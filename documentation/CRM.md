# CRM — panduan pemilik studio

Konsol internal di `/crm`: stok, pesanan, dan pipeline penjualan. Semua data
berasal dari database yang sama dengan storefront, jadi perubahan langsung
terlihat di halaman publik.

---

## Masuk

Production membutuhkan `CRM_PASSCODE` (tanpa ini login ditolak) dan
`AUTH_SECRET` untuk menandatangani cookie sesi. Di development, passcode
default hanya berlaku bila `NODE_ENV !== "production"`.

Sesi berakhir otomatis; tombol **Sign out** ada di dasar sidebar.

---

## Aturan stok (penting)

Stok hanya berubah karena transaksi yang jelas — tidak ada lagi angka shelf
yang "hilang" tanpa jejak.

| Kejadian | Efek pada stok | Efek pada `units_sold` |
| --- | --- | --- |
| Order dibuat (pair *ready*) | − jumlah | + jumlah |
| Order dibuat (pair *made to order*) | tidak berubah | + jumlah |
| Order dibatalkan (`cancelled`) | + jumlah (kembali ke shelf) | − jumlah |
| Order dihapus saat masih aktif | + jumlah | − jumlah |
| Order dibuka lagi (`cancelled → paid`) | − jumlah, **ditolak 409 bila stok kurang** | + jumlah |
| Set stok manual di halaman Inventory | diatur langsung | tidak berubah |

Validasi yang berjalan di server:

- Tidak bisa memesan lebih banyak daripada stok pair *ready* (HTTP 409).
- Pair *sold out* dan *archive* tidak bisa dipesan sama sekali.
- Pair *made to order* boleh dipesan tanpa menyentuh shelf.
- Stok negatif ditolak (HTTP 400), bukan diam-diam dijadikan 0.
- Baris duplikat (pair + ukuran sama) digabung, jumlah dibatasi 1–20 per baris.

---

## Halaman

### Overview

- Kartu KPI: revenue, order berjalan, pair di shelf, enquiry terbuka.
- **Revenue by week** dengan delta minggu ini vs minggu sebelumnya (dihitung
  dari data, bukan angka statis).
- **Needs attention** — daftar hal yang menunggu keputusan: style sold out,
  stok menipis, pembayaran pending lebih dari 3 hari, dan enquiry baru yang
  belum disentuh selama sepekan.

### Inventory

- Filter per status (ready / made to order / sold out / low stock / archive).
- **Kotak stok bisa diketik langsung**: ubah angka, tekan Enter atau klik di
  luar untuk menyimpan; Escape membatalkan.
- Tombol ★ di samping nama pair menyalakan/mematikan *featured* di storefront.
- Editor lengkap untuk nama, model, leather, colorway, harga, size run, foto,
  dan deskripsi.

### Orders

- Tab status, pencarian (nomor order, nama, email, kota, negara), dan
  pengurutan (tanggal, total, nama).
- Baris bisa dibuka untuk melihat pair, catatan, dan kontak; di sana ada
  **Edit details**, Email, WhatsApp, dan Delete.
- Perubahan status memengaruhi stok sesuai tabel di atas; pembatalan
  mengembalikan pair ke shelf.
- Aksi massal hanya berlaku untuk baris yang **terlihat** pada filter aktif.
  Berganti filter otomatis membersihkan pilihan.
- **Export CSV** mengikuti filter yang sedang aktif.

### Leads

- Papan lima tahap: New → Contacted → Quoted → Won / Lost.
- Tombol ← → memindahkan kartu satu tahap; **Open card** membuka editor penuh
  (tahap, nilai deal, pair yang diminati, catatan studio).
- **+ New lead** mencatat enquiry dari WhatsApp, Instagram, atau kunjungan
  studio yang tidak lewat storefront.
- Nilai deal dipakai untuk menghitung *open pipeline* di kartu ringkasan.

---

## Perilaku antarmuka

- **Esc** menutup modal; klik di luar panel juga menutup.
- Fokus keyboard terkunci di dalam modal dan kembali ke tombol pemicu saat
  ditutup; scroll halaman di belakang modal dikunci (aman walau modal
  bertumpuk).
- Notifikasi sukses hilang otomatis setelah 5 detik; pesan error tetap sampai
  ditutup.
- Aksi merusak (hapus order, hapus pair, hapus lead) memakai dialog konfirmasi,
  bukan `window.confirm`.

---

## Endpoint yang dipakai

| Metode | Endpoint | Guna |
| --- | --- | --- |
| `POST` | `/api/crm/session` | Login passcode → cookie sesi |
| `DELETE` | `/api/crm/session` | Logout |
| `POST` | `/api/crm/orders` | Buat order (validasi stok) |
| `PATCH` | `/api/crm/orders/[id]` | Ubah status **atau** detail pelanggan |
| `DELETE` | `/api/crm/orders/[id]` | Hapus order (stok dikembalikan) |
| `POST` | `/api/crm/orders/bulk` | Ubah status banyak order |
| `POST` | `/api/crm/products` | Tambah pair |
| `PATCH` | `/api/crm/products/[id]` | Ubah pair / stok / featured |
| `DELETE` | `/api/crm/products/[id]` | Hapus pair (riwayat order tetap) |
| `POST` | `/api/crm/leads` | Tambah lead manual |
| `PATCH` | `/api/crm/leads/[id]` | Ubah tahap, nilai deal, catatan |
| `DELETE` | `/api/crm/leads/[id]` | Hapus lead |

Semua endpoint CRM membutuhkan cookie sesi pemilik (`401` bila tidak ada).

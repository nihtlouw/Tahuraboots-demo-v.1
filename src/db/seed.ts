import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema, isMissingRelationError, resetSchemaCache } from "@/db/ensure-schema";
import { leads, orderItems, orders, products } from "@/db/schema";

type SeedItem = { slug: string; size: string; quantity: number };

type SeedOrder = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  city: string;
  channel: string;
  status: string;
  daysAgo: number;
  notes: string;
  items: SeedItem[];
};

const seedProducts = [
  {
    slug: "bandung-toe-cap",
    name: "Bandung Toe-Cap",
    model: "Toe-Cap Lace Boot",
    leather: "Tochigi Vachetta",
    colorway: "Olive Grove",
    description:
      "Our house silhouette. A seven-eyelet toe-cap built over a hand-carved last, hand-welted to a single leather sole. The olive vachetta is tanned in Tochigi, Japan and darkens into a deep moss patina with wear.",
    priceIdr: 3450000,
    stock: 4,
    status: "ready",
    imageUrl: "/images/boot-olive.jpg",
    collectionName: "Core Line",
    sizes: "39,40,41,42,43,44,45",
    featured: true,
    unitsSold: 38,
  },
  {
    slug: "ters-kopo-brogue",
    name: "Ters Kopo Brogue",
    model: "Lace-to-Toe Brogue",
    leather: "Shinki Hikaru Horsebutt",
    colorway: "Oxblood No. 8",
    description:
      "A lace-to-toe brogue cut from Shinki Hikaru horsebutt, punched and brogued by hand at the studio bench. Oxblood No. 8 is a drum-dyed hide with a pull-up that reads near-black in low light.",
    priceIdr: 4150000,
    stock: 2,
    status: "ready",
    imageUrl: "/images/boot-oxblood.jpg",
    collectionName: "Atelier Series",
    sizes: "39,40,41,42,43,44",
    featured: true,
    unitsSold: 27,
  },
  {
    slug: "garut-engineer",
    name: "Garut Engineer",
    model: "Engineer Boot",
    leather: "Horween Chromexcel",
    colorway: "Black Beauty",
    description:
      "A mid-calf engineer inspired by 1940s motorcycle boots. Horween Chromexcel, antique brass harness buckles and a triple-stitched vamp. Built to be resoled for decades, not seasons.",
    priceIdr: 4850000,
    stock: 0,
    status: "ready",
    imageUrl: "/images/boot-engineer.jpg",
    collectionName: "Archive Reissue",
    sizes: "40,41,42,43,44,45",
    featured: true,
    unitsSold: 64,
  },
  {
    slug: "dago-chelsea",
    name: "Dago Chelsea",
    model: "Chelsea Boot",
    leather: "Smooth Calf",
    colorway: "Cognac",
    description:
      "The everyday pair. Clean elastic gore, rounded toe and a lightweight commando sole for wet Bandung afternoons. Cognac calf with a hand-burnished toe.",
    priceIdr: 2950000,
    stock: 6,
    status: "ready",
    imageUrl: "/images/boot-chelsea.jpg",
    collectionName: "Core Line",
    sizes: "38,39,40,41,42,43,44,45",
    featured: false,
    unitsSold: 41,
  },
  {
    slug: "cikapundung-croc",
    name: "Cikapundung Croc",
    model: "Croc-Embossed Lace Boot",
    leather: "Croc-embossed Calf",
    colorway: "Midnight Croc",
    description:
      "A statement pair in midnight croc-embossed calf, laced with antique brass hooks over a leather sole. Made in limited runs of six pairs per hide.",
    priceIdr: 4250000,
    stock: 1,
    status: "ready",
    imageUrl: "/images/boot-croc.jpg",
    collectionName: "Atelier Series",
    sizes: "40,41,42,43,44",
    featured: false,
    unitsSold: 12,
  },
  {
    slug: "braga-monkey",
    name: "Braga Monkey",
    model: "Monkey Boot",
    leather: "Veg-tan Vachetta",
    colorway: "Natural Tan",
    description:
      "Our most requested made-to-order style. Tall, lace-to-toe monkey boot on a storm welt and commando sole, cut from natural vegetable-tanned vachetta that sunburns beautifully.",
    priceIdr: 3750000,
    stock: 0,
    status: "made_to_order",
    imageUrl: "/images/boot-monkey.jpg",
    collectionName: "Atelier Series",
    sizes: "39,40,41,42,43,44,45",
    featured: true,
    unitsSold: 19,
  },
  {
    slug: "lembang-hiker",
    name: "Lembang Hiker",
    model: "Field & Hiker Boot",
    leather: "Oiled Waxed Flesh",
    colorway: "Espresso",
    description:
      "A field boot for the Lembang trail: speed hooks, padded collar, Norwegian welt and a heavy lugged sole. Oiled waxed flesh shrugs off rain and mud.",
    priceIdr: 4450000,
    stock: 3,
    status: "ready",
    imageUrl: "/images/boot-hiker.jpg",
    collectionName: "Field Series",
    sizes: "40,41,42,43,44,45",
    featured: false,
    unitsSold: 22,
  },
  {
    slug: "sukajadi-chukka",
    name: "Sukajadi Chukka",
    model: "Chukka",
    leather: "Repello Suede",
    colorway: "Chocolate",
    description:
      "A three-eyelet chukka in water-repellent Repello suede with a stacked leather heel. The 2024 run is fully claimed — join the waitlist for the next cutting.",
    priceIdr: 2650000,
    stock: 0,
    status: "archive",
    imageUrl: "/images/boot-chukka.jpg",
    collectionName: "Archive Reissue",
    sizes: "39,40,41,42,43",
    featured: false,
    unitsSold: 31,
  },
] as const;

/**
 * Rilis kedua katalog: dua belas siluet yang sebelumnya hanya ada di feed
 * Instagram studio. Foto di `public/images/catalog/` berasal dari arsip studio
 * dan sudah dipotong bersih dari elemen UI aplikasi.
 *
 * Dipisahkan dari `seedProducts` supaya deployment yang sudah berjalan bisa
 * ditambahi tanpa menyentuh produk, pesanan, atau lead yang sudah ada.
 */
const seedCatalogExtras = [
  {
    slug: "ciwidey-western",
    name: "Ciwidey Western",
    model: "Western Boot",
    leather: "Oiled Javan Cowhide",
    colorway: "Tobacco Tan",
    description:
      "A full-height western boot with hand-stitched eagle and flame panels on the shaft. Oiled Javan cowhide over a stacked Cuban heel, built on a snip toe — the loudest pair we make and the one that photographs best.",
    priceIdr: 4150000,
    stock: 2,
    status: "ready",
    imageUrl: "/images/catalog/ciwidey-western.jpg",
    collectionName: "Western Line",
    sizes: "39,40,41,42,43,44,45",
    featured: true,
    unitsSold: 9,
  },
  {
    slug: "cibaduyut-show-western",
    name: "Cibaduyut Show Western",
    model: "Custom Western Boot",
    leather: "Black Calf with Hand Embroidery",
    colorway: "Black / Multicolour",
    description:
      "A custom commission: black calf shafts hand-embroidered in colour, finished with brass smiley studs on both sides. Every pair is drawn with the customer before a single stitch goes in — six to eight weeks on the bench.",
    priceIdr: 4450000,
    stock: 0,
    status: "made_to_order",
    imageUrl: "/images/catalog/cibaduyut-western.jpg",
    collectionName: "Western Line",
    sizes: "39,40,41,42,43,44,45",
    featured: false,
    unitsSold: 4,
  },
  {
    slug: "maribaya-mountain",
    name: "Maribaya Mountain",
    model: "Mountain Boot",
    leather: "Brown Calf & Tan Suede",
    colorway: "Chestnut / Tan",
    description:
      "A 1940s alpine pattern rebuilt at the bench: two-tone upper, padded tan collar, D-ring lacing and a lugged commando sole on a heavy leather welt. Made for the trail up to Maribaya and the walk back down.",
    priceIdr: 3850000,
    stock: 3,
    status: "ready",
    imageUrl: "/images/catalog/maribaya-mountain.jpg",
    collectionName: "Field Series",
    sizes: "40,41,42,43,44,45",
    featured: true,
    unitsSold: 14,
  },
  {
    slug: "tangkuban-mountain",
    name: "Tangkuban Mountain",
    model: "Mountain Boot",
    leather: "Burgundy Calf",
    colorway: "Oxblood Burgundy",
    description:
      "The Maribaya pattern in a deeper colourway: burgundy calf, tan padded collar and the same D-ring lacing. The welt is stitched twice by hand, so it can be rebuilt rather than replaced.",
    priceIdr: 3950000,
    stock: 2,
    status: "ready",
    imageUrl: "/images/catalog/tangkuban-mountain.jpg",
    collectionName: "Field Series",
    sizes: "40,41,42,43,44,45",
    featured: false,
    unitsSold: 6,
  },
  {
    slug: "riau-canvas-tall",
    name: "Riau Canvas Tall",
    model: "Tall Lace Boot",
    leather: "Brown Calf & Charcoal Canvas",
    colorway: "Brown / Charcoal",
    description:
      "Nine inches of canvas shaft paneled into a calf-leather vamp, with a full-length zip at the back so it goes on in one motion. Wedge sole, contrast piping, and a toe cap that takes a shine.",
    priceIdr: 3150000,
    stock: 2,
    status: "ready",
    imageUrl: "/images/catalog/riau-canvas.jpg",
    collectionName: "Atelier Series",
    sizes: "39,40,41,42,43,44,45",
    featured: false,
    unitsSold: 8,
  },
  {
    slug: "pasteur-gaucho",
    name: "Pasteur Gaucho",
    model: "Gaucho Ankle Boot",
    leather: "Cognac Pull-Up",
    colorway: "Cognac",
    description:
      "A tall-shafted ankle boot closed with a single brass buckle and no lacing at all. Cognac pull-up over a stacked leather heel — the pair that dresses up a plain trouser without looking formal.",
    priceIdr: 3050000,
    stock: 4,
    status: "ready",
    imageUrl: "/images/catalog/pasteur-gaucho.jpg",
    collectionName: "Atelier Series",
    sizes: "39,40,41,42,43,44",
    featured: true,
    unitsSold: 17,
  },
  {
    slug: "asia-afrika-strap",
    name: "Asia Afrika Strap",
    model: "Strap Ankle Boot",
    leather: "Spit-Shined Oxblood Calf",
    colorway: "Oxblood No. 8",
    description:
      "A single-strap ankle boot with the shaft cut high and the toe drawn long. The oxblood calf is burnished by hand to a mirror finish, so it reads almost black indoors and deep red in daylight.",
    priceIdr: 2850000,
    stock: 3,
    status: "ready",
    imageUrl: "/images/catalog/asiaafrika-strap.jpg",
    collectionName: "Atelier Series",
    sizes: "39,40,41,42,43,44,45",
    featured: false,
    unitsSold: 11,
  },
  {
    slug: "setiabudi-service",
    name: "Setiabudi Service",
    model: "Norwegian Welt Service Boot",
    leather: "Olive Javan Pull-Up",
    colorway: "Olive",
    description:
      "Our Norwegian split storm welt, stitched 360 degrees in chain stitch, on olive Javan pull-up. Two rows of welt stitching and a commando sole mean this is the pair that survives the wet season.",
    priceIdr: 3650000,
    stock: 5,
    status: "ready",
    imageUrl: "/images/catalog/setiabudi-service.jpg",
    collectionName: "Core Line",
    sizes: "40,41,42,43,44,45",
    featured: true,
    unitsSold: 23,
  },
  {
    slug: "gedebage-logger",
    name: "Gedebage Logger",
    model: "Logger Boot",
    leather: "Dark Brown Oiled Cowhide",
    colorway: "Espresso",
    description:
      "A nine-inch logger with a full wedge sole and contrast thread following every panel. Ten pairs of eyelets, a bumper toe and a heel you can walk a field in all day.",
    priceIdr: 3750000,
    stock: 1,
    status: "ready",
    imageUrl: "/images/catalog/gedebage-logger.jpg",
    collectionName: "Field Series",
    sizes: "40,41,42,43,44,45",
    featured: false,
    unitsSold: 7,
  },
  {
    slug: "antapani-derby",
    name: "Antapani Derby",
    model: "Lace-Up Derby",
    leather: "Shrunken Grey Cowhide",
    colorway: "Speckled Taupe",
    description:
      "A low lace-up in shrunken grey cowhide, where the grain breaks into a marbled texture as it wears. Pale leather midsole and white contrast stitching — the quietest, most textured pair on the shelf.",
    priceIdr: 2750000,
    stock: 3,
    status: "ready",
    imageUrl: "/images/catalog/antapani-derby.jpg",
    collectionName: "Core Line",
    sizes: "39,40,41,42,43,44",
    featured: false,
    unitsSold: 13,
  },
  {
    slug: "ujungberung-mustard",
    name: "Ujungberung Mustard",
    model: "Suede Derby",
    leather: "Mustard Suede",
    colorway: "Mustard",
    description:
      "Six eyelets, a long almond toe and not a single panel wasted. Mustard suede over a pale leather sole — a seasonal colour we cut in small runs and rarely repeat.",
    priceIdr: 2350000,
    stock: 0,
    status: "made_to_order",
    imageUrl: "/images/catalog/ujungberung-suede.jpg",
    collectionName: "Core Line",
    sizes: "38,39,40,41,42,43,44",
    featured: false,
    unitsSold: 5,
  },
  {
    slug: "cibeunying-chukka",
    name: "Cibeunying Chukka",
    model: "Chukka",
    leather: "Crackled Dark Cowhide",
    colorway: "Espresso Black",
    description:
      "A four-eyelet chukka in crackled espresso cowhide with a slim leather sole and a stacked heel. Light enough to wear all day, dark enough to wear with anything.",
    priceIdr: 2300000,
    stock: 2,
    status: "ready",
    imageUrl: "/images/catalog/cibeunying-chukka.jpg",
    collectionName: "Core Line",
    sizes: "39,40,41,42,43,44,45",
    featured: false,
    unitsSold: 10,
  },
] as const;

const seedOrders: SeedOrder[] = [
  {
    customerName: "Raka Pradipta",
    customerEmail: "raka.pradipta@gmail.com",
    customerPhone: "+62 812 3344 9081",
    country: "Indonesia",
    city: "Bandung",
    channel: "whatsapp",
    status: "paid",
    daysAgo: 1,
    notes: "Studio pickup requested, size confirmed from fitting.",
    items: [{ slug: "garut-engineer", size: "42", quantity: 1 }],
  },
  {
    customerName: "Marcus Bell",
    customerEmail: "marcus.bell@outlook.com",
    customerPhone: "+61 412 887 221",
    country: "Australia",
    city: "Melbourne",
    channel: "web",
    status: "pending",
    daysAgo: 1,
    notes: "Awaiting bank transfer confirmation.",
    items: [{ slug: "lembang-hiker", size: "44", quantity: 1 }],
  },
  {
    customerName: "Daniel Oh",
    customerEmail: "d.oh@seoulatelier.kr",
    customerPhone: "+82 10 5521 8890",
    country: "South Korea",
    city: "Seoul",
    channel: "web",
    status: "paid",
    daysAgo: 3,
    notes: "Two pairs, ship together via DHL.",
    items: [
      { slug: "cikapundung-croc", size: "42", quantity: 1 },
      { slug: "braga-monkey", size: "43", quantity: 1 },
    ],
  },
  {
    customerName: "Hiroshi Tanabe",
    customerEmail: "tanabe.h@japanmade.jp",
    customerPhone: "+81 90 1188 4402",
    country: "Japan",
    city: "Tokyo",
    channel: "instagram",
    status: "shipped",
    daysAgo: 5,
    notes: "Tracking sent by WhatsApp. Requested extra laces.",
    items: [{ slug: "bandung-toe-cap", size: "41", quantity: 1 }],
  },
  {
    customerName: "Yudha Saputra",
    customerEmail: "yudha.saputra@yahoo.com",
    customerPhone: "+62 813 9900 1122",
    country: "Indonesia",
    city: "Denpasar",
    channel: "studio",
    status: "cancelled",
    daysAgo: 6,
    notes: "Customer moved to waitlist for the croc style instead.",
    items: [{ slug: "bandung-toe-cap", size: "44", quantity: 1 }],
  },
  {
    customerName: "Nadia Putri",
    customerEmail: "nadiaputri@gmail.com",
    customerPhone: "+62 811 2233 5566",
    country: "Indonesia",
    city: "Jakarta",
    channel: "web",
    status: "paid",
    daysAgo: 9,
    notes: "Gift wrap with handwritten card.",
    items: [{ slug: "sukajadi-chukka", size: "40", quantity: 1 }],
  },
  {
    customerName: "Lena Fischer",
    customerEmail: "lena.fischer@posteo.de",
    customerPhone: "+49 151 2233 8890",
    country: "Germany",
    city: "Berlin",
    channel: "web",
    status: "in_production",
    daysAgo: 8,
    notes: "Monogram L.F. inside collar. Lasting scheduled week 3.",
    items: [{ slug: "ters-kopo-brogue", size: "40", quantity: 1 }],
  },
  {
    customerName: "Arif Nugraha",
    customerEmail: "arif.nugraha@corp.id",
    customerPhone: "+62 812 5566 7788",
    country: "Indonesia",
    city: "Jakarta",
    channel: "whatsapp",
    status: "delivered",
    daysAgo: 12,
    notes: "Two pairs for wedding party. Delivered via JNE.",
    items: [{ slug: "dago-chelsea", size: "43", quantity: 2 }],
  },
  {
    customerName: "Tom Whitfield",
    customerEmail: "tom@whitfield.co.uk",
    customerPhone: "+44 7700 118822",
    country: "United Kingdom",
    city: "London",
    channel: "instagram",
    status: "shipped",
    daysAgo: 14,
    notes: "Custom build — natural tan, storm welt.",
    items: [{ slug: "braga-monkey", size: "43", quantity: 1 }],
  },
  {
    customerName: "Siti Rahmawati",
    customerEmail: "siti.rahmawati@gmail.com",
    customerPhone: "+62 856 7788 9911",
    country: "Indonesia",
    city: "Surabaya",
    channel: "instagram",
    status: "delivered",
    daysAgo: 16,
    notes: "Size exchange from 41 to 40 handled at no cost.",
    items: [{ slug: "sukajadi-chukka", size: "39", quantity: 1 }],
  },
  {
    customerName: "Claire Dubois",
    customerEmail: "claire.dubois@paris.fr",
    customerPhone: "+33 6 22 88 44 10",
    country: "France",
    city: "Paris",
    channel: "web",
    status: "delivered",
    daysAgo: 24,
    notes: "Left a five star review on the brogue.",
    items: [{ slug: "ters-kopo-brogue", size: "38", quantity: 1 }],
  },
  {
    customerName: "Fajar Ramadhan",
    customerEmail: "fajar.ramadhan@gmail.com",
    customerPhone: "+62 878 1122 3344",
    country: "Indonesia",
    city: "Bandung",
    channel: "whatsapp",
    status: "delivered",
    daysAgo: 30,
    notes: "Returning customer, third pair.",
    items: [{ slug: "dago-chelsea", size: "42", quantity: 1 }],
  },
  {
    customerName: "Kenji Mori",
    customerEmail: "kenji.mori@gmail.com",
    customerPhone: "+81 80 9988 7766",
    country: "Japan",
    city: "Osaka",
    channel: "instagram",
    status: "delivered",
    daysAgo: 38,
    notes: "Requested wider E width.",
    items: [
      { slug: "bandung-toe-cap", size: "40", quantity: 1 },
      { slug: "lembang-hiker", size: "41", quantity: 1 },
    ],
  },
  {
    customerName: "Andreas Weber",
    customerEmail: "a.weber@munich.de",
    customerPhone: "+49 176 9988 2211",
    country: "Germany",
    city: "Munich",
    channel: "web",
    status: "delivered",
    daysAgo: 46,
    notes: "Resole service booked for next year.",
    items: [{ slug: "garut-engineer", size: "45", quantity: 1 }],
  },
  {
    customerName: "Bima Kurnia",
    customerEmail: "bima.kurnia@gmail.com",
    customerPhone: "+62 822 3344 5566",
    country: "Indonesia",
    city: "Semarang",
    channel: "studio",
    status: "delivered",
    daysAgo: 55,
    notes: "Fitted in studio, took the display pair.",
    items: [{ slug: "cikapundung-croc", size: "41", quantity: 1 }],
  },
];

const seedLeads = [
  {
    name: "Sophie Laurent",
    email: "sophie.laurent@gmail.com",
    phone: "+33 6 44 22 11 09",
    country: "France",
    productInterest: "Custom engineer boot",
    message:
      "Looking for a black engineer boot with a lower heel, size EU 39. Could you share the current lead time and shipped price to Paris?",
    source: "contact",
    status: "new",
    valueIdr: 5200000,
    daysAgo: 0,
    notes: "",
  },
  {
    name: "Michael Chen",
    email: "michael@narrowgate.sg",
    phone: "+65 8123 4567",
    country: "Singapore",
    productInterest: "Wholesale — 12 pairs",
    message:
      "We run a heritage menswear store on Ann Siang Hill. Interested in a 12 pair capsule of your toe-cap and chukka for Q4.",
    source: "contact",
    status: "new",
    valueIdr: 42000000,
    daysAgo: 1,
    notes: "",
  },
  {
    name: "Arya Wibisono",
    email: "arya.wibisono@gmail.com",
    phone: "+62 812 9988 4433",
    country: "Indonesia",
    productInterest: "Custom build — Toe-Cap Lace",
    message:
      "Build spec: Toe-Cap Lace / Oxblood No. 8 / Commando lug / EU 43 / monogram A.W. / brass eyelets. Ready to pay deposit.",
    source: "configurator",
    status: "quoted",
    valueIdr: 4950000,
    daysAgo: 2,
    notes: "Quote TB-Q-204 sent on WhatsApp.",
  },
  {
    name: "Hana Yoshida",
    email: "hana.yoshida@icloud.com",
    phone: "+81 90 3344 5566",
    country: "Japan",
    productInterest: "Custom build — Field & Hiker",
    message:
      "Build spec: Hiker / Espresso / Norwegian welt / EU 39. Hoping to have them before my Bandung trip in July.",
    source: "configurator",
    status: "quoted",
    valueIdr: 5300000,
    daysAgo: 3,
    notes: "Deposit link shared, follow up Friday.",
  },
  {
    name: "Rendra Aditya",
    email: "rendra.aditya@outlook.com",
    phone: "+62 878 2233 1100",
    country: "Indonesia",
    productInterest: "Custom build — Monkey Boot",
    message:
      "Build spec: Monkey Boot / Natural Tan / Leather sole / EU 41 / monogram R.A. Need help choosing between D and E width.",
    source: "configurator",
    status: "contacted",
    valueIdr: 3900000,
    daysAgo: 5,
    notes: "Sizing guide sent.",
  },
  {
    name: "Bram van Dijk",
    email: "bram.vandijk@gmail.com",
    phone: "+31 6 2211 8899",
    country: "Netherlands",
    productInterest: "Garut Engineer — restock",
    message:
      "Noticed the engineer boot is sold out in EU 44. Do you have a waitlist for the next Chromexcel cutting?",
    source: "contact",
    status: "contacted",
    valueIdr: 4850000,
    daysAgo: 6,
    notes: "Added to restock waitlist.",
  },
  {
    name: "Putri Anjani",
    email: "putri.anjani@gmail.com",
    phone: "+62 811 4455 6677",
    country: "Indonesia",
    productInterest: "Custom build — Chelsea",
    message:
      "Build spec: Chelsea / Cognac / Commando sole / EU 38 / monogram P.A. Deposit transferred this morning.",
    source: "configurator",
    status: "won",
    valueIdr: 3600000,
    daysAgo: 9,
    notes: "Converted — order TB-1012.",
  },
  {
    name: "Lucas Meyer",
    email: "lucas.meyer@gmx.de",
    phone: "+49 160 4455 7788",
    country: "Germany",
    productInterest: "Sizing advice",
    message:
      "Comparing your EU 45 to a Red Wing 44. Could you send the last measurements?",
    source: "contact",
    status: "lost",
    valueIdr: 0,
    daysAgo: 13,
    notes: "Went quiet after sizing info was sent.",
  },
];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Hanya permintaan yang BERJALAN BERSAMAAN yang digabung (dedupe). Hasilnya
 * tidak di-cache permanen: setiap render memverifikasi ulang dengan satu query
 * murah (`select count(*) from products`), sehingga instance yang sudah warm
 * tetap sadar kalau database di-reset atau diganti. Tanpa ini, halaman 500
 * selamanya sampai instance tersebut mati.
 */
let seedInflight: Promise<void> | null = null;

/**
 * Kunci advisory agar seed hanya berjalan di SATU instance.
 *
 * Di Vercel, beberapa lambda bisa cold-start bersamaan; tanpa kunci ini dua
 * instance sama-sama melihat tabel kosong lalu menyisipkan pesanan dengan nomor
 * yang sama (`TB-1041`), melanggar UNIQUE, transaksi gagal, dan halaman 500.
 */
async function runSeed() {
  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);

  if (existing && existing.count > 0) return;

  await db.transaction(async (tx) => {
    // Tunggu sampai instance lain selesai, lalu cek ulang di dalam kunci.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('tahura:seed'))`);

    const [recheck] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    if (recheck && recheck.count > 0) return;

    const insertedProducts = await tx
      .insert(products)
      .values(seedProducts.map((product) => ({ ...product })))
      .onConflictDoNothing()
      .returning();

    const bySlug = new Map(
      insertedProducts.map((product) => [product.slug, product]),
    );

    for (const [index, order] of seedOrders.entries()) {
      const items = order.items.map((item) => {
        const product = bySlug.get(item.slug);
        return {
          productId: product?.id ?? null,
          productName: product?.name ?? item.slug,
          size: item.size,
          quantity: item.quantity,
          unitPriceIdr: product?.priceIdr ?? 0,
        };
      });

      const total = items.reduce(
        (sum, item) => sum + item.unitPriceIdr * item.quantity,
        0,
      );

      const [createdOrder] = await tx
        .insert(orders)
        .values({
          orderNumber: `TB-${1041 + index}`,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          country: order.country,
          city: order.city,
          channel: order.channel,
          status: order.status,
          totalIdr: total,
          notes: order.notes,
          createdAt: daysAgo(order.daysAgo),
        })
        .onConflictDoNothing()
        .returning();

      if (createdOrder) {
        await tx
          .insert(orderItems)
          .values(items.map((item) => ({ ...item, orderId: createdOrder.id })));
      }
    }

    await tx.insert(leads).values(
      seedLeads.map((lead) => ({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        country: lead.country,
        productInterest: lead.productInterest,
        message: lead.message,
        source: lead.source,
        status: lead.status,
        valueIdr: lead.valueIdr,
        notes: lead.notes,
        createdAt: daysAgo(lead.daysAgo),
      })),
    );
  });
}

/**
 * Tambahkan produk rilis kedua ke database yang sudah berjalan.
 *
 * `runSeed()` hanya mengisi saat tabel produk masih kosong, sehingga deployment
 * yang sudah hidup tidak akan pernah menerima produk baru. Fungsi ini menutup
 * celah itu: hanya baris yang slug-nya belum ada yang disisipkan, dan produk,
 * pesanan, atau lead yang sudah ada tidak disentuh. Aman dipanggil berulang.
 *
 * Sengaja tidak di-cache: kalau database di-reset, produk tambahan harus bisa
 * masuk lagi pada request berikutnya.
 */
async function topUpCatalogExtras() {
  const slugs = seedCatalogExtras.map((product) => product.slug);

  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(inArray(products.slug, slugs));

  const present = new Set(existing.map((row) => row.slug));
  const missing = seedCatalogExtras.filter((product) => !present.has(product.slug));
  if (missing.length === 0) return;

  await db.transaction(async (tx) => {
    // Kunci terpisah dari seed utama: dua cold start bersamaan tetap aman.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('tahura:catalog-extras'))`);
    await tx
      .insert(products)
      .values(missing.map((product) => ({ ...product })))
      .onConflictDoNothing();
  });

  console.info(`[seed] ${missing.length} produk katalog baru ditambahkan`);
}

/**
 * Siapkan database: buat skema bila belum ada, lalu isi data contoh.
 *
 * Idempotent dan aman dipanggil dari page/route mana pun. Di deployment baru
 * (Vercel + Neon) ini membuat aplikasi langsung berfungsi tanpa langkah
 * migration manual.
 */
export function ensureSeed() {
  if (seedInflight) return seedInflight;

  const promise = ensureSchema()
    .then(() => runSeed())
    .then(() => topUpCatalogExtras())
    .catch(async (error) => {
      // Tabel hilang di tengah jalan (database di-reset / branch Neon baru):
      // buat ulang skema lalu ulangi sekali. Bukan kegagalan permanen.
      if (!isMissingRelationError(error)) throw error;

      console.warn("[seed] tabel belum ada saat seeding — membuat ulang skema");
      resetSchemaCache();
      await ensureSchema({ force: true });
      await runSeed();
      await topUpCatalogExtras();
    })
    .finally(() => {
      seedInflight = null;
    });

  seedInflight = promise;
  return promise;
}

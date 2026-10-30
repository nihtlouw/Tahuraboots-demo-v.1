import { sql } from "drizzle-orm";
import { db } from "@/db";
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

let seedPromise: Promise<void> | null = null;

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

/** Idempotent, safe to call from any server route or page. */
export function ensureSeed() {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

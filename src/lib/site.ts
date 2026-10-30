export const site = {
  name: "Tahura Boots Company",
  /**
   * URL publik untuk canonical/sitemap/structured data.
   * Prioritas: NEXT_PUBLIC_SITE_URL → domain produksi Vercel → domain studio.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://tahuraboots.co"),
  shortName: "Tahura",
  tagline: "Hand-welted in Bandung",
  founded: 2013,
  instagram: "https://www.instagram.com/tahurabootsco",
  instagramHandle: "@tahurabootsco",
  whatsapp: "6281122334455",
  whatsappHref:
    "https://wa.me/6281122334455?text=Hi%20Tahura%20Boots%20Co.%2C%20I%27d%20like%20to%20talk%20about%20a%20pair.",
  email: "studio@tahuraboots.co",
  addressLine1: "Jl. Ters Kopo, Komplek Bumi Asri Mekar Rahayu",
  addressLine2: "Jl. Mekar 11 Blok 02, RT/RW 04/12 E65, Bandung 40218",
  addressShort: "Bandung, West Java · Indonesia",
  hours: "Mon–Sat · 09.00–17.00 WIB",
  mapsHref:
    "https://www.google.com/maps?q=Jl.+Ters+Kopo+Bumi+Asri+Mekar+Rahayu+Bandung+40218",
} as const;

export const navLinks = [
  { label: "Collection", href: "#collection" },
  { label: "The Craft", href: "#craft" },
  { label: "Materials", href: "#materials" },
  { label: "Custom build", href: "#custom" },
  { label: "Studio", href: "#studio" },
] as const;

export const heroStats = [
  { value: "1,294", label: "pairs logged" },
  { value: "13.2K", label: "collectors" },
  { value: "40+", label: "countries" },
  { value: "2013", label: "est. in Bandung" },
] as const;

export const marqueeWords = [
  "Hand-welted",
  "Tochigi vachetta",
  "Made to order",
  "Ships worldwide",
  "Resole for life",
  "Bandung, Indonesia",
] as const;

export const materials = [
  {
    id: "tochigi",
    name: "Tochigi Vachetta",
    origin: "Tochigi, Japan",
    swatch: "#5c6244",
    short: "The house leather",
    body: "Vegetable-tanned for over thirty days in a small Japanese tannery, then finished with a light wax. It begins olive and settles into a deep moss patina that maps every mile you walk.",
    specs: [
      ["Tannage", "Vegetable, 30+ days"],
      ["Weight", "1.6 – 1.8 mm"],
      ["Best for", "Toe-cap, monkey boot"],
    ],
  },
  {
    id: "shinki",
    name: "Shinki Hikaru Horsebutt",
    origin: "Himeji, Japan",
    swatch: "#5f2429",
    short: "Dense, dramatic grain",
    body: "Horsebutt is the dense fibre just above the shell. Drum-dyed in small lots, it takes a mirror shine on the toe and reveals wild, uneven grain as it breaks in.",
    specs: [
      ["Tannage", "Chrome / drum-dyed"],
      ["Weight", "2.0 – 2.2 mm"],
      ["Best for", "Brogue, engineer"],
    ],
  },
  {
    id: "chromexcel",
    name: "Horween Chromexcel",
    origin: "Chicago, USA",
    swatch: "#262321",
    short: "The workhorse",
    body: "A hundred years of Chicago tanning in one hide: hot-stuffed with waxes and oils so it shrugs off rain, then buffed to a low sheen. Scratches rub out with a thumb.",
    specs: [
      ["Tannage", "Chrome, hot-stuffed"],
      ["Weight", "1.8 – 2.0 mm"],
      ["Best for", "Engineer, chelsea"],
    ],
  },
  {
    id: "croc",
    name: "Croc-Embossed Calf",
    origin: "Bandung, Indonesia",
    swatch: "#25282a",
    short: "Limited runs of six",
    body: "Calf, embossed with a Nile crocodile pattern and hand-glazed in the studio. Cut in runs of six pairs per hide so the scale alignment runs true across both boots.",
    specs: [
      ["Tannage", "Chrome, hand-glazed"],
      ["Weight", "1.4 – 1.6 mm"],
      ["Best for", "Statement lace boot"],
    ],
  },
  {
    id: "suede",
    name: "Repello Suede",
    origin: "Leeds, England",
    swatch: "#4b3629",
    short: "Rain-ready nap",
    body: "Repello is treated before tanning, so the water beads and the nap recovers. Deep chocolate with a soft hand — a chukka that handles Bandung's wet season without a second thought.",
    specs: [
      ["Tannage", "Chrome, water-repellent"],
      ["Weight", "1.5 – 1.7 mm"],
      ["Best for", "Chukka, derby"],
    ],
  },
  {
    id: "veg",
    name: "Natural Veg-Tan",
    origin: "Bandung, Indonesia",
    swatch: "#b98b5a",
    short: "Sunburned by you",
    body: "Untinted, unfinished, unapologetic. Our local vegetable-tanned vachetta starts pale and turns honey, then tobacco, then caramel — entirely dependent on how you wear it.",
    specs: [
      ["Tannage", "Vegetable, local hide"],
      ["Weight", "1.7 – 1.9 mm"],
      ["Best for", "Monkey, custom builds"],
    ],
  },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "The measure",
    time: "Week 0",
    body: "Every pair starts with a paper tracing or a studio fitting. We record arch length, ball girth and heel width, then pick a last within 2 mm of your foot.",
  },
  {
    number: "02",
    title: "The cutting",
    time: "Week 1",
    body: "Hides are inspected under daylight and cut around natural scars rather than through them. Upper, lining and toe puff are clicked, skived and hand-burnished.",
  },
  {
    number: "03",
    title: "The welt",
    time: "Week 3",
    body: "The upper is lasted by hand over seven days, then Goodyear hand-welted with a braided waxed thread. This is the stitch that lets a pair be resoled for life.",
  },
  {
    number: "04",
    title: "The finish",
    time: "Week 6",
    body: "Leather sole, stacked heel, edge ink and wax. Then the long part: the patina is started by hand in the studio so it only gets better with you.",
  },
] as const;

export const voices = [
  {
    quote:
      "Four wet seasons, one resole, and the olive has gone the colour of old moss. They have outlasted every sneaker I own.",
    name: "Arya Wibisono",
    place: "Bandung · Toe-Cap, 2021",
  },
  {
    quote:
      "I flew in for a fitting on a Tuesday. The measuring alone took an hour. The engineer boots landed eight weeks later, perfect.",
    name: "Hiroshi Tanabe",
    place: "Tokyo · Engineer, 2023",
  },
  {
    quote:
      "The only pair I pack for two weeks of client meetings. They look better creased than they did new.",
    name: "Lena Fischer",
    place: "Berlin · Brogue, 2022",
  },
  {
    quote:
      "Ordered from Melbourne, tracking came the same night the sole was stitched. That kind of small-studio care is rare.",
    name: "Marcus Bell",
    place: "Melbourne · Hiker, 2025",
  },
] as const;

export const journal = [
  {
    image: "/images/craft-stitching.jpg",
    tag: "In the workshop",
    title: "Thirty-one steps, one bench",
    excerpt:
      "What actually happens between a hide and a finished pair — a photojournal from the Ters Kopo studio.",
    date: "Jul 2025",
  },
  {
    image: "/images/editorial-wear.jpg",
    tag: "Worn",
    title: "Braga after rain",
    excerpt:
      "A walk through the old colonial quarter with the monkey boot, three years into its patina.",
    date: "Jun 2025",
  },
  {
    image: "/images/boot-croc.jpg",
    tag: "Atelier",
    title: "Six pairs per hide",
    excerpt:
      "The small-batch story behind the Cikapundung Croc and why it sells out every cutting.",
    date: "May 2025",
  },
] as const;

export const faqs = [
  {
    q: "How long does a made-to-order pair take?",
    a: "Six to eight weeks from deposit, including making the last. We send four build updates by WhatsApp so you know exactly which week the welt is being stitched.",
  },
  {
    q: "Do you ship outside Indonesia?",
    a: "Yes — DHL Express to 40+ countries, two to five working days in transit. Duties are calculated at checkout and no import surprises are left to you.",
  },
  {
    q: "What if the size is wrong?",
    a: "One free size exchange within 14 days of delivery on ready-to-ship pairs. For made-to-order, we re-last at cost — we would rather rebuild than have a pair sit unworn.",
  },
  {
    q: "Can a worn pair come back?",
    a: "Always. Resoles, welt repairs, stitching and patina work are quoted per pair. Anything we made is repairable for as long as the upper holds.",
  },
] as const;

export const customModels = [
  {
    id: "toe-cap",
    label: "Toe-Cap Lace",
    base: 3450000,
    blurb: "Seven eyelets, single leather sole, house last.",
  },
  {
    id: "monkey",
    label: "Monkey Boot",
    base: 3750000,
    blurb: "Tall lace-to-toe, storm welt, commando sole.",
  },
  {
    id: "engineer",
    label: "Engineer",
    base: 4850000,
    blurb: "Mid-calf harness, brass buckle, triple-stitched vamp.",
  },
  {
    id: "hiker",
    label: "Field & Hiker",
    base: 4450000,
    blurb: "Speed hooks, padded collar, lugged sole.",
  },
  {
    id: "chelsea",
    label: "Chelsea",
    base: 2950000,
    blurb: "Elastic gore, rounded toe, everyday weight.",
  },
] as const;

export const customLeathers = [
  {
    id: "tochigi",
    label: "Tochigi Vachetta",
    color: "Olive Grove",
    add: 0,
    swatch: "#5c6244",
  },
  {
    id: "shinki",
    label: "Shinki Horsebutt",
    color: "Oxblood No. 8",
    add: 700000,
    swatch: "#5f2429",
  },
  {
    id: "chromexcel",
    label: "Horween Chromexcel",
    color: "Black Beauty",
    add: 850000,
    swatch: "#262321",
  },
  {
    id: "veg",
    label: "Veg-tan Vachetta",
    color: "Natural Tan",
    add: 450000,
    swatch: "#b98b5a",
  },
  {
    id: "croc",
    label: "Croc-embossed Calf",
    color: "Midnight Croc",
    add: 1250000,
    swatch: "#2b2d2e",
  },
] as const;

export const customSoles = [
  { id: "leather", label: "Leather sole", blurb: "Sleek, resoleable", add: 0 },
  {
    id: "commando",
    label: "Commando lug",
    blurb: "Grip for wet season",
    add: 350000,
  },
  {
    id: "norwegian",
    label: "Norwegian welt",
    blurb: "Storm-proof, heavier",
    add: 550000,
  },
] as const;

export const customHardware = [
  { id: "brass", label: "Antique brass", add: 0 },
  { id: "nickel", label: "Brushed nickel", add: 60000 },
  { id: "blackened", label: "Blackened steel", add: 90000 },
] as const;

export const customSizes = [
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
] as const;

export const MONOGRAM_PRICE = 150000;
export const SHOE_TREE_PRICE = 280000;

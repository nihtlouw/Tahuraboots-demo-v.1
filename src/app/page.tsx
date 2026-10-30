import Image from "next/image";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { resolveAvailability } from "@/lib/catalog";
import { ensureSeed } from "@/db/seed";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Marquee } from "@/components/site/marquee";
import { Collection } from "@/components/site/collection";
import { Craft } from "@/components/site/craft";
import { Materials } from "@/components/site/materials";
import { Configurator } from "@/components/site/configurator";
import { Voices } from "@/components/site/voices";
import { Journal } from "@/components/site/journal";
import { Studio } from "@/components/site/studio";
import { Footer } from "@/components/site/footer";
import { Reveal } from "@/components/site/reveal";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed();

  const catalogue = await db
    .select()
    .from(products)
    .orderBy(desc(products.featured), products.id);

  const storefrontProducts = catalogue.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    model: product.model,
    leather: product.leather,
    colorway: product.colorway,
    description: product.description,
    priceIdr: product.priceIdr,
    stock: product.stock,
    status: product.status,
    imageUrl: product.imageUrl,
    collectionName: product.collectionName,
    sizes: product.sizes,
    featured: product.featured,
  }));

  // Structured data: membantu Google menampilkan katalog sebagai rich result.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        email: site.email,
        foundingDate: String(site.founded),
        address: {
          "@type": "PostalAddress",
          streetAddress: site.addressLine1,
          addressLocality: "Bandung",
          addressRegion: "West Java",
          addressCountry: "ID",
        },
      },
      {
        "@type": "ItemList",
        name: "Tahura Boots collection",
        itemListElement: storefrontProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: `${site.url}${product.imageUrl}`,
            brand: { "@type": "Brand", name: site.name },
            offers: {
              "@type": "Offer",
              price: product.priceIdr,
              priceCurrency: "IDR",
              availability:
                resolveAvailability(product) === "ready"
                  ? "https://schema.org/InStock"
                  : resolveAvailability(product) === "made_to_order"
                    ? "https://schema.org/PreOrder"
                    : "https://schema.org/SoldOut",
            },
          },
        })),
      },
    ],
  };

  return (
    <div id="top" className="min-h-screen bg-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <Marquee />

        <Collection products={storefrontProducts} />
        <Craft />

        <section className="relative overflow-hidden">
          <div className="relative min-h-[520px] w-full lg:min-h-[600px]">
            <Image
              src="/images/editorial-wear.jpg"
              alt="Tahura boots worn on a rain-wet street in Bandung"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
            <div className="grain-layer" />
            <div className="container-x relative flex min-h-[520px] items-center py-16 lg:min-h-[600px]">
              <Reveal className="max-w-xl">
                <p className="eyebrow text-brass">Field notes</p>
                <h2 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,3.8rem)] font-light leading-[1.02] text-paper">
                  Made to be
                  <br />
                  resoled.
                  <br />
                  <span className="italic text-brass-light">Not replaced.</span>
                </h2>
                <p className="mt-5 max-w-md text-[0.92rem] leading-relaxed text-paper/65">
                  Every Tahura pair carries a record in the studio ledger — hide,
                  last, maker, date. Send them back in ten years and the same
                  bench will re-welt, re-sole and re-finish them for a fraction
                  of a new pair.
                </p>
                <div className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-paper/15 pt-5">
                  {[
                    ["10 yr", "resole guarantee"],
                    ["1,294", "pairs in the ledger"],
                    ["48 h", "dispatch in stock"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <p className="font-display text-xl text-paper">{value}</p>
                      <p className="mt-1 text-[0.54rem] uppercase tracking-[0.16em] text-paper/45">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <a
                  href="#studio"
                  className="group mt-8 inline-flex items-center gap-4 border border-paper/25 px-5 py-3.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:border-brass hover:text-brass"
                >
                  Ask about the resole programme
                  <span className="transition-transform group-hover:translate-x-1">
                    ↗
                  </span>
                </a>
              </Reveal>
            </div>
          </div>
        </section>

        <Materials />
        <Configurator />
        <Voices />
        <Journal />
        <Studio />
      </main>
      <Footer />

      <a
        href={site.whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with the Tahura studio on WhatsApp"
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 border border-brass/50 bg-ink/85 px-4 py-3 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-paper shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:bg-brass hover:text-ink"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-brass/80 animate-soft-pulse group-hover:bg-ink/50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brass group-hover:bg-ink" />
        </span>
        <span className="hidden sm:inline">Chat with the maker</span>
        <span className="sm:hidden">WhatsApp</span>
        <span className="transition-transform group-hover:translate-x-0.5">↗</span>
      </a>
    </div>
  );
}

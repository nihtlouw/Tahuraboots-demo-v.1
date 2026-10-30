import { PRODUCT_STATUSES } from "@/lib/catalog";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

export type ProductPayload = {
  name?: string;
  slug?: string;
  model?: string;
  leather?: string;
  colorway?: string;
  description?: string;
  priceIdr?: number | string;
  stock?: number | string;
  status?: string;
  imageUrl?: string;
  collectionName?: string;
  sizes?: string;
  featured?: boolean;
};

export function normaliseProduct(body: ProductPayload) {
  const price = Number(body.priceIdr);
  const stock = Number(body.stock);
  const status = PRODUCT_STATUSES.includes(
    body.status as (typeof PRODUCT_STATUSES)[number],
  )
    ? (body.status as string)
    : "ready";

  return {
    name: (body.name ?? "").trim(),
    slug: slugify(body.slug || body.name || ""),
    model: (body.model ?? "Lace Boot").trim() || "Lace Boot",
    leather: (body.leather ?? "Tochigi Vachetta").trim(),
    colorway: (body.colorway ?? "").trim() || "House",
    description: (body.description ?? "").trim(),
    priceIdr: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
    stock: Number.isFinite(stock) && stock >= 0 ? Math.round(stock) : 0,
    status,
    imageUrl: body.imageUrl || "/images/boot-olive.jpg",
    collectionName: (body.collectionName ?? "Core Line").trim() || "Core Line",
    sizes: (body.sizes ?? "39,40,41,42,43,44,45").replace(/\s+/g, ""),
    featured: Boolean(body.featured),
  };
}

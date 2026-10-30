import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { CrmHeader } from "@/components/crm/ui";
import {
  ProductsManager,
  type CrmProduct,
} from "@/components/crm/products-manager";

export const dynamic = "force-dynamic";

export default async function CrmProductsPage() {
  await ensureSeed();

  const rows = await db
    .select()
    .from(products)
    .orderBy(desc(products.featured), products.id);

  const initial: CrmProduct[] = rows.map((product) => ({
    id: product.id,
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
    unitsSold: product.unitsSold,
  }));

  return (
    <div className="space-y-6">
      <CrmHeader
        eyebrow="Inventory"
        title="Pairs, stock & availability"
        description="Restock a shelf, flip a style to made to order, or mark an archive run closed. Changes appear on the storefront instantly — zero stock on a ready pair shows as sold out."
      />
      <ProductsManager initial={initial} />
    </div>
  );
}

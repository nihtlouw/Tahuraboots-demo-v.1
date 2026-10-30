import { db } from "@/db";
import { products } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { normaliseProduct, type ProductPayload } from "@/lib/product-input";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isOwner())) return unauthorized();

  try {
    // Deployment baru: pastikan skema + data contoh siap sebelum menulis.
    await ensureSeed();
    const body = (await request.json()) as ProductPayload;
    const values = normaliseProduct(body);

    if (!values.name || !values.slug || values.priceIdr <= 0) {
      return Response.json(
        { ok: false, error: "Name and a price above zero are required." },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(products)
      .values(values)
      .onConflictDoNothing()
      .returning();

    if (!created) {
      return Response.json(
        { ok: false, error: "That style name is already in the catalogue." },
        { status: 409 },
      );
    }

    return Response.json({ ok: true, product: created });
  } catch {
    return Response.json(
      { ok: false, error: "Could not add the pair." },
      { status: 500 },
    );
  }
}

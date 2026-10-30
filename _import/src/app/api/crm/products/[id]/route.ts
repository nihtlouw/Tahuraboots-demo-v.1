import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { PRODUCT_STATUSES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Payload = {
  name?: string;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isOwner())) return unauthorized();

  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return Response.json({ ok: false, error: "Invalid pair." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Payload;
    const patch: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.model === "string") patch.model = body.model.trim();
    if (typeof body.leather === "string") patch.leather = body.leather.trim();
    if (typeof body.colorway === "string") patch.colorway = body.colorway.trim();
    if (typeof body.description === "string") patch.description = body.description.trim();
    if (body.priceIdr !== undefined) {
      const price = Number(body.priceIdr);
      if (!Number.isFinite(price) || price <= 0) {
        return Response.json(
          { ok: false, error: "Price must be above zero." },
          { status: 400 },
        );
      }
      patch.priceIdr = Math.round(price);
    }
    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      patch.stock =
        Number.isFinite(stock) && stock >= 0 ? Math.round(stock) : 0;
    }
    if (body.status !== undefined) {
      if (!PRODUCT_STATUSES.includes(body.status as (typeof PRODUCT_STATUSES)[number])) {
        return Response.json(
          { ok: false, error: "Unknown product state." },
          { status: 400 },
        );
      }
      patch.status = body.status;
    }
    if (typeof body.imageUrl === "string" && body.imageUrl) patch.imageUrl = body.imageUrl;
    if (typeof body.collectionName === "string") patch.collectionName = body.collectionName.trim();
    if (typeof body.sizes === "string") patch.sizes = body.sizes.replace(/\s+/g, "");
    if (body.featured !== undefined) patch.featured = Boolean(body.featured);

    if (Object.keys(patch).length === 0) {
      return Response.json({ ok: false, error: "Nothing to update." }, { status: 400 });
    }

    const [updated] = await db
      .update(products)
      .set(patch)
      .where(eq(products.id, productId))
      .returning();

    if (!updated) {
      return Response.json({ ok: false, error: "Pair not found." }, { status: 404 });
    }

    return Response.json({ ok: true, product: updated });
  } catch {
    return Response.json(
      { ok: false, error: "Could not update the pair." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isOwner())) return unauthorized();

  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) {
    return Response.json({ ok: false, error: "Invalid pair." }, { status: 400 });
  }

  try {
    await db.delete(products).where(eq(products.id, productId));
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, error: "This pair is attached to an order and cannot be removed." },
      { status: 409 },
    );
  }
}

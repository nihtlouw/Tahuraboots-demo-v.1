import { db } from "@/db";
import { leads } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  productInterest?: string;
  message?: string;
  source?: string;
  valueIdr?: number | string;
};

/**
 * Tambah lead manual.
 *
 * Sebelumnya satu-satunya jalan masuk lead adalah form di storefront, jadi
 * enquiry dari WhatsApp atau kunjungan studio tidak pernah tercatat di pipeline.
 */
export async function POST(request: Request) {
  if (!(await isOwner())) return unauthorized();

  try {
    await ensureSeed();
    const body = (await request.json()) as Payload;

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();

    if (!name) {
      return Response.json({ ok: false, error: "A name is required." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return Response.json(
        { ok: false, error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const value = Math.round(Number(body.valueIdr) || 0);

    const [created] = await db
      .insert(leads)
      .values({
        name: name.slice(0, 160),
        email: email.slice(0, 180),
        phone: (body.phone ?? "").trim().slice(0, 60),
        country: (body.country ?? "Indonesia").trim().slice(0, 90) || "Indonesia",
        productInterest:
          (body.productInterest ?? "").trim().slice(0, 180) || "General enquiry",
        message: (body.message ?? "").trim().slice(0, 2000),
        source: (body.source ?? "studio").trim().slice(0, 40) || "studio",
        status: "new",
        valueIdr: value > 0 ? Math.min(value, 2_000_000_000) : 0,
        notes: "",
      })
      .returning();

    return Response.json({ ok: true, lead: created });
  } catch (error) {
    console.error("[api] gagal menambah lead:", error);
    return Response.json(
      { ok: false, error: "Could not add the lead." },
      { status: 500 },
    );
  }
}

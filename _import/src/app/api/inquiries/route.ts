import { db } from "@/db";
import { leads } from "@/db/schema";

export const dynamic = "force-dynamic";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  productInterest?: string;
  message?: string;
  source?: string;
  valueIdr?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const name = body.name?.trim();
    const email = body.email?.trim();

    if (!name || !email || !email.includes("@")) {
      return Response.json(
        { ok: false, error: "A name and a valid email are required." },
        { status: 400 },
      );
    }

    const valueIdr = Number(body.valueIdr);

    const [lead] = await db
      .insert(leads)
      .values({
        name: name.slice(0, 160),
        email: email.slice(0, 180),
        phone: (body.phone ?? "").slice(0, 60),
        country: (body.country ?? "Indonesia").slice(0, 90),
        productInterest: (body.productInterest ?? "General enquiry").slice(0, 180),
        message: (body.message ?? "").slice(0, 4000),
        source: ["configurator", "contact", "whatsapp", "studio"].includes(
          body.source ?? "",
        )
          ? (body.source as string)
          : "contact",
        status: "new",
        valueIdr: Number.isFinite(valueIdr) && valueIdr > 0 ? Math.round(valueIdr) : 0,
      })
      .returning({ id: leads.id });

    return Response.json({
      ok: true,
      id: lead?.id ?? null,
      reference: `TB-REQ-${String(lead?.id ?? 0).padStart(4, "0")}`,
    });
  } catch {
    return Response.json(
      { ok: false, error: "Could not record the enquiry." },
      { status: 500 },
    );
  }
}

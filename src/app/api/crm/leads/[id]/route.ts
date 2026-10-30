import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/catalog";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

type Payload = {
  status?: string;
  notes?: string;
  valueIdr?: number | string;
  productInterest?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isOwner())) return unauthorized();

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return Response.json({ ok: false, error: "Invalid lead." }, { status: 400 });
  }

  try {
    // Deployment baru: pastikan skema + data contoh siap sebelum menulis.
    await ensureSeed();
    const body = (await request.json()) as Payload;
    const patch: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!LEAD_STATUSES.includes(body.status as (typeof LEAD_STATUSES)[number])) {
        return Response.json(
          { ok: false, error: "Unknown pipeline stage." },
          { status: 400 },
        );
      }
      patch.status = body.status;
    }

    if (typeof body.notes === "string") patch.notes = body.notes.slice(0, 2000);

    // Nilai deal sebelumnya tidak bisa diisi sama sekali: lead dari WhatsApp
    // selalu tampil "Not quoted" walaupun owner sudah memberi harga.
    if (body.valueIdr !== undefined) {
      const value = Math.round(Number(body.valueIdr) || 0);
      if (!Number.isFinite(value) || value < 0) {
        return Response.json(
          { ok: false, error: "Deal value can't be negative." },
          { status: 400 },
        );
      }
      patch.valueIdr = Math.min(value, 2_000_000_000);
    }

    if (typeof body.productInterest === "string") {
      patch.productInterest =
        body.productInterest.trim().slice(0, 180) || "General enquiry";
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ ok: false, error: "Nothing to update." }, { status: 400 });
    }

    const [updated] = await db
      .update(leads)
      .set(patch)
      .where(eq(leads.id, leadId))
      .returning();

    if (!updated) {
      return Response.json({ ok: false, error: "Lead not found." }, { status: 404 });
    }

    return Response.json({ ok: true, lead: updated });
  } catch (error) {
    console.error("[api] gagal memperbarui lead:", error);
    return Response.json(
      { ok: false, error: "Could not update the lead." },
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
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return Response.json({ ok: false, error: "Invalid lead." }, { status: 400 });
  }

  try {
    await ensureSeed();
    const [removed] = await db
      .delete(leads)
      .where(eq(leads.id, leadId))
      .returning({ id: leads.id });

    if (!removed) {
      return Response.json({ ok: false, error: "Lead not found." }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api] gagal menghapus lead:", error);
    return Response.json(
      { ok: false, error: "Could not remove the lead." },
      { status: 500 },
    );
  }
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

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
    const body = (await request.json()) as { status?: string; notes?: string };
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
  } catch {
    return Response.json(
      { ok: false, error: "Could not update the lead." },
      { status: 500 },
    );
  }
}

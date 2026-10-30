import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/catalog";
import { deleteOrder, setOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isOwner())) return unauthorized();

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return Response.json({ ok: false, error: "Invalid order." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { status?: string; notes?: string };

    if (body.status !== undefined) {
      if (!ORDER_STATUSES.includes(body.status as (typeof ORDER_STATUSES)[number])) {
        return Response.json(
          { ok: false, error: "Unknown order state." },
          { status: 400 },
        );
      }

      const updated = await setOrderStatus(orderId, body.status, body.notes);
      if (!updated) {
        return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
      }
      return Response.json({ ok: true, order: updated });
    }

    if (typeof body.notes === "string") {
      const [updated] = await db
        .update(orders)
        .set({ notes: body.notes.slice(0, 2000) })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updated) {
        return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
      }
      return Response.json({ ok: true, order: updated });
    }

    return Response.json({ ok: false, error: "Nothing to update." }, { status: 400 });
  } catch {
    return Response.json(
      { ok: false, error: "Could not update the order." },
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
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return Response.json({ ok: false, error: "Invalid order." }, { status: 400 });
  }

  try {
    const removed = await deleteOrder(orderId);
    if (!removed) {
      return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, error: "Could not remove the order." },
      { status: 500 },
    );
  }
}

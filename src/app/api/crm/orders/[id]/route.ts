import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isOwner, unauthorized } from "@/lib/auth";
import { CHANNELS, ORDER_STATUSES } from "@/lib/catalog";
import { StockError, deleteOrder, setOrderStatus } from "@/lib/orders";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

type Payload = {
  status?: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  city?: string;
  country?: string;
  channel?: string;
};

function invalid(message: string) {
  return Response.json({ ok: false, error: message }, { status: 400 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isOwner())) return unauthorized();

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return invalid("Invalid order.");
  }

  try {
    // Deployment baru: pastikan skema + data contoh siap sebelum menulis.
    await ensureSeed();
    const body = (await request.json()) as Payload;

    // ── Perubahan status (memengaruhi stok) ────────────────────────────
    if (body.status !== undefined) {
      if (!ORDER_STATUSES.includes(body.status as (typeof ORDER_STATUSES)[number])) {
        return invalid("Unknown order state.");
      }

      const updated = await setOrderStatus(orderId, body.status, body.notes);
      if (!updated) {
        return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
      }
      return Response.json({ ok: true, order: updated });
    }

    // ── Edit detail pesanan ───────────────────────────────────────────
    const patch: Record<string, unknown> = {};

    if (typeof body.customerName === "string") {
      const name = body.customerName.trim();
      if (!name) return invalid("Customer name can't be empty.");
      patch.customerName = name.slice(0, 160);
    }

    if (typeof body.customerEmail === "string") {
      const email = body.customerEmail.trim();
      if (!email.includes("@")) return invalid("Enter a valid email address.");
      patch.customerEmail = email.slice(0, 180);
    }

    if (typeof body.customerPhone === "string") {
      patch.customerPhone = body.customerPhone.trim().slice(0, 60);
    }

    if (typeof body.city === "string") {
      patch.city = (body.city.trim() || "Bandung").slice(0, 90);
    }

    if (typeof body.country === "string") {
      patch.country = (body.country.trim() || "Indonesia").slice(0, 90);
    }

    if (typeof body.channel === "string") {
      if (!CHANNELS.includes(body.channel as (typeof CHANNELS)[number])) {
        return invalid("Unknown channel.");
      }
      patch.channel = body.channel;
    }

    if (typeof body.notes === "string") {
      patch.notes = body.notes.slice(0, 2000);
    }

    if (Object.keys(patch).length === 0) {
      return invalid("Nothing to update.");
    }

    const [updated] = await db
      .update(orders)
      .set(patch)
      .where(eq(orders.id, orderId))
      .returning();

    if (!updated) {
      return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
    }

    return Response.json({ ok: true, order: updated });
  } catch (error) {
    if (error instanceof StockError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 });
    }
    console.error("[api] gagal memperbarui pesanan:", error);
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
    return invalid("Invalid order.");
  }

  try {
    // Deployment baru: pastikan skema + data contoh siap sebelum menulis.
    await ensureSeed();
    const removed = await deleteOrder(orderId);
    if (!removed) {
      return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api] gagal menghapus pesanan:", error);
    return Response.json(
      { ok: false, error: "Could not remove the order." },
      { status: 500 },
    );
  }
}

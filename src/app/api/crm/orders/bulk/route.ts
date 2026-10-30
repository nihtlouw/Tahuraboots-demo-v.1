import { isOwner, unauthorized } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/catalog";
import { setOrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Ubah status banyak pesanan sekaligus (dipakai aksi massal di CRM). */
export async function POST(request: Request) {
  if (!(await isOwner())) return unauthorized();

  try {
    const body = (await request.json()) as { ids?: unknown; status?: unknown };

    const ids = Array.isArray(body.ids)
      ? [...new Set(body.ids.map((value) => Number(value)).filter(Number.isFinite))]
      : [];

    if (ids.length === 0) {
      return Response.json(
        { ok: false, error: "Choose at least one order." },
        { status: 400 },
      );
    }

    if (
      typeof body.status !== "string" ||
      !ORDER_STATUSES.includes(body.status as (typeof ORDER_STATUSES)[number])
    ) {
      return Response.json(
        { ok: false, error: "Unknown order state." },
        { status: 400 },
      );
    }

    const updated: number[] = [];
    const missing: number[] = [];

    for (const id of ids) {
      const row = await setOrderStatus(id, body.status);
      if (row) updated.push(id);
      else missing.push(id);
    }

    return Response.json({ ok: true, updated, missing, status: body.status });
  } catch {
    return Response.json(
      { ok: false, error: "Could not update those orders." },
      { status: 500 },
    );
  }
}

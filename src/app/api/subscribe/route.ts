import { sql } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { checkLoginRateLimit, clientKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES = ["footer", "waitlist", "product", "studio"] as const;

/**
 * "The cutting list" — sebelumnya form newsletter hanya mengubah state lokal
 * (tidak tersimpan). Sekarang alamatnya benar-benar masuk tabel `subscribers`.
 */
export async function POST(request: Request) {
  const key = await clientKey();
  const limit = checkLoginRateLimit(`subscribe:${key}`);
  if (!limit.allowed) {
    return Response.json(
      { ok: false, error: "Too many sign-ups from this connection. Try later." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      source?: string;
      interest?: string;
    };

    const email = (body.email ?? "").trim().toLowerCase();

    if (!EMAIL.test(email)) {
      return Response.json(
        { ok: false, error: "That email address does not look right." },
        { status: 400 },
      );
    }

    const source = SOURCES.includes(body.source as (typeof SOURCES)[number])
      ? (body.source as string)
      : "footer";

    const [row] = await db
      .insert(subscribers)
      .values({
        email: email.slice(0, 180),
        source,
        interest: (body.interest ?? "").slice(0, 180),
      })
      .onConflictDoNothing({ target: subscribers.email })
      .returning({ id: subscribers.id });

    return Response.json({
      ok: true,
      already: !row,
      message: row
        ? "You're on the cutting list. Watch your inbox."
        : "You're already on the cutting list.",
    });
  } catch {
    return Response.json(
      { ok: false, error: "Could not save your address. Try again." },
      { status: 500 },
    );
  }
}

/** Ringkasan jumlah subscriber (khusus owner, dipakai dashboard CRM). */
export async function GET() {
  const { isOwner, unauthorized } = await import("@/lib/auth");
  if (!(await isOwner())) return unauthorized();

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscribers);

  return Response.json({ ok: true, count: row?.count ?? 0 });
}

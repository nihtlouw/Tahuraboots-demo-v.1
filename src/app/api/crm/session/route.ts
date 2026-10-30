import { cookies } from "next/headers";
import { clientKey } from "@/lib/auth";
import {
  OWNER_COOKIE,
  checkRateLimit as checkLoginRateLimit,
  clearRateLimit as clearLoginRateLimit,
  createSessionToken,
  passcode,
  safeEqual,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const key = await clientKey();
  const limit = checkLoginRateLimit(key);

  if (!limit.allowed) {
    return Response.json(
      {
        ok: false,
        error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
      },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { passcode?: string };

  if (!safeEqual((body.passcode ?? "").trim(), passcode())) {
    return Response.json(
      { ok: false, error: "That passcode does not match the studio register." },
      { status: 401 },
    );
  }

  clearLoginRateLimit(key);

  const store = await cookies();
  store.set(OWNER_COOKIE, await createSessionToken(), sessionCookieOptions);
  return Response.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(OWNER_COOKIE);
  return Response.json({ ok: true });
}

/** Dipakai UI untuk mengecek status sesi tanpa memuat halaman CRM. */
export async function GET() {
  const store = await cookies();
  return Response.json({
    ok: true,
    signedIn: await verifySessionToken(store.get(OWNER_COOKIE)?.value),
  });
}

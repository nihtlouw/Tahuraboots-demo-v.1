import { cookies } from "next/headers";
import { OWNER_COOKIE, passcode } from "@/lib/auth";

export const dynamic = "force-dynamic";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    passcode?: string;
  };

  if ((body.passcode ?? "").trim() !== passcode()) {
    return Response.json(
      { ok: false, error: "That passcode does not match the studio register." },
      { status: 401 },
    );
  }

  const store = await cookies();
  store.set(OWNER_COOKIE, "owner", cookieOptions());
  return Response.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(OWNER_COOKIE);
  return Response.json({ ok: true });
}

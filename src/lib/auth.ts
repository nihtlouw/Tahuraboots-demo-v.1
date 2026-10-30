import { cookies, headers } from "next/headers";
import {
  OWNER_COOKIE,
  checkRateLimit,
  clearRateLimit,
  passcode,
  safeEqual,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session";

export { OWNER_COOKIE, passcode, sessionCookieOptions, safeEqual };
export {
  checkRateLimit as checkLoginRateLimit,
  clearRateLimit as clearLoginRateLimit,
  verifySessionToken,
};

export async function isOwner() {
  const store = await cookies();
  return verifySessionToken(store.get(OWNER_COOKIE)?.value);
}

export async function unauthorized() {
  return Response.json(
    { ok: false, error: "Owner session required." },
    { status: 401 },
  );
}

export async function clientKey() {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || store.get("x-real-ip") || "local";
}

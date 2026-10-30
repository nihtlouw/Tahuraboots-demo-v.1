/**
 * Sesi CRM — implementasi ramah Edge (Web Crypto), dipakai bersama oleh
 * middleware, server component, dan route handler.
 *
 * Token: `<expiresAt>.<nonce>.<hmacSha256_base64url>`.
 * Versi lama hanya memeriksa cookie `tahura_owner === "owner"`, sehingga siapa
 * pun bisa membuat cookie itu sendiri lewat devtools dan masuk ke CRM.
 */

export const OWNER_COOKIE = "tahura_owner";

/** Umur sesi CRM (detik). */
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

/** Batas percobaan login per IP. */
export const LOGIN_WINDOW_MS = 10 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 8;

const encoder = new TextEncoder();

export function passcode() {
  return process.env.CRM_PASSCODE ?? "tahura2026";
}

/** Kunci penandatangan sesi; idealnya `AUTH_SECRET` diisi eksplisit. */
export function sessionSecret() {
  return (
    process.env.AUTH_SECRET ??
    `tahura-session:${process.env.CRM_PASSCODE ?? "tahura2026"}`
  );
}

function toBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** Perbandingan waktu-konstan tanpa ketergantungan Node crypto. */
export function safeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return diff === 0;
}

function randomNonce() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes.buffer);
}

export async function createSessionToken(now = Date.now()) {
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const payload = `${expiresAt}.${randomNonce()}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  now = Date.now(),
) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiresAt, nonce, signature] = parts;
  const expected = await hmac(`${expiresAt}.${nonce}`);
  if (!safeEqual(signature, expected)) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}

// ── Rate limit login (in-memory per instance) ──────────────────────────────

type Attempt = { count: number; resetAt: number };

const globalForSession = globalThis as typeof globalThis & {
  __tahuraLoginAttempts?: Map<string, Attempt>;
};

const attempts =
  globalForSession.__tahuraLoginAttempts ??
  (globalForSession.__tahuraLoginAttempts = new Map<string, Attempt>());

export type RateLimitResult = { allowed: boolean; retryAfter: number };

export function checkRateLimit(
  key: string,
  limit = LOGIN_MAX_ATTEMPTS,
  now = Date.now(),
): RateLimitResult {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_SECONDS,
};

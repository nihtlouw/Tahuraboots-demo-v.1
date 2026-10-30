import { cookies } from "next/headers";

export const OWNER_COOKIE = "tahura_owner";

export async function isOwner() {
  const store = await cookies();
  return store.get(OWNER_COOKIE)?.value === "owner";
}

export async function unauthorized() {
  return Response.json(
    { ok: false, error: "Owner session required." },
    { status: 401 },
  );
}

export function passcode() {
  return process.env.CRM_PASSCODE ?? "tahura2026";
}

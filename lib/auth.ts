import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "sami_owner";
const WEEK = 7 * 24 * 60 * 60 * 1000;

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function configured(): boolean {
  return /^[a-f0-9]{64}$/.test(process.env.OWNER_CODE_HASH || "") && !!process.env.SESSION_SECRET;
}

export function validCode(code: string): boolean {
  if (!configured() || code.length > 100) return false;
  return equal(createHash("sha256").update(code).digest("hex"), process.env.OWNER_CODE_HASH!);
}

function signature(expires: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(`owner:${expires}`).digest("hex");
}

export async function setOwnerCookie(): Promise<void> {
  const expires = String(Date.now() + WEEK);
  (await cookies()).set(COOKIE, `${expires}.${signature(expires)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: WEEK / 1000 });
}

export async function clearOwnerCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isOwner(): Promise<boolean> {
  if (!configured()) return false;
  const value = (await cookies()).get(COOKIE)?.value || "";
  const match = /^(\d{13})\.([a-f0-9]{64})$/.exec(value);
  return !!match && Number(match[1]) > Date.now() && equal(match[2], signature(match[1]));
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

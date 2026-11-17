import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

const COOKIE = "sami_owner";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const scrypt = promisify(scryptCallback);
type OwnerPassword = { password_salt: string; password_hash: string; session_version: string };
let ownerTableReady: Promise<void> | undefined;

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function database() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  return neon(process.env.DATABASE_URL);
}

async function ownerPassword(): Promise<OwnerPassword | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!ownerTableReady) ownerTableReady = database()`CREATE TABLE IF NOT EXISTS sami_owner_auth (
    id integer PRIMARY KEY CHECK (id = 1),
    password_salt text NOT NULL,
    password_hash text NOT NULL,
    session_version text NOT NULL
  )`.then(() => undefined).catch(error => { ownerTableReady = undefined; throw error; });
  await ownerTableReady;
  const rows = await database()`SELECT password_salt, password_hash, session_version FROM sami_owner_auth WHERE id = 1`;
  return (rows[0] as OwnerPassword | undefined) ?? null;
}

export function configured(): boolean {
  return !!process.env.SESSION_SECRET && (!!process.env.DATABASE_URL || /^[a-f0-9]{64}$/.test(process.env.OWNER_CODE_HASH || ""));
}

async function matchesPassword(code: string, saved: OwnerPassword | null): Promise<boolean> {
  if (!configured() || !code || code.length > 100) return false;
  if (saved) {
    const hash = await scrypt(code, Buffer.from(saved.password_salt, "hex"), 64) as Buffer;
    return equal(hash.toString("hex"), saved.password_hash);
  }
  const fallback = process.env.OWNER_CODE_HASH || "";
  return /^[a-f0-9]{64}$/.test(fallback) && equal(createHash("sha256").update(code).digest("hex"), fallback);
}

export async function validCode(code: string): Promise<string | null> {
  const saved = await ownerPassword();
  return await matchesPassword(code, saved) ? saved?.session_version || "legacy" : null;
}

export async function changeOwnerPassword(current: string, next: string): Promise<{ status: "ok"; version: string } | { status: "incorrect" } | { status: "conflict" }> {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured for password changes.");
  const saved = await ownerPassword();
  // An existing owner session can choose the first custom password even if the
  // original deployment code is no longer known. Later changes need the current password.
  if ((saved || current) && !await matchesPassword(current, saved)) return { status: "incorrect" };
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(next, Buffer.from(salt, "hex"), 64) as Buffer).toString("hex");
  const version = randomUUID();
  const sql = database();
  const rows = saved
    ? await sql`UPDATE sami_owner_auth SET password_salt = ${salt}, password_hash = ${hash}, session_version = ${version}
        WHERE id = 1 AND session_version = ${saved.session_version} RETURNING id`
    : await sql`INSERT INTO sami_owner_auth (id, password_salt, password_hash, session_version)
        VALUES (1, ${salt}, ${hash}, ${version}) ON CONFLICT (id) DO NOTHING RETURNING id`;
  return rows.length ? { status: "ok", version } : { status: "conflict" };
}

function signature(expires: string, version: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(`owner:${expires}:${version}`).digest("hex");
}

export async function setOwnerCookie(version: string): Promise<void> {
  const expires = String(Date.now() + WEEK);
  (await cookies()).set(COOKIE, `${expires}.${version}.${signature(expires, version)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: WEEK / 1000 });
}

export async function clearOwnerCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isOwner(): Promise<boolean> {
  if (!configured()) return false;
  const value = (await cookies()).get(COOKIE)?.value || "";
  const match = /^(\d{13})\.(legacy|[a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(value);
  const old = /^(\d{13})\.([a-f0-9]{64})$/.exec(value);
  if (!match && !old) return false;
  const saved = await ownerPassword();
  if (match) {
    const version = saved?.session_version || "legacy";
    return Number(match[1]) > Date.now() && match[2] === version && equal(match[3], signature(match[1], version));
  }
  // Cookies issued before password changes remain valid only until a custom password is set.
  return !saved && Number(old![1]) > Date.now() && equal(old![2], createHmac("sha256", process.env.SESSION_SECRET!).update(`owner:${old![1]}`).digest("hex"));
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

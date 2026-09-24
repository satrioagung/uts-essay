import { cookies } from "next/headers";
import crypto from "node:crypto";

export const SESSION_COOKIE = "essayspace_session";

export async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value || null;
  return value ? verifySessionValue(value) : null;
}

export function createSessionValue(role: "admin" | "siswa", id = "demo") {
  const payload = Buffer.from(JSON.stringify({ role, id, createdAt: Date.now() })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifySessionValue(value: string): { role: "admin" | "siswa"; id: string } | null {
  const [payload, received] = value.split(".");
  if (!payload || !received) return null;
  const expected = signature(payload);
  if (received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return parsed.role && parsed.id ? parsed : null;
  } catch { return null; }
}

function signature(payload: string) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "change-this-session-secret").update(payload).digest("base64url");
}

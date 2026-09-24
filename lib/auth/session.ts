import { cookies } from "next/headers";

export const SESSION_COOKIE = "essayspace_session";

export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export function createSessionValue(role: "admin" | "siswa", id = "demo") {
  return Buffer.from(JSON.stringify({ role, id, createdAt: Date.now() })).toString("base64url");
}

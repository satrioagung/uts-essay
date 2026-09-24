import { NextResponse } from "next/server";
import { createSessionValue, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const role = body.role === "siswa" ? "siswa" : "admin";
  if (!body.identifier || !body.password) return NextResponse.json({ error: "Kredensial wajib diisi." }, { status: 400 });
  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(SESSION_COOKIE, createSessionValue(role, body.identifier), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}

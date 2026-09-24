import { NextResponse } from "next/server";
import { createSessionValue, SESSION_COOKIE } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const role = body.role === "siswa" ? "siswa" : "admin";
  if (!body.identifier || !body.password) return NextResponse.json({ error: "Kredensial wajib diisi." }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const table = role === "admin" ? "admin" : "siswa";
    const column = role === "admin" ? "username" : "no_ujian";
    const { data, error } = role === "admin"
      ? await supabase.from(table).select("id,password_hash").eq(column, body.identifier).maybeSingle()
      : await supabase.from(table).select("id,password").eq(column, body.identifier).maybeSingle();
    if (error) throw error;
    const record = data as any;
    const expectedHash = crypto.createHash("sha256").update(body.password).digest("hex");
    const valid = role === "admin" ? Boolean(record?.password_hash && record.password_hash.length === expectedHash.length && crypto.timingSafeEqual(Buffer.from(record.password_hash), Buffer.from(expectedHash))) : record?.password === body.password;
    if (!record || !valid) return NextResponse.json({ error: "Username/No. Ujian atau password salah." }, { status: 401 });
    const response = NextResponse.json({ ok: true, role, id: record.id });
    response.cookies.set(SESSION_COOKIE, createSessionValue(role, record.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
    return response;
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "Koneksi database belum siap." }, { status: 503 });
  }
}

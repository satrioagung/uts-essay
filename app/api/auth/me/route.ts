import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  const supabase = createAdminClient();
  const table = session.role === "admin" ? "admin" : "siswa";
  const fields = session.role === "admin" ? "id,nama,username" : "id,nama,no_ujian,kelas(nama_kelas)";
  const result = await supabase.from(table).select(fields).eq("id", session.id).single();
  if (result.error && session.role === "admin" && isMissingNameColumn(result.error)) {
    const fallback = await supabase.from(table).select("id,username").eq("id", session.id).single();
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    return NextResponse.json({ role: session.role, profile: { ...fallback.data, nama: fallback.data.username } });
  }
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ role: session.role, profile: result.data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const nama = String(body.nama || "").trim();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!nama || !username) return NextResponse.json({ error: "Nama dan username wajib diisi." }, { status: 400 });
  const payload: Record<string, string> = { nama, username };
  if (password) {
    if (password.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    payload.password_hash = crypto.createHash("sha256").update(password).digest("hex");
  }
  const { data, error } = await createAdminClient().from("admin").update(payload).eq("id", auth.session.id).select("id,nama,username").single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    if (isMissingNameColumn(error)) return NextResponse.json({ error: "Jalankan migration admin profile terlebih dahulu di Supabase." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

function isMissingNameColumn(error: { code?: string; message?: string }) {
  return error.code === "42703" && String(error.message || "").includes("nama");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return { response: NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 }) } as const;
  return { session } as const;
}

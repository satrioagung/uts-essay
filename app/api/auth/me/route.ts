import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  const supabase = createAdminClient();
  const table = session.role === "admin" ? "admin" : "siswa";
  const fields = session.role === "admin" ? "id,username" : "id,nama,no_ujian,kelas(nama_kelas)";
  const { data, error } = await supabase.from(table).select(fields).eq("id", session.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ role: session.role, profile: data });
}

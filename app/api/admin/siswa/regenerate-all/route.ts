import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

export async function POST() {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const supabase = createAdminClient();
  const { data: students, error: readError } = await supabase.from("siswa").select("id,nama,kelas_id").order("nama");
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  const rows = students || [];
  const temporary = rows.map(student => ({ id: student.id, nama: student.nama, kelas_id: student.kelas_id, no_ujian: `__regenerate__${student.id}`, password: randomPassword() }));
  for (const student of temporary) {
    const { error } = await supabase.from("siswa").update({ no_ujian: student.no_ujian }).eq("id", student.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const credentials = temporary.map((student, index) => ({ ...student, no_ujian: `u0181${String(index + 1).padStart(4, "0")}` }));
  for (const student of credentials) {
    const { error } = await supabase.from("siswa").update({ no_ujian: student.no_ujian, password: student.password }).eq("id", student.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: credentials.length, credentials: credentials.map(({ id, kelas_id, ...credential }) => credential) });
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join("");
}

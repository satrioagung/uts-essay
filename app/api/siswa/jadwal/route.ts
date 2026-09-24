import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const supabase = createAdminClient();
  const { data: student, error: studentError } = await supabase.from("siswa").select("id,nama,no_ujian,kelas_id,kelas(nama_kelas)").eq("id", auth.session.id).single();
  if (studentError) return NextResponse.json({ error: "Data siswa tidak ditemukan." }, { status: 404 });
  const { data: schedules, error } = await supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,durasi_menit,randomisasi_urutan_soal,status,kelas(nama_kelas),bank_soal(nama_bank_soal,mapel(nama_mapel),soal(count))").eq("kelas_id", student.kelas_id).in("status", ["siap", "berlangsung"]).order("waktu_mulai");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student, schedules: schedules || [] });
}

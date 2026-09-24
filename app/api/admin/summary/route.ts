import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const supabase = createAdminClient();
  const names = ["siswa", "bank_soal", "jadwal", "sesi_ujian"] as const;
  const counts = await Promise.all(names.map(async name => { const result = await supabase.from(name).select("id", { count: "exact", head: true }); return [name, result.count || 0] as const; }));
  let schedules: any;
  let scheduleError: any;
  ({ data: schedules, error: scheduleError } = await supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,waktu_selesai,durasi_menit,status,kelas!jadwal_kelas_id_fkey(nama_kelas),bank_soal(nama_bank_soal,mapel(nama_mapel))").order("waktu_mulai").limit(5));
  if (scheduleError?.code === "42703") ({ data: schedules } = await supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,durasi_menit,status,kelas!jadwal_kelas_id_fkey(nama_kelas),bank_soal(nama_bank_soal,mapel(nama_mapel))").order("waktu_mulai").limit(5));
  return NextResponse.json({ counts: Object.fromEntries(counts), schedules: schedules || [] });
}

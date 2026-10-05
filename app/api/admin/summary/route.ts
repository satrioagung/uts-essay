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
  ({ data: schedules, error: scheduleError } = await supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,waktu_selesai,durasi_menit,status,kelas!jadwal_kelas_id_fkey(nama_kelas),jadwal_kelas(kelas!jadwal_kelas_kelas_id(id,nama_kelas)),bank_soal(nama_bank_soal,mapel(nama_mapel))").order("waktu_mulai").limit(5));
  if (scheduleError) ({ data: schedules } = await supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,durasi_menit,status,kelas!jadwal_kelas_id_fkey(nama_kelas),bank_soal(nama_bank_soal,mapel(nama_mapel))").order("waktu_mulai").limit(5));
  const scheduleRows = schedules || [];
  const scheduleIds = scheduleRows.map((schedule: any) => schedule.id);
  let enrichedSchedules = scheduleRows;
  if (scheduleIds.length) {
    const { data: links } = await supabase.from("jadwal_kelas").select("jadwal_id,kelas_id").in("jadwal_id", scheduleIds);
    const classIds = Array.from(new Set((links || []).map((link: any) => link.kelas_id).filter(Boolean)));
    const { data: classes } = classIds.length ? await supabase.from("kelas").select("id,nama_kelas").in("id", classIds) : { data: [] };
    const classById = new Map((classes || []).map((item: any) => [item.id, item]));
    if (links?.length) {
      enrichedSchedules = scheduleRows.map((schedule: any) => ({
        ...schedule,
        jadwal_kelas: links.filter((link: any) => link.jadwal_id === schedule.id).map((link: any) => ({ kelas_id: link.kelas_id, kelas: classById.get(link.kelas_id) || null }))
      }));
    }
  }
  return NextResponse.json({ counts: Object.fromEntries(counts), schedules: enrichedSchedules });
}

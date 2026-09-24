import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const { data, error } = await createAdminClient().from("sesi_ujian").select("id,status,attempt_ke,waktu_mulai_sesi,waktu_selesai_sesi,jadwal(waktu_mulai,bank_soal(nama_bank_soal,mapel(nama_mapel)))").eq("siswa_id", auth.session.id).order("waktu_mulai_sesi", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

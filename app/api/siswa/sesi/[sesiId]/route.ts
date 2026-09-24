import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: { sesiId: string } }) {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const supabase = createAdminClient();
  const { data: session, error } = await supabase.from("sesi_ujian").select("id,siswa_id,jadwal_id,urutan_soal_acak,waktu_mulai_sesi,waktu_selesai_sesi,status,attempt_ke,jumlah_pelanggaran,jadwal(durasi_menit,bank_soal(nama_bank_soal,mapel(nama_mapel),soal(id,nomor,teks_soal)))").eq("id", params.sesiId).eq("siswa_id", auth.session.id).single();
  if (error || !session) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
  const answers = await supabase.from("jawaban").select("soal_id,jawaban_teks,updated_at").eq("sesi_ujian_id", params.sesiId);
  return NextResponse.json({ session, answers: answers.data || [] });
}

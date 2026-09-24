import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!body.sesiUjianId || !["lanjutkan", "mengulang", "paksa_selesai"].includes(body.mode)) return NextResponse.json({ error: "sesiUjianId dan mode reset wajib diisi." }, { status: 400 });
  const supabase = createAdminClient();
  if (body.mode === "lanjutkan") {
    const { data, error } = await supabase.from("sesi_ujian").update({ status: "sedang_mengerjakan", jumlah_pelanggaran: 0, updated_at: new Date().toISOString() }).eq("id", body.sesiUjianId).select("id,status,attempt_ke,jumlah_pelanggaran").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  }
  if (body.mode === "paksa_selesai") {
    const { data, error } = await supabase.from("sesi_ujian").update({ status: "selesai", waktu_selesai_sesi: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", body.sesiUjianId).select("id,status,attempt_ke").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  }
  const { data: old, error: oldError } = await supabase.from("sesi_ujian").select("siswa_id,jadwal_id,urutan_soal_acak,attempt_ke").eq("id", body.sesiUjianId).single();
  if (oldError || !old) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
  await supabase.from("jawaban").delete().eq("sesi_ujian_id", body.sesiUjianId);
  await supabase.from("sesi_ujian").update({ status: "selesai", waktu_selesai_sesi: new Date().toISOString() }).eq("id", body.sesiUjianId);
  const { data, error } = await supabase.from("sesi_ujian").insert({ siswa_id: old.siswa_id, jadwal_id: old.jadwal_id, urutan_soal_acak: old.urutan_soal_acak, status: "belum_mulai", attempt_ke: old.attempt_ke + 1 }).select("id,status,attempt_ke").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!body.jadwalId || !body.token) return NextResponse.json({ error: "Jadwal dan token wajib diisi." }, { status: 400 });
  const supabase = createAdminClient();
  const { data: schedule, error: scheduleError } = await supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,durasi_menit,randomisasi_urutan_soal,status,token!inner(kode_token,status),bank_soal(soal(id,nomor))").eq("id", body.jadwalId).eq("token.kode_token", String(body.token).toUpperCase()).eq("token.status", "aktif").maybeSingle();
  if (scheduleError || !schedule) return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa." }, { status: 401 });
  if (!(["siap", "berlangsung"] as string[]).includes(schedule.status)) return NextResponse.json({ error: "Jadwal belum dapat dimulai." }, { status: 409 });
  const { data: student } = await supabase.from("siswa").select("kelas_id").eq("id", auth.session.id).single();
  if (!student || student.kelas_id !== schedule.kelas_id) return NextResponse.json({ error: "Jadwal bukan untuk kelasmu." }, { status: 403 });
  const { data: previous } = await supabase.from("sesi_ujian").select("id,status,attempt_ke").eq("siswa_id", auth.session.id).eq("jadwal_id", body.jadwalId).order("attempt_ke", { ascending: false }).limit(1).maybeSingle();
  if (previous) return NextResponse.json({ error: "Kamu sudah memiliki sesi untuk jadwal ini. Hubungi admin bila perlu melanjutkan atau mengulang." }, { status: 409 });
  const questions = (schedule.bank_soal as { soal?: Array<{ id: string; nomor: number }> } | null)?.soal || [];
  const order = questions.map(question => question.id);
  if (schedule.randomisasi_urutan_soal !== false) order.sort(() => Math.random() - 0.5);
  const attempt = 1;
  const { data: session, error } = await supabase.from("sesi_ujian").insert({ siswa_id: auth.session.id, jadwal_id: body.jadwalId, urutan_soal_acak: order, waktu_mulai_sesi: new Date().toISOString(), status: "sedang_mengerjakan", attempt_ke: attempt }).select("id,jadwal_id,waktu_mulai_sesi,status,urutan_soal_acak,attempt_ke").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("jadwal").update({ status: "berlangsung" }).eq("id", body.jadwalId).eq("status", "siap");
  return NextResponse.json({ session }, { status: 201 });
}

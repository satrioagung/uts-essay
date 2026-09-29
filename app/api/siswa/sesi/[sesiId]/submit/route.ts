import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_: Request, { params }: { params: { sesiId: string } }) {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const supabase = createAdminClient();
  const { data: session, error: sessionError } = await supabase.from("sesi_ujian").select("id,status,jadwal(bank_soal(soal(id)))").eq("id", params.sesiId).eq("siswa_id", auth.session.id).single();
  if (sessionError || !session) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
  const questions = (session.jadwal as any)?.bank_soal?.soal || [];
  const { data: answers, error: answersError } = await supabase.from("jawaban").select("soal_id,jawaban_teks").eq("sesi_ujian_id", params.sesiId);
  if (answersError) return NextResponse.json({ error: answersError.message }, { status: 500 });
  const answerByQuestion = new Map((answers || []).map(answer => [answer.soal_id, String(answer.jawaban_teks || "").trim()]));
  const unansweredCount = questions.filter((question: { id: string }) => !answerByQuestion.get(question.id)).length;
  if (unansweredCount > 0) return NextResponse.json({ error: `${unansweredCount} soal belum diisi.` }, { status: 409 });
  const { data, error } = await supabase.from("sesi_ujian").update({ status: "selesai", waktu_selesai_sesi: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", params.sesiId).eq("siswa_id", auth.session.id).eq("status", "sedang_mengerjakan").select("id,status,waktu_selesai_sesi").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

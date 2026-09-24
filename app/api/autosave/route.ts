import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!body.sesiUjianId || !body.soalId) return NextResponse.json({ error: "Sesi dan soal wajib diisi." }, { status: 400 });
  const supabase = createAdminClient();
  const { data: session } = await supabase.from("sesi_ujian").select("id,status").eq("id", body.sesiUjianId).eq("siswa_id", auth.session.id).single();
  if (!session || session.status !== "sedang_mengerjakan") return NextResponse.json({ error: "Sesi tidak aktif." }, { status: 409 });
  const { data, error } = await supabase.from("jawaban").upsert({ sesi_ujian_id: body.sesiUjianId, soal_id: body.soalId, jawaban_teks: String(body.jawabanTeks || ""), updated_at: new Date().toISOString() }, { onConflict: "sesi_ujian_id,soal_id" }).select("id,updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, savedAt: data.updated_at });
}

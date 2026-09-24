import { NextResponse } from "next/server";
import { validateQuestionRows } from "@/lib/import-validation";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const issues = validateQuestionRows(rows);
  if (issues.length) return NextResponse.json({ ok: false, issues }, { status: 422 });
  if (!body.bankSoalId) return NextResponse.json({ error: "Bank soal tujuan wajib dipilih." }, { status: 400 });
  const payload = rows.map((row: Record<string, unknown>) => ({ bank_soal_id: body.bankSoalId, nomor: Number(row.Nomor), teks_soal: String(row.Soal).trim() }));
  const { data, error } = await createAdminClient().from("soal").insert(payload).select("id,nomor,teks_soal,bank_soal_id");
  if (error?.code === "23505") return NextResponse.json({ error: "Ada nomor soal yang sudah digunakan di bank soal ini." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, imported: data?.length || 0, data: data || [] });
}

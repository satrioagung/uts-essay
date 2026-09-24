import { NextResponse } from "next/server";
import { validateStudentRows } from "@/lib/import-validation";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const issues = validateStudentRows(rows, Array.isArray(body.classNames) ? body.classNames : []);
  if (issues.length) return NextResponse.json({ ok: false, issues }, { status: 422 });
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("siswa").select("no_ujian").like("no_ujian", "u0181%");
  let next = Math.max(0, ...(existing || []).map((row: { no_ujian: string }) => Number(String(row.no_ujian).slice(5)) || 0));
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const payload = rows.map((row: Record<string, unknown>) => { next += 1; const password = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); return { no_ujian: `u0181${String(next).padStart(4, "0")}`, password, nama: String(row.Nama).trim(), kelas_id: String((body.classMap || {})[String(row.Kelas).trim()] || "") }; });
  if (payload.some((row: { kelas_id: string }) => !row.kelas_id)) return NextResponse.json({ error: "Mapping kelas tidak lengkap." }, { status: 400 });
  const { data, error } = await supabase.from("siswa").insert(payload).select("no_ujian,password,nama,kelas_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, imported: data?.length || 0, credentials: data || [] });
}

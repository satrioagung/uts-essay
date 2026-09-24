import { NextResponse } from "next/server";
import { validateStudentRows } from "@/lib/import-validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const issues = validateStudentRows(rows, Array.isArray(body.classNames) ? body.classNames : []);
  if (issues.length) return NextResponse.json({ ok: false, issues }, { status: 422 });
  return NextResponse.json({ ok: true, imported: rows.length, message: "Siswa siap disimpan ke Supabase." });
}

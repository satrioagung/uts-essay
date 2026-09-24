import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.sesiUjianId || !body.soalId) return NextResponse.json({ error: "Sesi dan soal wajib diisi." }, { status: 400 });
  // Production implementation persists to Jawaban via the Supabase server client.
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}

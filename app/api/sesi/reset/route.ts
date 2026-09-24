import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.sesiUjianId || !["lanjutkan", "mengulang"].includes(body.mode)) return NextResponse.json({ error: "sesiUjianId dan mode reset wajib diisi." }, { status: 400 });
  return NextResponse.json({ ok: true, sesiUjianId: body.sesiUjianId, mode: body.mode, message: "Reset sesi siap dipersist ke Supabase." });
}

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.jadwalId) return NextResponse.json({ error: "jadwalId wajib diisi." }, { status: 400 });
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return NextResponse.json({ ok: true, jadwalId: body.jadwalId, token: code, note: "Token lama harus diubah menjadi kedaluwarsa dalam transaksi Supabase." });
}

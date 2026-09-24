import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!body.jadwalId) return NextResponse.json({ error: "jadwalId wajib diisi." }, { status: 400 });
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const supabase = createAdminClient();
  const { error: expireError } = await supabase.from("token").update({ status: "kedaluwarsa" }).eq("jadwal_id", body.jadwalId).eq("status", "aktif");
  if (expireError) return NextResponse.json({ error: expireError.message }, { status: 500 });
  const { data, error } = await supabase.from("token").insert({ jadwal_id: body.jadwalId, kode_token: code, status: "aktif" }).select("id,jadwal_id,kode_token,status,generated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, token: data });
}

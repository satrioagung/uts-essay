import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const jadwalId = new URL(request.url).searchParams.get("jadwalId");
  if (!jadwalId) return NextResponse.json({ error: "jadwalId wajib diisi." }, { status: 400 });
  const { data, error } = await createAdminClient().from("sesi_ujian").select("id,status,attempt_ke,jumlah_pelanggaran,updated_at,siswa(nama,no_ujian,kelas(nama_kelas))").eq("jadwal_id", jadwalId).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

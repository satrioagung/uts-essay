import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_: Request, { params }: { params: { sesiId: string } }) {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const { data, error } = await createAdminClient().from("sesi_ujian").update({ status: "selesai", waktu_selesai_sesi: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", params.sesiId).eq("siswa_id", auth.session.id).eq("status", "sedang_mengerjakan").select("id,status,waktu_selesai_sesi").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

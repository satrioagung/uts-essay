import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: { sesiId: string } }) {
  const auth = await requireRole("siswa");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.violation) { update.status = "terputus"; update.jumlah_pelanggaran = Number(body.jumlahPelanggaran || 0) + 1; }
  const { data, error } = await createAdminClient().from("sesi_ujian").update(update).eq("id", params.sesiId).eq("siswa_id", auth.session.id).select("status,jumlah_pelanggaran,updated_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0) : [];
  if (!ids.length) return NextResponse.json({ error: "Tidak ada siswa yang dipilih." }, { status: 400 });
  const { error } = await createAdminClient().from("siswa").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: ids.length });
}

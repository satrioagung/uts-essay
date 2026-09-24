import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: { jadwalId: string } }) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const { jadwalId } = params;
  const { data, error } = await createAdminClient().from("jawaban").select("jawaban_teks,soal(nomor),sesi_ujian!inner(jadwal_id,siswa(no_ujian,nama))").eq("sesi_ujian.jadwal_id", jadwalId).order("soal(nomor)");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data || []).map((row: any) => ({ "No. Ujian": row.sesi_ujian?.siswa?.no_ujian || "", Nama: row.sesi_ujian?.siswa?.nama || "", "Nomor Soal": row.soal?.nomor || "", Jawaban: row.jawaban_teks || "" }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Jawaban");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="jawaban-${jadwalId}.xlsx"` } });
}

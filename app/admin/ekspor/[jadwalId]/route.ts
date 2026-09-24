import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(_: Request, { params }: { params: { jadwalId: string } }) {
  const { jadwalId } = params;
  const rows = [
    { "No. Ujian": "u01810001", Nama: "Ahmad Fauzan", "Nomor Soal": 1, Jawaban: "" },
    { "No. Ujian": "u01810002", Nama: "Dinda Maharani", "Nomor Soal": 1, Jawaban: "" },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Jawaban");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="jawaban-${jadwalId}.xlsx"` } });
}

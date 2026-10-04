import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: { jadwalId: string } }) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const { jadwalId } = params;
  const supabase = createAdminClient();
  const [{ data: schedule, error: scheduleError }, { data, error }] = await Promise.all([
    supabase.from("jadwal").select("waktu_mulai,bank_soal(nama_bank_soal,mapel(nama_mapel)),kelas!jadwal_kelas_id_fkey(nama_kelas)").eq("id", jadwalId).maybeSingle(),
    supabase.from("jawaban").select("jawaban_teks,soal(nomor),sesi_ujian!inner(jadwal_id,siswa(no_ujian,nama,kelas(nama_kelas)))").eq("sesi_ujian.jadwal_id", jadwalId).order("soal(nomor)")
  ]);
  if (scheduleError) return NextResponse.json({ error: scheduleError.message }, { status: 500 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!schedule) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
  const { data: classLinks } = await supabase.from("jadwal_kelas").select("kelas!jadwal_kelas_kelas_id_fkey(nama_kelas)").eq("jadwal_id", jadwalId);
  const directClass = Array.isArray(schedule.kelas) ? schedule.kelas[0] : schedule.kelas;
  const bankSoal = Array.isArray(schedule.bank_soal) ? schedule.bank_soal[0] : schedule.bank_soal;
  const mapel = Array.isArray(bankSoal?.mapel) ? bankSoal.mapel[0] : bankSoal?.mapel;
  const classNames = [directClass?.nama_kelas, ...(classLinks || []).map((item: any) => (Array.isArray(item.kelas) ? item.kelas[0] : item.kelas)?.nama_kelas)].filter(Boolean);
  const uniqueClassNames = Array.from(new Set(classNames));
  const scheduleName = [mapel?.nama_mapel, bankSoal?.nama_bank_soal, ...uniqueClassNames].filter(Boolean).join("-");
  const rows = (data || []).map((row: any) => {
    const student = row.sesi_ujian?.siswa;
    const studentClass = Array.isArray(student?.kelas) ? student.kelas[0] : student?.kelas;
    return { "No. Ujian": student?.no_ujian || "", Nama: student?.nama || "", Kelas: studentClass?.nama_kelas || "", "Nomor Soal": row.soal?.nomor || "", Jawaban: row.jawaban_teks || "" };
  });
  const filename = sanitizeFilename(`jawaban-${scheduleName || "jadwal"}`);
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Mata Pelajaran", mapel?.nama_mapel || "-"],
    ["Kelas", uniqueClassNames.join(", ") || "-"],
    [],
    ["No. Ujian", "Nama", "Kelas", "Nomor Soal", "Jawaban"]
  ]);
  XLSX.utils.sheet_add_json(worksheet, rows, { origin: "A5", skipHeader: true });
  worksheet["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 80 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jawaban");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${filename}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}.xlsx` } });
}

function sanitizeFilename(value: string) {
  return value.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s-]+/g, "-").slice(0, 140) || "jawaban-jadwal";
}

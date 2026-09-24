export type ImportIssue = { row: number; message: string };

export function validateStudentRows(rows: Array<Record<string, unknown>>, classNames: string[]) {
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const name = String(row.Nama || "").trim();
    const className = String(row.Kelas || "").trim();
    if (!name || !className) issues.push({ row: index + 2, message: "Nama dan Kelas wajib diisi." });
    if (seen.has(name.toLowerCase())) issues.push({ row: index + 2, message: "Nama duplikat dalam file." });
    if (name) seen.add(name.toLowerCase());
    if (className && !classNames.includes(className)) issues.push({ row: index + 2, message: `Kelas ${className} tidak ditemukan.` });
  });
  return issues;
}

export function validateQuestionRows(rows: Array<Record<string, unknown>>) {
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const number = String(row.Nomor || "").trim();
    const question = String(row.Soal || "").trim();
    if (!number || !question) issues.push({ row: index + 2, message: "Nomor dan Soal wajib diisi." });
    if (seen.has(number)) issues.push({ row: index + 2, message: "Nomor soal duplikat." });
    if (number) seen.add(number);
  });
  return issues;
}

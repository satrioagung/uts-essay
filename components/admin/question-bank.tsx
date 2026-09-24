"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Check, FileSpreadsheet, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { validateQuestionRows } from "@/lib/import-validation";

type Question = { id: string; nomor: number; teks_soal: string };
type Props = { bank: { id: string; nama_bank_soal: string; mapel?: { nama_mapel?: string } }; onClose: () => void; onNotify: (message: string) => void; onChanged?: () => void };

export function QuestionBankModal({ bank, onClose, onNotify, onChanged }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | null>(null);
  const [number, setNumber] = useState("");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [issues, setIssues] = useState<{ row: number; message: string }[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    const response = await fetch(`/api/admin/soal?bankSoalId=${bank.id}`, { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    setQuestions(response.ok ? result.data || [] : []);
    setLoading(false);
  }

  useEffect(() => { void loadQuestions(); }, [bank.id]);

  function startEdit(question: Question) {
    setEditing(question);
    setNumber(String(question.nomor));
    setText(question.teks_soal);
  }

  function clearEdit() {
    setEditing(null);
    setNumber("");
    setText("");
  }

  async function saveQuestion() {
    if (!editing || !number.trim() || !text.trim()) return;
    setSaving(true);
    const response = await fetch("/api/admin/soal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, bank_soal_id: bank.id, nomor: Number(number), teks_soal: text.trim() }) });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { onNotify(result.error || "Soal gagal disimpan."); return; }
    clearEdit();
    await loadQuestions();
    onChanged?.();
    onNotify("Soal berhasil diperbarui.");
  }

  async function deleteQuestion(question: Question) {
    if (!window.confirm(`Hapus soal nomor ${question.nomor}?`)) return;
    const response = await fetch(`/api/admin/soal?id=${question.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { onNotify(result.error || "Soal gagal dihapus."); return; }
    if (editing?.id === question.id) clearEdit();
    await loadQuestions();
    onChanged?.();
    onNotify("Soal berhasil dihapus.");
  }

  async function readFile(file: File) {
    setFileName(file.name);
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
    const normalized = raw.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), value])));
    setRows(normalized);
    const existingNumbers = new Set(questions.map(question => String(question.nomor)));
    setIssues([...validateQuestionRows(normalized), ...normalized.flatMap((row, index) => existingNumbers.has(String(row.Nomor || "").trim()) ? [{ row: index + 2, message: `Nomor soal ${row.Nomor} sudah ada di bank ini.` }] : [])]);
  }

  async function importQuestions() {
    if (!rows.length || issues.length) return;
    const response = await fetch("/api/import-soal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows, bankSoalId: bank.id }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setIssues(result.issues || [{ row: 0, message: result.error || "Import gagal." }]); return; }
    setRows([]); setIssues([]); setFileName("");
    await loadQuestions();
    onChanged?.();
    onNotify(`${result.imported || rows.length} soal berhasil diimpor.`);
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4"><div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-line p-5"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-brand">{bank.mapel?.nama_mapel || "Bank soal"}</p><h2 className="mt-1 text-lg font-bold text-ink">{bank.nama_bank_soal}</h2><p className="mt-1 text-xs text-muted">{questions.length} soal tersedia</p></div><button onClick={onClose} className="text-muted hover:text-ink"><X size={19} /></button></div><div className="border-b border-line bg-[#fbfbff] p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-bold text-ink">Import soal</h3><p className="mt-1 text-xs leading-5 text-muted">Import soal ke bank ini menggunakan kolom Nomor dan Soal. Periksa preview sebelum menyimpan.</p></div><FileSpreadsheet className="text-brand" size={22} /></div><input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={event => event.target.files?.[0] && void readFile(event.target.files[0])} /><button onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-[#d8d5ff] bg-white px-4 py-4 text-left hover:bg-brand-soft"><span><span className="block text-sm font-bold text-ink">{fileName || "Pilih file Excel"}</span><span className="mt-1 block text-xs text-muted">Format .xlsx atau .xls</span></span><span className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">Pilih file</span></button>{rows.length > 0 && <QuestionImportPreview rows={rows} issues={issues} />}<div className="mt-4 flex justify-end"><Button disabled={!rows.length || issues.length > 0} onClick={() => void importQuestions()}>Validasi & simpan import</Button></div></div><div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_.65fr]"><section><div className="mb-3"><h3 className="text-sm font-bold text-ink">Daftar soal</h3><p className="mt-1 text-xs text-muted">Pratinjau soal dan gunakan ikon edit atau hapus pada setiap butir.</p></div><div className="overflow-hidden rounded-xl border border-line">{loading ? <p className="p-8 text-center text-sm text-muted">Memuat soal...</p> : questions.length === 0 ? <p className="p-8 text-center text-sm text-muted">Belum ada soal di bank ini.</p> : <div className="divide-y divide-line">{questions.map(question => <div key={question.id} className="flex gap-3 p-4"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">{question.nomor}</div><p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-ink">{question.teks_soal}</p><button onClick={() => startEdit(question)} className="h-8 shrink-0 rounded-lg p-2 text-muted hover:bg-brand-soft hover:text-brand" title="Edit soal"><Pencil size={15} /></button><button onClick={() => void deleteQuestion(question)} className="h-8 shrink-0 rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger" title="Hapus soal"><Trash2 size={15} /></button></div>)}</div>}</div></section><aside>{editing ? <div className="rounded-xl border border-line p-4"><h3 className="text-sm font-bold text-ink">Edit soal nomor {editing.nomor}</h3><div className="mt-4 space-y-3"><label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">Nomor soal</span><input type="number" min="1" value={number} onChange={event => setNumber(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">Teks soal</span><textarea value={text} onChange={event => setText(event.target.value)} rows={8} className="w-full rounded-lg border border-line px-3 py-2 text-sm leading-6 outline-none focus:border-brand" /></label><div className="flex justify-end gap-2"><Button variant="secondary" onClick={clearEdit}>Batal</Button><Button onClick={() => void saveQuestion()} disabled={!number.trim() || !text.trim() || saving}><Check size={15} /> {saving ? "Menyimpan..." : "Simpan perubahan"}</Button></div></div></div> : <div className="rounded-xl bg-canvas p-5 text-sm leading-6 text-muted">Pilih ikon edit pada salah satu soal untuk melihat, memperbarui, atau menghapus detailnya.</div>}</aside></div><div className="flex justify-end border-t border-line p-5"><Button onClick={onClose}>Selesai</Button></div></div></div>;
}

function QuestionImportPreview({ rows, issues }: { rows: Record<string, unknown>[]; issues: { row: number; message: string }[] }) {
  const issueMap = new Map<number, string[]>();
  issues.forEach(issue => issueMap.set(issue.row, [...(issueMap.get(issue.row) || []), issue.message]));
  return <div className="mt-4 space-y-2"><div className="flex gap-2 text-[11px]"><Badge tone="success">{rows.length - new Set(issues.map(issue => issue.row)).size} valid</Badge><Badge tone="danger">{new Set(issues.map(issue => issue.row)).size} bermasalah</Badge></div><div className="max-h-52 overflow-auto rounded-lg border border-line"><table className="w-full text-left text-[11px]"><thead className="sticky top-0 bg-canvas text-muted"><tr><th className="px-3 py-2">Baris</th><th className="px-3 py-2">Nomor</th><th className="px-3 py-2">Soal</th></tr></thead><tbody className="divide-y divide-line">{rows.map((row, index) => { const rowNumber = index + 2; const rowIssues = issueMap.get(rowNumber) || []; return <tr key={index} className={rowIssues.length ? "bg-danger-soft/50" : "bg-success-soft/20"}><td className="px-3 py-2 text-muted">{rowNumber}</td><td className="px-3 py-2 font-bold">{String(row.Nomor || "-")}</td><td className="px-3 py-2 text-muted">{rowIssues.join(" ") || String(row.Soal || "-")}</td></tr>; })}</tbody></table></div></div>;
}

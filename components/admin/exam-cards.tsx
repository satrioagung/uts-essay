"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Printer, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Student = { id: string; nama: string; no_ujian: string; password: string; kelas?: { nama_kelas?: string } };
type PaperSize = "a4" | "f4";
const pageOptions: Record<PaperSize, number[]> = { a4: [4, 6, 8], f4: [4, 6, 8, 10] };

export function ExamCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [paper, setPaper] = useState<PaperSize>("a4");
  const [cardsPerPage, setCardsPerPage] = useState(8);
  const [header, setHeader] = useState({ line1: "PEMERINTAH PROVINSI JAWA BARAT", line2: "SMK NEGERI 1 CONTOH", line3: "KARTU PESERTA UJIAN" });

  useEffect(() => {
    fetch("/api/admin/siswa?includeCredentials=true", { cache: "no-store" }).then(r => r.json()).then(result => {
      const rows = result.data || [];
      setStudents(rows);
      setSelected(rows.map((student: Student) => student.id));
    });
  }, []);
  useEffect(() => { if (!pageOptions[paper].includes(cardsPerPage)) setCardsPerPage(pageOptions[paper][pageOptions[paper].length - 1]); }, [paper, cardsPerPage]);

  const classes = useMemo(() => Array.from(new Set(students.map(student => student.kelas?.nama_kelas).filter(Boolean))) as string[], [students]);
  const filtered = useMemo(() => students.filter(student => (classFilter === "all" || student.kelas?.nama_kelas === classFilter) && `${student.nama} ${student.no_ujian} ${student.kelas?.nama_kelas || ""}`.toLowerCase().includes(search.toLowerCase())), [students, search, classFilter]);
  const visibleIds = filtered.map(student => student.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));
  const printable = students.filter(student => selected.includes(student.id) && (classFilter === "all" || student.kelas?.nama_kelas === classFilter));
  const pages = chunk(printable, cardsPerPage);

  function toggle(id: string) { setSelected(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id]); }
  function setClass(value: string) { setClassFilter(value); setSelected(value === "all" ? students.map(student => student.id) : students.filter(student => student.kelas?.nama_kelas === value).map(student => student.id)); }
  function toggleVisible() { setSelected(value => allVisibleSelected ? value.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...value, ...visibleIds]))); }

  return <div className="space-y-6">
    <div className="print-hidden flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.15em] text-brand">Administrasi ujian</p><h2 className="text-2xl font-extrabold tracking-tight text-ink">Cetak Kartu Ujian</h2><p className="mt-1 text-sm text-muted">Pilih kelas, atur kertas, lalu cetak kartu ukuran identitas.</p></div><Button onClick={() => window.print()} disabled={!printable.length}><Printer size={16} /> Cetak {printable.length} kartu</Button></div>
    <div className="print-hidden grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <Card><CardHeader><CardTitle>Template header</CardTitle><p className="mt-1 text-xs text-muted">Tiga baris ini tampil di setiap kartu.</p></CardHeader><CardContent className="space-y-4"><HeaderField label="Header baris 1" value={header.line1} onChange={value => setHeader(previous => ({ ...previous, line1: value }))} /><HeaderField label="Header baris 2" value={header.line2} onChange={value => setHeader(previous => ({ ...previous, line2: value }))} /><HeaderField label="Header baris 3" value={header.line3} onChange={value => setHeader(previous => ({ ...previous, line3: value }))} /><div className="flex gap-2 rounded-xl bg-brand-soft p-3 text-xs leading-5 text-[#5752a9]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /> Header berlaku ke seluruh kartu yang dicetak.</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Pengaturan cetak</CardTitle><p className="mt-1 text-xs text-muted">Kartu yang dicetak mengikuti kelas dan pagination ini.</p></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2"><SelectField label="Kelas cetak" value={classFilter} onChange={setClass} options={[{ value: "all", label: "Semua kelas" }, ...classes.map(value => ({ value, label: value }))]} /><SelectField label="Ukuran kertas" value={paper} onChange={value => setPaper(value as PaperSize)} options={[{ value: "a4", label: "A4 — 210 × 297 mm" }, { value: "f4", label: "F4 — 215,9 × 330,2 mm" }]} /><SelectField label="Kartu per halaman" value={String(cardsPerPage)} onChange={value => setCardsPerPage(Number(value))} options={pageOptions[paper].map(value => ({ value: String(value), label: `${value} kartu per halaman` }))} /><div className="rounded-xl bg-canvas p-3 text-xs text-muted"><b className="text-ink">Preview:</b> {printable.length} kartu · {pages.length} halaman {paper.toUpperCase()}</div></CardContent></Card>
    </div>
    <div className="print-hidden"><Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Pilih siswa</CardTitle><p className="mt-1 text-xs text-muted">{printable.length} kartu akan dicetak{classFilter !== "all" ? ` untuk ${classFilter}` : ""}.</p></div><button onClick={toggleVisible} className="text-xs font-bold text-brand">{allVisibleSelected ? "Batalkan pilihan" : `Pilih ${classFilter === "all" ? "semua" : classFilter}`}</button></CardHeader><CardContent><div className="relative mb-3"><Search className="absolute left-3 top-2.5 text-muted" size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari siswa..." className="h-9 w-full rounded-lg border border-line pl-9 text-xs outline-none focus:border-brand" /></div><div className="max-h-72 space-y-1 overflow-auto">{filtered.map(student => <label key={student.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-canvas"><input type="checkbox" checked={selected.includes(student.id)} onChange={() => toggle(student.id)} className="accent-brand" /><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand">{student.nama.slice(0, 2).toUpperCase()}</span><span className="flex-1"><span className="block text-xs font-bold text-ink">{student.nama}</span><span className="block text-[10px] text-muted">{student.no_ujian} · {student.kelas?.nama_kelas || "-"}</span></span></label>)}</div></CardContent></Card></div>
    <div className={`print-area paper-${paper}`}>{printable.length === 0 ? <Card className="print-hidden"><CardContent className="p-10 text-center text-sm text-muted">Belum ada siswa yang dipilih.</CardContent></Card> : pages.map((page, pageIndex) => <div className="print-sheet" key={pageIndex}><div className="print-grid">{page.map(student => <ExamCard key={student.id} student={student} header={header} />)}</div><p className="print-hidden print-page-label">Halaman {pageIndex + 1} dari {pages.length}</p></div>)}</div>
  </div>;
}

function chunk<T>(items: T[], size: number) { const result: T[][] = []; for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size)); return result; }
function HeaderField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">{label}</span><input value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand">{options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>; }
function ExamCard({ student, header }: { student: Student; header: { line1: string; line2: string; line3: string } }) { return <div className="exam-card rounded-md border border-ink bg-white text-ink"><div className="exam-card-header"><p>{header.line1 || "-"}</p><p>{header.line2 || "-"}</p><p>{header.line3 || "-"}</p></div><div className="exam-card-body"><div className="exam-card-row"><b>Nama</b><span>: {student.nama}</span></div><div className="exam-card-row"><b>Kelas</b><span>: {student.kelas?.nama_kelas || "-"}</span></div><div className="exam-card-row"><b>No peserta ujian</b><span className="font-mono font-bold">: {student.no_ujian}</span></div><div className="exam-card-row"><b>Password</b><span className="font-mono font-bold">: {student.password}</span></div></div><div className="exam-card-footer"><span>Harap simpan kartu ini.</span><span className="flex items-center gap-1"><Check size={9} /> EssaySpace</span></div></div>; }

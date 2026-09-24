"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, BookOpen, CalendarDays, ChevronRight, CircleStop, RefreshCw, Repeat2, RotateCcw, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ClassOption = { id: string; name: string };

export function LiveDashboard() {
  const [summary, setSummary] = useState<any>({ counts: {}, schedules: [] });
  const [monitor, setMonitor] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitorSchedule, setMonitorSchedule] = useState<any>(null);
  const [monitorClassId, setMonitorClassId] = useState("all");
  const monitorScheduleRef = useRef<any>(null);
  const monitorClassIdRef = useRef("all");

  async function loadMonitor(jadwalId: string, classId = monitorClassIdRef.current) {
    const response = await fetch(`/api/admin/monitor?jadwalId=${jadwalId}`, { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (response.ok) setMonitor((result.data || []).filter((item: any) => classId === "all" || item.siswa?.kelas_id === classId));
  }

  async function load() {
    const response = await fetch("/api/admin/summary", { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setLoading(false); return; }
    const schedules = result.schedules || [];
    setSummary(result);
    const fallback = schedules.find((item: any) => item.status === "berlangsung") || schedules[0] || null;
    const selected = schedules.find((item: any) => item.id === monitorScheduleRef.current?.id) || fallback;
    monitorScheduleRef.current = selected;
    setMonitorSchedule(selected);
    if (selected) await loadMonitor(selected.id, monitorClassIdRef.current);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const supabase = createClient();
    const channel = supabase.channel("sesi-ujian-monitor").on("postgres_changes", { event: "*", schema: "public", table: "sesi_ujian" }, () => { void load(); }).subscribe();
    const interval = window.setInterval(() => { void load(); }, 15000);
    return () => { window.clearInterval(interval); void supabase.removeChannel(channel); };
  }, []);

  const schedules = summary.schedules || [];
  const count = (name: string) => String(summary.counts?.[name] ?? 0);
  const statuses = { sedang_mengerjakan: monitor.filter(item => item.status === "sedang_mengerjakan").length, belum_mulai: monitor.filter(item => item.status === "belum_mulai").length, selesai: monitor.filter(item => item.status === "selesai").length, terputus: monitor.filter(item => item.status === "terputus").length };
  const stats = [{ label: "Total Siswa", value: count("siswa"), meta: "Seluruh data siswa", icon: Users, color: "brand" }, { label: "Bank Soal", value: count("bank_soal"), meta: "Soal siap digunakan", icon: BookOpen, color: "success" }, { label: "Jadwal Aktif", value: count("jadwal"), meta: "Semua status", icon: CalendarDays, color: "warning" }, { label: "Perlu Ditinjau", value: String(statuses.terputus), meta: "Sesi terputus", icon: AlertTriangle, color: "danger" }];
  const classOptions = getClassOptions(monitorSchedule);

  function selectSchedule(schedule: any) { monitorScheduleRef.current = schedule; monitorClassIdRef.current = "all"; setMonitorSchedule(schedule); setMonitorClassId("all"); void loadMonitor(schedule.id, "all"); }
  function selectClass(classId: string) { monitorClassIdRef.current = classId; setMonitorClassId(classId); if (monitorScheduleRef.current) void loadMonitor(monitorScheduleRef.current.id, classId); }
  async function handleSessionAction(id: string, mode: "lanjutkan" | "mengulang" | "paksa_selesai", label: string) {
    if (!window.confirm(`${label} sesi peserta ini?`)) return;
    const response = await fetch("/api/sesi/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sesiUjianId: id, mode }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { window.alert(result.error || "Tindakan gagal dilakukan."); return; }
    if (monitorSchedule) await loadMonitor(monitorSchedule.id, monitorClassId);
  }

  return <div className="space-y-7"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat => { const Icon = stat.icon; return <Card key={stat.label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-muted">{stat.label}</p><p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{loading ? "—" : stat.value}</p></div><div className={cn("grid h-10 w-10 place-items-center rounded-xl", stat.color === "brand" ? "bg-brand-soft text-brand" : stat.color === "success" ? "bg-success-soft text-success" : stat.color === "warning" ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger")}><Icon size={19} /></div></div><p className={cn("mt-4 text-[11px] font-bold", stat.color === "danger" ? "text-danger" : "text-muted")}>{stat.meta}</p></Card>; })}</div>
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]"><Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Jadwal ujian aktif</CardTitle><p className="mt-1 text-xs text-muted">Pilih jadwal untuk melihat peserta secara live</p></div><Link href="/admin/jadwal" className="flex items-center gap-1 text-xs font-bold text-brand">Lihat semua <ChevronRight size={14} /></Link></CardHeader><CardContent className="space-y-3">{schedules.length === 0 ? <p className="p-5 text-center text-sm text-muted">Belum ada jadwal.</p> : schedules.map((schedule: any) => <button key={schedule.id} onClick={() => selectSchedule(schedule)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition", monitorSchedule?.id === schedule.id ? "border-brand bg-brand-soft/40" : "border-line hover:border-brand/40 hover:bg-[#fcfcff]")}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-extrabold text-brand">{(schedule.bank_soal?.nama_bank_soal || "UJ").slice(0, 3)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{schedule.bank_soal?.mapel?.nama_mapel || schedule.bank_soal?.nama_bank_soal}</p><Badge tone={schedule.status === "berlangsung" ? "brand" : schedule.status === "siap" ? "success" : "warning"}>{schedule.status}</Badge></div><p className="mt-1 truncate text-xs text-muted">{getClassOptions(schedule).map(item => item.name).join(", ") || "-"} · {new Date(schedule.waktu_mulai).toLocaleString("id-ID")}</p></div><Activity size={16} className="shrink-0 text-muted" /></button>)}</CardContent></Card><Card><CardHeader><div className="flex items-start justify-between"><div><CardTitle>Monitoring sesi</CardTitle><p className="mt-1 text-xs text-muted">{monitorSchedule ? monitorSchedule.bank_soal?.nama_bank_soal : "Pilih jadwal"}</p></div><button onClick={() => monitorSchedule && void loadMonitor(monitorSchedule.id)} className="text-muted"><RefreshCw size={16} /></button></div></CardHeader><CardContent><div className="grid grid-cols-2 gap-3">{[{ n: statuses.sedang_mengerjakan, label: "Mengerjakan", tone: "brand" }, { n: statuses.belum_mulai, label: "Belum mulai", tone: "neutral" }, { n: statuses.selesai, label: "Selesai", tone: "success" }, { n: statuses.terputus, label: "Terputus", tone: "danger" }].map(item => <div key={item.label} className="rounded-xl bg-canvas p-4"><div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", item.tone === "brand" ? "bg-brand" : item.tone === "success" ? "bg-success" : item.tone === "danger" ? "bg-danger" : "bg-[#aeb5c2]")} /><span className="text-xs font-semibold text-muted">{item.label}</span></div><p className="mt-2 text-xl font-extrabold text-ink">{item.n}</p></div>)}</div><div className="mt-5 flex items-center gap-2 text-[11px] text-muted"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Pembaruan otomatis aktif</div></CardContent></Card></div>
    <Card><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Peserta {monitorSchedule ? `— ${monitorSchedule.bank_soal?.nama_bank_soal || ""}` : ""}</CardTitle><p className="mt-1 text-xs text-muted">Sesi terpilih · kelompokkan berdasarkan kelas</p></div><div className="flex items-center gap-2"><label className="text-xs font-semibold text-muted">Kelas<select value={monitorClassId} onChange={event => selectClass(event.target.value)} className="ml-2 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink"><option value="all">Semua kelas</option>{classOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div></CardHeader><CardContent><div className="overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-canvas text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Siswa</th><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pelanggaran</th><th className="px-4 py-3">Tindakan</th></tr></thead><tbody className="divide-y divide-line">{monitor.map(item => { const flagged = Number(item.jumlah_pelanggaran || 0) > 0 || item.status === "terputus"; return <tr key={item.id}><td className="px-4 py-3"><p className="font-bold text-ink">{item.siswa?.nama}</p><p className="text-[10px] text-muted">{item.siswa?.no_ujian}</p></td><td className="px-4 py-3 text-muted">{item.siswa?.kelas?.nama_kelas || "-"}</td><td className="px-4 py-3"><Badge tone={item.status === "terputus" ? "danger" : item.status === "selesai" ? "success" : item.status === "sedang_mengerjakan" ? "brand" : "neutral"}>{item.status}</Badge></td><td className="px-4 py-3">{flagged ? <Badge tone="danger">{item.jumlah_pelanggaran || 0} kali</Badge> : <span className="text-muted">0</span>}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{flagged && <><Button size="sm" variant="soft" onClick={() => void handleSessionAction(item.id, "lanjutkan", "Reset dan lanjutkan")}><RotateCcw size={13} /> Reset</Button><Button size="sm" variant="secondary" onClick={() => void handleSessionAction(item.id, "mengulang", "Mengulang")}><Repeat2 size={13} /> Ulang</Button><Button size="sm" variant="danger" onClick={() => void handleSessionAction(item.id, "paksa_selesai", "Paksa selesai")}><CircleStop size={13} /> Selesai</Button></>}</div></td></tr>; })}</tbody></table>{monitor.length === 0 && <p className="p-8 text-center text-sm text-muted">Belum ada sesi untuk jadwal dan kelas ini.</p>}</div></CardContent></Card></div>;
}

function getClassOptions(schedule: any): ClassOption[] {
  if (!schedule) return [];
  const options = [{ id: schedule.kelas_id, name: schedule.kelas?.nama_kelas }, ...(schedule.jadwal_kelas || []).map((item: any) => ({ id: item.kelas_id || item.kelas?.id, name: item.kelas?.nama_kelas }))];
  return Array.from(new Map(options.filter(item => item.id && item.name).map(item => [item.id, item])).values());
}

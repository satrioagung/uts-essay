"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "siswa">("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, identifier, password }) });
    if (typeof window !== "undefined") localStorage.setItem("essayspace-role", role);
    router.push(role === "admin" ? "/admin/dashboard" : "/siswa/jadwal");
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#24294a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-[#8e89ff]/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3 font-bold tracking-tight"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand"><Sparkles size={18} /></div> EssaySpace</div>
        <div className="relative z-10 max-w-lg pb-10">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#a9adce]">UJIAN ESSAY ONLINE</p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-[-0.04em]">Ujian yang tertata.<br /><span className="text-[#9e9aff]">Belajar lebih bermakna.</span></h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#b6bad4]">Kelola soal, jadwal, dan progres ujian essay siswa dalam satu ruang yang sederhana dan terukur.</p>
          <div className="mt-10 flex items-center gap-8 text-xs text-[#b6bad4]"><span>✦ 12 kelas aktif</span><span>✦ 248 siswa</span><span>✦ Realtime</span></div>
        </div>
        <p className="relative z-10 text-xs text-[#7f85aa]">© 2024 EssaySpace untuk SMK Indonesia</p>
      </section>

      <section className="flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 font-bold tracking-tight lg:hidden"><div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><Sparkles size={18} /></div> EssaySpace</div>
          <div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand">Selamat datang kembali</p><h2 className="text-3xl font-bold tracking-[-0.03em] text-ink">Masuk ke ruang ujian</h2><p className="mt-2 text-sm text-muted">Gunakan akun yang sudah dibuat oleh admin.</p></div>
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#eef0f5] p-1"><button onClick={() => setRole("admin")} className={`rounded-lg py-2.5 text-sm font-bold transition ${role === "admin" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>Admin</button><button onClick={() => setRole("siswa")} className={`rounded-lg py-2.5 text-sm font-bold transition ${role === "siswa" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>Siswa</button></div>
          <form onSubmit={submit} className="space-y-5">
            <label className="block"><span className="mb-2 block text-xs font-bold text-ink">{role === "admin" ? "Username" : "No. Ujian"}</span><div className="relative"><UserRound className="absolute left-3 top-3 text-muted" size={17} /><input required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={role === "admin" ? "Masukkan username" : "Contoh: u01810001"} className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-[#aeb5c2] focus:border-brand focus:ring-4 focus:ring-brand/10" /></div></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-ink">Password</span><div className="relative"><LockKeyhole className="absolute left-3 top-3 text-muted" size={17} /><input required value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder={role === "admin" ? "Masukkan password" : "6 karakter"} className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-11 text-sm outline-none transition placeholder:text-[#aeb5c2] focus:border-brand focus:ring-4 focus:ring-brand/10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted hover:text-ink">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            <div className="flex items-center justify-between pt-1"><label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="accent-brand" /> Ingat saya</label>{role === "admin" && <button type="button" className="text-xs font-bold text-brand">Lupa password?</button>}</div>
            <Button type="submit" size="lg" className="mt-2 w-full">Masuk ke dashboard <ArrowRight size={17} /></Button>
          </form>
          {role === "siswa" && <div className="mt-7 flex gap-3 rounded-xl border border-[#dedcff] bg-brand-soft p-4 text-xs leading-5 text-[#5b57ad]"><KeyRound className="mt-0.5 shrink-0" size={16} /><span>Nomor ujian dan password diberikan oleh admin sekolah. Hubungi admin jika mengalami kendala.</span></div>}
          {role === "admin" && <p className="mt-8 text-center text-xs text-muted">Demo: isi sembarang username dan password untuk melanjutkan.</p>}
        </div>
      </section>
    </main>
  );
}

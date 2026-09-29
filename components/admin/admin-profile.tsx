"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminProfile = { id?: string; nama?: string; username?: string };

export function AdminProfileModal({ profile, onClose, onSaved }: { profile: AdminProfile; onClose: () => void; onSaved: (profile: AdminProfile) => void }) {
  const [nama, setNama] = useState(profile.nama || "");
  const [username, setUsername] = useState(profile.username || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true); setError("");
    const response = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama, username, password }) });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setError(result.error || "Profil gagal diperbarui."); return; }
    onSaved(result.profile);
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-line p-5"><div><h2 className="text-lg font-bold text-ink">Edit profil admin</h2><p className="mt-1 text-xs text-muted">Perbarui nama, username, atau password admin.</p></div><button onClick={onClose} className="text-muted hover:text-ink"><X size={19} /></button></div><div className="space-y-4 p-5"><label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">Nama</span><input value={nama} onChange={event => setNama(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" placeholder="Nama administrator" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">Username</span><input value={username} onChange={event => setUsername(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" placeholder="Username admin" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-ink">Password baru <span className="font-normal text-muted">(opsional)</span></span><input type="password" value={password} onChange={event => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" placeholder="Kosongkan jika tidak diubah" /></label>{error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">{error}</p>}</div><div className="flex justify-end gap-2 border-t border-line p-5"><Button variant="secondary" onClick={onClose}>Batal</Button><Button disabled={saving} onClick={() => void submit()}><Check size={15} /> {saving ? "Menyimpan..." : "Simpan perubahan"}</Button></div></div></div>;
}

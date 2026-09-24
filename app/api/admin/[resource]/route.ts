import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

const tables = new Set(["mapel", "kelas", "bank-soal", "soal", "siswa", "jadwal"]);

export async function GET(_: Request, { params }: { params: { resource: string } }) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const resource = params.resource;
  if (!tables.has(resource)) return NextResponse.json({ error: "Resource tidak tersedia." }, { status: 404 });
  try {
    const supabase = createAdminClient();
    const query = resource === "mapel" ? supabase.from("mapel").select("id,nama_mapel,created_at").order("nama_mapel")
      : resource === "kelas" ? supabase.from("kelas").select("id,nama_kelas,created_at").order("nama_kelas")
      : resource === "bank-soal" ? supabase.from("bank_soal").select("id,nama_bank_soal,mapel_id,created_at,mapel(nama_mapel),soal(count)").order("created_at", { ascending: false })
      : resource === "soal" ? supabase.from("soal").select("id,bank_soal_id,nomor,teks_soal,created_at,bank_soal(nama_bank_soal)").order("nomor")
      : resource === "siswa" ? supabase.from("siswa").select("id,no_ujian,nama,kelas_id,created_at,kelas(nama_kelas)").order("nama")
      : supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,durasi_menit,randomisasi_urutan_soal,pengaturan_anti_curang,status,created_at,kelas(nama_kelas),bank_soal(nama_bank_soal,mapel(nama_mapel))").order("waktu_mulai", { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("admin list error", error);
    return NextResponse.json({ error: "Gagal membaca data." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { resource: string } }) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const resource = params.resource;
  if (!tables.has(resource)) return NextResponse.json({ error: "Resource tidak tersedia." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  try {
    const supabase = createAdminClient();
    if (resource === "siswa") {
      if (!body.nama || !body.kelas_id) return NextResponse.json({ error: "Nama dan kelas wajib diisi." }, { status: 400 });
      const prefix = "u0181";
      const { data: existing } = await supabase.from("siswa").select("no_ujian").like("no_ujian", `${prefix}%`);
      const next = Math.max(0, ...(existing || []).map(row => Number(String(row.no_ujian).slice(prefix.length)) || 0)) + 1;
      const password = randomPassword();
      const payload = { no_ujian: `${prefix}${String(next).padStart(4, "0")}`, password, nama: body.nama, kelas_id: body.kelas_id };
      const { data, error } = await supabase.from("siswa").insert(payload).select("id,no_ujian,password,nama,kelas_id").single();
      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }
    const payload = resource === "mapel" ? { nama_mapel: body.nama_mapel || body.nama } : resource === "kelas" ? { nama_kelas: body.nama_kelas || body.nama } : resource === "bank-soal" ? { nama_bank_soal: body.nama_bank_soal || body.nama, mapel_id: body.mapel_id } : resource === "soal" ? { bank_soal_id: body.bank_soal_id, nomor: Number(body.nomor), teks_soal: body.teks_soal || body.soal } : { kelas_id: body.kelas_id, bank_soal_id: body.bank_soal_id, waktu_mulai: body.waktu_mulai, durasi_menit: Number(body.durasi_menit), randomisasi_urutan_soal: body.randomisasi_urutan_soal ?? true, pengaturan_anti_curang: body.pengaturan_anti_curang || { deteksi_pindah_tab: true, disable_copy_paste: true }, status: body.status || "draft" };
    const { data, error } = await supabase.from(resource === "bank-soal" ? "bank_soal" : resource).insert(payload).select("*").single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("admin create error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan data." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { resource: string } }) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const resource = params.resource;
  if (!tables.has(resource)) return NextResponse.json({ error: "Resource tidak tersedia." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  const { id, ...payload } = body;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from(resource === "bank-soal" ? "bank_soal" : resource).update(payload).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengubah data." }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: { resource: string } }) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const resource = params.resource;
  if (!tables.has(resource)) return NextResponse.json({ error: "Resource tidak tersedia." }, { status: 404 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  const { error } = await createAdminClient().from(resource === "bank-soal" ? "bank_soal" : resource).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join("");
}

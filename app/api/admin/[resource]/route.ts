import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

const tables = new Set(["mapel", "kelas", "bank-soal", "soal", "siswa", "jadwal"]);

function buildSchedulePayload(body: Record<string, any>) {
  const start = body.waktu_mulai || combineLocalDateTime(body.tanggal_mulai, body.jam_mulai);
  const end = body.waktu_selesai || combineLocalDateTime(body.tanggal_selesai, body.jam_selesai);
  const duration = Number(body.durasi_menit) || (start && end ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000) : 0);
  return { kelas_id: getClassIds(body)[0] || body.kelas_id, bank_soal_id: body.bank_soal_id, waktu_mulai: start, waktu_selesai: end, durasi_menit: duration, randomisasi_urutan_soal: body.randomisasi_urutan_soal ?? true, pengaturan_anti_curang: body.pengaturan_anti_curang || { deteksi_pindah_tab: true, disable_copy_paste: true }, status: body.status || "draft" };
}

function getClassIds(body: Record<string, any>) { return Array.from(new Set((Array.isArray(body.kelas_ids) ? body.kelas_ids : String(body.kelas_ids || body.kelas_id || "").split(",")).map(value => String(value).trim()).filter(Boolean))); }
function isMissingTableError(error: any) { return error?.code === "42P01" || error?.code === "PGRST205" || String(error?.message || "").toLowerCase().includes("could not find the table"); }

function combineLocalDateTime(date?: string, time?: string) {
  if (!date || !time) return undefined;
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
}

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
      : resource === "soal" ? (() => { const questionQuery = supabase.from("soal").select("id,bank_soal_id,nomor,teks_soal,bank_soal(nama_bank_soal)"); const bankSoalId = new URL(_.url).searchParams.get("bankSoalId"); return bankSoalId ? questionQuery.eq("bank_soal_id", bankSoalId).order("nomor") : questionQuery.order("nomor"); })()
      : resource === "siswa" ? supabase.from("siswa").select(`id,no_ujian,nama,kelas_id,created_at,kelas(nama_kelas)${new URL(_.url).searchParams.get("includeCredentials") === "true" ? ",password" : ""}`).order("nama")
      : supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,waktu_selesai,durasi_menit,randomisasi_urutan_soal,pengaturan_anti_curang,status,created_at,kelas!jadwal_kelas_id_fkey(nama_kelas),jadwal_kelas(kelas!jadwal_kelas_kelas_id_fkey(id,nama_kelas)),bank_soal(nama_bank_soal,mapel(nama_mapel)),token(kode_token,status)").order("waktu_mulai", { ascending: true });
    let data: any;
    let error: any;
    ({ data, error } = await query);
    if (error && resource === "jadwal") {
      ({ data, error } = await supabase.from("jadwal").select("id,kelas_id,bank_soal_id,waktu_mulai,durasi_menit,randomisasi_urutan_soal,pengaturan_anti_curang,status,created_at,kelas!jadwal_kelas_id_fkey(nama_kelas),bank_soal(nama_bank_soal,mapel(nama_mapel)),token(kode_token,status)").order("waktu_mulai", { ascending: true }));
    }
    if (error && resource === "soal") {
      let simpleQuestionQuery = supabase.from("soal").select("id,bank_soal_id,nomor,teks_soal");
      const bankSoalId = new URL(_.url).searchParams.get("bankSoalId");
      if (bankSoalId) simpleQuestionQuery = simpleQuestionQuery.eq("bank_soal_id", bankSoalId);
      ({ data, error } = await simpleQuestionQuery.order("nomor"));
    }
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
    const scheduleClassIds = resource === "jadwal" ? getClassIds(body) : [];
    if (scheduleClassIds.length > 1) {
      const { error: classTableError } = await supabase.from("jadwal_kelas").select("jadwal_id").limit(1);
      if (classTableError && isMissingTableError(classTableError)) return NextResponse.json({ code: "JADWAL_KELAS_MIGRATION_REQUIRED", error: "Pilih lebih dari satu kelas memerlukan tabel jadwal_kelas. Jalankan migration Supabase terlebih dahulu." }, { status: 503 });
      if (classTableError) throw classTableError;
    }
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
    const payload = resource === "mapel" ? { nama_mapel: body.nama_mapel || body.nama } : resource === "kelas" ? { nama_kelas: body.nama_kelas || body.nama } : resource === "bank-soal" ? { nama_bank_soal: body.nama_bank_soal || body.nama, mapel_id: body.mapel_id } : resource === "soal" ? { bank_soal_id: body.bank_soal_id, nomor: Number(body.nomor), teks_soal: body.teks_soal || body.soal } : buildSchedulePayload(body);
    let { data, error } = await supabase.from(resource === "bank-soal" ? "bank_soal" : resource).insert(payload).select("*").single();
    if (error?.code === "42703" && resource === "jadwal") {
      const { waktu_selesai: _waktuSelesai, ...legacyPayload } = payload as Record<string, unknown>;
      ({ data, error } = await supabase.from("jadwal").insert(legacyPayload).select("*").single());
    }
    if (error) throw error;
    if (resource === "jadwal") {
      const classIds = scheduleClassIds;
      if (classIds.length) {
        const { error: classError } = await supabase.from("jadwal_kelas").insert(classIds.map(kelas_id => ({ jadwal_id: data.id, kelas_id })));
        if (classError && !isMissingTableError(classError)) throw classError;
      }
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("admin create error", error);
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "Nomor soal tersebut sudah digunakan di bank soal ini." }, { status: 409 });
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
  const { id, ...bodyPayload } = body;
  const payload = resource === "jadwal" ? buildSchedulePayload(bodyPayload) : bodyPayload;
  try {
    const supabase = createAdminClient();
    const scheduleClassIds = resource === "jadwal" ? getClassIds(bodyPayload) : [];
    if (scheduleClassIds.length > 1) {
      const { error: classTableError } = await supabase.from("jadwal_kelas").select("jadwal_id").limit(1);
      if (classTableError && isMissingTableError(classTableError)) return NextResponse.json({ code: "JADWAL_KELAS_MIGRATION_REQUIRED", error: "Pilih lebih dari satu kelas memerlukan tabel jadwal_kelas. Jalankan migration Supabase terlebih dahulu." }, { status: 503 });
      if (classTableError) throw classTableError;
    }
    let { data, error } = await supabase.from(resource === "bank-soal" ? "bank_soal" : resource).update(payload).eq("id", id).select("*").single();
    if (error?.code === "42703" && resource === "jadwal") {
      const { waktu_selesai: _waktuSelesai, ...legacyPayload } = payload as Record<string, unknown>;
      ({ data, error } = await supabase.from("jadwal").update(legacyPayload).eq("id", id).select("*").single());
    }
    if (error) throw error;
    if (resource === "jadwal") {
      const classIds = scheduleClassIds;
      const { error: clearClassesError } = await supabase.from("jadwal_kelas").delete().eq("jadwal_id", id);
      if (clearClassesError && !isMissingTableError(clearClassesError)) throw clearClassesError;
      if (classIds.length) {
        const { error: classError } = await supabase.from("jadwal_kelas").insert(classIds.map(kelas_id => ({ jadwal_id: id, kelas_id })));
        if (classError && !isMissingTableError(classError)) throw classError;
      }
    }
    return NextResponse.json({ data });
  } catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "Nomor soal tersebut sudah digunakan di bank soal ini." }, { status: 409 }); return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengubah data." }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: { resource: string } }) {
  const auth = await requireRole("admin");
  if ("response" in auth) return auth.response;
  const resource = params.resource;
  if (!tables.has(resource)) return NextResponse.json({ error: "Resource tidak tersedia." }, { status: 404 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  const supabase = createAdminClient();
  if (resource === "jadwal") {
    const force = new URL(request.url).searchParams.get("force") === "true";
    const { data: schedule, error: scheduleError } = await supabase.from("jadwal").select("id,status,kelas!jadwal_kelas_id_fkey(nama_kelas)").eq("id", id).maybeSingle();
    if (scheduleError) return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    if (!schedule) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
    const { data: sessions, error: sessionReadError } = await supabase.from("sesi_ujian").select("id,status").eq("jadwal_id", id);
    if (sessionReadError && !isMissingTableError(sessionReadError)) return NextResponse.json({ error: sessionReadError.message }, { status: 500 });
    const sessionList = sessions || [];
    const requiresConfirmation = ["siap", "berlangsung"].includes(schedule.status) || sessionList.length > 0;
    if (requiresConfirmation && !force) {
      return NextResponse.json({ code: "JADWAL_IN_USE", error: "Jadwal masih aktif atau memiliki sesi ujian.", schedule, sessions: sessionList }, { status: 409 });
    }
    if (force && sessionList.length) {
      const sessionIds = sessionList.map(session => session.id);
      const { error: answersError } = await supabase.from("jawaban").delete().in("sesi_ujian_id", sessionIds);
      if (answersError) return NextResponse.json({ error: answersError.message }, { status: 500 });
      const { error: sessionsError } = await supabase.from("sesi_ujian").delete().in("id", sessionIds);
      if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }
    const { error: tokensError } = await supabase.from("token").delete().eq("jadwal_id", id);
    if (tokensError && !isMissingTableError(tokensError)) return NextResponse.json({ error: tokensError.message }, { status: 500 });
    const { error: classesError } = await supabase.from("jadwal_kelas").delete().eq("jadwal_id", id);
    if (classesError && !isMissingTableError(classesError)) return NextResponse.json({ error: classesError.message }, { status: 500 });
  }
  if (resource === "bank-soal") {
    const { data: schedules, error: scheduleError } = await supabase.from("jadwal").select("id,status,kelas!jadwal_kelas_id_fkey(nama_kelas)").eq("bank_soal_id", id).order("waktu_mulai", { ascending: true });
    if (scheduleError) return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    const force = new URL(request.url).searchParams.get("force") === "true";
    if ((schedules || []).length > 0 && !force) return NextResponse.json({ code: "BANK_SOAL_IN_USE", error: "Bank soal masih digunakan oleh jadwal ujian.", schedules }, { status: 409 });
    if (force && schedules?.length) {
      const scheduleIds = schedules.map(schedule => schedule.id);
      const { data: sessions, error: sessionReadError } = await supabase.from("sesi_ujian").select("id").in("jadwal_id", scheduleIds);
      if (sessionReadError) return NextResponse.json({ error: sessionReadError.message }, { status: 500 });
      const sessionIds = (sessions || []).map(session => session.id);
      if (sessionIds.length) {
        const { error: answersError } = await supabase.from("jawaban").delete().in("sesi_ujian_id", sessionIds);
        if (answersError) return NextResponse.json({ error: answersError.message }, { status: 500 });
        const { error: sessionsError } = await supabase.from("sesi_ujian").delete().in("id", sessionIds);
        if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 });
      }
      const { error: tokensError } = await supabase.from("token").delete().in("jadwal_id", scheduleIds);
      if (tokensError) return NextResponse.json({ error: tokensError.message }, { status: 500 });
      const { error: schedulesError } = await supabase.from("jadwal").delete().in("id", scheduleIds);
      if (schedulesError) return NextResponse.json({ error: schedulesError.message }, { status: 500 });
    }
  }
  const { error } = await supabase.from(resource === "bank-soal" ? "bank_soal" : resource).delete().eq("id", id);
  if (error) {
    console.error("admin delete error", { resource, id, error });
    if (resource === "jadwal" && error.code === "23503") return NextResponse.json({ code: "JADWAL_IN_USE", error: "Jadwal masih memiliki data ujian yang terkait. Coba hapus dengan konfirmasi ulang." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, deleted: 1 });
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join("");
}

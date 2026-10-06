type ScheduleWindow = {
  status?: string | null;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  durasi_menit?: number | null;
};

export function deriveScheduleStatus(schedule: ScheduleWindow, now = Date.now()) {
  if (schedule.status === "draft") return "draft";
  const start = schedule.waktu_mulai ? Date.parse(schedule.waktu_mulai) : Number.NaN;
  const end = schedule.waktu_selesai
    ? Date.parse(schedule.waktu_selesai)
    : Number.isFinite(start)
      ? start + Number(schedule.durasi_menit || 0) * 60_000
      : Number.NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return schedule.status || "draft";
  if (now >= end) return "selesai";
  if (now >= start) return "berlangsung";
  return "siap";
}

/** Refreshes time-based statuses without changing draft schedules. */
export async function syncScheduleStatuses(supabase: any) {
  const now = new Date().toISOString();
  const results = await Promise.all([
    supabase.from("jadwal").update({ status: "selesai" }).in("status", ["siap", "berlangsung"]).not("waktu_selesai", "is", null).lte("waktu_selesai", now),
    supabase.from("jadwal").update({ status: "berlangsung" }).eq("status", "siap").not("waktu_selesai", "is", null).lte("waktu_mulai", now).gt("waktu_selesai", now),
    supabase.from("jadwal").update({ status: "siap" }).eq("status", "berlangsung").gt("waktu_mulai", now).gt("waktu_selesai", now)
  ]);
  return results.find((result: any) => result.error)?.error || null;
}

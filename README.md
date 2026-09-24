# EssaySpace

Prototype aplikasi UTS essay online untuk SMK dengan Next.js App Router, Tailwind/shadcn-style UI, Supabase-ready data layer, dan SheetJS export.

## Jalankan lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Tanpa env Supabase, aplikasi tetap bisa dijelajahi menggunakan data demo. SQL produksi tersedia di `supabase/schema.sql`.

## Alur demo

- `/login` — pilih Admin atau Siswa. Login awal admin setelah schema dijalankan: `admin` / `admin123`.
- Admin — dashboard, monitoring realtime mock, manajemen siswa/jadwal/bank soal, dan modal impor Excel.
- Siswa — jadwal ujian, input token, halaman pengerjaan dengan autosave indicator, dan hasil berbasis status.

## Catatan implementasi

`lib/supabase/client.ts` dan `lib/supabase/server.ts` sudah siap untuk Supabase SSR. Custom session memakai httpOnly cookie melalui `app/api/auth/login/route.ts`; validasi impor terpisah di `lib/import-validation.ts`. Jalankan `supabase/schema.sql` di Supabase SQL Editor sebelum login. Aplikasi akan otomatis menormalkan URL yang masih berformat `/rest/v1/`, tetapi format yang direkomendasikan tetap `https://<project-ref>.supabase.co`.

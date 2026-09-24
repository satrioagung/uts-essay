# Setup Supabase

1. Buka Supabase SQL Editor dan jalankan `schema.sql`.
   Jika database sudah pernah dibuat sebelum fitur jadwal multi-kelas, jalankan juga `migrations/20260924_add_jadwal_kelas.sql` agar satu jadwal dapat memiliki beberapa kelas.
2. Seed login awal: `admin` / `admin123` (segera ganti setelah login).
3. Isi `.env.local` berdasarkan `.env.example`, termasuk `SUPABASE_SERVICE_ROLE_KEY` dan `SESSION_SECRET`.
4. Route server memakai service role sehingga key tersebut tidak boleh dikirim ke browser atau di-commit.

Saat mengaktifkan RLS lebih ketat, pertahankan semua operasi database melalui route handler server agar custom session tetap menjadi satu-satunya pintu masuk aplikasi.

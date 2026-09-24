-- EssaySpace schema for Supabase Postgres.
create extension if not exists pgcrypto;

create table if not exists admin (id uuid primary key default gen_random_uuid(), username text unique not null, password_hash text not null, created_at timestamptz default now());
create table if not exists kelas (id uuid primary key default gen_random_uuid(), nama_kelas text unique not null, created_at timestamptz default now());
create table if not exists mapel (id uuid primary key default gen_random_uuid(), nama_mapel text unique not null, created_at timestamptz default now());
create table if not exists bank_soal (id uuid primary key default gen_random_uuid(), mapel_id uuid not null references mapel(id) on delete cascade, nama_bank_soal text not null, created_at timestamptz default now(), unique(mapel_id, nama_bank_soal));
create table if not exists siswa (id uuid primary key default gen_random_uuid(), no_ujian text unique not null, password text not null, nama text not null, kelas_id uuid not null references kelas(id), created_at timestamptz default now());
create table if not exists soal (id uuid primary key default gen_random_uuid(), bank_soal_id uuid not null references bank_soal(id) on delete cascade, nomor integer not null, teks_soal text not null, unique(bank_soal_id, nomor));
do $$ begin create type jadwal_status as enum ('draft', 'siap', 'berlangsung', 'selesai'); exception when duplicate_object then null; end $$;
create table if not exists jadwal (id uuid primary key default gen_random_uuid(), kelas_id uuid not null references kelas(id), bank_soal_id uuid not null references bank_soal(id), waktu_mulai timestamptz not null, durasi_menit integer not null check (durasi_menit > 0), randomisasi_urutan_soal boolean not null default true, pengaturan_anti_curang jsonb not null default '{"deteksi_pindah_tab": true, "disable_copy_paste": true}', status jadwal_status not null default 'draft', created_at timestamptz default now());
create table if not exists token (id uuid primary key default gen_random_uuid(), jadwal_id uuid not null references jadwal(id) on delete cascade, kode_token text not null, status text not null default 'aktif' check (status in ('aktif', 'kedaluwarsa')), generated_at timestamptz default now());
create unique index if not exists one_active_token_per_schedule on token(jadwal_id) where status = 'aktif';
do $$ begin create type sesi_status as enum ('belum_mulai', 'sedang_mengerjakan', 'terputus', 'selesai'); exception when duplicate_object then null; end $$;
create table if not exists sesi_ujian (id uuid primary key default gen_random_uuid(), siswa_id uuid not null references siswa(id), jadwal_id uuid not null references jadwal(id), urutan_soal_acak jsonb not null default '[]', waktu_mulai_sesi timestamptz, waktu_selesai_sesi timestamptz, status sesi_status not null default 'belum_mulai', attempt_ke integer not null default 1, jumlah_pelanggaran integer not null default 0, updated_at timestamptz default now(), unique(siswa_id, jadwal_id, attempt_ke));
create table if not exists jawaban (id uuid primary key default gen_random_uuid(), sesi_ujian_id uuid not null references sesi_ujian(id) on delete cascade, soal_id uuid not null references soal(id), jawaban_teks text not null default '', updated_at timestamptz default now(), unique(sesi_ujian_id, soal_id));

alter table sesi_ujian replica identity full;
alter table sesi_ujian enable row level security;
alter table jawaban enable row level security;
alter table admin enable row level security;
alter table kelas enable row level security;
alter table mapel enable row level security;
alter table bank_soal enable row level security;
alter table siswa enable row level security;
alter table soal enable row level security;
alter table jadwal enable row level security;
alter table token enable row level security;

-- Server routes use the service role and therefore bypass RLS. The policies below
-- keep direct client access blocked while preserving the option to add claims later.
insert into admin (username, password_hash)
values ('admin', encode(digest('admin123', 'sha256'), 'hex'))
on conflict (username) do nothing;

do $$ begin
  alter publication supabase_realtime add table sesi_ujian;
exception when duplicate_object then null;
end $$;

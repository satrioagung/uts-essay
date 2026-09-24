-- Relasi many-to-many jadwal ujian dan kelas.
create table if not exists jadwal_kelas (
  jadwal_id uuid not null references jadwal(id) on delete cascade,
  kelas_id uuid not null references kelas(id) on delete cascade,
  primary key (jadwal_id, kelas_id)
);

create index if not exists jadwal_kelas_kelas_id_idx on jadwal_kelas(kelas_id);
alter table jadwal_kelas enable row level security;

notify pgrst, 'reload schema';

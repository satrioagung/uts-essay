alter table admin add column if not exists nama text not null default 'Administrator';
notify pgrst, 'reload schema';

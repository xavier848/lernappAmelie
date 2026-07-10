-- Referenz-Kopie der per Supabase-MCP angewandten Migration "schema_v1"
-- Projekt: lernapp-amelie (ufcmnbqmeqyubokvibfc), eu-central-1
-- Hinweis: Die always-true-Policies auf devices/progress/exercise_attempts/daily_activity
-- sind bewusst (Familien-App ohne Login, anonyme Geraete-ID, siehe Spec §6).

create table topics (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, icon text not null default '📘', sort int not null default 0, published boolean not null default true);
create table lessons (id uuid primary key default gen_random_uuid(), topic_id uuid not null references topics(id) on delete cascade, slug text unique not null, title text not null, sort int not null default 0, published boolean not null default true, created_at timestamptz not null default now());
create table exercises (id uuid primary key default gen_random_uuid(), lesson_id uuid not null references lessons(id) on delete cascade, sort int not null default 0, type text not null check (type in ('steps_order','multiple_choice','match_pairs','sort_buckets','money_count','budget')), data jsonb not null);
create table devices (id uuid primary key, label text, created_at timestamptz not null default now());
create table progress (id uuid primary key default gen_random_uuid(), device_id uuid not null references devices(id), lesson_id uuid not null references lessons(id) on delete cascade, stars int not null check (stars between 1 and 3), xp int not null default 0, completed_at timestamptz not null default now(), unique(device_id, lesson_id));
create table exercise_attempts (id uuid primary key default gen_random_uuid(), device_id uuid not null references devices(id), exercise_id uuid not null references exercises(id) on delete cascade, correct boolean not null, created_at timestamptz not null default now());
create table daily_activity (device_id uuid not null references devices(id), day date not null, xp int not null default 0, primary key (device_id, day));
alter table topics enable row level security;
alter table lessons enable row level security;
alter table exercises enable row level security;
alter table devices enable row level security;
alter table progress enable row level security;
alter table exercise_attempts enable row level security;
alter table daily_activity enable row level security;
create policy "read published topics" on topics for select using (published);
create policy "read published lessons" on lessons for select using (published);
create policy "read exercises of published lessons" on exercises for select using (exists (select 1 from lessons l where l.id = lesson_id and l.published));
create policy "device insert" on devices for insert with check (true);
create policy "device read own" on devices for select using (true);
create policy "progress all" on progress for all using (true) with check (true);
create policy "attempts insert" on exercise_attempts for insert with check (true);
create policy "activity all" on daily_activity for all using (true) with check (true);
insert into storage.buckets (id, name, public) values ('images','images',true);

-- Nachtraege (2026-07-10):
-- Reset-Funktion + Lesezugriff auf Versuchs-Statistik (fehlte in v1).
create policy "attempts delete" on exercise_attempts for delete using (true);
create policy "attempts read" on exercise_attempts for select using (true);

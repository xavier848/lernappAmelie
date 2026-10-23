-- KI-Hilfen (Pony erklaert, Frag das Pony): eine Zeile pro Anfrage an Claude.
-- Dient dem Tageslimit (Kostenbremse) und zeigt, wie viel die Hilfe genutzt
-- wird. Es werden KEINE Inhalte gespeichert - weder Fragen noch Antworten.
-- Nur der Server schreibt und liest (Service-Role); RLS ohne Policies sperrt
-- den anon-Key komplett aus.
create table if not exists ki_nutzung (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  art text not null check (art in ('erklaeren', 'pony')),
  lesson_slug text,
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  ok boolean not null default true
);

create index if not exists ki_nutzung_created_at_idx on ki_nutzung (created_at);

alter table ki_nutzung enable row level security;

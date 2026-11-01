-- Lernblatt: Datenbank fuer Konten, Tests und Lernstand.
-- Einmal im SQL-Editor des NEUEN Supabase-Projekts ausfuehren.
-- Das Skript legt nur Dinge an (kein DROP, kein DELETE) und kann gefahrlos wiederholt werden.

-- ---------- Profile: der angezeigte Benutzername ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

-- Beim Registrieren wird der Benutzername aus den Metadaten uebernommen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', 'Unbekannt'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Tests: der gemeinsame Kalender ----------
create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null,
  title text not null check (char_length(title) between 1 and 80),
  test_date date not null,
  unit_ids text[] not null default '{}',
  note text check (note is null or char_length(note) <= 500),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);
create index if not exists tests_date_idx on public.tests (test_date);

-- ---------- Lernstand: pro Benutzer ein Dokument ----------
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Zugriffsregeln (Row Level Security) ----------
alter table public.profiles enable row level security;
alter table public.tests enable row level security;
alter table public.progress enable row level security;

-- Profile: alle duerfen Namen lesen (fuer "angelegt von"). Schreiben nur ueber den Trigger.
drop policy if exists "profiles lesen" on public.profiles;
create policy "profiles lesen" on public.profiles
  for select to anon, authenticated using (true);

-- Tests: alle sehen den Kalender, jeder Angemeldete darf eintragen, aendern und loeschen.
drop policy if exists "tests lesen" on public.tests;
create policy "tests lesen" on public.tests
  for select to anon, authenticated using (true);

drop policy if exists "tests eintragen" on public.tests;
create policy "tests eintragen" on public.tests
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "tests aendern" on public.tests;
create policy "tests aendern" on public.tests
  for update to authenticated using (true) with check (true);

drop policy if exists "tests loeschen" on public.tests;
create policy "tests loeschen" on public.tests
  for delete to authenticated using (true);

-- Lernstand: nur der eigene.
drop policy if exists "progress lesen" on public.progress;
create policy "progress lesen" on public.progress
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "progress eintragen" on public.progress;
create policy "progress eintragen" on public.progress
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "progress aendern" on public.progress;
create policy "progress aendern" on public.progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

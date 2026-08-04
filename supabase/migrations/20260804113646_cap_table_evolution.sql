-- Cap Table Evrimi (ownership % over time) — HASSAS: ortaklık yüzdeleri
-- Kaynak mock: src/constants/financeReportsData.ts › capTableEvolution (geniş → long format)
-- partner_id, PARTNERS / temettü defteri ile AYNI id sistemi (abdulhamit / ahmet / hasan).
-- Erişim: yalnızca admin (public.is_admin()). Bu .sql'i Supabase'de siz çalıştıracaksınız.

create table if not exists public.cap_table_evolution (
  id         bigint generated always as identity primary key,
  period     text          not null,          -- CapTableSnapshot.period
  partner_id text          not null,          -- PARTNERS.id (abdulhamit/ahmet/hasan)
  share_pct  numeric(6,4)  not null,          -- o dönemdeki pay yüzdesi
  created_at timestamptz   not null default now()
);

-- RLS: satır bazlı güvenlik + authenticated role'e tablo yetkileri
alter table public.cap_table_evolution enable row level security;

grant select, insert, update, delete on public.cap_table_evolution to authenticated;

-- Yalnızca admin okuyabilir/yazabilir. Admin olmayan authenticated için select 0 satır
-- döner (RLS filtresi) → sayfa "yetkiniz yok" placeholder gösterir.
drop policy if exists cap_table_evolution_admin_all on public.cap_table_evolution;
create policy cap_table_evolution_admin_all
  on public.cap_table_evolution
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed — geniş formattan long formata (5 dönem × 3 ortak = 15 satır)
insert into public.cap_table_evolution (period, partner_id, share_pct) values
  ('2022', 'abdulhamit', 40), ('2022', 'ahmet', 40), ('2022', 'hasan', 20),
  ('2023', 'abdulhamit', 38), ('2023', 'ahmet', 37), ('2023', 'hasan', 25),
  ('2024', 'abdulhamit', 36), ('2024', 'ahmet', 36), ('2024', 'hasan', 28),
  ('2025', 'abdulhamit', 35), ('2025', 'ahmet', 35), ('2025', 'hasan', 30),
  ('2026', 'abdulhamit', 35), ('2026', 'ahmet', 35), ('2026', 'hasan', 30);

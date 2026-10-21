-- Cap Table Evrimi (ownership % over time) — HASSAS: ortaklık yüzdeleri
-- Veri bu dosyada TUTULMAZ; satırlar Supabase üzerinden doğrudan yönetilir.
-- partner_id: ortak tanımlayıcısı (metin).
-- Erişim: yalnızca admin (public.is_admin()). Bu .sql'i Supabase'de siz çalıştıracaksınız.

create table if not exists public.cap_table_evolution (
  id         bigint generated always as identity primary key,
  period     text          not null,          -- CapTableSnapshot.period
  partner_id text          not null,          -- ortak tanımlayıcısı
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

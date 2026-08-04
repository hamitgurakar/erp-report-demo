-- Ortak Getirisi (Shareholder Returns) — ortak bazında getiri özeti
-- Kaynak mock: src/constants/financeReportsData.ts › partnerReturns (PartnerReturn[])
-- Erişim: yalnızca admin (public.is_admin()). Bu .sql'i Supabase'de siz çalıştıracaksınız.

create table if not exists public.ortak_getirisi (
  id             bigint generated always as identity primary key,
  partner_id     text           not null,          -- PartnerReturn.partnerId
  name           text           not null,          -- PartnerReturn.name
  pct            numeric(6,4)   not null,          -- PartnerReturn.pct   (pay %)
  shares         bigint         not null,          -- PartnerReturn.shares
  cumulative_div numeric(14,2)  not null,          -- PartnerReturn.cumulativeDiv (₺)
  this_period    numeric(14,2)  not null,          -- PartnerReturn.thisPeriod   (₺)
  tsr            numeric(6,4)   not null,          -- PartnerReturn.tsr   (%)
  created_at     timestamptz    not null default now()
);

-- RLS: satır bazlı güvenlik + authenticated role'e tablo yetkileri
alter table public.ortak_getirisi enable row level security;

grant select, insert, update, delete on public.ortak_getirisi to authenticated;

-- Yalnızca admin okuyabilir/yazabilir. Admin olmayan authenticated kullanıcı için
-- select 0 satır döner (RLS filtresi) → sayfa "yetkiniz yok" placeholder gösterir.
drop policy if exists ortak_getirisi_admin_all on public.ortak_getirisi;
create policy ortak_getirisi_admin_all
  on public.ortak_getirisi
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed — mock satırları birebir
insert into public.ortak_getirisi (partner_id, name, pct, shares, cumulative_div, this_period, tsr) values
  ('abdulhamit', 'Abdülhamit Gürakar', 35, 7000000, 7720850.00, 1120000.00, 24.5),
  ('ahmet',      'Ahmet Üreme',        35, 7000000, 7720850.00, 1120000.00, 24.5),
  ('hasan',      'Hasan Topalakcı',    30, 6000000, 6598000.00,  960000.00, 23.8);

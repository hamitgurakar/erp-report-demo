import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../../types';
import {
  stockHealthData, stockAgingData, stockTurnoverTrend, stockVsSalesData,
  criticalStockData, inefficientStockData, stockAgeVelocityData,
} from '../../../constants/categoryData';
import { KPICard } from '../../kpi/KPICard';
import { SectionHeader } from '../../ui/SectionHeader';
import { ChartContainer } from '../../ui/ChartContainer';
import { FilterBar, type FilterOption } from '../../ui/FilterBar';
import { Icon } from '../../ui/Icon';
import { useTranslation } from '../../../i18n/LanguageContext';
import { type ColDef } from '../../ui/ColumnManager';
import { ColumnPresetDropdown } from '../../ui/ColumnPresetDropdown';
import { fmtPercent, fmtMonth } from '../../../utils/format';
import { tTerm } from '../../../i18n/terms';

const CRITICAL_COLS: ColDef[] = [
  { key: 'urun', label: 'Ürün' },
  { key: 'kategori', label: 'Kategori' },
  { key: 'mevcutStok', label: 'Mevcut Stok' },
  { key: 'gunlukSatisHizi', label: 'Günlük Satış Hızı' },
  { key: 'tahminTukenme', label: 'Tahmini Tükenme' },
  { key: 'tedarikSuresi', label: 'Tedarik Süresi' },
  { key: 'durum', label: 'Durum' },
  { key: 'aksiyon', label: 'Aksiyon' },
];

const INEF_COLS: ColDef[] = [
  { key: 'urun', label: 'Ürün' },
  { key: 'kategori', label: 'Kategori' },
  { key: 'stokDeg', label: 'Stok Değeri (₺)' },
  { key: 'stokYas', label: 'Stok Yaşı (gün)' },
  { key: 'son30Gun', label: 'Son 30 Gün Satış' },
  { key: 'son90Gun', label: 'Son 90 Gün Satış' },
  { key: 'stokDevir', label: 'Stok Devir Hızı (x)' },
  { key: 'brutMarj', label: 'Brüt Marj %' },
  { key: 'durum', label: 'Durum' },
  { key: 'aksiyon', label: 'Önerilen Aksiyon' },
];

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  dark: boolean;
}

export const CategoryStock = ({ t, l, lang, panels, onAddPanel, onPinTo }: Props) => {
  const i18n = useTranslation();
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };
  const [visibleCols, setVisibleCols] = useState<string[]>(CRITICAL_COLS.map((c) => c.key));
  const [visibleInefCols, setVisibleInefCols] = useState<string[]>(INEF_COLS.map((c) => c.key));

  const filters: FilterOption[] = [
    { key: 'kategori', label: l.filtreKategori, options: ['Elektronik', 'Kozmetik', 'Ev & Yaşam', 'Gıda', 'Tekstil', 'Spor'] },
    { key: 'stokDurum', label: l.filtreStokDurum, options: [l.stokSaglikli, l.stokFazla, l.stokKritik, l.stokOlu] },
    { key: 'depo', label: l.filtreDepo, options: ['İstanbul', 'Ankara', 'İzmir'] },
  ];

  const stockHealthLabels: Record<string, string> = {
    saglikli: l.stokSaglikli, fazla: l.stokFazla, kritik: l.stokKritik, olu: l.stokOlu,
  };

  const durumBadge = (durum: 'acil' | 'uyari' | 'izle') => {
    const conf = {
      acil: { label: l.durumAcil, color: t.rd, bg: t.rdL },
      uyari: { label: l.durumUyari, color: t.am, bg: t.amL },
      izle: { label: l.durumIzle, color: t.c1, bg: t.gnL },
    }[durum];
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: conf.color, background: conf.bg, borderRadius: 5, padding: '2px 8px' }}>
        {tTerm(conf.label)}
      </span>
    );
  };

  const aksiyonBtn = (durum: 'acil' | 'uyari' | 'izle') => {
    const conf = {
      acil: { label: l.siparisGec, color: t.gn, bg: t.gnL },
      uyari: { label: l.incele, color: t.am, bg: t.amL },
      izle: { label: l.izleniyor, color: t.tx2, bg: t.bg2 },
    }[durum];
    return (
      <button
        onClick={() => window.open('#', '_blank')}
        style={{ fontSize: 10, fontWeight: 600, color: conf.color, background: conf.bg, border: `1px solid ${conf.color}44`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        {tTerm(conf.label)}
      </button>
    );
  };

  const inefDurumBadge = (durum: 'olu' | 'yavas' | 'fazla') => {
    const conf = {
      olu: { label: l.oluStokLabel, color: t.rd, bg: t.rdL },
      yavas: { label: l.yavasLabel, color: t.am, bg: t.amL },
      fazla: { label: lang === 'tr' ? 'Fazla' : 'Excess', color: '#C2410C', bg: '#FFF7ED' },
    }[durum];
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: conf.color, background: conf.bg, borderRadius: 5, padding: '2px 8px' }}>
        {tTerm(conf.label)}
      </span>
    );
  };

  const inefAksiyonBtn = (aksiyon: string) => {
    const cfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
      kampanya: { label: l.kampanyaYap,    color: t.pr,  bg: t.pr  + '14', border: t.pr  + '55' },
      bundle:   { label: l.bundleOlustur,  color: t.tl,  bg: t.tl  + '14', border: t.tl  + '55' },
      fiyat:    { label: l.fiyatDusur,     color: t.am,  bg: t.amL,        border: t.am  + '55' },
      listeden: { label: l.listedenCikar,  color: t.rd,  bg: t.rdL,        border: t.rd  + '55' },
    };
    const c = cfg[aksiyon] ?? { label: aksiyon, color: t.tx2, bg: t.bg2, border: t.bd };
    return (
      <button
        onClick={() => window.open('#', '_blank')}
        style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          color: c.color, background: c.bg, border: `1px solid ${c.border}`,
          cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.01em',
        }}
      >
        {tTerm(c.label)}
      </button>
    );
  };

  // Color for stock vs sales scatter
  const scatterColor = (color: string) => color === 'green' ? t.gn : color === 'red' ? t.rd : t.am;

  // ABC color for age vs velocity scatter
  const abcColor = (abc: string) => abc === 'A' ? t.gn : abc === 'B' ? t.am : t.rd;

  // Truncate long labels to max 15 chars
  const trunc = (name: string) => name.length > 15 ? name.slice(0, 14) + '…' : name;

  return (
    <>
      <SectionHeader title={l.katStok} t={t} />
      <FilterBar t={t} l={l} filters={filters} />

      {/* B1: Row 1 — 4 big KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="kat-stok-toplam" title={l.katToplamStokDeg} value="2.91M ₺" trendValue="+4.5%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="kat-stok-devir" title={l.katStokDevir} value="4.8x" trendValue="+0.3x" sparkTrend="up" color="tl" unit="x" big info={l.katStokDevirInfo} {...kp} />
        <KPICard id="kat-stok-kritik" title={l.katKritikStok} value="23 SKU" trendValue="+5" sparkTrend="up" color="rd" unit="SKU" big {...kp} />
        <KPICard id="kat-stok-olu" title={l.katOluStokDeg} value="312K ₺" trendValue="-18K" sparkTrend="down" color="am" unit="K ₺" big info={l.katOluStokInfo} {...kp} />
      </div>

      {/* B1: Row 2 — 4 small KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <KPICard id="kat-stok-karsilama" title={l.katKarsılamaSuresi} value={`48 ${i18n.t('common.daysLower')}`} trendValue={`-3 ${i18n.t('common.daysLower')}`} sparkTrend="down" color="gn" unit={i18n.t('common.daysLower')} {...kp} />
        <KPICard id="kat-stok-fazla" title={l.katFazlaStokDeg} value="185K ₺" trendValue="+12K" sparkTrend="up" color="am" unit="K ₺" {...kp} />
        <KPICard id="kat-stok-tedarik" title={l.katOrtTedarikSuresi} value={`12 ${i18n.t('common.daysLower')}`} trendValue={`-1 ${i18n.t('common.daysLower')}`} sparkTrend="down" color="gn" unit={i18n.t('common.daysLower')} {...kp} />
        <KPICard id="kat-stok-yas" title={l.katStokYasi} value={`34 ${i18n.t('common.daysLower')}`} trendValue={`+2 ${i18n.t('common.daysLower')}`} sparkTrend="up" color="am" unit={i18n.t('common.daysLower')} {...kp} />
      </div>

      {/* B1: Row 3 — 3 small KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="kat-stok-toplam-sku" title={l.katToplamSkuStok} value="1,247" trendValue="+45" sparkTrend="up" color="c1" unit="SKU" {...kp} />
        <KPICard id="kat-stok-dogruluk" title={l.katStokDogruluk} value="%96.2" trendValue="+0.4%" sparkTrend="up" color="gn" unit="%" {...kp} />
        <KPICard id="kat-stok-siparis" title={l.katSiparisBekkleyen} value="67" trendValue="+8" sparkTrend="up" color="c3" unit="SKU" info={l.katSiparisBekkleyenInfo} {...kp} />
      </div>

      {/* Charts 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
        {/* Stock health donut */}
        <ChartContainer t={t} l={l} title={l.katStokSaglik} id="kat-stok-chart-saglik" info={l.katStokSaglikInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={stockHealthData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" strokeWidth={0}>
                    {stockHealthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.tx }}>1,247</div>
                <div style={{ fontSize: 9, color: t.tx2 }}>SKU</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stockHealthData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: t.tx2, flex: 1 }}>{stockHealthLabels[d.name]}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.tx }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>

        {/* Turnover trend */}
        <ChartContainer t={t} l={l} title={l.katStokDevirTrend} id="kat-stok-chart-devirtrend" info={l.katStokDevirTrendInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={stockTurnoverTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} domain={[3.5, 7]} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={6} stroke={t.rd} strokeDasharray="5 3" label={{ value: lang === 'tr' ? 'Hedef 6x' : 'Target 6x', fontSize: 10, fill: t.rd, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="devir" name={lang === 'tr' ? 'Devir Hızı' : 'Turnover'} stroke={t.tl} strokeWidth={2.5} dot={{ r: 4, fill: t.tl }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* B2: Stock aging — 10 categories, taller */}
        <ChartContainer t={t} l={l} title={l.katStokYaslanma} id="kat-stok-chart-yas" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockAgingData} layout="vertical" barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v}%`} />
              <Bar dataKey="d0_30" name={`0-30 ${i18n.t('common.daysLower')}`} stackId="a" fill="#059669" />
              <Bar dataKey="d31_60" name={`31-60 ${i18n.t('common.daysLower')}`} stackId="a" fill="#10B981" />
              <Bar dataKey="d61_90" name={`61-90 ${i18n.t('common.daysLower')}`} stackId="a" fill="#D97706" />
              <Bar dataKey="d90plus" name={`90+ ${i18n.t('common.daysLower')}`} stackId="a" fill="#DC2626" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* B3: Stock vs sales velocity with color coding */}
        <ChartContainer t={t} l={l} title={l.katStokSatisHizi} id="kat-stok-chart-scatter" info={l.stokYasVelocityInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            {[
              { label: lang === 'tr' ? 'İyi Denge' : 'Good Balance', color: t.gn },
              { label: lang === 'tr' ? 'Orta' : 'Mid', color: t.am },
              { label: lang === 'tr' ? 'Verimsiz' : 'Inefficient', color: t.rd },
            ].map((item) => (
              <span key={tTerm(item.label)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: t.tx2 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                {tTerm(item.label)}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <ScatterChart margin={{ top: 6, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="stokDeg" name={lang === 'tr' ? 'Stok Değeri (K ₺)' : 'Stock Value (K ₺)'} tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="satisHizi" name={lang === 'tr' ? 'Satış Hızı' : 'Sales Velocity'} tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <ZAxis range={[40, 120]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                      <div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Stok' : 'Stock'}: {payload[0].payload.stokDeg}K ₺</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Satış Hızı' : 'Velocity'}: {payload[0].payload.satisHizi}</div>
                    </div>
                  ) : null
                }
              />
              {['green', 'amber', 'red'].map((c) => {
                const fill = scatterColor(c);
                return (
                  <Scatter
                    key={c}
                    data={stockVsSalesData.filter((d) => d.color === c)}
                    fill={fill}
                    opacity={0.8}
                    shape={(props: { cx?: number; cy?: number; payload?: { name: string } }) => {
                      const { cx = 0, cy = 0, payload } = props;
                      if (!payload) return <g />;
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.8} />
                          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill={t.tx2} fontWeight={500} style={{ pointerEvents: 'none' }}>
                            {trunc(payload.name)}
                          </text>
                        </g>
                      );
                    }}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* B4: Critical stock table with Action column */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.katKritikStokTablo}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnPresetDropdown t={t} l={l} tableType="criticalStock" allColumns={CRITICAL_COLS} visibleKeys={visibleCols} onChange={setVisibleCols} />
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
              <Icon name="download" size={12} color={t.tx3} />
              Excel
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {CRITICAL_COLS.filter((c) => visibleCols.includes(c.key)).map((col) => (
                  <th key={col.key} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: col.key === 'urun' || col.key === 'kategori' ? 'left' : 'right', whiteSpace: 'nowrap' }}>
                    {tTerm(col.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criticalStockData.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {visibleCols.includes('urun') && <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx, textAlign: 'left' }}>{row.urun}</td>}
                  {visibleCols.includes('kategori') && <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2, textAlign: 'left' }}>{row.kategori}</td>}
                  {visibleCols.includes('mevcutStok') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.mevcutStok < 10 ? t.rd : t.tx, fontWeight: row.mevcutStok < 10 ? 700 : 400 }}>{row.mevcutStok}</td>}
                  {visibleCols.includes('gunlukSatisHizi') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.gunlukSatisHizi.toFixed(1)}</td>}
                  {visibleCols.includes('tahminTukenme') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.tahminTukenme <= 7 ? t.rd : row.tahminTukenme <= 14 ? t.am : t.gn, fontWeight: 600 }}>{row.tahminTukenme} {i18n.t('common.daysLower')}</td>}
                  {visibleCols.includes('tedarikSuresi') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx2 }}>{row.tedarikSuresi} {i18n.t('common.daysLower')}</td>}
                  {visibleCols.includes('durum') && <td style={{ padding: '9px 14px', textAlign: 'right' }}>{durumBadge(row.durum)}</td>}
                  {visibleCols.includes('aksiyon') && <td style={{ padding: '9px 14px', textAlign: 'right' }}>{aksiyonBtn(row.durum)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* B5: Stok Verimsizlik Analizi */}
      <SectionHeader title={l.stokVerimsizlik} t={t} />

      {/* Verimsizlik skoru donut + Stok Yaşı scatter (2-col) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Verimsizlik score donut */}
        <ChartContainer t={t} l={l} title={l.stokVerimsizlikSkoru} id="kat-stok-inef-skor" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie
                    data={[{ value: 22, color: t.rd }, { value: 18, color: t.am }, { value: 60, color: t.gn }]}
                    cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" strokeWidth={0}
                  >
                    {[{ value: 22, color: t.rd }, { value: 18, color: t.am }, { value: 60, color: t.gn }].map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.rd }}>{fmtPercent(40, 0)}</div>
                <div style={{ fontSize: 10, color: t.tx2 }}>{lang === 'tr' ? 'Verimsiz' : 'Inefficient'}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: l.oluStokLabel, pct: '22%', color: t.rd },
                { label: l.yavasLabel, pct: '18%', color: t.am },
                { label: lang === 'tr' ? 'Sağlıklı' : 'Healthy', pct: '60%', color: t.gn },
              ].map((d) => (
                <div key={tTerm(d.label)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: t.tx2, flex: 1 }}>{tTerm(d.label)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: d.color }}>{d.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>

        {/* Stok Yaşı vs Satış Hızı scatter */}
        <ChartContainer t={t} l={l} title={l.stokYasVelocity} id="kat-stok-inef-scatter" info={l.stokYasVelocityInfo} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {['A', 'B', 'C'].map((abc) => (
              <span key={abc} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: t.tx2 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: abcColor(abc) }} />
                {lang === 'tr' ? `${abc} Grubu` : `Group ${abc}`}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <ScatterChart margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} />
              <XAxis type="number" dataKey="yas" name={lang === 'tr' ? 'Stok Yaşı (gün)' : 'Stock Age (days)'} tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="hiz" name={lang === 'tr' ? 'Aylık Satış Hızı' : 'Monthly Velocity'} tick={{ fontSize: 10, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <ZAxis range={[30, 100]} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                      <div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Yaş' : 'Age'}: {payload[0].payload.yas} {i18n.t('common.daysLower')}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Hız' : 'Velocity'}: {payload[0].payload.hiz}</div>
                      <div style={{ color: t.tx2 }}>{lang === 'tr' ? 'Stok Değeri' : 'Stock Value'}: {payload[0].payload.stokDeg}K ₺</div>
                    </div>
                  ) : null
                }
              />
              {['A', 'B', 'C'].map((abc) => {
                const fill = abcColor(abc);
                return (
                  <Scatter
                    key={abc}
                    data={stockAgeVelocityData.filter((d) => d.abc === abc)}
                    fill={fill}
                    opacity={0.85}
                    shape={(props: { cx?: number; cy?: number; payload?: { name: string } }) => {
                      const { cx = 0, cy = 0, payload } = props;
                      if (!payload) return <g />;
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.85} />
                          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill={t.tx2} fontWeight={500} style={{ pointerEvents: 'none' }}>
                            {trunc(payload.name)}
                          </text>
                        </g>
                      );
                    }}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Verimsiz ürünler tablosu */}
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 500, color: t.tx }}>{l.verimsizUrunler}</span>
            <span style={{ fontSize: 11, color: t.tx2, marginLeft: 8 }}>{l.verimsizlikInfo}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ColumnPresetDropdown t={t} l={l} tableType="inefficient" allColumns={INEF_COLS} visibleKeys={visibleInefCols} onChange={setVisibleInefCols} />
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>
              <Icon name="download" size={12} color={t.tx3} />
              Excel
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.bd}`, background: t.bg2 }}>
                {INEF_COLS.filter((c) => visibleInefCols.includes(c.key)).map((col) => (
                  <th key={col.key} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, color: t.tx2, textAlign: col.key === 'urun' || col.key === 'kategori' || col.key === 'durum' || col.key === 'aksiyon' ? 'left' : 'right', whiteSpace: 'nowrap' }}>
                    {tTerm(col.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inefficientStockData.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: `1px solid ${t.bd}` }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                  onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {visibleInefCols.includes('urun') && <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: t.tx, textAlign: 'left' }}>{row.urun}</td>}
                  {visibleInefCols.includes('kategori') && <td style={{ padding: '9px 14px', fontSize: 12, color: t.tx2, textAlign: 'left' }}>{row.kategori}</td>}
                  {visibleInefCols.includes('stokDeg') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.stokDeg}K ₺</td>}
                  {visibleInefCols.includes('stokYas') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.stokYas > 180 ? t.rd : row.stokYas > 90 ? t.am : t.tx, fontWeight: row.stokYas > 90 ? 600 : 400 }}>{row.stokYas} {i18n.t('common.daysLower')}</td>}
                  {visibleInefCols.includes('son30Gun') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.son30Gun < 5 ? t.rd : t.tx }}>{row.son30Gun}</td>}
                  {visibleInefCols.includes('son90Gun') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: t.tx }}>{row.son90Gun}</td>}
                  {visibleInefCols.includes('stokDevir') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.stokDevir < 2 ? t.rd : row.stokDevir < 4 ? t.am : t.gn, fontWeight: 600 }}>{row.stokDevir.toFixed(1)}x</td>}
                  {visibleInefCols.includes('brutMarj') && <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'right', color: row.brutMarj < 20 ? t.rd : row.brutMarj < 30 ? t.am : t.gn, fontWeight: 600 }}>{row.brutMarj.toFixed(1)}%</td>}
                  {visibleInefCols.includes('durum') && <td style={{ padding: '9px 14px', textAlign: 'left' }}>{inefDurumBadge(row.durum)}</td>}
                  {visibleInefCols.includes('aksiyon') && (
                    <td style={{ padding: '7px 14px', textAlign: 'left' }}>
                      {inefAksiyonBtn(row.aksiyon)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

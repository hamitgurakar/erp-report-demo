import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { revData, revPct, donutD, hedefD } from '../../constants/data';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { WaterfallChart } from '../charts/WaterfallChart';

interface RevenueSectionProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  dark: boolean;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

export const RevenueSection = ({ t, l, lang, dark, panels, onAddPanel, onPinTo }: RevenueSectionProps) => {
  const [revMode, setRevMode] = useState('TL');
  const kp = { t, l, panels, onAddPanel, onPinTo };
  const DC = [t.pr, t.tl, t.am];

  const CTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.tx, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
            <span style={{ color: t.tx2 }}>{p.name}:</span>
            <span style={{ fontWeight: 500 }}>{p.value.toLocaleString('tr-TR')}{revMode === '%' ? '%' : 'K ₺'}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <SectionHeader title={l.satisGeliri} t={t}>
        <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
          {['TL', '%'].map((m) => (
            <button
              key={m}
              onClick={() => setRevMode(m)}
              style={{ padding: '4px 12px', fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: revMode === m ? t.pr : 'transparent', color: revMode === m ? '#fff' : t.tx2 }}
            >
              {m}
            </button>
          ))}
        </div>
      </SectionHeader>

      <div style={{ display: 'flex', gap: 12 }}>
        <ChartContainer {...kp} style={{ flex: 2 }} title={`${l.aylikGelir} (${revMode === 'TL' ? l.binTL : '%'})`} id="chart-gelir">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revMode === 'TL' ? revData : revPct} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CTooltip />} cursor={{ fill: t.hoverBg }} />
              <Bar dataKey="gelir" name={l.gelir} fill={t.c1} radius={[4, 4, 0, 0]} opacity={0.45} />
              <Bar dataKey="brutKar" name={l.brutKar} fill={t.c2} radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="netKar" name={l.netKar} fill={t.c3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer {...kp} style={{ flex: 1 }} title={l.gelirDagilimi} id="chart-dagilim">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={donutD} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                {donutD.map((_, i) => <Cell key={i} fill={DC[i]} />)}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: t.tx }}>
                      {payload[0].name}: {revMode === 'TL' ? (payload[0].payload as typeof donutD[0]).tl : `${payload[0].value}%`}
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 600, color: t.tx, marginTop: -100 }}>2.45M ₺</div>
          <div style={{ textAlign: 'center', fontSize: 10, color: t.tx3, marginBottom: 55 }}>{l.toplam}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {donutD.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: DC[i] }} />
                <span style={{ color: t.tx2 }}>{d.name}</span>
                <span style={{ fontWeight: 500 }}>{revMode === 'TL' ? d.tl : `${d.value}%`}</span>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <ChartContainer {...kp} style={{ flex: 1 }} title={l.plWaterfall} id="chart-wf">
          <WaterfallChart t={t} lang={lang} />
        </ChartContainer>

        <ChartContainer {...kp} style={{ flex: 1 }} title={l.gelirHedef} id="chart-hedef">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={hedefD} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: t.hoverBg }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.tx }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      {payload.map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, marginTop: 3 }} />
                          {p.name}: {p.value}K ₺
                        </div>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="hedef" name={l.hedef} fill={dark ? '#475569' : '#CBD5E1'} radius={[4, 4, 0, 0]} />
              <Bar dataKey="gerceklesen" name={l.gerceklesen} radius={[4, 4, 0, 0]}>
                {hedefD.map((d, i) => (
                  <Cell key={i} fill={d.gerceklesen >= d.hedef ? t.gnP : t.rdP} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </>
  );
};

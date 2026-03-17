import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { cfD, tahD } from '../../constants/data';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';

interface CashFlowSectionProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

export const CashFlowSection = ({ t, l, lang, panels, onAddPanel, onPinTo }: CashFlowSectionProps) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  return (
    <>
      <SectionHeader title={l.nakitAkis} t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="kpi-tahsilat" title={l.tahsilatTutari} value="1.82M ₺" trendValue="+8.4%" sparkTrend="up" color="gn" unit="K ₺" {...kp} />
        <KPICard id="kpi-nakit" title={l.nakitPoz} value="+245K ₺" trendValue="+18K" sparkTrend="up" color="gn" unit="K ₺" {...kp} />
        <KPICard id="kpi-toplamalacak" title={l.toplamAlacaklar} value="412K ₺" trendValue="+5.2%" sparkTrend="up" color="c1" unit="K ₺" {...kp} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="kpi-alacak" title={l.vadeGecenAlacaklar} value="128K ₺" trendValue="+12K" sparkTrend="up" color="rd" unit="K ₺" {...kp} />
        <KPICard id="kpi-toplamborc" title={l.toplamBorc} value="450K ₺" trendValue="+3.1%" sparkTrend="up" color="rd" unit="K ₺" {...kp} />
        <KPICard id="kpi-vadeborc" title={l.vadeGecenBorc} value="85K ₺" trendValue="+5K" sparkTrend="up" color="rd" unit="K ₺" {...kp} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <ChartContainer t={t} l={l} style={{ flex: 2 }} title={l.haftalikNakit} id="chart-nakit" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, marginBottom: 8, marginTop: -4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: t.gnP }} />{l.giris}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: t.rdP }} />{l.cikis}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={cfD} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: t.hoverBg }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.tx }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ color: t.gn }}>{l.giris}: {payload[0]?.value}K ₺</div>
                      <div style={{ color: t.rd }}>{l.cikis}: {payload[1]?.value}K ₺</div>
                      <div style={{ fontWeight: 500, marginTop: 4, color: (payload[0]?.value as number) > (payload[1]?.value as number) ? t.gn : t.rd }}>
                        Net: {((payload[0]?.value as number) - (payload[1]?.value as number))}K ₺
                      </div>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="giris" name={l.giris} fill={t.gnP} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cikis" name={l.cikis} fill={t.rdP} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} style={{ flex: 1 }} title={l.b2bTahsilat} id="chart-tahsilat" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={tahD}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis domain={[78, 96]} tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                cursor={{ stroke: t.bd }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: t.tx }}>
                      {label}: <b>{payload[0].value}%</b>
                    </div>
                  ) : null
                }
              />
              <Line type="monotone" dataKey="oran" stroke={t.gn} strokeWidth={2} dot={{ r: 3, fill: t.gn }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey={() => 90} stroke={t.rd} strokeWidth={1} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </>
  );
};

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { borcD, nakitDD } from '../../constants/data';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';

interface DebtSectionProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  dark: boolean;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

export const DebtSection = ({ t, l, lang, dark, panels, onAddPanel, onPinTo }: DebtSectionProps) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  return (
    <>
      <SectionHeader title={l.borcluluk} t={t} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <KPICard id="kpi-nakitpoz" title={l.nakitPoz} value="130K ₺" trendValue="+4.2%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="kpi-toplamalacak2" title={l.toplamAlacaklar} value="412K ₺" trendValue="+5.2%" sparkTrend="up" color="c1" unit="K ₺" big {...kp} />
        <KPICard id="kpi-toplamborc2" title={l.toplamBorc} value="450K ₺" trendValue="+3.1%" sparkTrend="up" color="rd" unit="K ₺" big {...kp} />
        <KPICard id="kpi-netborc" title={l.netBorc} value="320K ₺" trendValue="+2.8%" sparkTrend="up" color="co" unit="K ₺" big {...kp} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPICard id="kpi-kisavadeli" title={l.kisaVadeliBorc} value="195K ₺" trendValue="+4.1%" sparkTrend="up" color="c3" unit="K ₺" info={l.kisaVadeliInfo} {...kp} />
        <KPICard id="kpi-uzunvadeli" title={l.uzunVadeliBorc} value="210K ₺" trendValue="+2.5%" sparkTrend="up" color="c1" unit="K ₺" info={l.uzunVadeliInfo} {...kp} />
        <KPICard id="kpi-vadealacak" title={l.vadeGecenAlacaklar} value="128K ₺" trendValue="+12K" sparkTrend="up" color="rd" unit="K ₺" {...kp} />
        <KPICard id="kpi-vadeodeme" title={l.vadeGecenOdemeler} value="85K ₺" trendValue="+5K" sparkTrend="up" color="rd" unit="K ₺" {...kp} />
        <KPICard id="kpi-finansmanborc" title={l.finansmanBorcu} value="72K ₺" trendValue="+1.8%" sparkTrend="flat" color="pu" unit="K ₺" {...kp} />
        <KPICard id="kpi-tedarikciborc" title={l.tedarikciBorcu} value="168K ₺" trendValue="+6.3%" sparkTrend="up" color="am" unit="K ₺" {...kp} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <ChartContainer t={t} l={l} style={{ flex: 1 }} title={l.borcDagilimi} id="chart-borc" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={borcD} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="period" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip cursor={{ fill: t.hoverBg }} />
              <Bar dataKey="kisaVadeli" name={l.kisaVadeli} stackId="a" fill={t.c3} />
              <Bar dataKey="uzunVadeli" name={l.uzunVadeli} stackId="a" fill={t.c1} />
              <Bar dataKey="faiz" name={l.faiz} stackId="a" fill={dark ? '#475569' : '#CBD5E1'} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer t={t} l={l} style={{ flex: 1 }} title={l.nakitDetay} id="chart-nakitdetay" panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo}>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={nakitDD} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: t.hoverBg }} />
              <Bar dataKey="operasyonel" name={l.operasyonelL} fill={t.c2} radius={[4, 4, 0, 0]} />
              <Bar dataKey="yatirim" name={l.yatirim} fill={t.tl} radius={[4, 4, 0, 0]} />
              <Bar dataKey="finansman" name={l.finansman} fill={dark ? '#64748B' : '#94A3B8'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </>
  );
};

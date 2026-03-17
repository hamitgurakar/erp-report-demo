import type { Theme, LangStrings, Lang, Panel } from '../../types';
import { KPICard } from '../kpi/KPICard';
import { SectionHeader } from '../ui/SectionHeader';

interface GeneralSectionProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  bkMode: string;
  nkMode: string;
  onBkMode: (v: string) => void;
  onNkMode: (v: string) => void;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

export const GeneralSection = ({ t, l, lang, bkMode, nkMode, onBkMode, onNkMode, panels, onAddPanel, onPinTo }: GeneralSectionProps) => {
  const kp = { t, l, lang, panels, onAddPanel, onPinTo };

  return (
    <>
      <SectionHeader title={l.genel} t={t} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <KPICard id="kpi-ciro" title={l.toplamCiro} value="2.45M ₺" trendValue="+12.5%" sparkTrend="up" color="gn" unit="K ₺" big {...kp} />
        <KPICard id="kpi-brutkar" title={l.brutKar} value="620K ₺" altValue="25.3%" trendValue="+9.8%" sparkTrend="up" color="gn" showToggle toggleState={bkMode} onToggle={onBkMode} unit="K ₺" big {...kp} />
        <KPICard id="kpi-netkar" title={l.netKar} value="385K ₺" altValue="15.7%" trendValue="+8.3%" sparkTrend="up" color="gn" showToggle toggleState={nkMode} onToggle={onNkMode} unit="K ₺" big {...kp} />
        <KPICard id="kpi-siparis" title={l.siparis} value="1,247" trendValue="+5.1%" sparkTrend="up" color="c1" unit={lang === 'en' ? 'pcs' : 'adet'} big {...kp} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginTop: 10 }}>
        <KPICard id="kpi-musteri" title={l.aktifMusteri} value="342" trendValue="-2.1%" sparkTrend="down" color="rd" unit={lang === 'en' ? 'pcs' : 'adet'} {...kp} />
        <KPICard id="kpi-ortsiparis" title={l.ortSiparis} value="1,964 ₺" trendValue="+7.0%" sparkTrend="up" color="gn" unit="₺" {...kp} />
        <KPICard id="kpi-satisadedi" title={l.satisAdedi} value="3,842" trendValue="+6.2%" sparkTrend="up" color="c2" unit={lang === 'en' ? 'pcs' : 'adet'} {...kp} />
        <KPICard id="kpi-stokmal" title={l.stokMaliyeti} value="121K ₺" trendValue="+2.1%" sparkTrend="flat" color="pu" unit="K ₺" {...kp} />
        <KPICard id="kpi-stokdeg" title={l.stokDegeri} value="291K ₺" trendValue="+4.5%" sparkTrend="up" color="pu" unit="K ₺" {...kp} />
        <KPICard id="kpi-potmarj" title={l.potStokMarji} value="%58.4" trendValue="+3.2%" sparkTrend="up" color="tl" unit="%" {...kp} />
      </div>
    </>
  );
};

import type { Theme, LangStrings, Lang } from '../../types';
import { mkSpk } from '../../constants/data';
import { totalSpend } from '../../constants/procurementData';
import { fmtCompactTRY } from '../../utils/format';
import { SectionHeader } from '../ui/SectionHeader';
import { Spark } from '../ui/Spark';
import { Icon } from '../ui/Icon';

interface DeptCard {
  title: string;
  value: string;
  trend: string;
  accent: string;
  sparkTrend: 'up' | 'down' | 'flat';
  icon: string;
  unit: string;
}

interface DepartmentSectionProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
}

export const DepartmentSection = ({ t, l, lang }: DepartmentSectionProps) => {
  // Satın Alma kartı: Satın Alma modülü verisiyle hizalı (aylık ort. = yıllık toplam / 12).
  const monthlyProcurement = totalSpend / 12;
  const cards: DeptCard[] = [
    { title: l.b2bGelir, value: '1.8M ₺', trend: '+14%', accent: t.gn, sparkTrend: 'up', icon: 'trendUp', unit: 'K ₺' },
    { title: l.b2cGelir, value: '720K ₺', trend: '+8%', accent: t.am, sparkTrend: 'up', icon: 'user', unit: 'K ₺' },
    { title: l.satinAlma, value: fmtCompactTRY(monthlyProcurement), trend: '+6%', accent: t.pu, sparkTrend: 'up', icon: 'shoppingBag', unit: 'K ₺' },
    { title: l.operasyon, value: '94.2%', trend: 'SLA', accent: t.co, sparkTrend: 'flat', icon: 'package', unit: '%' },
    { title: l.musteriDestek, value: '4.2h', trend: lang === 'en' ? 'Avg.' : 'Ort.', accent: t.pk, sparkTrend: 'down', icon: 'headphones', unit: lang === 'en' ? 'hrs' : 'saat' },
    { title: l.finans, value: '+245K ₺', trend: lang === 'en' ? 'Cash' : 'Nakit', accent: t.tl, sparkTrend: 'up', icon: 'calculator', unit: 'K ₺' },
  ];

  return (
    <>
      <SectionHeader title={l.deptOzet} t={t} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {cards.map((d, i) => (
          <div
            key={i}
            style={{ background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, borderLeft: `3px solid ${d.accent}`, padding: '14px 16px', cursor: 'pointer' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.borderColor = d.accent)}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.borderColor = t.bd)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: t.tx2 }}>{d.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${d.accent}15`, color: d.accent, fontWeight: 500 }}>{d.trend}</span>
                <Icon name="arrowRight" size={12} color={t.tx3} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, margin: '4px 0' }}>{d.value}</div>
            <Spark data={mkSpk(d.sparkTrend, d.unit, lang)} color={d.accent} t={t} />
          </div>
        ))}
      </div>
    </>
  );
};

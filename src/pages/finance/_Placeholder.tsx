import type { Theme, LangStrings, Lang } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { ReportPageLayout } from '../../components/finance';

// Finans Suite sayfalarının ortak prop şekli (Dashboard'dan `kp` ile gelir).
export interface FinancePageProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels?: unknown;
  onAddPanel?: (name: string) => void;
  onPinTo?: (panelName: string, cardId: string) => void;
  onSelectRep?: (key: string) => void;
  acct?: string;
}

interface PlaceholderProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  title: string;
}

/** P0 boş placeholder gövdesi — sayfa prompt'ları (P1–P10) bunun yerine gerçek içeriği koyar. */
export const FinancePlaceholder = ({ t, l, lang, title }: PlaceholderProps) => (
  <ReportPageLayout t={t} lang={lang} title={title}>
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: '80px 24px', border: `1px dashed ${t.bd}`, borderRadius: 12, background: t.bg2, color: t.tx3,
      }}
    >
      <Icon name="barChart3" size={34} color={t.tx3} />
      <div style={{ fontSize: 14, color: t.tx2, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 12.5 }}>{l.mhFinSoon}</div>
    </div>
  </ReportPageLayout>
);

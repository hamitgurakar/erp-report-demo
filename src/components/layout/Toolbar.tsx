import { useState } from 'react';
import type { Theme, LangStrings } from '../../types';
import { Icon } from '../ui/Icon';
import { DatePicker } from '../panels/DatePicker';
import type { Lang } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface ToolbarProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  title: string;
  showDelete?: boolean;
  onDelete?: () => void;
  acct: string;
  onChangeAcct: (v: string) => void;
  dateRange: string;
  setDateRange: (v: string) => void;
}

export const Toolbar = ({
  t, l, lang, sidebarOpen, onOpenSidebar,
  title, showDelete, onDelete,
  acct, onChangeAcct,
  dateRange, setDateRange,
}: ToolbarProps) => {
  const [showAcct, setShowAcct] = useState(false);
  const [showDP, setShowDP] = useState(false);
  const i18n = useTranslation();

  const ACCOUNT_LABELS: Record<string, string> = {
    total: i18n.t('common.muhikuTotal'),
    b2c: i18n.t('common.muhikuB2C'),
    b2b: i18n.t('common.muhikuB2B'),
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 24px', borderBottom: `1px solid ${t.bd}`, background: t.bg, gap: 10, flexShrink: 0, zIndex: 10 }}>
      {!sidebarOpen && (
        <button
          onClick={onOpenSidebar}
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx2 }}
        >
          <Icon name="menu" size={16} />
        </button>
      )}

      <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>

      {showDelete && (
        <button
          onClick={onDelete}
          style={{ marginLeft: 8, width: 28, height: 28, borderRadius: 6, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
        >
          <Icon name="trash2" size={14} />
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Account selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowAcct(!showAcct)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx, cursor: 'pointer', fontSize: 13 }}
        >
          {ACCOUNT_LABELS[acct]}
          <Icon name="chevDown" size={13} />
        </button>
        {showAcct && (
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 10, padding: 6, minWidth: 170, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 30 }}>
            {Object.entries(ACCOUNT_LABELS).map(([k, lb]) => (
              <div
                key={k}
                onClick={() => { onChangeAcct(k); setShowAcct(false); }}
                style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer', background: acct === k ? t.prL : 'transparent', color: acct === k ? t.pr : t.tx, fontSize: 13 }}
              >
                {lb}
                {acct === k && <span style={{ float: 'right' }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <button style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx2 }}>
        <Icon name="refresh" size={14} />
      </button>

      {/* Date picker */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDP(!showDP)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx, cursor: 'pointer', fontSize: 13 }}
        >
          <Icon name="calendar" size={14} />
          {dateRange}
          <Icon name="chevDown" size={13} />
        </button>
        {showDP && (
          <DatePicker
            t={t}
            l={l}
            lang={lang}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onClose={() => setShowDP(false)}
          />
        )}
      </div>
    </div>
  );
};

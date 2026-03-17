import type { Theme, LangStrings, Lang } from '../../types';
import { Icon, Flag } from '../ui/Icon';

interface HeaderProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  dark: boolean;
  onToggleDark: () => void;
  showLang: boolean;
  onToggleLang: () => void;
  onChangeLang: (lang: Lang) => void;
}

export const Header = ({ t, l, lang, dark, onToggleDark, showLang, onToggleLang, onChangeLang }: HeaderProps) => {
  const menus = lang === 'en'
    ? ['Product', 'CMS', 'Sales', 'Procurement', 'Operations', 'Support', 'Marketing', 'Accounting', 'Reports']
    : ['Ürün', 'CMS', 'Satış', 'Satınalma', 'Operasyon', 'Destek', 'Marketing', 'Muhasebe', 'Raporlar'];
  const activeLabel = lang === 'en' ? 'Reports' : 'Raporlar';

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 48, background: t.bg, borderBottom: `1px solid ${t.bd}`, flexShrink: 0, zIndex: 30 }}>
      <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 2, marginRight: 28, cursor: 'pointer' }}>MUHIKU</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        {menus.map((m) => (
          <button
            key={m}
            style={{ padding: '6px 11px', borderRadius: 6, border: 'none', background: m === activeLabel ? t.prL : 'transparent', color: m === activeLabel ? t.pr : t.tx2, fontSize: 13, fontWeight: m === activeLabel ? 500 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            {m}
            <Icon name="chevDown" size={12} color={m === activeLabel ? t.pr : t.tx3} />
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, color: t.tx3, fontSize: 12, cursor: 'pointer' }}>
          <Icon name="search" size={14} />{l.ara}
        </div>

        <div style={{ position: 'relative' }}>
          <button style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx2 }}>
            <Icon name="bell" size={18} />
          </button>
          <div style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 4, background: t.rd, border: `1.5px solid ${t.bg}` }} />
        </div>

        {/* Language selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={onToggleLang}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer' }}
          >
            <Flag country={lang} size={18} />
            <span style={{ fontSize: 11, fontWeight: 500, color: t.tx2 }}>{lang.toUpperCase()}</span>
            <Icon name="chevDown" size={11} color={t.tx3} />
          </button>
          {showLang && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: 4, minWidth: 120, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 30 }}>
              {(['tr', 'en'] as Lang[]).map((code) => (
                <div
                  key={code}
                  onClick={() => onChangeLang(code)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', background: lang === code ? t.prL : 'transparent', color: lang === code ? t.pr : t.tx, fontSize: 12 }}
                  onMouseOver={(e) => { if (lang !== code) (e.currentTarget as HTMLElement).style.background = t.bg2; }}
                  onMouseOut={(e) => { if (lang !== code) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Flag country={code} size={16} />
                  {code === 'tr' ? 'Türkçe' : 'English'}
                  {lang === code && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onToggleDark}
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx2 }}
        >
          <Icon name={dark ? 'sun' : 'moon'} size={14} />
        </button>

        <button style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx2 }}>
          <Icon name="star" size={14} />
        </button>

        <div style={{ width: 34, height: 34, borderRadius: 17, background: `linear-gradient(135deg,${t.pr},${t.pu})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
          AU
        </div>
      </div>
    </div>
  );
};

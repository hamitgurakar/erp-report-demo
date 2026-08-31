import { useEffect, useRef, useState } from 'react';

type ProjectId = 'erp' | 'influencer' | 'tahsilat';
type ProjectStatus = 'live' | 'soon';
type ProjectIcon = 'bar-chart' | 'rating' | 'coin';

interface Project {
  id: ProjectId;
  name: string;
  desc: string;
  status: ProjectStatus;
  url: string;
  iconBg: string;
  iconColor: string;
  icon: ProjectIcon;
}

interface ProjectSwitcherProps {
  activeProject: ProjectId;
  portalUrl?: string;
}

const PROJECTS: Project[] = [
  {
    id: 'erp',
    name: 'ERP Raporlama',
    desc: "Satış, kategori ve finans dashboard'u",
    status: 'live',
    url: '/erp',
    iconBg: '#4F46E5',
    iconColor: '#FFFFFF',
    icon: 'bar-chart',
  },
  {
    id: 'influencer',
    name: 'Influencer Rating',
    desc: 'Başvuru, skorlama ve kutu gönderimi',
    status: 'live',
    url: '/influencer',
    iconBg: '#7C3AED',
    iconColor: '#FFFFFF',
    icon: 'rating',
  },
  {
    id: 'tahsilat',
    name: 'Muhasebe Tahsilat',
    desc: 'Tahsilat takip ve alacak yönetimi',
    status: 'soon',
    url: '#',
    iconBg: '#0D9488',
    iconColor: '#FFFFFF',
    icon: 'coin',
  },
];

const PORTAL_ORIGIN = import.meta.env.VITE_PORTAL_ORIGIN ?? 'https://lab.mhkapp.com';

/**
 * Proje başına tam URL override'ı (.env.local). İki projeyi aynı anda local'de
 * gezmek için: VITE_INFLUENCER_URL=http://localhost:5173/influencer
 * Vite bu değerleri build sırasında yerine koyduğu için referanslar statik olmalı.
 */
const URL_OVERRIDES: Record<ProjectId, string | undefined> = {
  erp: import.meta.env.VITE_ERP_URL,
  influencer: import.meta.env.VITE_INFLUENCER_URL,
  tahsilat: import.meta.env.VITE_TAHSILAT_URL,
};

/**
 * Prod'da kardeş projeler portal üzerinden relative path ile çözülür (/erp, /influencer).
 * Dev'de ise Vite'ın base'i /erp/ olduğu için "/influencer" local sunucuda aranır ve
 * "did you mean /erp/influencer?" hatası çıkar — bu yüzden local'de PORTAL_ORIGIN'e gidiyoruz.
 */
const resolveUrl = (p: Project) => {
  const override = URL_OVERRIDES[p.id];
  if (override) return override;
  return import.meta.env.DEV ? `${PORTAL_ORIGIN}${p.url}` : p.url;
};

const C = {
  indigo: '#4F46E5',
  teal: '#0D9488',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  slate900: '#1E293B',
  slate600: '#475569',
  slate400: '#94A3B8',
  border: '#E2E8F0',
  activeBg: '#EEF2FF',
};

/* ---------- Inline SVG icons ---------- */

const HexLogo = ({ size = 30 }: { size?: number }) => {
  const gid = 'mhk-hex-grad';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor={C.indigo} />
          <stop offset="1" stopColor={C.teal} />
        </linearGradient>
      </defs>
      <path
        d="M20 2.5l13.86 8v16l-13.86 8-13.86-8v-16l13.86-8z"
        fill={`url(#${gid})`}
      />
      <path
        d="M14 26V18.5M20 26V14M26 26v-5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ transition: 'transform 0.16s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path d="M6 9l6 6 6-6" stroke={C.slate400} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProjectGlyph = ({ icon, color }: { icon: ProjectIcon; color: string }) => {
  if (icon === 'bar-chart') {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="13" width="4" height="7" rx="1" fill={color} />
        <rect x="10" y="8" width="4" height="12" rx="1" fill={color} />
        <rect x="16" y="4" width="4" height="16" rx="1" fill={color} />
      </svg>
    );
  }
  if (icon === 'rating') {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9.5" cy="7.5" r="3.5" fill={color} />
        <path d="M3.5 19.5c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path
          d="M17.5 12l1.24 2.5 2.76.4-2 1.95.47 2.75-2.47-1.3-2.47 1.3.47-2.75-2-1.95 2.76-.4L17.5 12z"
          fill={color}
        />
      </svg>
    );
  }
  // coin
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="2" />
      <path d="M12 7.5v9M9.5 14c0 1.4 1.1 2.3 2.5 2.3s2.5-.8 2.5-2.1c0-2.8-4.8-1.6-4.8-4.2 0-1.2 1-2 2.3-2s2.3.8 2.3 2"
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Check = ({ color = C.indigo }: { color?: string }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeft = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 6l-6 6 6 6" stroke={C.slate600} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- Component ---------- */

export const ProjectSwitcher = ({ activeProject, portalUrl = PORTAL_ORIGIN }: ProjectSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = PROJECTS.find((p) => p.id === activeProject) ?? PROJECTS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (p: Project) => {
    if (p.status !== 'live') return;
    setOpen(false);
    window.location.href = resolveUrl(p);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', marginRight: 24 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Proje değiştir"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '4px 8px',
          border: 'none',
          background: open ? C.activeBg : 'transparent',
          borderRadius: 9,
          cursor: 'pointer',
          height: 40,
          fontFamily: 'inherit',
        }}
      >
        <HexLogo size={30} />
        <span className="ps-trigger-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
          <span style={{ fontSize: 10.5, color: C.slate400, fontWeight: 500 }}>Muhiku Lab</span>
          <span style={{ fontSize: 13.5, color: C.slate900, fontWeight: 700 }}>{active.name}</span>
        </span>
        <Chevron open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <style>{`
            @keyframes psFadeIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @media (max-width: 520px) {
              .ps-panel {
                position: fixed !important;
                left: 8px !important;
                right: 8px !important;
                top: 56px !important;
                width: auto !important;
              }
              .ps-trigger-text { display: none !important; }
            }
          `}</style>
          <div
            className="ps-panel"
            role="menu"
            aria-label="Projeler"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 8,
              width: 320,
              background: '#FFFFFF',
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              boxShadow: '0 12px 32px rgba(15,23,42,0.16)',
              padding: 14,
              zIndex: 50,
              fontFamily: 'system-ui, Inter, sans-serif',
              animation: 'psFadeIn 0.16s ease',
            }}
          >
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 4px 12px' }}>
              <HexLogo size={34} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>Muhiku Lab</span>
                <span style={{ fontSize: 11.5, color: C.slate400 }}>Demo Portalı</span>
              </div>
            </div>

            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, color: C.slate400, padding: '4px 4px 8px' }}>
              PROJELER
            </div>

            {/* Project list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PROJECTS.map((p) => {
                const isActive = p.id === activeProject;
                const isSoon = p.status === 'soon';
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="menuitem"
                    disabled={isSoon}
                    onClick={() => go(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 10px',
                      borderRadius: 11,
                      border: 'none',
                      background: isActive ? C.activeBg : 'transparent',
                      cursor: isSoon ? 'not-allowed' : 'pointer',
                      opacity: isSoon ? 0.55 : 1,
                      fontFamily: 'inherit',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseOver={(e) => {
                      if (!isSoon && !isActive) (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                    }}
                    onMouseOut={(e) => {
                      if (!isSoon && !isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {/* Vivid filled icon tile */}
                    <span
                      style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: p.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ProjectGlyph icon={p.icon} color={p.iconColor} />
                    </span>

                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.slate900 }}>{p.name}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 20,
                            background: isSoon ? '#F1F5F9' : C.greenBg,
                            color: isSoon ? C.slate400 : C.green,
                          }}
                        >
                          {isSoon ? 'Yakında' : 'Canlı'}
                        </span>
                      </span>
                      <span style={{ fontSize: 11.5, color: C.slate600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.desc}
                      </span>
                    </span>

                    {isActive && (
                      <span style={{ flexShrink: 0, display: 'flex' }}>
                        <Check />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: C.border, margin: '12px 0 8px' }} />

            {/* Back to portal */}
            <a
              href={portalUrl}
              role="menuitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 10px',
                borderRadius: 10,
                color: C.slate600,
                fontSize: 12.5,
                fontWeight: 500,
                textDecoration: 'none',
              }}
              onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
              onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <ArrowLeft />
              Projelere Dön
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectSwitcher;

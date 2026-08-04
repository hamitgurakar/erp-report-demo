import type { Theme, Lang } from '../../types';
import { Icon } from './Icon';

/** Rol henüz çözülmeden admin-only sayfa istenirse gösterilen yükleniyor durumu. */
export function RoleLoading({ t }: { t: Theme }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <span
        style={{
          width: 30, height: 30, borderRadius: '50%',
          border: `3px solid ${t.bd}`, borderTopColor: t.pr,
          animation: 'mh-spin 0.7s linear infinite', display: 'inline-block',
        }}
      />
      <style>{`@keyframes mh-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Yetkisiz kullanıcı bir Yönetim sayfasına ulaştığında gösterilen placeholder. */
export function AccessDenied({ t, lang }: { t: Theme; lang: Lang }) {
  const en = lang === 'en';
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: t.prL, color: t.pr,
          }}
        >
          <Icon name="alertTriangle" size={26} color={t.pr} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.tx, marginBottom: 8 }}>
          {en ? 'You are not authorized to view this section' : 'Bu bölümü görüntüleme yetkiniz yok'}
        </div>
        <div style={{ fontSize: 13.5, color: t.tx2, lineHeight: 1.55 }}>
          {en
            ? 'Management reports are restricted to admins. Contact a workspace admin if you need access.'
            : 'Yönetim raporları yalnızca yöneticilere açıktır. Erişim için bir çalışma alanı yöneticisine başvurun.'}
        </div>
      </div>
    </div>
  );
}

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useRole } from './RoleContext';
import { supabase } from '../lib/supabase';

/**
 * SADECE geliştirme ortamı (import.meta.env.DEV) için geçici login.
 *
 * Login normalde portal (muhiku-portal) tarafında yapılır; bu bileşen yalnızca
 * dev'de, portal olmadan hızlı oturum açmak içindir. App.jsx'te
 * `import.meta.env.DEV && <DevAuthGate/>` guard'ı altında render edilir; prod
 * build'de bu dal ölü kod olur ve import tree-shake ile tamamen atılır — string
 * dahil hiçbir parçası prod bundle'a girmez.
 *
 * Mevcut supabase client + useRole/is_admin akışına dokunmaz; sadece
 * supabase.auth.signInWithPassword çağırır, gerisi onAuthStateChange ile döner.
 */
const wrap: CSSProperties = {
  position: 'fixed', bottom: 14, left: 14, zIndex: 99999,
  fontFamily: "'Inter',-apple-system,system-ui,sans-serif",
};
const cardStyle: CSSProperties = {
  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
  boxShadow: '0 10px 30px rgba(0,0,0,0.18)', padding: '12px 14px', width: 240,
};
const badge: CSSProperties = {
  ...cardStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: 8,
  padding: '7px 10px', fontSize: 11.5, color: '#475569',
};
const inp: CSSProperties = {
  width: '100%', padding: '7px 9px', fontSize: 12.5, borderRadius: 7,
  border: '1px solid #CBD5E1', boxSizing: 'border-box', marginTop: 6, color: '#1E293B',
};

export function DevAuthGate() {
  const { user, email, roleLoaded } = useRole();
  const [em, setEm] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!roleLoaded) return null;

  // Oturum varsa: küçük gösterge (Dev: <email> | Çıkış)
  if (user) {
    return (
      <div style={wrap}>
        <div style={badge}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: '#16A34A', flexShrink: 0 }} />
          <span>Dev: <strong style={{ color: '#1E293B' }}>{email}</strong></span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ marginLeft: 4, padding: '3px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #E2E8F0', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
          >
            Çıkış
          </button>
        </div>
      </div>
    );
  }

  // Oturum yoksa: küçük Dev Login kartı
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em.trim(), password: pw });
    setBusy(false);
    if (error) setErr(error.message);
    // başarılıysa onAuthStateChange oturumu günceller → kart otomatik gizlenir
  }

  return (
    <div style={wrap}>
      <form style={cardStyle} onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#4F46E5' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#B45309', background: '#FEF3C7', borderRadius: 5, padding: '1px 6px' }}>DEV</span>
          Dev Login
        </div>
        <input style={inp} type="email" placeholder="e-posta" value={em} autoComplete="username"
          onChange={(e) => { setEm(e.target.value); setErr(''); }} />
        <input style={inp} type="password" placeholder="şifre" value={pw} autoComplete="current-password"
          onChange={(e) => { setPw(e.target.value); setErr(''); }} />
        {err && <div style={{ fontSize: 11.5, color: '#DC2626', marginTop: 6 }}>{err}</div>}
        <button
          type="submit"
          disabled={busy}
          style={{ width: '100%', marginTop: 8, padding: '8px 0', fontSize: 12.5, fontWeight: 600, borderRadius: 7, border: 'none', background: '#4F46E5', color: '#fff', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Giriş yapılıyor…' : 'Giriş'}
        </button>
      </form>
    </div>
  );
}

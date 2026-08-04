import { useCallback, useEffect, useState } from 'react';
import type { Theme, LangStrings, Lang } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../auth/RoleContext';

interface Props {
  t: Theme;
  l: LangStrings;
  lang: Lang;
}

interface AdminRow {
  email: string;
  added_by: string | null;
  created_at: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminSettings({ t, lang }: Props) {
  const en = lang === 'en';
  const T = (tr: string, e: string) => (en ? e : tr);

  const { email: currentEmail } = useRole();

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('admin_emails')
      .select('email,added_by,created_at')
      .order('created_at', { ascending: true });
    if (error) {
      setLoadError(error.message);
      setRows([]);
    } else {
      setRows((data as AdminRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setAddError(T('Geçerli bir e-posta adresi girin.', 'Enter a valid email address.'));
      return;
    }
    if (rows.some((r) => r.email.toLowerCase() === email)) {
      setAddError(T('Bu e-posta zaten admin listesinde.', 'This email is already an admin.'));
      return;
    }
    setAdding(true);
    const { error } = await supabase
      .from('admin_emails')
      .insert({ email, added_by: currentEmail });
    setAdding(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    setNewEmail('');
    await load();
  }

  async function handleDelete(row: AdminRow) {
    setRowError(null);
    setDeleting(true);
    const { error } = await supabase.from('admin_emails').delete().eq('email', row.email);
    setDeleting(false);
    setConfirm(null);
    if (error) {
      setRowError(error.message);
      return;
    }
    await load();
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(en ? 'en-US' : 'tr-TR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const isSelf = (email: string) =>
    !!currentEmail && email.toLowerCase() === currentEmail.toLowerCase();
  const isLast = rows.length <= 1;

  const cellBase: React.CSSProperties = {
    padding: '11px 14px',
    fontSize: 13,
    borderBottom: `1px solid ${t.bd}`,
    textAlign: 'left',
  };
  const thBase: React.CSSProperties = {
    ...cellBase,
    fontSize: 11,
    fontWeight: 600,
    color: t.tx3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    background: t.bg2,
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 0 60px' }}>
      {/* Section header — teal bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: '#0D9488' }} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: t.tx }}>
          {T('Admin Listesi', 'Admin List')}
        </span>
        <div style={{ flex: 1, height: 1, background: t.bd }} />
      </div>
      <div style={{ fontSize: 13, color: t.tx2, lineHeight: 1.5, marginBottom: 18 }}>
        {T(
          'Yönetim raporlarına erişebilen admin e-postaları. Buradaki değişiklikler Supabase admin_emails tablosuna yazılır ve tüm erişim kontrolünü belirler.',
          'Admin emails that can access Management reports. Changes are written to the Supabase admin_emails table and drive all access control.',
        )}
      </div>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setAddError(null); }}
            placeholder={T('ornek@muhiku.com', 'name@muhiku.com')}
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: `1px solid ${addError ? t.rd : t.bd}`,
              background: t.cd,
              color: t.tx,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {addError && (
            <div style={{ fontSize: 12, color: t.rd, marginTop: 5 }}>{addError}</div>
          )}
        </div>
        <button
          type="submit"
          disabled={adding}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', fontSize: 13, fontWeight: 600,
            borderRadius: 8, border: 'none', background: t.pr, color: '#fff',
            cursor: adding ? 'default' : 'pointer', opacity: adding ? 0.6 : 1, whiteSpace: 'nowrap',
          }}
        >
          <Icon name="plus" size={14} color="#fff" />
          {adding ? T('Ekleniyor…', 'Adding…') : T('Admin Ekle', 'Add Admin')}
        </button>
      </form>

      {rowError && (
        <div style={{ fontSize: 12, color: t.rd, marginBottom: 8 }}>{rowError}</div>
      )}

      {/* Table */}
      <div style={{ border: `1px solid ${t.bd}`, borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thBase}>{T('E-posta', 'Email')}</th>
              <th style={thBase}>{T('Ekleyen', 'Added by')}</th>
              <th style={thBase}>{T('Tarih', 'Date')}</th>
              <th style={{ ...thBase, textAlign: 'right', width: 70 }}>{T('Sil', 'Delete')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ ...cellBase, color: t.tx3, textAlign: 'center', padding: '22px 14px' }}>{T('Yükleniyor…', 'Loading…')}</td></tr>
            ) : loadError ? (
              <tr><td colSpan={4} style={{ ...cellBase, color: t.rd, textAlign: 'center', padding: '22px 14px' }}>{T('Liste yüklenemedi: ', 'Failed to load: ')}{loadError}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} style={{ ...cellBase, color: t.tx3, textAlign: 'center', padding: '22px 14px' }}>{T('Kayıtlı admin yok.', 'No admins yet.')}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.email}>
                  <td style={{ ...cellBase, color: t.tx, fontWeight: 500 }}>
                    {r.email}
                    {isSelf(r.email) && (
                      <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, color: t.pr, background: t.prL, borderRadius: 5, padding: '1px 6px' }}>
                        {T('siz', 'you')}
                      </span>
                    )}
                  </td>
                  <td style={{ ...cellBase, color: t.tx2 }}>{r.added_by || '—'}</td>
                  <td style={{ ...cellBase, color: t.tx2 }}>{fmtDate(r.created_at)}</td>
                  <td style={{ ...cellBase, textAlign: 'right' }}>
                    <button
                      onClick={() => { setRowError(null); setConfirm(r); }}
                      title={T('Sil', 'Delete')}
                      style={{
                        width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.bd}`,
                        background: 'transparent', cursor: 'pointer', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', color: t.rd,
                      }}
                    >
                      <Icon name="trash2" size={14} color={t.rd} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm modal */}
      {confirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: t.cd, borderRadius: 14, padding: '22px 26px', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: `1px solid ${t.bd}` }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: t.tx }}>
              {T('Admini sil', 'Delete admin')}
            </div>
            <div style={{ fontSize: 13, color: t.tx2, marginBottom: 14, lineHeight: 1.5 }}>
              <strong style={{ color: t.tx }}>{confirm.email}</strong>{' '}
              {T('admin listesinden kaldırılacak.', 'will be removed from the admin list.')}
            </div>

            {(isSelf(confirm.email) || isLast) && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                <Icon name="alertTriangle" size={16} color="#B45309" />
                <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
                  {isLast
                    ? T('Bu son admin. Silerseniz hiç kimse Yönetim bölümüne ve bu ekrana erişemez.', 'This is the last admin. Removing it means no one can access Management or this screen.')
                    : T('Kendinizi siliyorsunuz. Bu işlemden sonra Yönetim bölümüne erişiminizi kaybedebilirsiniz.', 'You are removing yourself. You may lose access to Management after this.')}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setConfirm(null)}
                style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', color: t.tx2, cursor: 'pointer', fontSize: 13 }}
              >
                {T('İptal', 'Cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                disabled={deleting}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: t.rd, color: '#fff', cursor: deleting ? 'default' : 'pointer', fontSize: 13, fontWeight: 500, opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? T('Siliniyor…', 'Deleting…') : T('Sil', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

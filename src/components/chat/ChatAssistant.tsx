import { useState } from 'react';
import type { Theme, LangStrings } from '../../types';
import { Icon } from '../ui/Icon';

interface ChatAssistantProps {
  t: Theme;
  l: LangStrings;
}

export const ChatAssistant = ({ t, l }: ChatAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 50, height: 50, borderRadius: 25, background: `linear-gradient(135deg,${t.pr},${t.pu})`, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(79,70,229,0.3)', zIndex: 30 }}
      >
        <Icon name="bot" size={22} color="#fff" />
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: 370, height: '100vh', background: t.bg, borderLeft: `1px solid ${t.bd}`, display: 'flex', flexDirection: 'column', zIndex: 30, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
          <Icon name="bot" size={18} color={t.pr} />
          {l.asistan}
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.tx2 }}>
          <Icon name="x" size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* User message */}
        <div style={{ alignSelf: 'flex-end', background: t.bg2, borderRadius: '12px 12px 4px 12px', padding: '10px 14px', maxWidth: '80%', fontSize: 13 }}>
          {l.chatQ}
        </div>

        {/* Assistant message */}
        <div style={{ alignSelf: 'flex-start', background: t.prL, borderLeft: `3px solid ${t.pr}`, borderRadius: '4px 12px 12px 12px', padding: '10px 14px', maxWidth: '85%', fontSize: 13 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            {l.chatA1} <b>B2B</b> {l.chatA2} <b>1.8M ₺</b> {l.chatA3} <b>%55</b>{l.chatA4}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, background: t.bg2, borderRadius: 6, padding: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: t.tx2 }}>B2B</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.pr }}>1.8M ₺</div>
            </div>
            <div style={{ flex: 1, background: t.bg2, borderRadius: 6, padding: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: t.tx2 }}>B2C</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.tl }}>720K ₺</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.bd}`, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={l.soruSor}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.bd}`, background: t.bg2, color: t.tx, fontSize: 13, outline: 'none' }}
        />
        <button style={{ width: 34, height: 34, borderRadius: 8, background: t.pr, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrowRight" size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
};

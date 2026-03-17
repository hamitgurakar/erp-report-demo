import type { ReactNode } from 'react';
import type { Theme } from '../../types';

interface SectionHeaderProps {
  title: string;
  t: Theme;
  children?: ReactNode;
}

export const SectionHeader = ({ title, t, children }: SectionHeaderProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 28 }}>
    <div style={{ width: 3, height: 18, background: t.tl, borderRadius: 2 }} />
    <span style={{ fontSize: 12, fontWeight: 600, color: t.tl, letterSpacing: 1.2, textTransform: 'uppercase' }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: t.bd }} />
    {children}
  </div>
);

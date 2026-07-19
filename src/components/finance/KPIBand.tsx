import type { ReactNode } from 'react';

interface KPIBandProps {
  children: ReactNode;
}

/** Sayfa üstü KPI şeridi — 6-8 KPICard'ı yan yana sarar (wrap). */
export const KPIBand = ({ children }: KPIBandProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
    {children}
  </div>
);

import type { Theme, LangStrings, Panel } from '../../types';
import { SectionHeader } from '../ui/SectionHeader';
import { ChartContainer } from '../ui/ChartContainer';
import { HealthScore } from '../charts/HealthScore';
import { AlertsPanel } from '../charts/AlertsPanel';

interface StrategicSectionProps {
  t: Theme;
  l: LangStrings;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

const HEALTH_METRICS = (l: LangStrings, t: Theme) => [
  { lb: l.buyume, v: 'A', c: t.gn },
  { lb: l.karlilik, v: 'B+', c: t.gn },
  { lb: l.likidite, v: 'B', c: t.am },
  { lb: l.borclulukL, v: 'C+', c: t.rd },
];

export const StrategicSection = ({ t, l, panels, onAddPanel, onPinTo }: StrategicSectionProps) => {
  const kp = { t, l, panels, onAddPanel, onPinTo };
  const metrics = HEALTH_METRICS(l, t);

  return (
    <>
      <SectionHeader title={l.stratejik} t={t} />
      <div style={{ display: 'flex', gap: 12 }}>
        <ChartContainer
          {...kp}
          style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          title={l.saglikSkoru}
          id="chart-health"
        >
          <HealthScore score={72} t={t} l={l} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, width: '100%' }}>
            {metrics.map((m, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '5px 4px', borderRadius: 6, background: t.bg2 }}>
                <div style={{ fontSize: 9, color: t.tx3 }}>{m.lb}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: m.c }}>{m.v}</div>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer {...kp} style={{ flex: 1 }} title={l.yonetimUyarilari} id="chart-alerts">
          <AlertsPanel t={t} l={l} />
        </ChartContainer>
      </div>
    </>
  );
};

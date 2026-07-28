// DCF varsayımları paylaşılan deposu (tek kaynak = "Ayarlar").
// DCF Calculator override edip "Ayarlar'a kaydet" ile yazar; Değerleme sayfası bu baseline'ı okur.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DcfSettings } from '../constants/dcfData';
import { dcfDefaults } from '../constants/dcfData';

export interface DcfLogEntry { id: string; ts: number; action: string; detail: string }
export interface NamedScenario { name: string; settings: DcfSettings }

interface DcfCtx {
  saved: DcfSettings;                    // Ayarlar baseline (Değerleme okur)
  scenarios: NamedScenario[];
  log: DcfLogEntry[];
  saveToSettings: (s: DcfSettings) => void;   // working → Ayarlar
  saveScenario: (name: string, s: DcfSettings) => void;
  deleteScenario: (name: string) => void;
}

const Ctx = createContext<DcfCtx | null>(null);

export const DcfProvider = ({ children }: { children: ReactNode }) => {
  const [saved, setSaved] = useState<DcfSettings>(() => JSON.parse(JSON.stringify(dcfDefaults)));
  const [scenarios, setScenarios] = useState<NamedScenario[]>([]);
  const [log, setLog] = useState<DcfLogEntry[]>([]);
  const pushLog = useCallback((action: string, detail: string) =>
    setLog((l) => [{ id: `DL${Date.now()}-${Math.round(performance.now())}`, ts: Date.now(), action, detail }, ...l].slice(0, 30)), []);

  const saveToSettings = useCallback((s: DcfSettings) => {
    setSaved(JSON.parse(JSON.stringify(s)));
    pushLog('Ayarlar', `WACC %${s.waccPct} · terminal %${s.terminalGrowthPct} · DLOM %${s.dlomPct} · büyüme %${s.growthPct}`);
  }, [pushLog]);
  const saveScenario = useCallback((name: string, s: DcfSettings) => {
    setScenarios((prev) => [...prev.filter((x) => x.name !== name), { name, settings: JSON.parse(JSON.stringify(s)) }]);
    pushLog('Senaryo kaydedildi', name);
  }, [pushLog]);
  const deleteScenario = useCallback((name: string) => {
    setScenarios((prev) => prev.filter((x) => x.name !== name));
    pushLog('Senaryo silindi', name);
  }, [pushLog]);

  const value = useMemo<DcfCtx>(() => ({ saved, scenarios, log, saveToSettings, saveScenario, deleteScenario }),
    [saved, scenarios, log, saveToSettings, saveScenario, deleteScenario]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useDcf = (): DcfCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDcf must be used within DcfProvider');
  return c;
};

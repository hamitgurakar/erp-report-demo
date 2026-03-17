export interface Theme {
  bg: string;
  bg2: string;
  bg3: string;
  tx: string;
  tx2: string;
  tx3: string;
  bd: string;
  bdH: string;
  cd: string;
  pr: string;
  prL: string;
  tl: string;
  gn: string;
  gnL: string;
  gnP: string;
  rd: string;
  rdL: string;
  rdP: string;
  am: string;
  amL: string;
  pu: string;
  puL: string;
  co: string;
  pk: string;
  c1: string;
  c2: string;
  c3: string;
  hoverBg: string;
}

export type Lang = 'tr' | 'en';

export type LangStrings = Record<string, string>;

export interface Panel {
  name: string;
  items: string[];
}

export interface SparkPoint {
  v: number;
  label: string;
}

export interface KPIDef {
  title: string;
  value: string;
  trendValue: string;
  sparkTrend: 'up' | 'down' | 'flat';
  color: string;
  unit: string;
  altValue?: string;
}

export interface DeptReport {
  id: string;
  label: string;
  icon: string;
  reports: string[];
}

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  desc: string;
  action: string;
}

export interface KPISharedProps {
  t: Theme;
  l: LangStrings;
  lang: Lang;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
}

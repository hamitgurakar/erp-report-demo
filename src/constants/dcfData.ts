// DCF Calculator varsayımları — tek kaynak (Ayarlar). Değerleme sayfası da bunları okur.
// Muhiku halka kapalı: hisse fiyatı/market cap YOK. 20.000.000 hisse, cap table %35/%35/%30.
export type BaseMetric = 'FCF' | 'NetKar' | 'FAVOK';
export type TerminalMethod = 'gordon' | 'exit';

export interface DcfScenario { key: 'bear' | 'base' | 'bull'; weight: number; growthPct: number }

export interface DcfSettings {
  baseMetric: BaseMetric;
  baseValueTRY: number;      // başlangıç değeri (autofill: son 5y ort. / manuel override)
  autofillBase: boolean;
  years: number;             // açık projeksiyon yılı
  growthPct: number;         // yıllık büyüme %
  growthDecayPct: number;    // her yıl büyümeyi bu oranda azalt (0 = decay yok)
  terminalGrowthPct: number; // terminal büyüme (nominal GSYİH, WACC altında)
  terminalMethod: TerminalMethod;
  exitMultiple: number;      // exit-multiple modu için
  waccPct: number;           // iskonto oranı (TL nominal)
  erpPct: number;            // Türkiye ERP (bilgi amaçlı, Damodaran)
  netDebtTRY: number;        // EV → Equity köprüsü
  dlomPct: number;           // pazarlanabilirlik iskontosu
  scenarios: DcfScenario[];  // Kötümser/Baz/İyimser 25/50/25
  currentFairValueTRY: number; // Reverse DCF hedefi (Ayarlar'daki mevcut AI gerçeğe uygun değer, DLOM sonrası özkaynak)
  historicalCagrPct: number; // reverse kıyas (tarihsel büyüme)
  shares: number;            // sabit 20.000.000
  capTable: { partner: string; pct: number }[];
}

export const DCF_SHARES = 20_000_000;

// Metrik başına başlangıç değeri (son yıl ~ 5y ortalaması; Finansal Veriler'den autofill mantığı)
export const BASE_BY_METRIC: Record<BaseMetric, number> = {
  FCF: 12_000_000,     // serbest nakit akışı
  NetKar: 9_000_000,   // net kâr
  FAVOK: 15_000_000,   // FAVÖK
};

export const dcfDefaults: DcfSettings = {
  baseMetric: 'FCF',
  baseValueTRY: BASE_BY_METRIC.FCF,
  autofillBase: true,
  years: 5,
  growthPct: 30,          // ~2020-2025 hasılat CAGR
  growthDecayPct: 15,     // her yıl büyüme %15 (relatif) yavaşlar
  terminalGrowthPct: 25,  // ≈ nominal GSYİH beklentisi, WACC altında
  terminalMethod: 'gordon',
  exitMultiple: 6,        // EV/FAVÖK ~ comps aralığı
  waccPct: 38.5,          // TL nominal
  erpPct: 9.30,           // Damodaran 07/2026
  netDebtTRY: 8_000_000,
  dlomPct: 25,
  scenarios: [
    { key: 'bear', weight: 25, growthPct: 18 },
    { key: 'base', weight: 50, growthPct: 30 },
    { key: 'bull', weight: 25, growthPct: 42 },
  ],
  currentFairValueTRY: 55_000_000, // Ayarlar mevcut fair value (DLOM sonrası özkaynak) — reverse hedefi
  historicalCagrPct: 30,
  shares: DCF_SHARES,
  capTable: [
    { partner: 'Abdülhamit', pct: 35 },
    { partner: 'Ahmet', pct: 35 },
    { partner: 'Hasan', pct: 30 },
  ],
};

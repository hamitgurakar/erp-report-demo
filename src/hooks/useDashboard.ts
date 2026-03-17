import { useState } from 'react';
import type { Lang, Panel } from '../types';
import { TH } from '../constants/theme';
import { L } from '../constants/i18n';
import { mkDeptReports } from '../constants/data';

export const useDashboard = () => {
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [acct, setAcct] = useState('total');
  const [dateRange, setDateRange] = useState('Son 30 gün');
  const [view, setView] = useState('report');
  const [activeRep, setActiveRep] = useState('yonetim__0');
  const [expandedDepts, setExpandedDepts] = useState<string[]>(['yonetim']);
  const [favs, setFavs] = useState<string[]>(['yonetim__0', 'satis__1']);
  const [panels, setPanels] = useState<Panel[]>([
    { name: 'Haftalık Kontrolüm', items: ['kpi-ciro', 'kpi-netkar'] },
    { name: 'CFO Görünümü', items: ['kpi-brutkar', 'kpi-stokdeg'] },
  ]);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('tr');
  const [showLang, setShowLang] = useState(false);
  const [bkMode, setBkMode] = useState('TL');
  const [nkMode, setNkMode] = useState('TL');

  const t = dark ? TH.dark : TH.light;
  const l = L[lang];
  const deptReports = mkDeptReports(l);

  const isPanel = view.startsWith('panel:');
  const activePanelName = isPanel ? view.replace('panel:', '') : null;
  const activePanel = panels.find((p) => p.name === activePanelName);

  // Sidebar handlers
  const toggleDept = (id: string) =>
    setExpandedDepts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleFav = (key: string) =>
    setFavs((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);

  const selectRep = (key: string) => { setActiveRep(key); setView('report'); };

  // Panel handlers
  const addPanel = (name: string) => {
    if (!panels.find((p) => p.name === name)) {
      setPanels((prev) => [...prev, { name, items: [] }]);
    }
  };

  const pinTo = (panelName: string, cardId: string) => {
    setPanels((prev) =>
      prev.map((x) =>
        x.name === panelName
          ? { ...x, items: x.items.includes(cardId) ? x.items : [...x.items, cardId] }
          : x
      )
    );
    setView(`panel:${panelName}`);
  };

  const removeFromPanel = (panelName: string, cardId: string) =>
    setPanels((prev) => prev.map((x) => x.name === panelName ? { ...x, items: x.items.filter((i) => i !== cardId) } : x));

  const deletePanel = (name: string) => {
    setPanels((prev) => prev.filter((x) => x.name !== name));
    setView('report');
    setDelConfirm(null);
  };

  const reorderPanel = (panelName: string, from: number, to: number) =>
    setPanels((prev) =>
      prev.map((x) => {
        if (x.name !== panelName) return x;
        const items = [...x.items];
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        return { ...x, items };
      })
    );

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    setShowLang(false);
    setDateRange(newLang === 'en' ? 'Last 30 days' : 'Son 30 gün');
  };

  return {
    // State
    dark, t, l, lang, deptReports,
    sidebarOpen, setSidebarOpen,
    acct, setAcct,
    dateRange, setDateRange,
    view, setView,
    activeRep,
    expandedDepts,
    favs,
    panels,
    delConfirm, setDelConfirm,
    showLang, setShowLang,
    bkMode, setBkMode,
    nkMode, setNkMode,
    isPanel, activePanelName, activePanel,
    // Handlers
    toggleDark: () => setDark((d) => !d),
    toggleDept,
    toggleFav,
    selectRep,
    addPanel,
    pinTo,
    removeFromPanel,
    deletePanel,
    reorderPanel,
    changeLang,
  };
};

import { useDashboard } from '../hooks/useDashboard';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Toolbar } from '../components/layout/Toolbar';
import { PanelView } from '../components/panels/PanelView';
import { GeneralSection } from '../components/sections/GeneralSection';
import { RevenueSection } from '../components/sections/RevenueSection';
import { StrategicSection } from '../components/sections/StrategicSection';
import { DepartmentSection } from '../components/sections/DepartmentSection';
import { CashFlowSection } from '../components/sections/CashFlowSection';
import { DebtSection } from '../components/sections/DebtSection';
import { CategoryOverview } from '../components/sections/category/CategoryOverview';
import { CategoryPerformance } from '../components/sections/category/CategoryPerformance';
import { CategoryStock } from '../components/sections/category/CategoryStock';
import { CategoryBrand } from '../components/sections/category/CategoryBrand';
import { CategoryABC } from '../components/sections/category/CategoryABC';
import { ExecutiveSummary } from './procurement/ExecutiveSummary';
import { Operations } from './procurement/Operations';
import { BuyerPerformance } from './procurement/BuyerPerformance';
import { ProjectPricing } from './procurement/ProjectPricing';
import { Suppliers } from './procurement/Suppliers';
import { Cost } from './procurement/Cost';
import { Payables } from './procurement/Payables';
import { StockReplenishment } from './procurement/StockReplenishment';
import { Profitability } from './procurement/Profitability';
import { SalesOverview } from '../components/satis/SalesOverview';
import { SalesRevenue } from '../components/satis/SalesRevenue';
import { SalesPipeline } from '../components/satis/SalesPipeline';
import { SalesRepPerformance } from '../components/satis/SalesRepPerformance';
import { SalesCustomerSegment } from '../components/satis/SalesCustomerSegment';
import { SalesProductCategory } from '../components/satis/SalesProductCategory';
import { SalesSeasonal } from '../components/satis/SalesSeasonal';
import { SalesAICoach } from '../components/satis/SalesAICoach';
import { SalesCommunication } from '../components/satis/SalesCommunication';
import { SalesForecasting } from '../components/satis/SalesForecasting';
import { SalesTargets } from '../components/satis/SalesTargets';
import { ManagementTargets } from '../components/yonetim/ManagementTargets';
import { FinancialData } from './finance/FinancialData';
import { IncomeProfitability } from './finance/income-profitability/IncomeProfitability';
import { CashLiquidity } from './finance/cash-liquidity/CashLiquidity';
import { Receivables } from './finance/receivables/Receivables';
import { Payables as FinPayables } from './finance/payables/Payables';
import { TaxCompliance } from './finance/tax-compliance/TaxCompliance';
import { Leverage } from './finance/leverage/Leverage';
import { Valuation } from './finance/Valuation';
import { ShareholderReturns } from './finance/ShareholderReturns';
import { Scorecard } from './finance/Scorecard';
import { CfoCockpit } from './finance/CfoCockpit';
import { ChatAssistant } from '../components/chat/ChatAssistant';
import { Icon } from '../components/ui/Icon';

export default function Dashboard() {
  const db = useDashboard();

  const kp = {
    t: db.t,
    l: db.l,
    lang: db.lang,
    panels: db.panels,
    onAddPanel: db.addPanel,
    onPinTo: db.pinTo,
    onSelectRep: db.selectRep,
    acct: db.acct,
  };

  const repTitles: Record<string, string> = {
    'yonetim__3': db.l.yonetimHedefler,
    'yonetim__4': db.l.finansalVeriler,
    'satis__0': db.l.satisOzeti,
    'satis__1': db.l.satisRaporu,
    'satis__2': db.l.pipelineAnalizi,
    'satis__3': db.l.kanalPerf,
    'satis__4': db.l.musteriSeg,
    'satis__5': db.l.satisUrunKategori,
    'satis__6': db.l.satisSezonsal,
    'satis__7': db.l.satisAICoach,
    'satis__8': db.l.satisIletisim,
    'satis__9': db.l.satisForecasting,
    'satis__10': db.l.satisHedefler,
    'kategori__0': db.l.katOzet,
    'kategori__1': db.l.katPerf,
    'kategori__2': db.l.katStok,
    'kategori__3': db.l.katMarka,
    'kategori__4': db.l.katABC,
    'muhasebe__0': db.l.mhFin0,
    'muhasebe__1': db.l.mhFin1,
    'muhasebe__2': db.l.mhFin2,
    'muhasebe__3': db.l.mhFin3,
    'muhasebe__4': db.l.mhFin4,
    'muhasebe__5': db.l.mhFin5,
    'muhasebe__6': db.l.mhFin6,
    'muhasebe__7': db.l.mhFin7,
    'muhasebe__8': db.l.mhFin8,
    'muhasebe__9': db.l.mhFin9,
  };
  const toolbarTitle = db.isPanel
    ? (db.activePanelName ?? '')
    : repTitles[db.activeRep] ?? db.l.yonetimPaneli;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: db.t.bg, color: db.t.tx, fontFamily: "'Inter',-apple-system,system-ui,sans-serif", fontSize: 14, overflow: 'hidden' }}>

      <Header
        t={db.t}
        l={db.l}
        lang={db.lang}
        dark={db.dark}
        onToggleDark={db.toggleDark}
        showLang={db.showLang}
        onToggleLang={() => db.setShowLang(!db.showLang)}
        onChangeLang={db.changeLang}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          t={db.t}
          l={db.l}
          open={db.sidebarOpen}
          onClose={() => db.setSidebarOpen(false)}
          deptReports={db.deptReports}
          expandedDepts={db.expandedDepts}
          onToggleDept={db.toggleDept}
          favs={db.favs}
          onToggleFav={db.toggleFav}
          activeRep={db.activeRep}
          onSelectRep={db.selectRep}
          panels={db.panels}
          view={db.view}
          onSelectPanel={(name) => db.setView(`panel:${name}`)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Toolbar
            t={db.t}
            l={db.l}
            lang={db.lang}
            sidebarOpen={db.sidebarOpen}
            onOpenSidebar={() => db.setSidebarOpen(true)}
            title={toolbarTitle}
            showDelete={db.isPanel}
            onDelete={() => db.setDelConfirm(db.activePanelName)}
            acct={db.acct}
            onChangeAcct={db.setAcct}
            dateRange={db.dateRange}
            setDateRange={db.setDateRange}
            hideAccount={db.activeRep === 'yonetim__4' || db.activeRep.startsWith('muhasebe__')}
          />

          <div style={{ padding: '5px 24px', fontSize: 11, color: db.t.tx3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: db.t.gn }} />
            {db.l.sonGunc}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 100px 24px' }}>
            {db.isPanel && db.activePanel ? (
              <PanelView
                panel={db.activePanel}
                t={db.t}
                l={db.l}
                lang={db.lang}
                onRemoveItem={db.removeFromPanel}
                onReorder={db.reorderPanel}
              />
            ) : db.activeRep === 'yonetim__3' ? (
              <ManagementTargets {...kp} />
            ) : db.activeRep === 'yonetim__4' ? (
              <FinancialData {...kp} />
            ) : db.activeRep === 'satis__0' ? (
              <SalesOverview {...kp} />
            ) : db.activeRep === 'satis__1' ? (
              <SalesRevenue {...kp} />
            ) : db.activeRep === 'satis__2' ? (
              <SalesPipeline {...kp} />
            ) : db.activeRep === 'satis__3' ? (
              <SalesRepPerformance {...kp} />
            ) : db.activeRep === 'satis__4' ? (
              <SalesCustomerSegment {...kp} />
            ) : db.activeRep === 'satis__5' ? (
              <SalesProductCategory {...kp} />
            ) : db.activeRep === 'satis__6' ? (
              <SalesSeasonal {...kp} />
            ) : db.activeRep === 'satis__7' ? (
              <SalesAICoach {...kp} />
            ) : db.activeRep === 'satis__8' ? (
              <SalesCommunication {...kp} />
            ) : db.activeRep === 'satis__9' ? (
              <SalesForecasting {...kp} />
            ) : db.activeRep === 'satis__10' ? (
              <SalesTargets {...kp} />
            ) : db.activeRep === 'kategori__0' ? (
              <CategoryOverview {...kp} dark={db.dark} />
            ) : db.activeRep === 'kategori__1' ? (
              <CategoryPerformance {...kp} />
            ) : db.activeRep === 'kategori__2' ? (
              <CategoryStock {...kp} dark={db.dark} />
            ) : db.activeRep === 'kategori__3' ? (
              <CategoryBrand {...kp} />
            ) : db.activeRep === 'kategori__4' ? (
              <CategoryABC {...kp} />
            ) : db.activeRep === 'satin-alma__0' ? (
              <ExecutiveSummary {...kp} />
            ) : db.activeRep === 'satin-alma__2' ? (
              <Operations {...kp} />
            ) : db.activeRep === 'satin-alma__3' ? (
              <BuyerPerformance {...kp} />
            ) : db.activeRep === 'satin-alma__4' ? (
              <ProjectPricing {...kp} />
            ) : db.activeRep === 'satin-alma__1' ? (
              <Suppliers {...kp} />
            ) : db.activeRep === 'satin-alma__5' ? (
              <Cost {...kp} />
            ) : db.activeRep === 'satin-alma__7' ? (
              <Payables {...kp} />
            ) : db.activeRep === 'satin-alma__8' ? (
              <StockReplenishment {...kp} />
            ) : db.activeRep === 'satin-alma__6' ? (
              <Profitability {...kp} />
            ) : db.activeRep === 'muhasebe__0' ? (
              <IncomeProfitability {...kp} />
            ) : db.activeRep === 'muhasebe__1' ? (
              <CashLiquidity {...kp} />
            ) : db.activeRep === 'muhasebe__2' ? (
              <Receivables {...kp} />
            ) : db.activeRep === 'muhasebe__3' ? (
              <FinPayables {...kp} />
            ) : db.activeRep === 'muhasebe__4' ? (
              <TaxCompliance {...kp} />
            ) : db.activeRep === 'muhasebe__5' ? (
              <Leverage {...kp} />
            ) : db.activeRep === 'muhasebe__6' ? (
              <Valuation {...kp} />
            ) : db.activeRep === 'muhasebe__7' ? (
              <ShareholderReturns {...kp} />
            ) : db.activeRep === 'muhasebe__8' ? (
              <Scorecard {...kp} />
            ) : db.activeRep === 'muhasebe__9' ? (
              <CfoCockpit {...kp} />
            ) : (
              <>
                <GeneralSection
                  {...kp}
                  bkMode={db.bkMode}
                  nkMode={db.nkMode}
                  onBkMode={db.setBkMode}
                  onNkMode={db.setNkMode}
                />
                <RevenueSection {...kp} dark={db.dark} />
                <StrategicSection {...kp} />
                <DepartmentSection t={db.t} l={db.l} lang={db.lang} />
                <CashFlowSection {...kp} />
                <DebtSection {...kp} dark={db.dark} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {db.delConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => db.setDelConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: db.t.cd, borderRadius: 14, padding: '24px 28px', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: `1px solid ${db.t.bd}` }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{db.l.panoSil}</div>
            <div style={{ fontSize: 13, color: db.t.tx2, marginBottom: 20, lineHeight: 1.5 }}>
              "{db.delConfirm}" {db.l.panoSilMsg}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => db.setDelConfirm(null)}
                style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${db.t.bd}`, background: 'transparent', color: db.t.tx2, cursor: 'pointer', fontSize: 13 }}
              >
                {db.l.iptal}
              </button>
              <button
                onClick={() => db.deletePanel(db.delConfirm!)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: db.t.rd, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                {db.l.sil}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatAssistant t={db.t} l={db.l} />
    </div>
  );
}

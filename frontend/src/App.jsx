import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Loader2 } from 'lucide-react';

import NavRail from './components/NavRail';
import Dashboard from './components/Dashboard';
import NewCaseForm from './components/NewCaseForm';
import WeightCalculator from './components/WeightCalculator';
import CargoBooking from './components/CargoBooking';
import MilestoneTracking from './components/MilestoneTracking';
import EnquiryCRM from './components/EnquiryCRM';
import QuotationManager from './components/QuotationManager';
import AwbTracker from './components/AwbTracker';
import PickupScheduler from './components/PickupScheduler';
import WarehouseInventory from './components/WarehouseInventory';
import InvoiceTracker from './components/InvoiceTracker';
import DeliveryProof from './components/DeliveryProof';
import ComplaintsList from './components/ComplaintsList';
import WorkflowEngine from './components/WorkflowEngine';
import AgentPortal from './components/AgentPortal';
import RateManager from './components/RateManager';
import PartnerManagement from './components/PartnerManagement';
import AirlineComparison from './components/AirlineComparison';
import AiQuotationAssist from './components/AiQuotationAssist';
import AiCustomsAssist from './components/AiCustomsAssist';
import AiInsuranceAssist from './components/AiInsuranceAssist';
import AiRouteAssist from './components/AiRouteAssist';
import CargoDescCleaner from './components/CargoDescCleaner';
import ShipmentInsights from './components/ShipmentInsights';
import RemindersAlerts from './components/RemindersAlerts';
import LoginPage from './components/LoginPage';

import { useAuth } from './lib/AuthContext';
import { api } from './lib/api';

// ─── Pages accessible by role ─────────────────────────────────────────────────
// 'all'      = both manager and customer
// 'manager'  = manager only
// 'customer' = customer only (currently none — but easy to add)

const PAGE_ROLES = {
  dashboard:      'all',
  booking:        'all',
  milestone:      'all',
  enquiry:        'manager',
  quotation:      'all',
  awb:            'all',
  pickup:         'manager',
  warehouse:      'manager',
  invoice:        'manager',
  delivery:       'all',
  complaints:     'all',
  'new-case':     'all',
  workflow:       'manager',
  agent:          'manager',
  rates:          'manager',
  partners:       'manager',
  airline:        'all',
  'ai-quotation': 'all',
  'ai-customs':   'all',
  'ai-insurance': 'all',
  'ai-route':     'all',
  'cargo-cleaner':'manager',
  'weight-calc':  'all',
  insights:       'manager',
  reminders:      'manager',
};

export default function App() {
  const { user, role, loading, logout } = useAuth();
  const [view, setView]   = useState('dashboard');
  const [openCount, setOpenCount] = useState(0);

  // Guard: redirect customer away from manager-only pages
  const safeSetView = (v) => {
    const allowed = PAGE_ROLES[v] ?? 'all';
    if (allowed === 'manager' && role !== 'manager') return;
    setView(v);
  };

  useEffect(() => {
    if (!user) return;
    api.getStats().then((s) => {
      const open      = s.byStatus?.find((x) => x.status === 'OPEN')?.count || 0;
      const escalated = s.byStatus?.find((x) => x.status === 'ESCALATED')?.count || 0;
      setOpenCount(open + escalated);
    }).catch(() => {});
  }, [view, user]);

  // ── Loading splash ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-tower-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cargo-orange" />
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!user) return <LoginPage />;

  // ── Page map ──────────────────────────────────────────────────────────────
  const PAGE_MAP = {
    dashboard:      <Dashboard onNavigate={safeSetView} />,
    booking:        <CargoBooking />,
    milestone:      <MilestoneTracking />,
    enquiry:        <EnquiryCRM />,
    quotation:      <QuotationManager />,
    awb:            <AwbTracker />,
    pickup:         <PickupScheduler />,
    warehouse:      <WarehouseInventory />,
    invoice:        <InvoiceTracker />,
    delivery:       <DeliveryProof />,
    complaints:     <ComplaintsList />,
    'new-case':     <NewCaseForm onCreated={() => setView('dashboard')} />,
    workflow:       <WorkflowEngine />,
    agent:          <AgentPortal />,
    rates:          <RateManager />,
    partners:       <PartnerManagement />,
    airline:        <AirlineComparison />,
    'ai-quotation': <AiQuotationAssist />,
    'ai-customs':   <AiCustomsAssist />,
    'ai-insurance': <AiInsuranceAssist />,
    'ai-route':     <AiRouteAssist />,
    'cargo-cleaner':<CargoDescCleaner />,
    'weight-calc':  <WeightCalculator />,
    insights:       <ShipmentInsights />,
    reminders:      <RemindersAlerts />,
  };

  // If current view is now forbidden (e.g. role changed), fall back
  const currentAllowed = PAGE_ROLES[view] ?? 'all';
  const activePage =
    currentAllowed === 'manager' && role !== 'manager'
      ? PAGE_MAP['dashboard']
      : PAGE_MAP[view] ?? <Dashboard onNavigate={safeSetView} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-tower-900">
      <NavRail
        active={view}
        onChange={safeSetView}
        openCount={openCount}
        role={role}
        user={user}
        onLogout={logout}
      />
      <main className="flex-1 min-h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activePage}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

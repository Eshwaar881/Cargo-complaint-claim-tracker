import { motion } from 'framer-motion';
import {
  LayoutDashboard, PackagePlus, MapPin, MessageSquare, FileText,
  Plane, Truck, Warehouse, Receipt, ClipboardCheck,
  AlertTriangle, FilePlus2, GitBranch,
  UserCog, DollarSign, Users, BarChart2,
  Sparkles, FileSearch, Shield, Navigation, Wand2,
  Scale, TrendingUp, Bell, LogOut,
} from 'lucide-react';

const ICONS = {
  LayoutDashboard, PackagePlus, MapPin, MessageSquare, FileText,
  Plane, Truck, Warehouse, Receipt, ClipboardCheck,
  AlertTriangle, FilePlus2, GitBranch,
  UserCog, DollarSign, Users, BarChart2,
  Sparkles, FileSearch, Shield, Navigation, Wand2,
  Scale, TrendingUp, Bell,
};

// 'role' field: 'all' | 'manager'
const NAV = [
  { section: 'Core Ops' },
  { id: 'dashboard',     label: 'Ops Dashboard',        icon: 'LayoutDashboard', role: 'all' },
  { id: 'booking',       label: 'Cargo Booking',         icon: 'PackagePlus',     role: 'all' },
  { id: 'milestone',     label: 'Milestone Tracking',    icon: 'MapPin',          role: 'all' },
  { id: 'enquiry',       label: 'Customer CRM',          icon: 'MessageSquare',   role: 'manager' },
  { id: 'quotation',     label: 'Quotation Manager',     icon: 'FileText',        role: 'all' },
  { section: 'Logistics' },
  { id: 'awb',           label: 'Airway Bill Tracker',   icon: 'Plane',           role: 'all' },
  { id: 'pickup',        label: 'Airport Pickup',         icon: 'Truck',           role: 'manager' },
  { id: 'warehouse',     label: 'Warehouse Inventory',   icon: 'Warehouse',       role: 'manager' },
  { id: 'invoice',       label: 'Invoice Tracker',        icon: 'Receipt',         role: 'manager' },
  { id: 'delivery',      label: 'Delivery Proof (ePOD)', icon: 'ClipboardCheck',  role: 'all' },
  { section: 'Complaints' },
  { id: 'complaints',    label: 'Complaint & Claims',    icon: 'AlertTriangle',   role: 'all', badge: true },
  { id: 'new-case',      label: 'New Complaint',          icon: 'FilePlus2',       role: 'all' },
  { id: 'workflow',      label: 'Workflow Engine',         icon: 'GitBranch',       role: 'manager' },
  { section: 'Management' },
  { id: 'agent',         label: 'Agent Portal',           icon: 'UserCog',         role: 'manager' },
  { id: 'rates',         label: 'Route Rate Manager',     icon: 'DollarSign',      role: 'manager' },
  { id: 'partners',      label: 'Partner Management',     icon: 'Users',           role: 'manager' },
  { id: 'airline',       label: 'Airline Rate Compare',   icon: 'BarChart2',       role: 'all' },
  { section: 'AI Tools' },
  { id: 'ai-quotation',  label: 'AI Quotation Assist',   icon: 'Sparkles',        role: 'all' },
  { id: 'ai-customs',    label: 'AI Customs / Docs',      icon: 'FileSearch',      role: 'all' },
  { id: 'ai-insurance',  label: 'Insurance Claim AI',     icon: 'Shield',          role: 'all' },
  { id: 'ai-route',      label: 'Route Suggestion AI',    icon: 'Navigation',      role: 'all' },
  { id: 'cargo-cleaner', label: 'Cargo Desc Cleaner',     icon: 'Wand2',           role: 'manager' },
  { section: 'Tools' },
  { id: 'weight-calc',   label: 'Chargeable Weight Calc', icon: 'Scale',           role: 'all' },
  { id: 'insights',      label: 'Shipment Insights',      icon: 'TrendingUp',      role: 'manager' },
  { id: 'reminders',     label: 'Reminders & Alerts',     icon: 'Bell',            role: 'manager' },
];

export default function NavRail({ active, onChange, openCount = 0, role, user, onLogout }) {
  const isManager = role === 'manager';

  // Filter nav items based on role
  const visibleNav = NAV.filter((item) => {
    if (item.section) return true;          // always show section headers
    return item.role === 'all' || isManager; // manager sees everything
  });

  return (
    <nav className="flex md:flex-col gap-0 md:w-56 md:min-h-screen md:py-4 md:px-3 bg-tower-800 border-b md:border-b-0 md:border-r border-panel-600/60 overflow-y-auto">
      {/* Logo */}
      <div className="hidden md:flex items-center gap-2 mb-4 px-2 pt-2">
        <div className="w-8 h-8 rounded bg-cargo-orange flex items-center justify-center font-display font-bold text-tower-900 text-sm flex-shrink-0">CC</div>
        <div>
          <div className="font-display text-sm font-semibold text-paper-100 leading-tight">Cargo Ops</div>
          <div className="text-[10px] text-paper-100/50">Full Platform v2</div>
        </div>
      </div>

      {/* User identity chip */}
      {user && (
        <div className="hidden md:flex items-center gap-2 mx-1 mb-3 px-3 py-2.5 rounded-xl bg-panel-700/60 border border-panel-600/40">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-6 h-6 rounded-full flex-shrink-0 ring-1 ring-panel-600"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-cargo-orange/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-cargo-orange">
                {(user.displayName || user.email || 'M')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-paper-100 truncate leading-tight">
              {isManager ? 'Manager' : (user.displayName || 'Customer')}
            </div>
            <div className="text-[10px] text-paper-100/40 truncate">{user.email}</div>
          </div>
          <span
            className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
              isManager
                ? 'bg-cargo-orange/20 text-cargo-orange'
                : 'bg-resolved-teal/20 text-resolved-teal'
            }`}
          >
            {isManager ? 'Mgr' : 'Cust'}
          </span>
        </div>
      )}

      {/* Nav items */}
      {visibleNav.map((item) => {
        if (item.section) {
          return (
            <div key={item.section} className="hidden md:block text-[10px] font-bold text-paper-100/30 uppercase tracking-widest px-3 pt-4 pb-1">
              {item.section}
            </div>
          );
        }
        const Icon = ICONS[item.icon];
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 mx-1 my-0.5 ${
              isActive ? 'text-paper-100' : 'text-paper-100/50 hover:text-paper-100/80'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-panel-700 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={15} className="relative z-10 flex-shrink-0" />
            <span className="relative z-10 hidden md:inline truncate">{item.label}</span>
            {item.badge && openCount > 0 && (
              <span className="relative z-10 ml-auto hidden md:flex items-center justify-center bg-breach-red text-white text-[10px] font-bold rounded-full w-4 h-4 flex-shrink-0">
                {openCount > 9 ? '9+' : openCount}
              </span>
            )}
          </button>
        );
      })}

      {/* Logout */}
      <div className="hidden md:block mt-auto pt-4 border-t border-panel-600/30 mx-1">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-paper-100/40 hover:text-breach-red hover:bg-breach-red/8 transition-colors duration-150"
        >
          <LogOut size={15} className="flex-shrink-0" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </nav>
  );
}

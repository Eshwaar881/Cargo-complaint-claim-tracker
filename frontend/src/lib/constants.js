export const CATEGORIES = [
  { value: 'DELAY', label: 'Delay', icon: 'Clock' },
  { value: 'DAMAGE', label: 'Damage', icon: 'PackageX' },
  { value: 'MISSING_PACKAGE', label: 'Missing Package', icon: 'SearchX' },
  { value: 'BILLING_ISSUE', label: 'Billing Issue', icon: 'Receipt' },
  { value: 'DOCUMENTATION_ISSUE', label: 'Documentation Issue', icon: 'FileWarning' },
];

export const STATUSES = [
  'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'PENDING_CUSTOMER',
  'RESOLVED', 'REJECTED', 'ESCALATED', 'CLOSED',
];

export const STATUS_LABELS = {
  OPEN: 'Open', ACKNOWLEDGED: 'Acknowledged', INVESTIGATING: 'Investigating',
  PENDING_CUSTOMER: 'Pending Customer', RESOLVED: 'Resolved', REJECTED: 'Rejected',
  ESCALATED: 'Escalated', CLOSED: 'Closed',
};

export const PRIORITY_COLORS = {
  LOW:      { text: '#3FA796', bg: 'rgba(63,167,150,0.15)' },
  MEDIUM:   { text: '#D9A23B', bg: 'rgba(217,162,59,0.15)' },
  HIGH:     { text: '#D4742F', bg: 'rgba(212,116,47,0.15)' },
  CRITICAL: { text: '#C23B3B', bg: 'rgba(194,59,59,0.15)' },
};

export const STATUS_COLORS = {
  OPEN: '#D9A23B', ACKNOWLEDGED: '#5B8DEF', INVESTIGATING: '#D4742F',
  PENDING_CUSTOMER: '#9B7FD4', RESOLVED: '#3FA796', REJECTED: '#6B7280',
  ESCALATED: '#C23B3B', CLOSED: '#4B5563',
};

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export const SOURCES = [
  { value: 'CUSTOMER_PORTAL', label: 'Customer Portal' },
  { value: 'AGENT_PORTAL', label: 'Agent Portal' },
  { value: 'CRM', label: 'CRM' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'INTERNAL_OPS', label: 'Internal Ops' },
];

export const NEXT_STATUS_MAP = {
  OPEN: ['ACKNOWLEDGED', 'ESCALATED', 'REJECTED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'ESCALATED'],
  INVESTIGATING: ['PENDING_CUSTOMER', 'RESOLVED', 'REJECTED', 'ESCALATED'],
  PENDING_CUSTOMER: ['INVESTIGATING', 'RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  REJECTED: ['INVESTIGATING'],
  ESCALATED: ['INVESTIGATING', 'RESOLVED'],
  CLOSED: [],
};

export const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const SLA_MATRIX = {
  DELAY:               { CRITICAL: 2,  HIGH: 6,  MEDIUM: 12, LOW: 24 },
  MISSING_PACKAGE:     { CRITICAL: 2,  HIGH: 4,  MEDIUM: 12, LOW: 24 },
  DAMAGE:              { CRITICAL: 4,  HIGH: 8,  MEDIUM: 24, LOW: 48 },
  BILLING_ISSUE:       { CRITICAL: 8,  HIGH: 24, MEDIUM: 48, LOW: 72 },
  DOCUMENTATION_ISSUE: { CRITICAL: 4,  HIGH: 12, MEDIUM: 24, LOW: 48 },
};

export const OWNERS = [
  'Karthik Iyer', 'Meera Pillai', 'Rohan Das', 'Sana Sheikh', 'Vikram Nair',
];

// Nav items for all 21+ modules
export const NAV_MODULES = [
  { section: 'Core Operations' },
  { id: 'dashboard',      label: 'Ops Dashboard',       icon: 'LayoutDashboard' },
  { id: 'booking',        label: 'Cargo Booking',        icon: 'PackagePlus' },
  { id: 'milestone',      label: 'Milestone Tracking',   icon: 'MapPin' },
  { id: 'enquiry',        label: 'Customer Enquiry CRM', icon: 'MessageSquare' },
  { id: 'quotation',      label: 'Quotation Manager',    icon: 'FileText' },
  { section: 'Logistics' },
  { id: 'awb',            label: 'Airway Bill Tracker',  icon: 'Plane' },
  { id: 'pickup',         label: 'Airport Pickup',        icon: 'Truck' },
  { id: 'warehouse',      label: 'Warehouse Inventory',  icon: 'Warehouse' },
  { id: 'invoice',        label: 'Invoice Tracker',       icon: 'Receipt' },
  { id: 'delivery',       label: 'Delivery Proof',        icon: 'ClipboardCheck' },
  { section: 'Complaints & Claims' },
  { id: 'complaints',     label: 'Complaint & Claims',   icon: 'AlertTriangle', badge: true },
  { id: 'new-case',       label: 'New Complaint',         icon: 'FilePlus2' },
  { id: 'workflow',       label: 'Complaint Workflow',    icon: 'GitBranch' },
  { section: 'Management' },
  { id: 'agent',          label: 'Agent Portal',          icon: 'UserCog' },
  { id: 'rates',          label: 'Route Rate Manager',    icon: 'DollarSign' },
  { id: 'partners',       label: 'Partner Management',    icon: 'Users' },
  { id: 'airline',        label: 'Airline Rate Compare',  icon: 'BarChart2' },
  { section: 'AI Tools' },
  { id: 'ai-quotation',   label: 'AI Quotation Assist',  icon: 'Sparkles' },
  { id: 'ai-customs',     label: 'AI Customs/Docs',       icon: 'FileSearch' },
  { id: 'ai-insurance',   label: 'Insurance Claim AI',    icon: 'Shield' },
  { id: 'ai-route',       label: 'Route Suggestion AI',   icon: 'Navigation' },
  { id: 'cargo-cleaner',  label: 'Cargo Desc Cleaner',    icon: 'Wand2' },
  { section: 'Tools & Analytics' },
  { id: 'weight-calc',    label: 'Chargeable Weight Calc',icon: 'Scale' },
  { id: 'insights',       label: 'Shipment Insights',     icon: 'TrendingUp' },
  { id: 'reminders',      label: 'Reminders & Alerts',    icon: 'Bell' },
];

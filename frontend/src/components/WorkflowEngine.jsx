import { useState } from 'react';

const WORKFLOWS = {
  DELAY: {
    color: '#D9A23B', sla: 'CRITICAL=2h · HIGH=6h · MEDIUM=12h · LOW=24h',
    steps: [
      { n:1, title:'OPEN — Auto-priority assigned', desc:'If >48h delay → CRITICAL; >12h → HIGH; else MEDIUM. Confirmation email sent to customer.' },
      { n:2, title:'ACKNOWLEDGED — Ops confirms receipt', desc:'Assign to logistics ops team. Initial customer communication sent within 1h.' },
      { n:3, title:'INVESTIGATING — Contact airline & forwarder', desc:'Required: updated ETA and root cause within SLA window. Route delay factor checked via API.' },
      { n:4, title:'PENDING CUSTOMER or RESOLVED', desc:'If additional info needed → PENDING_CUSTOMER; else mark RESOLVED. Customer notified.' },
      { n:5, title:'CLOSED — Follow-up dispatched', desc:'CSAT survey sent 24h after resolution. Case archived.', done: true },
    ],
  },
  DAMAGE: {
    color: '#C23B3B', sla: 'CRITICAL=4h · HIGH=8h · MEDIUM=24h',
    steps: [
      { n:1, title:'OPEN — Request evidence immediately', desc:'Auto-email requesting damage photos + packing list. If claim >$5,000 → auto CRITICAL.' },
      { n:2, title:'INVESTIGATING — Warehouse inspection', desc:'Inspect cargo at warehouse. Cross-check packing standards. Survey report required.' },
      { n:3, title:'ESCALATED — Insurance claim initiated', desc:'If formal claim filed: notify insurance team, assess salvage value, issue survey.' },
      { n:4, title:'RESOLVED — Settlement or compensation', desc:'Resolution email with claim settlement breakdown. Credit note or replacement dispatched.', done: true },
    ],
  },
  MISSING_PACKAGE: {
    color: '#C23B3B', sla: 'Always CRITICAL — 2h first response',
    steps: [
      { n:1, title:'Immediate warehouse trace', desc:'Cross-check ULD breakdown, carrier manifest, and airline pallet roster at all transit stations.' },
      { n:2, title:'Airline cargo office notified', desc:'Tracer telex issued to all transit stations (origin, hub, destination). Priority handling requested.' },
      { n:3, title:'Customer updated every 2 hours', desc:'Proactive updates sent until resolution.' },
      { n:4, title:'Found → reroute | Not found → insurance', desc:'If located: priority reroute and expedite. If not found after 7 days: formal claim initiated.', done: true },
    ],
  },
  BILLING_ISSUE: {
    color: '#D9A23B', sla: 'HIGH=24h · MEDIUM=48h · LOW=72h',
    steps: [
      { n:1, title:'OPEN — Accounts team assigned', desc:'Pull original booking confirmation and contract rate card for reconciliation.' },
      { n:2, title:'INVESTIGATING — Invoice reconciliation', desc:'Compare invoice vs contract rates. Identify discrepancy and cause (fuel surcharge, weight diff, etc.).' },
      { n:3, title:'PENDING CUSTOMER (if applicable)', desc:'If customer needs to provide supporting docs (e.g. original PO), request and await.' },
      { n:4, title:'RESOLVED — Credit note or explanation', desc:'Corrected invoice or credit note issued within 48h. Explanation sent with breakdown.', done: true },
    ],
  },
  DOCUMENTATION_ISSUE: {
    color: '#8B6FD4', sla: 'Customs hold=4h · MEDIUM=24h',
    steps: [
      { n:1, title:'OPEN — Doc exec assigned', desc:'Documentation executive reviews AWB, manifest, customs paperwork, certificates.' },
      { n:2, title:'INVESTIGATING — Identify discrepancy', desc:'Find error type: wrong HS code, missing certificate, AWB mismatch, consignee details error.' },
      { n:3, title:'Reissue documents — Notify airline', desc:'Reissue corrected documents. File amendment with customs authority. Notify airline cargo office.' },
      { n:4, title:'RESOLVED — Clearance confirmed', desc:'Customs release or documentation correction confirmed. Customer notified.', done: true },
    ],
  },
};

const TABS = Object.keys(WORKFLOWS);
const LABELS = { DELAY:'Delay', DAMAGE:'Damage', MISSING_PACKAGE:'Missing Package', BILLING_ISSUE:'Billing Issue', DOCUMENTATION_ISSUE:'Documentation' };

export default function WorkflowEngine() {
  const [active, setActive] = useState('DELAY');
  const wf = WORKFLOWS[active];
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Complaint Workflow Engine</h1><p className="text-sm text-paper-100/55">Category-specific SLA rules, escalation paths, and required actions for each complaint type.</p></div>
      <div className="flex gap-1 bg-panel-700/50 rounded-lg p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={()=>setActive(t)} className={`flex-1 min-w-max px-3 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${active===t?'bg-panel-600 text-paper-100':'text-paper-100/50 hover:text-paper-100/80'}`} style={active===t?{color:wf.color}:{}}>{LABELS[t]}</button>
        ))}
      </div>
      <div className="mb-4 px-4 py-2.5 rounded-lg border text-xs font-semibold" style={{borderColor:`${wf.color}40`,background:`${wf.color}12`,color:wf.color}}>
        ⏱ SLA: {wf.sla}
      </div>
      <ul className="space-y-0">
        {wf.steps.map((step, i) => (
          <li key={i} className="flex gap-4 relative">
            {i < wf.steps.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-panel-600/60" />}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 z-10" style={{ background: step.done ? wf.color : 'var(--color-panel-600)', color: step.done ? '#0B1320' : 'var(--color-paper-100)' }}>
              {step.done ? '✓' : step.n}
            </div>
            <div className="flex-1 pb-6">
              <div className="font-semibold text-paper-100 text-sm mb-1">{step.title}</div>
              <div className="text-xs text-paper-100/60 leading-relaxed">{step.desc}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

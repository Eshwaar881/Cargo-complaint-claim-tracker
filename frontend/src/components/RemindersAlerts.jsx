import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, Mail, DollarSign } from 'lucide-react';
import { api } from '../lib/api';

const RULES = [
  { icon: AlertTriangle, color: '#C23B3B', title: 'SLA Breach Alert', desc: 'Auto-escalate + email Ops Manager when any case breaches SLA', active: true },
  { icon: Clock, color: '#D9A23B', title: 'SLA Warning — 2h Before', desc: 'Notify assigned agent when 2h remain on SLA window', active: true },
  { icon: CheckCircle2, color: '#3FA796', title: 'Resolution Confirmation', desc: 'Email customer when case resolved; include CSAT survey link', active: true },
  { icon: Mail, color: '#D4742F', title: 'Weekly Summary Digest', desc: 'Email ops team every Monday 9:00 AM with open case summary', active: true },
  { icon: DollarSign, color: '#8B6FD4', title: 'Overdue Invoice Alert', desc: 'Notify accounts when invoice passes due date', active: true },
  { icon: Bell, color: '#5B8DEF', title: 'New CRITICAL Case', desc: 'Instant SMS + email to Ops Manager when CRITICAL case created', active: false },
];

const LOG = [
  { type:'breach', color:'#C23B3B', title:'SLA breached — CCT-2026-000009', sub:'Escalated to Ops Manager · Jun 26, 08:45 · SENT' },
  { type:'warn',   color:'#D9A23B', title:'SLA warning — CCT-2026-000011',  sub:'Notified Meera Pillai · Jun 26, 09:15 · SENT' },
  { type:'res',    color:'#3FA796', title:'Resolution email — CCT-2026-000005', sub:'Sent to JSW Steel · Jun 25, 16:30 · SENT' },
  { type:'conf',   color:'#D4742F', title:'Confirmation — CCT-2026-000012',  sub:'Auto-confirm to BMW Group · Jun 26, 07:00 · SENT' },
  { type:'inv',    color:'#8B6FD4', title:'Invoice overdue — INV-2026-0188', sub:'Notified Accounts · Jun 20, 09:00 · SENT' },
];

export default function RemindersAlerts() {
  const [rules, setRules] = useState(RULES);
  const [caseRef, setCaseRef] = useState('');
  const [msg, setMsg] = useState('');

  const toggle = (i) => setRules(r => r.map((x, j) => j === i ? { ...x, active: !x.active } : x));

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Reminders & Automated Alerts</h1><p className="text-sm text-paper-100/55">Configure alert rules and view notification history.</p></div>
        <button onClick={()=>alert('Add custom rule')} className="px-4 py-2 rounded-lg bg-cargo-orange text-tower-900 text-sm font-bold hover:bg-cargo-orange-soft transition-colors">+ Add Rule</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-bold text-paper-100/40 uppercase tracking-wider mb-3">Alert Rules</div>
          <div className="space-y-2">
            {rules.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className="flex items-center gap-3 bg-panel-700/60 border border-panel-600/40 rounded-xl p-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}20` }}>
                    <Icon size={16} style={{ color: r.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-paper-100">{r.title}</div>
                    <div className="text-[11px] text-paper-100/50 truncate">{r.desc}</div>
                  </div>
                  <button onClick={() => toggle(i)} className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${r.active ? 'bg-resolved-teal' : 'bg-panel-600'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${r.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-paper-100/40 uppercase tracking-wider mb-3">Recent Notifications</div>
          <div className="space-y-2 mb-6">
            {LOG.map((l, i) => (
              <div key={i} className="flex gap-3 bg-panel-700/60 border border-panel-600/40 rounded-xl p-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: l.color }} />
                <div><div className="text-sm text-paper-100 font-medium">{l.title}</div><div className="text-[11px] text-paper-100/50 mt-0.5">{l.sub}</div></div>
              </div>
            ))}
          </div>
          <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-4">
            <div className="text-xs font-bold text-paper-100/40 uppercase tracking-wider mb-3">Send Manual Reminder</div>
            <div className="space-y-3">
              <input value={caseRef} onChange={e=>setCaseRef(e.target.value)} placeholder="Case ref e.g. CCT-2026-000012" className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60" />
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Reminder message to customer..." rows={3} className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60 resize-none" />
              <button onClick={()=>alert(`Reminder sent for ${caseRef || 'case'}!`)} className="px-4 py-2 rounded-lg bg-cargo-orange text-tower-900 text-sm font-bold hover:bg-cargo-orange-soft transition-colors">Send Reminder</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

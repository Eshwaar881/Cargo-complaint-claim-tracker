import { useEffect, useState, useCallback } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, STATUSES, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../lib/constants';
import ComplaintDetail from './ComplaintDetail';
import { motion, AnimatePresence } from 'framer-motion';

function timeLeft(slaDueAt, status) {
  if (!slaDueAt || ['RESOLVED','REJECTED','CLOSED'].includes(status)) return null;
  const ms = new Date(slaDueAt).getTime() - Date.now();
  if (ms <= 0) return { label: '⚠ BREACHED', color: '#C23B3B', breached: true };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const label = h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  const color = h < 2 ? '#D9A23B' : '#3FA796';
  return { label, color, breached: false };
}

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [{ complaints }, statsData] = await Promise.all([api.listComplaints(filters), api.getStats()]);
      setComplaints(complaints); setStats(statsData);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Complaint &amp; Claim Tracker</h1>
          <p className="text-sm text-paper-100/55">Admin view — all cases with priority, SLA countdown, action history.</p>
        </div>
        {stats?.slaBreached > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-breach-red/15 text-breach-red text-xs font-semibold">
            <AlertTriangle size={13} />
            {stats.slaBreached} SLA breach{stats.slaBreached !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-100/40" />
          <input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Search ref, AWB, name…" className="w-full bg-panel-700/60 border border-panel-600/40 rounded-lg pl-8 pr-3 py-2 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60" />
        </div>
        {[['status','All statuses', STATUSES.map(s=>({v:s,l:STATUS_LABELS[s]}))],
          ['category','All categories', CATEGORIES.map(c=>({v:c.value,l:c.label}))],
          ['priority','All priorities', ['CRITICAL','HIGH','MEDIUM','LOW'].map(p=>({v:p,l:p}))]
        ].map(([key, placeholder, opts]) => (
          <select key={key} value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))} className="bg-panel-700/60 border border-panel-600/40 rounded-lg px-3 py-2 text-sm text-paper-100 outline-none focus:border-cargo-orange/60">
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
      </div>

      {error && <div className="bg-breach-red/10 border border-breach-red/30 text-breach-red text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-panel-700/40 rounded-xl border border-panel-600/30 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-panel-600/40">
              {['Ref #','Category','Priority','Status','Raised By','Owner','SLA','Claim','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-paper-100/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length:5}).map((_,i) => (
                <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-5 rounded bg-panel-700/50 animate-pulse" /></td></tr>
              ))
            ) : complaints.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-paper-100/40 text-sm">No cases match these filters.</td></tr>
            ) : complaints.map((c) => {
              const sla = timeLeft(c.sla_due_at, c.status);
              const pc = PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.MEDIUM;
              const sc = STATUS_COLORS[c.status] || '#6B7280';
              return (
                <motion.tr key={c.id} initial={{opacity:0}} animate={{opacity:1}} className="border-b border-panel-600/20 hover:bg-panel-700/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-paper-100/70">{c.reference_code}</td>
                  <td className="px-4 py-3 text-sm">{c.category.replace('_',' ')}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{color:pc.text,background:pc.bg}}>{c.priority}</span></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{color:sc,background:`${sc}22`}}>{STATUS_LABELS[c.status]}</span></td>
                  <td className="px-4 py-3 text-sm text-paper-100/80">{c.raised_by_name}</td>
                  <td className="px-4 py-3 text-sm text-paper-100/60">{c.owner_name || <span className="italic text-paper-100/35">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-[12px]" style={{color: sla?.color || '#6B7280'}}>{sla?.label || (c.resolved_at ? 'Resolved' : '—')}</td>
                  <td className="px-4 py-3 text-sm">{c.is_claim ? <span className="text-cargo-orange font-medium">{c.claim_currency} {c.claim_amount?.toLocaleString()}</span> : <span className="text-paper-100/30">—</span>}</td>
                  <td className="px-4 py-3"><button onClick={() => setSelectedId(c.id)} className="px-3 py-1 rounded-lg text-xs font-semibold border border-panel-600/60 text-paper-100/70 hover:border-cargo-orange hover:text-cargo-orange transition-colors">Manage</button></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedId && <ComplaintDetail id={selectedId} onClose={() => setSelectedId(null)} onUpdated={load} />}
      </AnimatePresence>
    </div>
  );
}

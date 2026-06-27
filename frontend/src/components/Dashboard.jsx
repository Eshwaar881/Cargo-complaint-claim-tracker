import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, STATUSES, STATUS_LABELS } from '../lib/constants';
import RadarStatusRing from './RadarStatusRing';
import ComplaintTicket from './ComplaintTicket';
import ComplaintDetail from './ComplaintDetail';

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ complaints }, statsData] = await Promise.all([
        api.listComplaints(filters),
        api.getStats(),
      ]);
      setComplaints(complaints);
      setStats(statsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <RadarStatusRing byPriority={stats?.byPriority || []} total={stats?.total || 0} />
          <div>
            <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Operations Dashboard</h1>
            <p className="text-sm text-paper-100/55">Complaint &amp; claim tracking across delay, damage, missing package, billing, and documentation cases.</p>
            {stats?.slaBreached > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-breach-red/15 text-breach-red text-xs font-semibold"
              >
                <AlertTriangle size={13} />
                {stats.slaBreached} case{stats.slaBreached !== 1 ? 's' : ''} past SLA
              </motion.div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(stats?.byCategory || []).map((c) => (
            <div key={c.category} className="bg-panel-700/60 rounded-lg px-3 py-2 border border-panel-600/40">
              <div className="font-mono text-lg font-semibold text-paper-100">{c.count}</div>
              <div className="text-[11px] text-paper-100/50 truncate">{c.category.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-100/40" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search reference, AWB, name..."
            className="w-full bg-panel-700/60 border border-panel-600/40 rounded-lg pl-9 pr-3 py-2 text-sm text-paper-100 placeholder:text-paper-100/35 focus:border-cargo-orange/60 outline-none transition-colors"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="bg-panel-700/60 border border-panel-600/40 rounded-lg px-3 py-2 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          className="bg-panel-700/60 border border-panel-600/40 rounded-lg px-3 py-2 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-breach-red/10 border border-breach-red/30 text-breach-red text-sm rounded-lg px-4 py-3 mb-6">
          Couldn't load cases: {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-panel-700/40 animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 text-paper-100/45">
          <p className="font-display text-lg mb-1">No cases match these filters</p>
          <p className="text-sm">Try clearing a filter, or report a new case from the left.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {complaints.map((c, i) => (
              <ComplaintTicket key={c.id} complaint={c} index={i} onClick={() => setSelectedId(c.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <ComplaintDetail
            id={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdated={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

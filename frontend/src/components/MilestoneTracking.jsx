import { useState } from 'react';
import { api } from '../lib/api';
import { Search } from 'lucide-react';

const MILESTONES = [
  { status: 'DELIVERED', label: 'Delivered to Consignee', done: true },
  { status: 'CUSTOMS', label: 'Customs Cleared at Destination', done: true },
  { status: 'ARRIVED', label: 'Arrived at Destination Airport (FRA)', done: true },
  { status: 'IN_TRANSIT', label: 'In Transit — Hub Transfer (DXB)', done: true },
  { status: 'BOOKED', label: 'Departed Origin (BOM) · AI101', done: true },
];

export default function MilestoneTracking() {
  const [query, setQuery] = useState('');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.searchShipments(query);
      setShipment(data.shipments?.[0] || null);
    } catch { setShipment(null); }
    finally { setLoading(false); setSearched(true); }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Milestone Tracking Portal</h1><p className="text-sm text-paper-100/55">Track real-time shipment milestones by AWB number.</p></div>
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-100/40" /><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Enter AWB number e.g. 098-44710023" className="w-full bg-panel-700/60 border border-panel-600/40 rounded-lg pl-9 pr-3 py-2.5 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60" /></div>
        <button onClick={search} disabled={loading} className="px-4 py-2.5 rounded-lg bg-cargo-orange text-tower-900 font-bold text-sm hover:bg-cargo-orange-soft transition-colors disabled:opacity-60">{loading ? 'Searching…' : 'Track'}</button>
      </div>
      {searched && !shipment && <div className="text-center py-10 text-paper-100/40 text-sm">No shipment found for "{query}". Try a seeded AWB from the database.</div>}
      {shipment && (
        <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div><div className="font-mono text-sm text-paper-100/60 mb-0.5">AWB {shipment.awb_number}</div><div className="font-display font-bold text-paper-100 text-lg">{shipment.shipper_name} → {shipment.consignee_name}</div></div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cargo-orange/15 text-cargo-orange">{shipment.milestone_status}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><div className="text-[11px] text-paper-100/40 uppercase tracking-wider mb-0.5">Route</div><div>{shipment.origin_code} → {shipment.dest_code}</div></div>
            <div><div className="text-[11px] text-paper-100/40 uppercase tracking-wider mb-0.5">Commodity</div><div>{shipment.commodity || '—'}</div></div>
            <div><div className="text-[11px] text-paper-100/40 uppercase tracking-wider mb-0.5">Weight</div><div>{shipment.gross_weight_kg} kg actual / {shipment.chargeable_weight_kg} kg chargeable</div></div>
            <div><div className="text-[11px] text-paper-100/40 uppercase tracking-wider mb-0.5">ETA</div><div>{shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '—'}</div></div>
          </div>
          <div className="text-[11px] font-bold text-paper-100/40 uppercase tracking-wider mb-3">Milestone History</div>
          <ul className="space-y-3">
            {MILESTONES.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 ${m.done ? 'bg-resolved-teal text-white' : 'bg-panel-700/50 text-paper-100/30'}`}>{m.done ? '✓' : '○'}</div>
                <div className="text-sm text-paper-100/80">{m.label}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'framer-motion';
import {
  X, Sparkles, Mail, UserCog, ArrowRightCircle, CheckCircle2,
  AlertCircle, MessageSquarePlus, Clock,
} from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../lib/constants';

const NEXT_STATUS_MAP = {
  OPEN: ['ACKNOWLEDGED', 'ESCALATED', 'REJECTED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'ESCALATED'],
  INVESTIGATING: ['PENDING_CUSTOMER', 'RESOLVED', 'REJECTED', 'ESCALATED'],
  PENDING_CUSTOMER: ['INVESTIGATING', 'RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  REJECTED: ['INVESTIGATING'],
  ESCALATED: ['INVESTIGATING', 'RESOLVED'],
  CLOSED: [],
};

const EVENT_ICONS = {
  CREATED: MessageSquarePlus,
  STATUS_CHANGE: ArrowRightCircle,
  PRIORITY_CHANGE: AlertCircle,
  OWNER_CHANGE: UserCog,
  NOTE_ADDED: MessageSquarePlus,
  AI_TRIAGE: Sparkles,
  REMINDER_SENT: Clock,
  EMAIL_SENT: Mail,
  SLA_BREACHED: AlertCircle,
  RESOLVED: CheckCircle2,
  REOPENED: ArrowRightCircle,
};

const OWNERS = ['Karthik Iyer', 'Meera Pillai', 'Rohan Das', 'Sana Sheikh', 'Vikram Nair'];

export default function ComplaintDetail({ id, onClose, onUpdated }) {
  const { user, role } = useAuth();
  const actorName = role === 'manager' ? 'Manager (PSM)' : (user?.displayName || user?.email || 'Customer');
  const isManager = role === 'manager';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getComplaint(id);
    setData(res);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const refreshAll = async () => {
    await load();
    onUpdated?.();
  };

  const handleStatus = async (status) => {
    setBusy(true);
    try {
      await api.updateStatus(id, status, actorName);
      await refreshAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (ownerName) => {
    setBusy(true);
    try {
      await api.assignOwner(id, ownerName, actorName);
      await refreshAll();
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await api.addNote(id, note, actorName);
      setNote('');
      await refreshAll();
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-tower-800 border border-panel-600/60 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl"
      >
        {loading || !data ? (
          <div className="p-10 text-center text-paper-100/50">Loading case...</div>
        ) : (
          <>
            <div className="sticky top-0 bg-tower-800 border-b border-panel-600/50 px-6 py-4 flex items-start justify-between gap-4 z-10">
              <div>
                <div className="font-mono text-xs text-paper-100/50 mb-1">{data.complaint.reference_code}</div>
                <h2 className="font-display text-lg font-bold text-paper-100">{CATEGORY_LABELS[data.complaint.category]}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-panel-700 text-paper-100/60 hover:text-paper-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge label={STATUS_LABELS[data.complaint.status]} color={STATUS_COLORS[data.complaint.status]} />
                <Badge
                  label={`${data.complaint.priority} priority`}
                  color={PRIORITY_COLORS[data.complaint.priority]?.text}
                />
                {data.complaint.is_claim ? (
                  <Badge label={`Claim: ${data.complaint.claim_currency} ${data.complaint.claim_amount}`} color="#9B7FD4" />
                ) : null}
              </div>

              <p className="text-sm text-paper-100/85 leading-relaxed bg-panel-700/40 rounded-lg p-4 border border-panel-600/30">
                {data.complaint.description}
              </p>

              {data.complaint.ai_summary && (
                <div className="bg-cargo-orange/10 border border-cargo-orange/25 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={14} className="text-cargo-orange" />
                    <span className="text-xs font-semibold text-cargo-orange uppercase tracking-wide">Triage Summary</span>
                  </div>
                  <p className="text-sm text-paper-100/85 mb-2">{data.complaint.ai_summary}</p>
                  <p className="text-xs text-paper-100/60"><strong>Recommended next step:</strong> {data.complaint.ai_recommendation}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Raised by" value={`${data.complaint.raised_by_name}`} sub={data.complaint.raised_by_email} />
                <Field label="AWB" value={data.complaint.awb_number || '—'} mono />
                <Field label="Source" value={data.complaint.source.replace('_', ' ')} />
                <Field label="SLA due" value={data.complaint.sla_due_at ? new Date(data.complaint.sla_due_at).toLocaleString() : '—'} />
              </div>

              <div>
                <div className="text-xs font-semibold text-paper-100/50 uppercase tracking-wide mb-2">Assign owner</div>
              {!isManager && <p className="text-xs text-paper-100/40 italic">Only managers can assign owners.</p>}
                {isManager && (
                <div className="flex flex-wrap gap-2">
                  {OWNERS.map((o) => (
                    <button
                      key={o}
                      disabled={busy}
                      onClick={() => handleAssign(o)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        data.complaint.owner_name === o
                          ? 'bg-cargo-orange text-tower-900 border-cargo-orange'
                          : 'bg-panel-700/50 border-panel-600/50 text-paper-100/70 hover:border-cargo-orange/50'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                )}
              </div>

              {isManager && (
              <div>
                <div className="text-xs font-semibold text-paper-100/50 uppercase tracking-wide mb-2">Move to</div>
                <div className="flex flex-wrap gap-2">
                  {(NEXT_STATUS_MAP[data.complaint.status] || []).map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      onClick={() => handleStatus(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-panel-700 border border-panel-600/60 text-paper-100 hover:border-cargo-orange hover:text-cargo-orange transition-colors disabled:opacity-50"
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                  {(NEXT_STATUS_MAP[data.complaint.status] || []).length === 0 && (
                    <span className="text-xs text-paper-100/40 italic">Terminal status — no further transitions.</span>
                  )}
                </div>
              </div>
              )}

              <div>
                <div className="text-xs font-semibold text-paper-100/50 uppercase tracking-wide mb-2">Add note</div>
                <div className="flex gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add an internal note..."
                    className="flex-1 bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={busy || !note.trim()}
                    className="px-4 py-2 rounded-lg bg-cargo-orange text-tower-900 text-sm font-semibold disabled:opacity-40 hover:bg-cargo-orange-soft transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-paper-100/50 uppercase tracking-wide mb-3">Action history</div>
                <div className="space-y-3">
                  {data.events.map((ev) => {
                    const Icon = EVENT_ICONS[ev.event_type] || MessageSquarePlus;
                    return (
                      <div key={ev.id} className="flex gap-3 text-sm">
                        <div className="w-7 h-7 rounded-full bg-panel-700 border border-panel-600/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon size={13} className="text-paper-100/60" />
                        </div>
                        <div className="flex-1">
                          <div className="text-paper-100/85">{ev.detail}</div>
                          <div className="text-[11px] text-paper-100/40 mt-0.5">
                            {ev.actor_name} · {new Date(ev.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function Badge({ label, color }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, backgroundColor: `${color}22` }}
    >
      {label}
    </span>
  );
}

function Field({ label, value, sub, mono }) {
  return (
    <div>
      <div className="text-[11px] text-paper-100/45 uppercase tracking-wide mb-0.5">{label}</div>
      <div className={`text-paper-100/85 ${mono ? 'font-mono text-sm' : 'text-sm font-medium'}`}>{value}</div>
      {sub && <div className="text-[11px] text-paper-100/40">{sub}</div>}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, SOURCES } from '../lib/constants';
import { useAuth } from '../lib/AuthContext';

const initialForm = {
  category: 'DELAY',
  description: '',
  awbNumber: '',
  isClaim: false,
  claimAmount: '',
  claimCurrency: 'USD',
  source: 'CUSTOMER_PORTAL',
  raisedByName: '',
  raisedByEmail: '',
};

export default function NewCaseForm({ onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        raisedByName: f.raisedByName || user.name || user.displayName || '',
        raisedByEmail: f.raisedByEmail || user.email || '',
      }));
    }
  }, [user]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        claimAmount: form.isClaim ? Number(form.claimAmount) || 0 : undefined,
      };
      const res = await api.createComplaint(payload);
      setResult(res);
      onCreated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startNew = () => {
    setForm(initialForm);
    setResult(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Report a Cargo Issue</h1>
      <p className="text-sm text-paper-100/55 mb-8">
        Submit a delay, damage, missing package, billing, or documentation case. We'll auto-assign priority and an SLA window, and triage it immediately.
      </p>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-paper-100 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-2 text-resolved-teal mb-3">
              <CheckCircle2 size={20} />
              <span className="font-display font-semibold">Case logged successfully</span>
            </div>
            <p className="text-sm text-tower-900/70 mb-4">
              Reference code <span className="font-mono font-semibold text-tower-900">{result.complaint.reference_code}</span> ·
              Priority <span className="font-semibold">{result.complaint.priority}</span>
            </p>

            <div className="bg-cargo-orange/10 border border-cargo-orange/25 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={14} className="text-cargo-orange" />
                <span className="text-xs font-semibold text-cargo-orange uppercase tracking-wide">
                  {result.triage.source === 'AI' ? 'AI Triage' : 'Automated Triage'}
                </span>
              </div>
              <p className="text-sm text-tower-900/80 mb-1">{result.triage.summary}</p>
              <p className="text-xs text-tower-900/60"><strong>Next step:</strong> {result.triage.recommendation}</p>
            </div>

            <p className="text-xs text-tower-900/50 mb-5">
              Confirmation email to {form.raisedByEmail}: {' '}
              <span className={result.notification.status === 'SENT' ? 'text-resolved-teal font-medium' : 'text-warn-amber font-medium'}>
                {result.notification.status === 'SENT' ? 'sent' : `logged (${result.notification.reason || 'not delivered'})`}
              </span>
            </p>

            <button
              onClick={startNew}
              className="px-4 py-2 rounded-lg bg-tower-900 text-paper-100 text-sm font-semibold hover:bg-tower-800 transition-colors"
            >
              Report another case
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div>
              <Label>Category</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => update('category', c.value)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left ${
                      form.category === c.value
                        ? 'bg-cargo-orange text-tower-900 border-cargo-orange'
                        : 'bg-panel-700/50 border-panel-600/50 text-paper-100/75 hover:border-cargo-orange/50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                required
                minLength={5}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe what happened in detail..."
                rows={4}
                className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>AWB Number (optional)</Label>
                <input
                  value={form.awbNumber}
                  onChange={(e) => update('awbNumber', e.target.value)}
                  placeholder="e.g. 098-4471 0023"
                  className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm font-mono text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60"
                />
              </div>
              <div>
                <Label>Source</Label>
                <select
                  value={form.source}
                  onChange={(e) => update('source', e.target.value)}
                  className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
                >
                  {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="isClaim"
                checked={form.isClaim}
                onChange={(e) => update('isClaim', e.target.checked)}
                className="w-4 h-4 rounded accent-cargo-orange"
              />
              <label htmlFor="isClaim" className="text-sm text-paper-100/80">This is a formal monetary claim</label>
            </div>

            {form.isClaim && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Claim amount</Label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.claimAmount}
                    onChange={(e) => update('claimAmount', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <select
                    value={form.claimCurrency}
                    onChange={(e) => update('claimCurrency', e.target.value)}
                    className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
                  >
                    {['USD', 'EUR', 'GBP', 'INR', 'AED'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Your name</Label>
                <input
                  required
                  value={form.raisedByName}
                  onChange={(e) => update('raisedByName', e.target.value)}
                  className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
                />
              </div>
              <div>
                <Label>Your email</Label>
                <input
                  required
                  type="email"
                  value={form.raisedByEmail}
                  onChange={(e) => update('raisedByEmail', e.target.value)}
                  className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
                />
              </div>
            </div>

            {error && (
              <div className="bg-breach-red/10 border border-breach-red/30 text-breach-red text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cargo-orange text-tower-900 font-display font-semibold hover:bg-cargo-orange-soft transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ children }) {
  return <div className="text-xs font-semibold text-paper-100/60 uppercase tracking-wide mb-1.5">{children}</div>;
}

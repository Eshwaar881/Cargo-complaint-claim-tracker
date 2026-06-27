import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function WeightCalculator() {
  const [form, setForm] = useState({ lengthCm: '', widthCm: '', heightCm: '', actualWeightKg: '', pieces: '1' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleCalculate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.calculateChargeableWeight({
        lengthCm: Number(form.lengthCm),
        widthCm: Number(form.widthCm),
        heightCm: Number(form.heightCm),
        actualWeightKg: Number(form.actualWeightKg),
        pieces: Number(form.pieces) || 1,
      });
      setResult(res);
    } catch (e) {
      setError(e.message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <Scale size={20} className="text-cargo-orange" />
        <h1 className="font-display text-2xl font-bold text-paper-100">Chargeable Weight Calculator</h1>
      </div>
      <p className="text-sm text-paper-100/55 mb-8">
        IATA standard: chargeable weight is the greater of actual gross weight and volumetric weight (L×W×H ÷ 6000 per piece). Used to validate billing and damage claims against shipment data.
      </p>

      <form onSubmit={handleCalculate} className="bg-panel-700/40 border border-panel-600/40 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Length (cm)" value={form.lengthCm} onChange={(v) => update('lengthCm', v)} />
          <NumberField label="Width (cm)" value={form.widthCm} onChange={(v) => update('widthCm', v)} />
          <NumberField label="Height (cm)" value={form.heightCm} onChange={(v) => update('heightCm', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Actual weight (kg)" value={form.actualWeightKg} onChange={(v) => update('actualWeightKg', v)} />
          <NumberField label="Pieces" value={form.pieces} onChange={(v) => update('pieces', v)} />
        </div>

        {error && <div className="text-breach-red text-sm">{error}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cargo-orange text-tower-900 font-semibold text-sm hover:bg-cargo-orange-soft transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Scale size={15} />}
          Calculate
        </button>
      </form>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-5 bg-paper-100 rounded-xl p-5 shadow-lg"
        >
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Stat label="Actual weight" value={`${result.actualWeightKg} kg`} />
            <Stat label="Volumetric weight" value={`${result.volumetricWeightKg} kg`} />
          </div>
          <div className="border-t border-tower-900/10 pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-tower-900/50 uppercase tracking-wide">Chargeable weight</div>
              <div className="font-display text-2xl font-bold text-tower-900">{result.chargeableWeightKg} kg</div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-cargo-orange/15 text-cargo-orange text-xs font-semibold">
              billed on {result.basis === 'VOLUMETRIC' ? 'volume' : 'actual weight'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-paper-100/55 uppercase tracking-wide block mb-1">{label}</label>
      <input
        type="number" min="0" step="0.01" required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-panel-700/60 border border-panel-600/50 rounded-lg px-3 py-2 text-sm text-paper-100 outline-none focus:border-cargo-orange/60"
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-tower-900/50 uppercase tracking-wide">{label}</div>
      <div className="font-mono text-lg font-semibold text-tower-900">{value}</div>
    </div>
  );
}

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

const COMMODITIES = ['General Cargo','Perishables','Dangerous Goods (DG)','Live Animals','Pharmaceuticals (GDP)','Valuables / High-Value','Automotive Parts','Electronics'];
const SERVICE_TYPES = ['Economy (5–7 days)','Express (3–5 days)','Priority (1–2 days)'];

const init = {
  shipperName:'', shipperAddress:'', originCode:'', consigneeName:'', consigneeAddress:'', destCode:'',
  commodity:'General Cargo', pieces:1, grossWeight:'', lengthCm:'', widthCm:'', heightCm:'',
  serviceType:'Economy (5–7 days)', preferredDate:'', specialInstructions:'',
};

export default function CargoBooking() {
  const [form, setForm] = useState(init);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const vol = (form.lengthCm * form.widthCm * form.heightCm * (form.pieces || 1)) / 1_000_000;
  const volKg = (vol * 167).toFixed(1);
  const chargeableKg = Math.max(Number(form.grossWeight) * (form.pieces || 1), vol * 167).toFixed(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const payload = {
        awb_number: `TMP-${Date.now()}`,
        origin_code: form.originCode.toUpperCase(),
        dest_code: form.destCode.toUpperCase(),
        shipper_name: form.shipperName,
        consignee_name: form.consigneeName,
        commodity: form.commodity,
        pieces: Number(form.pieces),
        gross_weight_kg: Number(form.grossWeight),
        length_cm: Number(form.lengthCm) || null,
        width_cm:  Number(form.widthCm)  || null,
        height_cm: Number(form.heightCm) || null,
        chargeable_weight_kg: Number(chargeableKg),
        milestone_status: 'BOOKED',
        eta: form.preferredDate || null,
      };
      const data = await api.createShipment(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="bg-paper-100 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-resolved-teal mb-3">
          <CheckCircle2 size={20} />
          <span className="font-display font-semibold text-tower-900">Booking created successfully</span>
        </div>
        <p className="text-sm text-tower-900/70 mb-4">
          AWB <span className="font-mono font-semibold text-tower-900">{result.shipment?.awb_number}</span> ·{' '}
          {form.originCode.toUpperCase()} → {form.destCode.toUpperCase()} · {chargeableKg} kg chargeable
        </p>
        <button className="btn-primary px-4 py-2 rounded-lg bg-tower-900 text-paper-100 text-sm font-semibold" onClick={() => { setResult(null); setForm(init); }}>
          Book another shipment
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Cargo Booking Form</h1>
        <p className="text-sm text-paper-100/55">Create a new cargo booking and generate an Airway Bill.</p>
      </div>
      {error && <div className="mb-4 bg-breach-red/10 border border-breach-red/30 text-breach-red text-sm rounded-lg px-4 py-3">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipper */}
          <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-paper-100">Shipper Details</h2>
            <Field label="Shipper / Exporter Name" required><input required className="field" value={form.shipperName} onChange={e=>set('shipperName',e.target.value)} placeholder="e.g. Tata Steel Ltd" /></Field>
            <Field label="Shipper Address"><textarea className="field resize-none" rows={2} value={form.shipperAddress} onChange={e=>set('shipperAddress',e.target.value)} placeholder="Full address..." /></Field>
            <Field label="Origin Airport (IATA)" required><input required maxLength={3} className="field font-mono uppercase" value={form.originCode} onChange={e=>set('originCode',e.target.value)} placeholder="BOM" /></Field>
          </div>
          {/* Consignee */}
          <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-paper-100">Consignee Details</h2>
            <Field label="Consignee / Importer Name" required><input required className="field" value={form.consigneeName} onChange={e=>set('consigneeName',e.target.value)} placeholder="e.g. BMW Group GmbH" /></Field>
            <Field label="Consignee Address"><textarea className="field resize-none" rows={2} value={form.consigneeAddress} onChange={e=>set('consigneeAddress',e.target.value)} placeholder="Full address..." /></Field>
            <Field label="Destination Airport (IATA)" required><input required maxLength={3} className="field font-mono uppercase" value={form.destCode} onChange={e=>set('destCode',e.target.value)} placeholder="FRA" /></Field>
          </div>
          {/* Cargo Details */}
          <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5 space-y-4 md:col-span-2">
            <h2 className="font-display font-semibold text-paper-100">Cargo Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Commodity"><select className="field" value={form.commodity} onChange={e=>set('commodity',e.target.value)}>{COMMODITIES.map(c=><option key={c}>{c}</option>)}</select></Field>
              <Field label="No. of Pieces"><input type="number" min={1} className="field" value={form.pieces} onChange={e=>set('pieces',e.target.value)} /></Field>
              <Field label="Gross Weight (kg)" required><input required type="number" min={0.1} step={0.1} className="field" value={form.grossWeight} onChange={e=>set('grossWeight',e.target.value)} placeholder="100" /></Field>
              <div className="bg-panel-700/60 rounded-lg p-3 text-center">
                <div className="text-[11px] text-paper-100/50 mb-1">Chargeable Weight</div>
                <div className="font-mono font-bold text-cargo-orange text-lg">{chargeableKg} kg</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Length (cm)"><input type="number" min={0} className="field" value={form.lengthCm} onChange={e=>set('lengthCm',e.target.value)} placeholder="60" /></Field>
              <Field label="Width (cm)"><input type="number" min={0} className="field" value={form.widthCm} onChange={e=>set('widthCm',e.target.value)} placeholder="40" /></Field>
              <Field label="Height (cm)"><input type="number" min={0} className="field" value={form.heightCm} onChange={e=>set('heightCm',e.target.value)} placeholder="30" /></Field>
            </div>
            {vol > 0 && <p className="text-xs text-paper-100/50">Volume: {vol.toFixed(4)} CBM · Volumetric weight (air): {volKg} kg · Chargeable = max(gross, volumetric)</p>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Service Type"><select className="field" value={form.serviceType} onChange={e=>set('serviceType',e.target.value)}>{SERVICE_TYPES.map(s=><option key={s}>{s}</option>)}</select></Field>
              <Field label="Preferred Departure Date"><input type="date" className="field" value={form.preferredDate} onChange={e=>set('preferredDate',e.target.value)} /></Field>
            </div>
            <Field label="Special Instructions"><textarea className="field resize-none" rows={2} value={form.specialInstructions} onChange={e=>set('specialInstructions',e.target.value)} placeholder="Temperature requirements, fragile items, DG details..." /></Field>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-cargo-orange text-tower-900 font-bold text-sm hover:bg-cargo-orange-soft transition-colors disabled:opacity-60">
            {submitting ? 'Creating Booking…' : 'Create Booking & Generate AWB'}
          </button>
        </div>
      </form>
    </div>
  );
}
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-paper-100/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-breach-red ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

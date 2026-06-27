import { useState } from 'react';
import { Wand2, Loader2, Copy, CheckCircle2 } from 'lucide-react';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const EXAMPLES = [
  'car stuff + some metal bits and bolts for fixing machines',
  'medicine tablets and capsules in bottles, needs cold',
  '10 boxes electronics stuff - phones chargers cables etc.',
  'machine parts for airplane engines, various metals',
];

export default function CargoDescCleaner() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const clean = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: `You are an IATA air cargo documentation expert. When given a raw cargo description, return ONLY valid JSON (no markdown fences) with this shape:
{
  "cleaned": "<standardized 1-2 line IATA/customs-compliant cargo description>",
  "hsCode": "<most likely 6-digit HS code>",
  "hsDesc": "<official HS code description>",
  "dgClass": "<IATA DG class or 'Non-DG'>",
  "specialHandling": ["<any special handling codes, e.g. PER, PIL, AVI, VAL, or empty array>"],
  "notes": "<any compliance notes or flags>"
}`,
          messages: [{ role: 'user', content: `Clean this cargo description: "${input.trim()}"` }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'API error');
      const text = data.content?.find((c) => c.type === 'text')?.text || '{}';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setResult(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result?.cleaned || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Cargo Description Cleaner</h1>
        <p className="text-sm text-paper-100/55">Paste a raw or informal cargo description — AI standardizes it to IATA/customs-compliant format with HS code and DG classification.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5">
          <Label>Raw Description</Label>
          <textarea
            className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60 resize-none mb-3"
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your cargo description here — it can be informal, abbreviated, or in mixed language…"
          />
          <div className="text-[11px] text-paper-100/40 mb-3">Try an example:</div>
          <div className="flex flex-col gap-1.5 mb-4">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setInput(ex)} className="text-left text-xs text-paper-100/60 hover:text-paper-100 px-2 py-1 rounded bg-panel-700/40 hover:bg-panel-700/80 transition-colors truncate">
                {ex}
              </button>
            ))}
          </div>
          <button
            onClick={clean}
            disabled={loading || !input.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cargo-orange text-tower-900 font-bold text-sm hover:bg-cargo-orange-soft transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {loading ? 'Cleaning…' : 'Clean & Standardize'}
          </button>
          {error && <p className="text-xs text-breach-red mt-2">{error}</p>}
        </div>
        {/* Output */}
        <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5">
          <Label>Cleaned Output</Label>
          {!result ? (
            <div className="text-sm text-paper-100/35 text-center py-12">Output will appear here after cleaning.</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-panel-700/70 border border-cargo-orange/25 rounded-lg p-3 relative">
                <p className="text-sm text-paper-100 leading-relaxed pr-8">{result.cleaned}</p>
                <button onClick={copy} className="absolute top-2 right-2 text-paper-100/40 hover:text-paper-100 transition-colors">
                  {copied ? <CheckCircle2 size={14} className="text-resolved-teal" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="HS Code" value={result.hsCode} sub={result.hsDesc} />
                <InfoBox label="DG Classification" value={result.dgClass} />
              </div>
              {result.specialHandling?.length > 0 && (
                <div>
                  <Label>Special Handling Codes</Label>
                  <div className="flex gap-2 flex-wrap">
                    {result.specialHandling.map((sh) => (
                      <span key={sh} className="px-2 py-1 rounded bg-warn-amber/15 text-warn-amber text-xs font-mono font-semibold">{sh}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.notes && (
                <div className="bg-cargo-orange/10 border border-cargo-orange/20 rounded-lg p-3 text-xs text-paper-100/80">
                  ℹ {result.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Label({ children }) {
  return <div className="text-[11px] font-semibold text-paper-100/50 uppercase tracking-wider mb-2">{children}</div>;
}
function InfoBox({ label, value, sub }) {
  return (
    <div className="bg-panel-700/50 rounded-lg p-3">
      <div className="text-[10px] text-paper-100/40 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-mono font-bold text-paper-100">{value || '—'}</div>
      {sub && <div className="text-[11px] text-paper-100/50 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

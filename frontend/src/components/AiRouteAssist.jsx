import AiChat from './AiChat';

const SYSTEM = `You are an expert air cargo routing specialist. Given shipment requirements, suggest optimal routing options considering:
- Transit time vs cost trade-offs
- Airline reliability and service on the lane
- Hub connectivity and stopover options
- Commodity restrictions (DG, perishables, live animals)
- Seasonal capacity constraints
- Emergency routing for time-critical shipments
Always provide 2–3 options with pros and cons, and a clear recommendation.`;

const QUICK = [
  'Perishable flowers from Chennai (MAA) to Tokyo (NRT) — must arrive fresh within 24 hours',
  'DG lithium batteries from Bangalore to New York — fastest compliant routing',
  'Cost-optimised routing for 5 tonnes general cargo from Mumbai to São Paulo',
  'Live animals (pets) from Delhi to London — which airlines and what are the restrictions?',
];

export default function AiRouteAssist() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Route Suggestion Assistant</h1>
        <p className="text-sm text-paper-100/55">AI-optimised routing options based on commodity, urgency, cost, and airline capability.</p>
      </div>
      <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5" style={{ height: 'calc(100vh - 200px)' }}>
        <AiChat systemPrompt={SYSTEM} placeholder="Describe your shipment and I'll suggest the best routing options…" quickPrompts={QUICK} title="Route Suggestion AI" icon="🧭" />
      </div>
    </div>
  );
}

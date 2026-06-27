import AiChat from './AiChat';

const SYSTEM = `You are a senior air freight quotation specialist with 20+ years of experience. When given shipment details, provide a professional freight quotation including:
- Base rate per kg and total freight cost
- Fuel surcharge (FSC), security surcharge, handling charges
- Transit time options
- Any applicable surcharges (DG, pharma, perishables, etc.)
- Currency and validity
Be precise with numbers. Always ask for clarification if commodity, weight, or routing is unclear.`;

const QUICK = [
  '200kg pharma cold-chain from HYD to AMS, needed by July 1',
  '1 tonne general cargo BOM to FRA, no special requirements',
  '50kg electronics BLR to SFO, express delivery needed in 2 days',
  'Bulk rate for 10+ tonnes per month on DEL-JFK lane',
];

export default function AiQuotationAssist() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">AI Quotation Assistant</h1>
        <p className="text-sm text-paper-100/55">Describe your shipment — get a detailed freight quotation instantly.</p>
      </div>
      <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5" style={{ height: 'calc(100vh - 200px)' }}>
        <AiChat systemPrompt={SYSTEM} placeholder="e.g. 200kg pharma from Hyderabad to Amsterdam by July 1, temperature sensitive…" quickPrompts={QUICK} title="AI Quotation Assistant" icon="💰" />
      </div>
    </div>
  );
}

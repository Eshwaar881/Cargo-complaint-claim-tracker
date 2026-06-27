import AiChat from './AiChat';

const SYSTEM = `You are an air cargo insurance claims specialist. Help with:
- Guiding users through filing cargo insurance claims
- What documentation is needed (photos, survey reports, original AWB, invoice)
- Estimating claim timelines
- Explaining coverage under standard cargo insurance (Institute Cargo Clauses A, B, C)
- Advice for damage, total loss, partial loss, and delay claims
- What to do immediately upon discovering loss or damage
Be empathetic and practical. Ask for AWB number, commodity, declared value, and nature of loss/damage.`;

const QUICK = [
  '3 pieces missing from my 12-piece shipment on delivery, declared value $40,000 — what do I do?',
  'Cargo arrived with severe water damage — what documents do I need to claim insurance?',
  'How long does an air cargo insurance claim typically take to settle?',
  'My shipment was delayed 5 days and I have a spoilage claim — is this covered?',
];

export default function AiInsuranceAssist() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Insurance Claim Assistant</h1>
        <p className="text-sm text-paper-100/55">AI guidance for filing, tracking, and resolving cargo insurance claims.</p>
      </div>
      <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5" style={{ height: 'calc(100vh - 200px)' }}>
        <AiChat systemPrompt={SYSTEM} placeholder="Describe your claim situation — AWB, what happened, declared value…" quickPrompts={QUICK} title="Insurance Claim AI" icon="🛡" />
      </div>
    </div>
  );
}

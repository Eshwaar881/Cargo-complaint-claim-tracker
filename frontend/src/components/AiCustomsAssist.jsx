import AiChat from './AiChat';

const SYSTEM = `You are an expert in international air cargo customs regulations, IATA dangerous goods classification, and import/export documentation. Help freight professionals with:
- HS code classification
- Required export/import documents by country
- IATA DG categories and packing instructions
- Customs duty and tax queries
- Restricted and prohibited items
- Certificate of Origin, Phytosanitary, and other certificates
Always cite the relevant regulation or standard where possible.`;

const QUICK = [
  'What is the HS code for automotive brake pads (metal and rubber composite)?',
  'Documents needed to export pharmaceutical samples from India to Germany under GDP',
  'IATA DG classification for lithium-ion batteries — packing group and limits',
  'What are the import restrictions for pharma products entering the UAE?',
];

export default function AiCustomsAssist() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-paper-100 mb-1">AI Customs & Documentation Assistant</h1>
        <p className="text-sm text-paper-100/55">Ask about HS codes, customs procedures, IATA DG regulations, and required documentation.</p>
      </div>
      <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5" style={{ height: 'calc(100vh - 200px)' }}>
        <AiChat systemPrompt={SYSTEM} placeholder="e.g. What documents do I need to export pharmaceuticals from India to Netherlands?" quickPrompts={QUICK} title="AI Customs / Documentation" icon="📑" />
      </div>
    </div>
  );
}

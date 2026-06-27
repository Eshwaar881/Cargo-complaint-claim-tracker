import { useState } from 'react';
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const ENQUIRIES = [
  { id:'ENQ-001', customer:'Rajesh Kumar', subject:'Rate inquiry BOM–LAX', type:'Rate', status:'Pending', date:'Jun 26', color:'#D9A23B' },
  { id:'ENQ-002', customer:'Priya Singh',  subject:'Shipment delay AWB 098-4471', type:'Complaint', status:'Open', date:'Jun 25', color:'#C23B3B' },
  { id:'ENQ-003', customer:'Chen Wei',     subject:'Documentation query for customs', type:'Docs', status:'Resolved', date:'Jun 24', color:'#3FA796' },
  { id:'ENQ-004', customer:'Emirates Cargo',subject:'Bulk rate contract renewal 2027', type:'Contract', status:'Pending', date:'Jun 24', color:'#D9A23B' },
  { id:'ENQ-005', customer:'JSW Steel',    subject:'AWB correction request', type:'Docs', status:'Open', date:'Jun 23', color:'#C23B3B' },
];

export default function EnquiryCRM() {
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-paper-100 mb-1">Customer Enquiry CRM</h1><p className="text-sm text-paper-100/55">Track and respond to all customer enquiries.</p></div>
        <button className="px-4 py-2 rounded-lg bg-cargo-orange text-tower-900 text-sm font-bold hover:bg-cargo-orange-soft transition-colors">+ New Enquiry</button>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[['24','Total',null],['8','Pending Reply','#D9A23B'],['14','Resolved','#3FA796'],['2.4h','Avg Response','#D4742F']].map(([v,l,c])=>(
          <div key={l} className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-4"><div className="font-display text-xl font-bold" style={{color:c||'#F5F2EA'}}>{v}</div><div className="text-xs text-paper-100/50 mt-0.5">{l}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-panel-600/40 text-sm font-semibold text-paper-100">Enquiries</div>
          {ENQUIRIES.map(enq => (
            <button key={enq.id} onClick={()=>setSelected(enq)} className={`w-full text-left px-4 py-3 border-b border-panel-600/20 hover:bg-panel-700/40 transition-colors ${selected?.id===enq.id?'bg-panel-700/60':''}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[11px] text-paper-100/50">{enq.id}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{color:enq.color,background:`${enq.color}22`}}>{enq.status}</span>
              </div>
              <div className="text-sm font-medium text-paper-100">{enq.customer}</div>
              <div className="text-xs text-paper-100/55 truncate">{enq.subject}</div>
            </button>
          ))}
        </div>
        <div className="bg-panel-700/60 border border-panel-600/40 rounded-xl p-5">
          {!selected ? (
            <div className="text-center py-10 text-paper-100/35 text-sm">Select an enquiry to view details and reply.</div>
          ) : (
            <div>
              <div className="mb-4"><div className="font-mono text-xs text-paper-100/40 mb-0.5">{selected.id} · {selected.type}</div><div className="font-semibold text-paper-100">{selected.subject}</div><div className="text-xs text-paper-100/50 mt-0.5">From {selected.customer} · {selected.date}</div></div>
              <div className="bg-panel-700/50 rounded-lg p-3 text-sm text-paper-100/70 mb-4">
                <MessageSquare size={13} className="inline mr-1.5 text-paper-100/40" />
                Customer has submitted an enquiry regarding {selected.subject.toLowerCase()}. Please review and respond within 4 hours per SLA.
              </div>
              <div className="mb-3"><div className="text-[11px] font-semibold text-paper-100/40 uppercase tracking-wider mb-1.5">Reply</div>
                <textarea className="w-full bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60 resize-none" rows={4} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your reply to the customer..." />
              </div>
              <div className="flex gap-2">
                <button onClick={()=>alert('Reply sent!')} className="px-4 py-2 rounded-lg bg-cargo-orange text-tower-900 text-sm font-bold hover:bg-cargo-orange-soft transition-colors">Send Reply</button>
                <button onClick={()=>alert('Marked resolved!')} className="px-4 py-2 rounded-lg border border-resolved-teal/50 text-resolved-teal text-sm font-medium hover:bg-resolved-teal/10 transition-colors">Mark Resolved</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

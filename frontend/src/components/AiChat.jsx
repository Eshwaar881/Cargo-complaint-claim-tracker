// Reusable AI chat panel used by all AI assistant modules.
// Calls the Anthropic API directly (browser-side) when no backend proxy is available.
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

export default function AiChat({ systemPrompt, placeholder, quickPrompts = [], title = 'AI Assistant', icon = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 1000, system: systemPrompt, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'API error');
      const reply = data.content?.find((c) => c.type === 'text')?.text || '';
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
      setMessages([...next, { role: 'assistant', content: `⚠ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-160px)]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-cargo-orange" />
        <span className="font-display font-semibold text-paper-100 text-sm">{title}</span>
        <span className="ml-auto text-[11px] text-paper-100/40">Powered by Claude</span>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-sm text-paper-100/45 text-center py-8">
            {icon && <div className="text-4xl mb-2">{icon}</div>}
            Ask me anything about {title.toLowerCase().replace('ai ', '')}.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-cargo-orange text-tower-900 font-medium'
                : 'bg-panel-700/70 border border-panel-600/40 text-paper-100/90'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-panel-700/70 border border-panel-600/40 rounded-xl px-4 py-2.5">
              <Loader2 size={14} className="text-cargo-orange animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {quickPrompts.length > 0 && messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              onClick={() => sendMessage(qp)}
              className="text-[12px] px-3 py-1.5 rounded-lg bg-panel-700/50 border border-panel-600/50 text-paper-100/70 hover:border-cargo-orange/50 hover:text-paper-100 transition-colors text-left"
            >
              {qp}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 bg-panel-700/50 border border-panel-600/50 rounded-lg px-3 py-2.5 text-sm text-paper-100 placeholder:text-paper-100/35 outline-none focus:border-cargo-orange/60 disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-3 py-2.5 rounded-lg bg-cargo-orange text-tower-900 hover:bg-cargo-orange-soft transition-colors disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
      {error && <p className="text-xs text-breach-red mt-2">{error}</p>}
    </div>
  );
}

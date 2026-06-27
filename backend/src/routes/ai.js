/**
 * AI proxy routes — keeps API keys server-side.
 * All AI assistants in the frontend call these endpoints.
 */
import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const MODEL = 'claude-sonnet-4-6';

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith('replace_with')) return null;
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPTS = {
  quotation: `You are a senior air freight quotation specialist with 20+ years experience. Provide precise quotations with rate breakdowns, surcharges, transit times, and recommendations. Be professional and concise.`,
  customs: `You are an expert in international air cargo customs regulations, IATA DG classification, and import/export documentation. Cite regulations. Be precise.`,
  insurance: `You are an air cargo insurance claims specialist. Guide users through claims, documentation requirements, timelines, and ICC clause coverage. Be empathetic and practical.`,
  route: `You are an expert air cargo routing specialist. Provide 2–3 routing options with pros/cons and a clear recommendation considering cost, time, and commodity restrictions.`,
};

async function handleAiChat(req, res, type) {
  const client = getClient();
  if (!client) return res.status(503).json({ error: 'AI not configured — set ANTHROPIC_API_KEY in .env' });

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPTS[type],
      messages,
    });
    res.json({ reply: response.content.find((c) => c.type === 'text')?.text || '' });
  } catch (err) {
    console.error(`[AI ${type}] error:`, err.message);
    res.status(500).json({ error: err.message });
  }
}

router.post('/quotation', (req, res) => handleAiChat(req, res, 'quotation'));
router.post('/customs',   (req, res) => handleAiChat(req, res, 'customs'));
router.post('/insurance', (req, res) => handleAiChat(req, res, 'insurance'));
router.post('/route',     (req, res) => handleAiChat(req, res, 'route'));

router.post('/clean-cargo', async (req, res) => {
  const client = getClient();
  if (!client) return res.status(503).json({ error: 'AI not configured' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: `You are an IATA air cargo documentation expert. When given a raw cargo description, return ONLY valid JSON (no markdown) with: { "cleaned": "<IATA-compliant 1-2 line description>", "hsCode": "<6-digit HS code>", "hsDesc": "<official HS code description>", "dgClass": "<IATA DG class or Non-DG>", "specialHandling": ["<codes>"], "notes": "<compliance notes>" }`,
      messages: [{ role: 'user', content: `Clean this cargo description: "${text}"` }],
    });
    const raw = response.content.find((c) => c.type === 'text')?.text || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

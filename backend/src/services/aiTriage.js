import { GoogleGenAI } from '@google/genai';
import { getRequiredFollowUp } from './workflow.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DISABLE_AI = process.env.DISABLE_AI === 'true';

let client = null;
function getClient() {
  if (DISABLE_AI) return null;
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('replace_with')) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/**
 * Step 4: AI (or rule-based fallback) triage — produces a short summary
 * and a recommended next action for ops staff reviewing the complaint.
 */
export async function triageComplaint(complaint) {
  const ai = getClient();

  if (!ai) {
    return ruleBasedTriage(complaint);
  }

  try {
    const prompt = buildTriagePrompt(complaint);
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary?.slice(0, 500) || ruleBasedTriage(complaint).summary,
      recommendation: parsed.recommendation?.slice(0, 500) || ruleBasedTriage(complaint).recommendation,
      sentiment: parsed.sentiment || 'neutral',
      source: 'AI',
    };
  } catch (err) {
    console.error('[gemini] triage failed, falling back to rule-based:', err.message);
    return ruleBasedTriage(complaint, /* aiFailed */ true);
  }
}

function buildTriagePrompt(complaint) {
  return `You are an air cargo operations triage assistant. Given this complaint/claim, respond ONLY with valid JSON (no markdown fences) in this exact shape:
{"summary": "<one or two sentence neutral summary of the issue>", "recommendation": "<one specific, actionable next step for ops staff>", "sentiment": "<one of: neutral, urgent, frustrated, satisfied>"}

Complaint details:
- Category: ${complaint.category}
- Is formal claim: ${complaint.is_claim ? `Yes, amount ${complaint.claim_currency} ${complaint.claim_amount}` : 'No'}
- AWB: ${complaint.awb_number || 'N/A'}
- Priority: ${complaint.priority}
- Description: "${complaint.description}"

Keep the summary and recommendation concise and operational, not conversational.`;
}

/**
 * Deterministic fallback used when AI is disabled, unconfigured, or fails.
 * This guarantees Step 4 always produces a usable output.
 */
function ruleBasedTriage(complaint, aiFailed = false) {
  const followUp = getRequiredFollowUp(complaint.category);
  const claimNote = complaint.is_claim
    ? ` A formal claim of ${complaint.claim_currency} ${complaint.claim_amount} has been filed.`
    : '';

  return {
    summary: `${labelFor(complaint.category)} reported on AWB ${complaint.awb_number || 'N/A'}.${claimNote} Priority: ${complaint.priority}.`,
    recommendation: followUp,
    sentiment: complaint.priority === 'CRITICAL' ? 'urgent' : 'neutral',
    source: aiFailed ? 'RULE_BASED_FALLBACK' : 'RULE_BASED',
  };
}

function labelFor(category) {
  const map = {
    DELAY: 'Shipment delay',
    DAMAGE: 'Cargo damage',
    MISSING_PACKAGE: 'Missing package',
    BILLING_ISSUE: 'Billing discrepancy',
    DOCUMENTATION_ISSUE: 'Documentation issue',
  };
  return map[category] || 'Issue';
}

export function isAiEnabled() {
  return getClient() !== null;
}

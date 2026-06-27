// Cargo Complaint & Claim Workflow Engine
// Encodes the rules for each complaint category: default priority,
// SLA window, valid status transitions, and required follow-up actions.
// This is deliberately rule-based (deterministic) — AI augments it
// with summaries/recommendations but never decides the workflow itself.

export const CATEGORIES = ['DELAY', 'DAMAGE', 'MISSING_PACKAGE', 'BILLING_ISSUE', 'DOCUMENTATION_ISSUE'];

export const STATUSES = [
  'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'PENDING_CUSTOMER',
  'RESOLVED', 'REJECTED', 'ESCALATED', 'CLOSED',
];

// Valid forward transitions per status (keeps the lifecycle sane).
const TRANSITIONS = {
  OPEN: ['ACKNOWLEDGED', 'ESCALATED', 'REJECTED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'ESCALATED'],
  INVESTIGATING: ['PENDING_CUSTOMER', 'RESOLVED', 'REJECTED', 'ESCALATED'],
  PENDING_CUSTOMER: ['INVESTIGATING', 'RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'], // reopen path
  REJECTED: ['INVESTIGATING'],            // appeal/reopen path
  ESCALATED: ['INVESTIGATING', 'RESOLVED'],
  CLOSED: [], // terminal
};

// SLA hours by category x priority — the categories most likely to be
// urgent (AOG-adjacent delay, missing package) get tighter base windows.
const SLA_MATRIX = {
  DELAY:               { CRITICAL: 2, HIGH: 6, MEDIUM: 12, LOW: 24 },
  MISSING_PACKAGE:     { CRITICAL: 2, HIGH: 4, MEDIUM: 12, LOW: 24 },
  DAMAGE:              { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 48 },
  BILLING_ISSUE:       { CRITICAL: 8, HIGH: 24, MEDIUM: 48, LOW: 72 },
  DOCUMENTATION_ISSUE: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 48 },
};

/**
 * Rule-based priority suggestion based on category + signal flags.
 * AI may override this with a recommendation, but this is the deterministic floor.
 */
export function suggestPriority({ category, claimAmount, isClaim, milestoneStatus, hoursSinceExpectedDelivery }) {
  if (category === 'MISSING_PACKAGE') return 'CRITICAL';
  if (category === 'DAMAGE' && isClaim && claimAmount > 5000) return 'CRITICAL';
  if (category === 'DAMAGE' && isClaim) return 'HIGH';
  if (category === 'DELAY' && hoursSinceExpectedDelivery > 48) return 'CRITICAL';
  if (category === 'DELAY' && hoursSinceExpectedDelivery > 12) return 'HIGH';
  if (category === 'DOCUMENTATION_ISSUE' && milestoneStatus === 'CUSTOMS') return 'HIGH';
  if (category === 'BILLING_ISSUE' && isClaim) return 'MEDIUM';
  return 'MEDIUM';
}

export function getSlaDueDate({ category, priority, fromDate = new Date() }) {
  const hours = SLA_MATRIX[category]?.[priority] ?? 24;
  return new Date(fromDate.getTime() + hours * 60 * 60 * 1000);
}

export function canTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return false;
  return (TRANSITIONS[fromStatus] || []).includes(toStatus);
}

export function getAllowedNextStatuses(fromStatus) {
  return TRANSITIONS[fromStatus] || [];
}

export function isSlaBreached(slaDueAt, now = new Date()) {
  if (!slaDueAt) return false;
  return now.getTime() > new Date(slaDueAt).getTime();
}

/**
 * Required follow-up action per category — drives Step 6 reminders/messages.
 */
export function getRequiredFollowUp(category) {
  const map = {
    DELAY: 'Provide updated ETA and root cause to customer within SLA window.',
    DAMAGE: 'Request photo evidence and warehouse inspection report.',
    MISSING_PACKAGE: 'Trigger warehouse trace request and carrier manifest cross-check immediately.',
    BILLING_ISSUE: 'Accounts to reconcile invoice against rate card and respond with breakdown.',
    DOCUMENTATION_ISSUE: 'Documentation executive to verify AWB/customs paperwork and reissue if needed.',
  };
  return map[category] || 'Review case and assign appropriate owner.';
}

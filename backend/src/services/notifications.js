import sgMail from '@sendgrid/mail';
import { nanoid } from 'nanoid';
import { run } from '../db/index.js';

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'ops@yourcargocompany.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Cargo Ops Desk';

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const key = process.env.SENDGRID_API_KEY;
  if (!key || key.startsWith('replace_with')) return false;
  sgMail.setApiKey(key);
  configured = true;
  return true;
}

/**
 * Step 6: automated confirmations / reminders / follow-ups.
 * Every attempt — sent or failed — is logged to `notifications` so the
 * dashboard can show delivery history, never silently dropped.
 */
export async function sendNotification({ complaintId, recipient, subject, body, kind }) {
  const id = `ntf_${nanoid(10)}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO notifications (id, complaint_id, channel, recipient, subject, body_preview, kind, status, created_at)
     VALUES (@id, @complaintId, 'EMAIL', @recipient, @subject, @bodyPreview, @kind, 'PENDING', @createdAt)`,
    { id, complaintId, recipient, subject, bodyPreview: body.slice(0, 300), kind, createdAt: now }
  );

  if (!ensureConfigured()) {
    run(`UPDATE notifications SET status='FAILED', error_message=@err WHERE id=@id`, {
      id,
      err: 'SendGrid not configured (placeholder key) — notification logged only.',
    });
    return { id, status: 'FAILED', reason: 'SendGrid not configured' };
  }

  try {
    await sgMail.send({
      to: recipient,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      text: body,
      html: `<div style="font-family: Inter, Arial, sans-serif; line-height:1.6; color:#1C2B3D;">${body.replace(/\n/g, '<br/>')}</div>`,
    });

    const sentAt = new Date().toISOString();
    run(`UPDATE notifications SET status='SENT', sent_at=@sentAt WHERE id=@id`, { id, sentAt });
    return { id, status: 'SENT' };
  } catch (err) {
    const errorMessage = err.response?.body?.errors?.[0]?.message || err.message;
    run(`UPDATE notifications SET status='FAILED', error_message=@err WHERE id=@id`, { id, err: errorMessage });
    return { id, status: 'FAILED', reason: errorMessage };
  }
}

export function buildConfirmationEmail(complaint) {
  return {
    subject: `We've received your ${labelFor(complaint.category)} report — ${complaint.reference_code}`,
    body: `Hello ${complaint.raised_by_name},

Your report has been logged under reference ${complaint.reference_code}.

Category: ${labelFor(complaint.category)}
AWB: ${complaint.awb_number || 'N/A'}
Priority: ${complaint.priority}
Status: ${complaint.status}

${complaint.ai_recommendation ? `Next step: ${complaint.ai_recommendation}` : ''}

Our team will follow up within the committed SLA window. You can track progress with your reference code at any time.

— ${FROM_NAME}`,
  };
}

export function buildReminderEmail(complaint, hoursOverdue) {
  return {
    subject: `Action needed: ${complaint.reference_code} is past its SLA window`,
    body: `Hello ${complaint.owner_name || 'Team'},

Case ${complaint.reference_code} (${labelFor(complaint.category)}, priority ${complaint.priority}) is now ${Math.round(hoursOverdue)} hour(s) past its SLA deadline and still marked "${complaint.status}".

AWB: ${complaint.awb_number || 'N/A'}
Raised by: ${complaint.raised_by_name} (${complaint.raised_by_email})

Please review and update the case status as soon as possible.

— ${FROM_NAME}`,
  };
}

export function buildResolutionEmail(complaint) {
  return {
    subject: `Your case ${complaint.reference_code} has been resolved`,
    body: `Hello ${complaint.raised_by_name},

Your ${labelFor(complaint.category).toLowerCase()} report (${complaint.reference_code}) has been marked resolved.

${complaint.ai_summary ? `Summary: ${complaint.ai_summary}` : ''}

If this doesn't fully address your concern, you can reply to reopen the case.

— ${FROM_NAME}`,
  };
}

function labelFor(category) {
  const map = {
    DELAY: 'Shipment Delay',
    DAMAGE: 'Cargo Damage',
    MISSING_PACKAGE: 'Missing Package',
    BILLING_ISSUE: 'Billing Issue',
    DOCUMENTATION_ISSUE: 'Documentation Issue',
  };
  return map[category] || 'Issue';
}

export function isEmailEnabled() {
  return ensureConfigured();
}

import cron from 'node-cron';
import { nanoid } from 'nanoid';
import { all, run } from '../db/index.js';
import { isSlaBreached } from '../services/workflow.js';
import { sendNotification, buildReminderEmail } from '../services/notifications.js';

const ACTIVE_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'PENDING_CUSTOMER'];

/**
 * Step 6: runs every 15 minutes. Finds active complaints past their SLA
 * deadline that haven't already had a reminder sent in the last 6 hours,
 * sends an internal reminder to the owner, and logs a complaint_event.
 */
export function startSlaWatcher() {
  const task = cron.schedule('*/15 * * * *', async () => {
    await checkSlaBreaches();
  });

  // Also run once on boot so the demo doesn't have to wait 15 minutes.
  checkSlaBreaches();

  return task;
}

export async function checkSlaBreaches() {
  const now = new Date();
  const placeholders = ACTIVE_STATUSES.map((_, i) => `@status${i}`).join(',');
  const statusParams = Object.fromEntries(ACTIVE_STATUSES.map((s, i) => [`status${i}`, s]));

  const candidates = all(
    `SELECT * FROM complaints WHERE status IN (${placeholders}) AND sla_due_at IS NOT NULL`,
    statusParams
  );

  let remindersSent = 0;

  for (const complaint of candidates) {
    if (!isSlaBreached(complaint.sla_due_at, now)) continue;

    const recentReminder = all(
      `SELECT * FROM complaint_events
       WHERE complaint_id = @id AND event_type = 'REMINDER_SENT'
       AND created_at > @cutoff ORDER BY created_at DESC LIMIT 1`,
      { id: complaint.id, cutoff: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString() }
    );
    if (recentReminder.length > 0) continue;

    const hoursOverdue = (now.getTime() - new Date(complaint.sla_due_at).getTime()) / (1000 * 60 * 60);
    const recipient = complaint.owner_id ? null : null; // owner email not modeled separately; reuse raised_by for demo visibility
    const targetEmail = complaint.owner_name ? `${complaint.owner_name.toLowerCase().replace(/\s+/g, '.')}@cargo-ops.internal` : complaint.raised_by_email;

    const { subject, body } = buildReminderEmail(complaint, hoursOverdue);
    const result = await sendNotification({
      complaintId: complaint.id,
      recipient: targetEmail,
      subject,
      body,
      kind: 'REMINDER',
    });

    const eventId = `evt_${nanoid(10)}`;
    run(
      `INSERT INTO complaint_events (id, complaint_id, event_type, actor_name, detail, created_at)
       VALUES (@id, @complaintId, 'REMINDER_SENT', 'System (SLA Watcher)', @detail, @createdAt)`,
      {
        id: eventId,
        complaintId: complaint.id,
        detail: `SLA breached by ${hoursOverdue.toFixed(1)}h. Reminder ${result.status.toLowerCase()}.`,
        createdAt: now.toISOString(),
      }
    );

    if (complaint.status !== 'ESCALATED' && hoursOverdue > 24) {
      run(
        `UPDATE complaints SET status='ESCALATED', updated_at=@now WHERE id=@id`,
        { id: complaint.id, now: now.toISOString() }
      );
      run(
        `INSERT INTO complaint_events (id, complaint_id, event_type, actor_name, detail, created_at)
         VALUES (@id, @complaintId, 'STATUS_CHANGE', 'System (SLA Watcher)', 'Auto-escalated: SLA breached by over 24 hours.', @createdAt)`,
        { id: `evt_${nanoid(10)}`, complaintId: complaint.id, createdAt: now.toISOString() }
      );
    }

    remindersSent += 1;
  }

  if (remindersSent > 0) {
    console.log(`[sla-watcher] sent ${remindersSent} reminder(s) at ${now.toISOString()}`);
  }
  return remindersSent;
}

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { all, get, run } from '../db/index.js';
import {
  CATEGORIES, STATUSES, suggestPriority, getSlaDueDate,
  canTransition, getAllowedNextStatuses, getRequiredFollowUp,
} from '../services/workflow.js';
import { triageComplaint } from '../services/aiTriage.js';
import { estimateRouteDelayFactor } from '../services/routeService.js';
import { sendNotification, buildConfirmationEmail, buildResolutionEmail } from '../services/notifications.js';

const router = Router();

function nextRefCode() {
  const year = new Date().getFullYear();
  const row = get(`SELECT COUNT(*) as count FROM complaints WHERE reference_code LIKE @pattern`, {
    pattern: `CCT-${year}-%`,
  });
  const seq = String((row?.count || 0) + 1).padStart(6, '0');
  return `CCT-${year}-${seq}`;
}

function logEvent(complaintId, eventType, actorName, detail) {
  run(
    `INSERT INTO complaint_events (id, complaint_id, event_type, actor_name, detail, created_at)
     VALUES (@id, @complaintId, @eventType, @actorName, @detail, @createdAt)`,
    { id: `evt_${nanoid(10)}`, complaintId, eventType, actorName: actorName || 'System', detail, createdAt: new Date().toISOString() }
  );
}

// ---------------------------------------------------------------------
// GET /api/complaints — list with filters (Step 5: dashboard view)
// ---------------------------------------------------------------------
router.get('/', (req, res) => {
  const { status, category, priority, search } = req.query;
  let sql = 'SELECT * FROM complaints WHERE 1=1';
  const params = {};

  if (status) { sql += ' AND status = @status'; params.status = status; }
  if (category) { sql += ' AND category = @category'; params.category = category; }
  if (priority) { sql += ' AND priority = @priority'; params.priority = priority; }
  if (search) {
    sql += ' AND (reference_code LIKE @search OR awb_number LIKE @search OR raised_by_name LIKE @search OR description LIKE @search)';
    params.search = `%${search}%`;
  }
  sql += ' ORDER BY created_at DESC';

  const complaints = all(sql, params);
  res.json({ complaints });
});

// ---------------------------------------------------------------------
// GET /api/complaints/stats — aggregate counts for dashboard header
// ---------------------------------------------------------------------
router.get('/stats', (req, res) => {
  const byStatus = all('SELECT status, COUNT(*) as count FROM complaints GROUP BY status');
  const byCategory = all('SELECT category, COUNT(*) as count FROM complaints GROUP BY category');
  const byPriority = all('SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority');
  const breached = all(
    `SELECT COUNT(*) as count FROM complaints
     WHERE sla_due_at IS NOT NULL AND sla_due_at < @now
     AND status NOT IN ('RESOLVED','REJECTED','CLOSED')`,
    { now: new Date().toISOString() }
  );
  const total = all('SELECT COUNT(*) as count FROM complaints')[0]?.count || 0;

  res.json({
    total,
    byStatus, byCategory, byPriority,
    slaBreached: breached[0]?.count || 0,
  });
});

// ---------------------------------------------------------------------
// GET /api/complaints/:id — single record with full event + notification history
// ---------------------------------------------------------------------
router.get('/:id', (req, res) => {
  const complaint = get('SELECT * FROM complaints WHERE id = @id', { id: req.params.id });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const events = all('SELECT * FROM complaint_events WHERE complaint_id = @id ORDER BY created_at DESC', { id: req.params.id });
  const notifications = all('SELECT * FROM notifications WHERE complaint_id = @id ORDER BY created_at DESC', { id: req.params.id });
  const shipment = complaint.shipment_id ? get('SELECT * FROM shipments WHERE id = @id', { id: complaint.shipment_id }) : null;

  res.json({ complaint, events, notifications, shipment });
});

// ---------------------------------------------------------------------
// POST /api/complaints — Step 1+2+3+4+6: create a new complaint/claim
// ---------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const {
      category, subtype, description, isClaim, claimAmount, claimCurrency,
      awbNumber, shipmentId, source, raisedByName, raisedByEmail, raisedById,
    } = req.body;

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(', ')}` });
    }
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'description is required (min 5 characters)' });
    }
    if (!raisedByName || !raisedByEmail) {
      return res.status(400).json({ error: 'raisedByName and raisedByEmail are required' });
    }
    const validSources = ['CUSTOMER_PORTAL', 'AGENT_PORTAL', 'CRM', 'EMAIL', 'PHONE', 'INTERNAL_OPS'];
    if (!validSources.includes(source)) {
      return res.status(400).json({ error: `source must be one of ${validSources.join(', ')}` });
    }

    let shipment = null;
    if (shipmentId) shipment = get('SELECT * FROM shipments WHERE id = @id', { id: shipmentId });
    else if (awbNumber) shipment = get('SELECT * FROM shipments WHERE awb_number = @awb', { awb: awbNumber });

    let hoursSinceExpectedDelivery = 0;
    if (shipment?.eta) {
      hoursSinceExpectedDelivery = Math.max(0, (Date.now() - new Date(shipment.eta).getTime()) / (1000 * 60 * 60));
    }

    const priority = suggestPriority({
      category,
      claimAmount: Number(claimAmount) || 0,
      isClaim: Boolean(isClaim),
      milestoneStatus: shipment?.milestone_status,
      hoursSinceExpectedDelivery,
    });

    const now = new Date();
    const slaDueAt = getSlaDueDate({ category, priority, fromDate: now });

    const id = `cmp_${nanoid(12)}`;
    const referenceCode = nextRefCode();

    run(
      `INSERT INTO complaints (
        id, reference_code, shipment_id, awb_number, category, subtype, description,
        is_claim, claim_amount, claim_currency, priority, status, source,
        raised_by_id, raised_by_name, raised_by_email, owner_id, owner_name,
        sla_due_at, created_at, updated_at
      ) VALUES (
        @id, @referenceCode, @shipmentId, @awbNumber, @category, @subtype, @description,
        @isClaim, @claimAmount, @claimCurrency, @priority, 'OPEN', @source,
        @raisedById, @raisedByName, @raisedByEmail, NULL, NULL,
        @slaDueAt, @createdAt, @updatedAt
      )`,
      {
        id, referenceCode,
        shipmentId: shipment?.id || null,
        awbNumber: awbNumber || shipment?.awb_number || null,
        category, subtype: subtype || null, description,
        isClaim: isClaim ? 1 : 0,
        claimAmount: claimAmount ? Number(claimAmount) : null,
        claimCurrency: claimCurrency || 'USD',
        priority,
        source,
        raisedById: raisedById || null, raisedByName, raisedByEmail,
        slaDueAt: slaDueAt.toISOString(),
        createdAt: now.toISOString(), updatedAt: now.toISOString(),
      }
    );

    logEvent(id, 'CREATED', raisedByName, `${category} reported via ${source}. Priority auto-set to ${priority}.`);

    // Step 4: AI/rule-based triage
    const draftComplaint = get('SELECT * FROM complaints WHERE id = @id', { id });
    const triage = await triageComplaint(draftComplaint);

    run(
      `UPDATE complaints SET ai_summary=@summary, ai_recommendation=@recommendation, ai_sentiment=@sentiment, updated_at=@now WHERE id=@id`,
      { id, summary: triage.summary, recommendation: triage.recommendation, sentiment: triage.sentiment, now: new Date().toISOString() }
    );
    logEvent(id, 'AI_TRIAGE', 'System', `Triage generated via ${triage.source}: ${triage.recommendation}`);

    // Optional: route delay factor for DELAY category, if coordinates available
    let routeInfo = null;
    if (category === 'DELAY' && shipment?.origin_lat && shipment?.dest_lat) {
      routeInfo = await estimateRouteDelayFactor({
        originLat: shipment.origin_lat, originLng: shipment.origin_lng,
        destLat: shipment.dest_lat, destLng: shipment.dest_lng,
      });
      if (routeInfo.available) {
        logEvent(id, 'NOTE_ADDED', 'System', `Route check: ${routeInfo.distanceKm}km / ${routeInfo.durationMin}min ground leg.${routeInfo.flaggedLongRoute ? ' Flagged as long-route contributor.' : ''}`);
      }
    }

    // Step 6: automated confirmation email
    const finalComplaint = get('SELECT * FROM complaints WHERE id = @id', { id });
    const { subject, body } = buildConfirmationEmail(finalComplaint);
    const notifResult = await sendNotification({ complaintId: id, recipient: raisedByEmail, subject, body, kind: 'CONFIRMATION' });
    logEvent(id, 'EMAIL_SENT', 'System', `Confirmation email ${notifResult.status.toLowerCase()}.`);

    res.status(201).json({ complaint: finalComplaint, triage, routeInfo, notification: notifResult });
  } catch (err) {
    console.error('[POST /complaints] error:', err);
    res.status(500).json({ error: 'Failed to create complaint', detail: err.message });
  }
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id/status — Step 3/5: workflow status transitions
// ---------------------------------------------------------------------
router.patch('/:id/status', async (req, res) => {
  const { status: toStatus, actorName } = req.body;
  const complaint = get('SELECT * FROM complaints WHERE id = @id', { id: req.params.id });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  if (!STATUSES.includes(toStatus)) {
    return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
  }
  if (!canTransition(complaint.status, toStatus)) {
    return res.status(409).json({
      error: `Cannot transition from ${complaint.status} to ${toStatus}`,
      allowedNext: getAllowedNextStatuses(complaint.status),
    });
  }

  const now = new Date().toISOString();
  const resolvedAt = toStatus === 'RESOLVED' ? now : complaint.resolved_at;

  run('UPDATE complaints SET status=@status, resolved_at=@resolvedAt, updated_at=@now WHERE id=@id', {
    id: complaint.id, status: toStatus, resolvedAt, now,
  });
  logEvent(complaint.id, 'STATUS_CHANGE', actorName || 'Ops Staff', `${complaint.status} → ${toStatus}`);

  if (toStatus === 'RESOLVED') {
    logEvent(complaint.id, 'RESOLVED', actorName || 'Ops Staff', 'Case marked resolved.');
    const updated = get('SELECT * FROM complaints WHERE id = @id', { id: complaint.id });
    const { subject, body } = buildResolutionEmail(updated);
    const notifResult = await sendNotification({ complaintId: complaint.id, recipient: complaint.raised_by_email, subject, body, kind: 'RESOLUTION' });
    logEvent(complaint.id, 'EMAIL_SENT', 'System', `Resolution email ${notifResult.status.toLowerCase()}.`);
  }

  const updated = get('SELECT * FROM complaints WHERE id = @id', { id: complaint.id });
  res.json({ complaint: updated });
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id/assign — Step 5: assign/reassign owner
// ---------------------------------------------------------------------
router.patch('/:id/assign', (req, res) => {
  const { ownerId, ownerName, actorName } = req.body;
  const complaint = get('SELECT * FROM complaints WHERE id = @id', { id: req.params.id });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  run('UPDATE complaints SET owner_id=@ownerId, owner_name=@ownerName, updated_at=@now WHERE id=@id', {
    id: complaint.id, ownerId: ownerId || null, ownerName: ownerName || null, now: new Date().toISOString(),
  });
  logEvent(complaint.id, 'OWNER_CHANGE', actorName || 'Ops Staff', `Assigned to ${ownerName}`);

  const updated = get('SELECT * FROM complaints WHERE id = @id', { id: complaint.id });
  res.json({ complaint: updated });
});

// ---------------------------------------------------------------------
// PATCH /api/complaints/:id/priority — Step 5: manual priority override
// ---------------------------------------------------------------------
router.patch('/:id/priority', (req, res) => {
  const { priority, actorName } = req.body;
  const complaint = get('SELECT * FROM complaints WHERE id = @id', { id: req.params.id });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  const slaDueAt = getSlaDueDate({ category: complaint.category, priority, fromDate: new Date(complaint.created_at) });
  run('UPDATE complaints SET priority=@priority, sla_due_at=@slaDueAt, updated_at=@now WHERE id=@id', {
    id: complaint.id, priority, slaDueAt: slaDueAt.toISOString(), now: new Date().toISOString(),
  });
  logEvent(complaint.id, 'PRIORITY_CHANGE', actorName || 'Ops Staff', `${complaint.priority} → ${priority} (SLA recalculated)`);

  const updated = get('SELECT * FROM complaints WHERE id = @id', { id: complaint.id });
  res.json({ complaint: updated });
});

// ---------------------------------------------------------------------
// POST /api/complaints/:id/notes — Step 5: add manual note to history
// ---------------------------------------------------------------------
router.post('/:id/notes', (req, res) => {
  const { note, actorName } = req.body;
  const complaint = get('SELECT * FROM complaints WHERE id = @id', { id: req.params.id });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  if (!note || !note.trim()) return res.status(400).json({ error: 'note is required' });

  logEvent(complaint.id, 'NOTE_ADDED', actorName || 'Ops Staff', note.trim());
  run('UPDATE complaints SET updated_at=@now WHERE id=@id', { id: complaint.id, now: new Date().toISOString() });

  res.status(201).json({ ok: true });
});

export default router;

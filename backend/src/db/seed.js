import { nanoid } from 'nanoid';
import { all, get, run } from './index.js';
import { calculateChargeableWeight } from '../services/chargeableWeight.js';

const USERS = [
  { name: 'Aanya Rao', email: 'aanya.rao@cargo-ops.internal', role: 'ADMIN' },
  { name: 'Karthik Iyer', email: 'karthik.iyer@cargo-ops.internal', role: 'OPS_STAFF' },
  { name: 'Meera Pillai', email: 'meera.pillai@cargo-ops.internal', role: 'OPS_STAFF' },
  { name: 'Rohan Das', email: 'rohan.das@cargo-ops.internal', role: 'DOC_EXECUTIVE' },
  { name: 'Sana Sheikh', email: 'sana.sheikh@cargo-ops.internal', role: 'WAREHOUSE_STAFF' },
  { name: 'Vikram Nair', email: 'vikram.nair@cargo-ops.internal', role: 'ACCOUNTS_STAFF' },
  { name: 'Leela Menon', email: 'leela.menon@cargo-ops.internal', role: 'PARTNER_MANAGER' },
  { name: 'Global Freight Exports Pvt Ltd', email: 'ops@globalfreightexports.com', role: 'EXPORTER' },
  { name: 'Pacific Rim Importers', email: 'logistics@pacificrimimp.com', role: 'IMPORTER' },
  { name: 'Swift Cargo Agents', email: 'desk@swiftcargoagents.com', role: 'AGENT' },
];

const SHIPMENTS = [
  {
    awb: '098-4471 0023', origin: 'DEL', originLat: 28.5562, originLng: 77.1000,
    dest: 'JFK', destLat: 40.6413, destLng: -73.7781,
    shipper: 'Global Freight Exports Pvt Ltd', consignee: 'Pacific Rim Importers',
    commodity: 'Pharmaceuticals (temperature controlled)', pieces: 12,
    weight: 480, l: 60, w: 50, h: 45, milestone: 'IN_TRANSIT', etaOffsetHours: -30,
  },
  {
    awb: '098-4471 0098', origin: 'BOM', originLat: 19.0896, originLng: 72.8656,
    dest: 'LHR', destLat: 51.4700, destLng: -0.4543,
    shipper: 'Global Freight Exports Pvt Ltd', consignee: 'Swift Cargo Agents',
    commodity: 'Industrial machine parts', pieces: 4,
    weight: 1250, l: 120, w: 100, h: 90, milestone: 'CUSTOMS', etaOffsetHours: 6,
  },
  {
    awb: '098-4471 0145', origin: 'MAA', originLat: 12.9941, originLng: 80.1709,
    dest: 'DXB', destLat: 25.2532, destLng: 55.3657,
    shipper: 'Swift Cargo Agents', consignee: 'Pacific Rim Importers',
    commodity: 'Textiles', pieces: 30,
    weight: 620, l: 80, w: 60, h: 55, milestone: 'DELIVERED', etaOffsetHours: -72,
  },
  {
    awb: '098-4471 0201', origin: 'BLR', originLat: 13.1986, originLng: 77.7066,
    dest: 'SIN', destLat: 1.3644, destLng: 103.9915,
    shipper: 'Global Freight Exports Pvt Ltd', consignee: 'Pacific Rim Importers',
    commodity: 'Electronics components', pieces: 8,
    weight: 95, l: 50, w: 40, h: 35, milestone: 'ARRIVED', etaOffsetHours: -4,
  },
];

const COMPLAINT_TEMPLATES = [
  {
    category: 'DELAY', isClaim: false, source: 'CUSTOMER_PORTAL',
    description: 'Shipment was expected to arrive 30 hours ago and tracking still shows IN_TRANSIT with no update from the carrier.',
    raisedBy: { name: 'Pacific Rim Importers', email: 'logistics@pacificrimimp.com' },
    shipmentIdx: 0, ageHours: 20,
  },
  {
    category: 'DAMAGE', isClaim: true, claimAmount: 8500, source: 'AGENT_PORTAL',
    description: 'Two crates arrived with visible crushing on one side; machine housing appears dented. Photos attached at warehouse intake.',
    raisedBy: { name: 'Swift Cargo Agents', email: 'desk@swiftcargoagents.com' },
    shipmentIdx: 1, ageHours: 50,
  },
  {
    category: 'MISSING_PACKAGE', isClaim: true, claimAmount: 1200, source: 'CUSTOMER_PORTAL',
    description: 'Manifest shows 30 pieces but only 28 were received at destination warehouse. Two cartons of textiles unaccounted for.',
    raisedBy: { name: 'Pacific Rim Importers', email: 'logistics@pacificrimimp.com' },
    shipmentIdx: 2, ageHours: 5,
  },
  {
    category: 'BILLING_ISSUE', isClaim: true, claimAmount: 340, source: 'EMAIL',
    description: 'Invoice charges chargeable weight of 1250kg but our own measurement gives a lower volumetric figure. Requesting recalculation and credit note.',
    raisedBy: { name: 'Global Freight Exports Pvt Ltd', email: 'ops@globalfreightexports.com' },
    shipmentIdx: 1, ageHours: 90,
  },
  {
    category: 'DOCUMENTATION_ISSUE', isClaim: false, source: 'CRM',
    description: 'Consignee name on the airway bill is misspelled, customs is holding clearance until a corrected AWB copy is issued.',
    raisedBy: { name: 'Pacific Rim Importers', email: 'logistics@pacificrimimp.com' },
    shipmentIdx: 1, ageHours: 8,
  },
  {
    category: 'DELAY', isClaim: false, source: 'PHONE',
    description: 'Connecting flight missed due to weather diversion; consignee needs updated ETA for warehouse staffing.',
    raisedBy: { name: 'Pacific Rim Importers', email: 'logistics@pacificrimimp.com' },
    shipmentIdx: 3, ageHours: 2,
  },
];

function priorityFor(category, isClaim, claimAmount, ageHours) {
  if (category === 'MISSING_PACKAGE') return 'CRITICAL';
  if (category === 'DAMAGE' && isClaim && claimAmount > 5000) return 'CRITICAL';
  if (category === 'DAMAGE' && isClaim) return 'HIGH';
  if (category === 'DELAY' && ageHours > 24) return 'HIGH';
  if (category === 'DOCUMENTATION_ISSUE') return 'HIGH';
  return 'MEDIUM';
}

export function seedIfEmpty() {
  const existing = all('SELECT COUNT(*) as count FROM users')[0]?.count || 0;
  if (existing > 0) return;

  console.log('[seed] empty database detected, seeding demo data...');

  const userIds = {};
  for (const u of USERS) {
    const id = `usr_${nanoid(10)}`;
    userIds[u.name] = id;
    run('INSERT INTO users (id, name, email, role, created_at) VALUES (@id, @name, @email, @role, @createdAt)', {
      id, name: u.name, email: u.email, role: u.role, createdAt: new Date().toISOString(),
    });
  }

  const shipmentIds = [];
  for (const s of SHIPMENTS) {
    const id = `shp_${nanoid(10)}`;
    shipmentIds.push(id);
    const cw = calculateChargeableWeight({ lengthCm: s.l, widthCm: s.w, heightCm: s.h, actualWeightKg: s.weight, pieces: 1 });
    const eta = new Date(Date.now() + s.etaOffsetHours * 60 * 60 * 1000).toISOString();
    run(
      `INSERT INTO shipments (
        id, awb_number, origin_code, origin_lat, origin_lng, dest_code, dest_lat, dest_lng,
        shipper_name, consignee_name, commodity, pieces, gross_weight_kg,
        length_cm, width_cm, height_cm, chargeable_weight_kg, milestone_status, eta, created_at, updated_at
      ) VALUES (
        @id, @awb, @origin, @originLat, @originLng, @dest, @destLat, @destLng,
        @shipper, @consignee, @commodity, @pieces, @weight,
        @l, @w, @h, @chargeableWeight, @milestone, @eta, @createdAt, @updatedAt
      )`,
      {
        id, awb: s.awb, origin: s.origin, originLat: s.originLat, originLng: s.originLng,
        dest: s.dest, destLat: s.destLat, destLng: s.destLng,
        shipper: s.shipper, consignee: s.consignee, commodity: s.commodity, pieces: s.pieces, weight: s.weight,
        l: s.l, w: s.w, h: s.h, chargeableWeight: cw.chargeableWeightKg, milestone: s.milestone, eta,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
    );
  }

  const year = new Date().getFullYear();
  let seq = 1;

  for (const t of COMPLAINT_TEMPLATES) {
    const id = `cmp_${nanoid(12)}`;
    const referenceCode = `CCT-${year}-${String(seq++).padStart(6, '0')}`;
    const createdAt = new Date(Date.now() - t.ageHours * 60 * 60 * 1000);
    const priority = priorityFor(t.category, t.isClaim, t.claimAmount || 0, t.ageHours);
    const slaHours = { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 48 }[priority];
    const slaDueAt = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
    const shipment = SHIPMENTS[t.shipmentIdx];
    const shipmentId = shipmentIds[t.shipmentIdx];

    const status = t.ageHours > 48 ? 'INVESTIGATING' : (t.ageHours > 12 ? 'ACKNOWLEDGED' : 'OPEN');
    const owner = Object.entries(userIds).find(([name]) =>
      ['Karthik Iyer', 'Meera Pillai', 'Rohan Das', 'Vikram Nair', 'Sana Sheikh'][seq % 5] === name
    );

    run(
      `INSERT INTO complaints (
        id, reference_code, shipment_id, awb_number, category, description,
        is_claim, claim_amount, claim_currency, priority, status, source,
        raised_by_id, raised_by_name, raised_by_email, owner_id, owner_name,
        sla_due_at, ai_summary, ai_recommendation, ai_sentiment, created_at, updated_at
      ) VALUES (
        @id, @referenceCode, @shipmentId, @awb, @category, @description,
        @isClaim, @claimAmount, 'USD', @priority, @status, @source,
        NULL, @raisedByName, @raisedByEmail, NULL, NULL,
        @slaDueAt, @aiSummary, @aiRecommendation, @aiSentiment, @createdAt, @updatedAt
      )`,
      {
        id, referenceCode, shipmentId, awb: shipment.awb, category: t.category, description: t.description,
        isClaim: t.isClaim ? 1 : 0, claimAmount: t.claimAmount || null,
        priority, status, source: t.source,
        raisedByName: t.raisedBy.name, raisedByEmail: t.raisedBy.email,
        slaDueAt: slaDueAt.toISOString(),
        aiSummary: `${t.category.replace('_', ' ')} reported on AWB ${shipment.awb}. Priority: ${priority}.`,
        aiRecommendation: 'Review case details and assign appropriate owner for resolution.',
        aiSentiment: priority === 'CRITICAL' ? 'urgent' : 'neutral',
        createdAt: createdAt.toISOString(), updatedAt: createdAt.toISOString(),
      }
    );

    run(
      `INSERT INTO complaint_events (id, complaint_id, event_type, actor_name, detail, created_at)
       VALUES (@id, @complaintId, 'CREATED', @actorName, @detail, @createdAt)`,
      {
        id: `evt_${nanoid(10)}`, complaintId: id, actorName: t.raisedBy.name,
        detail: `${t.category} reported via ${t.source}. Priority auto-set to ${priority}.`,
        createdAt: createdAt.toISOString(),
      }
    );
  }

  console.log(`[seed] created ${USERS.length} users, ${SHIPMENTS.length} shipments, ${COMPLAINT_TEMPLATES.length} complaints.`);
}

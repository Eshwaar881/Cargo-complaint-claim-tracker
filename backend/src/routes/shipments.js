import { Router } from 'express';
import { all, get } from '../db/index.js';

const router = Router();

// GET /api/shipments?awb=XXXX — used by complaint intake form to pull context
router.get('/', (req, res) => {
  const { awb, search } = req.query;
  if (awb) {
    const shipment = get('SELECT * FROM shipments WHERE awb_number = @awb', { awb });
    return res.json({ shipments: shipment ? [shipment] : [] });
  }
  if (search) {
    const shipments = all(
      `SELECT * FROM shipments WHERE awb_number LIKE @q OR shipper_name LIKE @q OR consignee_name LIKE @q LIMIT 20`,
      { q: `%${search}%` }
    );
    return res.json({ shipments });
  }
  const shipments = all('SELECT * FROM shipments ORDER BY created_at DESC LIMIT 50');
  res.json({ shipments });
});

router.get('/:id', (req, res) => {
  const shipment = get('SELECT * FROM shipments WHERE id = @id', { id: req.params.id });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  res.json({ shipment });
});

export default router;

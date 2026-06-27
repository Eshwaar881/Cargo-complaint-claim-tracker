import { Router } from 'express';
import { calculateChargeableWeight } from '../services/chargeableWeight.js';

const router = Router();

// POST /api/chargeable-weight — explicit fallback module, also used to
// validate billing/damage claims against shipment data.
router.post('/', (req, res) => {
  try {
    const { lengthCm, widthCm, heightCm, actualWeightKg, pieces } = req.body;
    const result = calculateChargeableWeight({
      lengthCm: Number(lengthCm),
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
      actualWeightKg: Number(actualWeightKg),
      pieces: pieces ? Number(pieces) : 1,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

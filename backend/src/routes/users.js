import { Router } from 'express';
import { all } from '../db/index.js';

const router = Router();

// GET /api/users?role=OPS_STAFF — used to populate "assign to" dropdowns
router.get('/', (req, res) => {
  const { role } = req.query;
  const users = role
    ? all('SELECT * FROM users WHERE role = @role ORDER BY name', { role })
    : all('SELECT * FROM users ORDER BY role, name');
  res.json({ users });
});

export default router;

import { Router } from 'express';
import { query } from '../db/neon.js';

const router = Router();

// Fixed Manager Credentials
const MANAGER_EMAIL = 'psm@nxtwave.in';
const MANAGER_PASSWORD = 'nxtwave123!';

// POST /api/auth/login-manager
router.post('/login-manager', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email === MANAGER_EMAIL && password === MANAGER_PASSWORD) {
    return res.json({
      user: {
        id: 'mgr_fixed_01',
        name: 'Manager',
        email: MANAGER_EMAIL,
        role: 'manager'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid manager credentials' });
});

// POST /api/auth/register-customer
router.post('/register-customer', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (email.toLowerCase() === MANAGER_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot register with manager email' });
  }

  try {
    // Check if email already exists
    const checkRes = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Insert into Neon DB
    const insertRes = await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase(), password]
    );

    const user = insertRes.rows[0];
    res.status(201).json({
      user: {
        id: `cust_${user.id}`,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error registering customer:', err);
    res.status(500).json({ error: 'Failed to register customer in Neon database. Please make sure DATABASE_URL is configured.' });
  }
});

// POST /api/auth/login-customer
router.post('/login-customer', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const resDb = await query(
      'SELECT * FROM users WHERE email = $1 AND password = $2 AND role = $3',
      [email.toLowerCase(), password, 'customer']
    );

    if (resDb.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid customer email or password' });
    }

    const user = resDb.rows[0];
    res.json({
      user: {
        id: `cust_${user.id}`,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error logging in customer:', err);
    res.status(500).json({ error: 'Failed to verify login with Neon database. Please check connection settings.' });
  }
});

export default router;

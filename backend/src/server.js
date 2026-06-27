import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import complaintsRouter from './routes/complaints.js';
import shipmentsRouter from './routes/shipments.js';
import chargeableWeightRouter from './routes/chargeableWeight.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import { initNeon } from './db/neon.js';
import { startSlaWatcher } from './jobs/slaWatcher.js';
import { isAiEnabled } from './services/aiTriage.js';
import { isEmailEnabled } from './services/notifications.js';
import './db/index.js'; // ensures schema is applied + seed runs on boot
import { seedIfEmpty } from './db/seed.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// Initialize Neon database users table on startup
initNeon().catch(err => console.error("Neon init error in server.js:", err));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    aiEnabled: isAiEnabled(),
    emailEnabled: isEmailEnabled(),
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/chargeable-weight', chargeableWeightRouter);
app.use('/api/users', usersRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

seedIfEmpty();
startSlaWatcher();

app.listen(PORT, () => {
  console.log(`\n🛫  Cargo Complaint & Claim Tracker API running on http://localhost:${PORT}`);
  console.log(`   AI triage: ${isAiEnabled() ? 'ENABLED (Gemini)' : 'DISABLED — using rule-based fallback'}`);
  console.log(`   Email: ${isEmailEnabled() ? 'ENABLED (SendGrid)' : 'DISABLED — notifications logged only'}\n`);
});

// ---- ADDITIONAL ROUTES FOR V2 MODULES ----
// These extend the original server with routes for all 21+ modules.
// Import and mount below.

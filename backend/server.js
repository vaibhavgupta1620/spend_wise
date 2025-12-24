// backend/server.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns').promises;
const path = require('path');
const process = require('process');

const app = express();

/* ------------------------------------------------------------------
   CORS CONFIG (UPDATED FOR RENDER)
------------------------------------------------------------------ */

const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://spend-wise-kjuq.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow REST tools / server-to-server calls
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

console.log('[server] CORS allowed origins:', ALLOWED_ORIGINS);

/* ------------------------------------------------------------------
   MIDDLEWARE
------------------------------------------------------------------ */

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.path} auth=${!!req.headers.authorization}`);
  next();
});

/* ------------------------------------------------------------------
   ROUTES
------------------------------------------------------------------ */

const groupsRouter = require('./routes/groups');
const groupMembersRouter = require('./routes/groupMembers');
const approvalRulesRouter = require('./routes/approvalRules');

const expensesRouter = require('./routes/expenses');
const expenseApprovalsRouter = require('./routes/expenseApprovals');

const tripsRouter = require('./routes/trips');
const tripMembersRouter = require('./routes/tripMembers');
const tripExpensesRouter = require('./routes/tripExpenses');
const tripSettlementsRouter = require('./routes/tripSettlements');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

/* ------------------------------------------------------------------
   ADMIN / AUTH-POPULATE (SAFE LOAD)
------------------------------------------------------------------ */

let populateUserFromJwt = null;
let adminRouter = null;

try {
  populateUserFromJwt = require('./middleware/auth-populate');
  adminRouter = require('./routes/admin');
} catch (err) {
  console.error('[server] admin/auth-populate load failed:\n', err.stack || err);
}

/* ------------------------------------------------------------------
   DNS SRV CHECK (MongoDB Atlas)
------------------------------------------------------------------ */

async function checkSrvIfNeeded(uri) {
  if (!uri || !uri.startsWith('mongodb+srv://')) return true;

  try {
    let host = uri.split('@')[1] || uri;
    host = host.split('/')[0].split('?')[0];

    console.log('Detected SRV host part:', host);

    const records = await dns.resolveSrv(host);
    console.log(
      'SRV records found:',
      records.map(r => `${r.name}:${r.port}`).join(', ')
    );

    return true;
  } catch (err) {
    console.error('SRV DNS resolution failed:', err.code || err.message);
    return false;
  }
}

/* ------------------------------------------------------------------
   MONGODB CONNECTION (RENDER SAFE)
------------------------------------------------------------------ */

async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spendwise';

  if (!uri) {
    throw new Error('MONGODB_URI not defined');
  }

  if (uri.startsWith('mongodb+srv://')) {
    const srvOk = await checkSrvIfNeeded(uri);
    if (!srvOk) throw new Error('MongoDB SRV lookup failed');
  }

  console.log('Connecting to MongoDB...');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log('MongoDB connected ✅');
}

/* ------------------------------------------------------------------
   API ROUTE MOUNTING
------------------------------------------------------------------ */

app.use('/api/groups', groupsRouter);
app.use('/api/groups', groupMembersRouter);
app.use('/api/groups', approvalRulesRouter);

app.use('/api/expenses', expensesRouter);
app.use('/api/expense-approvals', expenseApprovalsRouter);

app.use('/api/trips', tripsRouter);
app.use('/api/trips', tripMembersRouter);
app.use('/api/trips', tripExpensesRouter);
app.use('/api/trips', tripSettlementsRouter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);

if (populateUserFromJwt) app.use(populateUserFromJwt);
if (adminRouter) app.use('/api/admin', adminRouter);

/* ------------------------------------------------------------------
   SERVE FRONTEND (VITE BUILD)
------------------------------------------------------------------ */

const frontendPath = path.join(__dirname, '../frontend/dist');

app.use(express.static(frontendPath));

// React SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ------------------------------------------------------------------
   HEALTH CHECKS
------------------------------------------------------------------ */

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/readiness', (req, res) => {
  res.json({
    ready: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
  });
});

/* ------------------------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------------------------ */

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);

  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

/* ------------------------------------------------------------------
   SERVER STARTUP (RENDER)
------------------------------------------------------------------ */

const PORT = process.env.PORT || 10000;
let server;

async function start() {
  try {
    await connectMongo();

    server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

/* ------------------------------------------------------------------
   GRACEFUL SHUTDOWN
------------------------------------------------------------------ */

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down...`);

  try {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.connection.close(false);
    process.exit(0);
  } catch (err) {
    console.error('Shutdown error:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// backend/server.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

/* ------------------------------------------------------------------
   CORS (RENDER SAFE – NO BLOCKING)
------------------------------------------------------------------ */

app.use(
  cors({
    origin: true,        // allow same-origin + render domain
    credentials: true,
  })
);
app.options('*', cors());

console.log('[server] CORS enabled');

/* ------------------------------------------------------------------
   MIDDLEWARE
------------------------------------------------------------------ */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

/* ------------------------------------------------------------------
   ROUTES
------------------------------------------------------------------ */

app.use('/api/groups', require('./routes/groups'));
app.use('/api/groups', require('./routes/groupMembers'));
app.use('/api/groups', require('./routes/approvalRules'));

app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/expense-approvals', require('./routes/expenseApprovals'));

app.use('/api/trips', require('./routes/trips'));
app.use('/api/trips', require('./routes/tripMembers'));
app.use('/api/trips', require('./routes/tripExpenses'));
app.use('/api/trips', require('./routes/tripSettlements'));

app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ------------------------------------------------------------------
   OPTIONAL ADMIN / AUTH POPULATE
------------------------------------------------------------------ */

try {
  const populateUserFromJwt = require('./middleware/auth-populate');
  const adminRouter = require('./routes/admin');

  app.use(populateUserFromJwt);
  app.use('/api/admin', adminRouter);

  console.log('[server] admin routes enabled');
} catch {
  console.log('[server] admin routes not found (safe)');
}

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
   SERVE FRONTEND (client/dist)
------------------------------------------------------------------ */

const clientPath = path.join(__dirname, '../client');

app.use(express.static(clientPath));

// SPA fallback – MUST BE AFTER API ROUTES
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

/* ------------------------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------------------------ */

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

/* ------------------------------------------------------------------
   SERVER STARTUP
------------------------------------------------------------------ */

const PORT = process.env.PORT || 10000;

async function start() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI missing');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected ✅');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const REGISTER_API_URL = process.env.EVALUATION_REGISTER_API_URL || 'http://20.207.122.201/evaluation-service/register';

app.use(cors());
app.use(express.json());

const memoryStore = {
  users: [],
  notifications: [],
};

function isDatabaseConnectionError(err) {
  if (!err) {
    return false;
  }

  const knownCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    '57P01',
    '08001',
    '08006',
    '3D000',
  ];

  return knownCodes.includes(err.code) || /connect|database|ECONN|timeout/i.test(err.message || '');
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'notification_db',
});

const path = require('path');
const frontendDist = path.join(__dirname, '..', 'notification_app_fe', 'dist');

app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

async function logAction(stack, level, pkg, message) {
  try {
    await axios.post('http://20.207.122.201/evaluation-service/logs', {
      stack,
      level,
      package: pkg,
      message
    });
  } catch (err) {
    console.error(`[${level}] [${pkg}] ${message}`, err.message);
  }
}

app.use((req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json;
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    logAction('backend', 'info', 'router', `${req.method} ${req.path} - ${res.statusCode}`).catch(() => {});
    return originalJson.call(this, data);
  };
  
  next();
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, rollNo, accessCode, mobileNo, githubUsername } = req.body;

    if (!email || !name || !rollNo || !accessCode || !mobileNo || !githubUsername) {
      logAction('backend', 'warn', 'auth', 'Missing required fields for registration').catch(() => {});
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let registrationResponse;

    try {
      registrationResponse = await axios.post(REGISTER_API_URL, {
        email,
        name,
        rollNo,
        accessCode,
        mobileNo,
        githubUsername,
      }, {
        timeout: 10000,
      });
    } catch (externalErr) {
      console.error('External registration error:', externalErr.message);
    }

    const clientID = registrationResponse?.data?.clientID || registrationResponse?.data?.clientId || uuidv4();
    const clientSecret = registrationResponse?.data?.clientSecret || registrationResponse?.data?.client_secret || uuidv4();

    const query = `
      INSERT INTO users (email, name, roll_no, client_id, client_secret)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, roll_no
    `;

    let userRecord;

    try {
      const result = await pool.query(query, [email, name, rollNo, clientID, clientSecret]);
      userRecord = result.rows[0];
    } catch (dbErr) {
      if (!isDatabaseConnectionError(dbErr)) {
        throw dbErr;
      }

      const alreadyExists = memoryStore.users.some(
        (user) => user.email === email || user.roll_no === rollNo
      );

      if (alreadyExists) {
        return res.status(409).json({ error: 'User already exists' });
      }

      userRecord = {
        id: uuidv4(),
        email,
        name,
        roll_no: rollNo,
        client_id: clientID,
        client_secret: clientSecret,
      };

      memoryStore.users.push(userRecord);
      logAction('backend', 'warn', 'auth', 'Database unavailable, using in-memory user store').catch(() => {});
    }
    
    logAction('backend', 'info', 'auth', `User registered: ${email}`).catch(() => {});

    res.status(201).json({
      clientID,
      clientSecret,
      message: 'Registration successful',
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        roll_no: userRecord.roll_no,
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    logAction('backend', 'error', 'auth', `Registration failed: ${err.message}`).catch(() => {});
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/token', async (req, res) => {
  try {
    const { email, clientID, clientSecret } = req.body;

    if (!email || !clientID || !clientSecret) {
      logAction('backend', 'warn', 'auth', 'Missing credentials for token generation').catch(() => {});
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const query = `
      SELECT id, email FROM users
      WHERE email = $1 AND client_id = $2 AND client_secret = $3
    `;

    let user;

    try {
      const result = await pool.query(query, [email, clientID, clientSecret]);
      user = result.rows[0];
    } catch (dbErr) {
      if (!isDatabaseConnectionError(dbErr)) {
        throw dbErr;
      }

      user = memoryStore.users.find(
        (item) =>
          item.email === email &&
          item.client_id === clientID &&
          item.client_secret === clientSecret
      );
    }
    
    if (!user) {
      logAction('backend', 'warn', 'auth', `Invalid credentials for ${email}`).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    logAction('backend', 'info', 'auth', `Token generated for: ${email}`).catch(() => {});

    res.status(200).json({
      access_token: token,
      token_type: 'Bearer'
    });
  } catch (err) {
    console.error('Token generation error:', err.message);
    logAction('backend', 'error', 'auth', `Token generation failed: ${err.message}`).catch(() => {});
    res.status(500).json({ error: 'Token generation failed' });
  }
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    logAction('backend', 'warn', 'auth', 'Invalid token').catch(() => {});
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { limit = 10, page = 1, notification_type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, type, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
    `;

    const params = [req.userId];

    if (notification_type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(notification_type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    let rows;

    try {
      const result = await pool.query(query, params);
      rows = result.rows;
    } catch (dbErr) {
      if (!isDatabaseConnectionError(dbErr)) {
        throw dbErr;
      }

      rows = memoryStore.notifications
        .filter((item) => item.user_id === req.userId)
        .filter((item) => (notification_type ? item.type === notification_type : true))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + Number(limit));
    }

    logAction('backend', 'info', 'notifications', `Fetched ${rows.length} notifications for user ${req.userId}`).catch(() => {});

    res.status(200).json({
      notifications: rows.map(row => ({
        ID: row.id,
        Type: row.type,
        Message: row.message,
        IsRead: row.is_read,
        Timestamp: row.created_at
      }))
    });
  } catch (err) {
    console.error('Notification fetch error:', err.message);
    logAction('backend', 'error', 'notifications', `Failed to fetch notifications: ${err.message}`).catch(() => {});
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const query = `
      UPDATE notifications
      SET is_read = $1
      WHERE id = $2 AND user_id = $3
      RETURNING id, type, message, is_read
    `;

    let updatedNotification;

    try {
      const result = await pool.query(query, [isRead, id, req.userId]);
      updatedNotification = result.rows[0];
    } catch (dbErr) {
      if (!isDatabaseConnectionError(dbErr)) {
        throw dbErr;
      }

      const existing = memoryStore.notifications.find(
        (item) => item.id === id && item.user_id === req.userId
      );

      if (existing) {
        existing.is_read = Boolean(isRead);
        updatedNotification = existing;
      }
    }

    if (!updatedNotification) {
      logAction('backend', 'warn', 'notifications', `Notification not found: ${id}`).catch(() => {});
      return res.status(404).json({ error: 'Notification not found' });
    }

    logAction('backend', 'info', 'notifications', `Notification ${id} marked as ${isRead ? 'read' : 'unread'}`).catch(() => {});

    res.status(200).json({
      ID: updatedNotification.id,
      message: 'Notification updated successfully'
    });
  } catch (err) {
    console.error('Notification update error:', err.message);
    logAction('backend', 'error', 'notifications', `Failed to update notification: ${err.message}`).catch(() => {});
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { stack, level, package: pkg, message } = req.body;

    if (!stack || !level || !pkg || !message) {
      return res.status(400).json({ error: 'Missing required log fields' });
    }

    const logID = uuidv4();
    const query = `
      INSERT INTO logs (id, stack, level, package, message)
      VALUES ($1, $2, $3, $4, $5)
    `;

    try {
      await pool.query(query, [logID, stack, level, pkg, message]);
    } catch (dbErr) {
      if (!isDatabaseConnectionError(dbErr)) {
        throw dbErr;
      }
      console.warn('Database unavailable for logs, accepted log in no-op mode');
    }

    res.status(200).json({
      logID,
      message: 'Log created successfully'
    });
  } catch (err) {
    console.error('Log creation error:', err.message);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Backend is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  logAction('backend', 'fatal', 'error-handler', `Unhandled error: ${err.message}`).catch(() => {});
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  logAction('backend', 'info', 'server', `Backend started on port ${PORT}`).catch(() => {});
});

module.exports = app;

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'notification_db',
});

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        roll_no VARCHAR(50) NOT NULL UNIQUE,
        client_id UUID NOT NULL UNIQUE,
        client_secret UUID NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        type VARCHAR(50) NOT NULL CHECK (type IN ('Event', 'Result', 'Placement')),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Notifications table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stack VARCHAR(50) NOT NULL,
        level VARCHAR(20) NOT NULL,
        package VARCHAR(100),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Logs table created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
      ON notifications(user_id, created_at DESC)
    `);
    console.log('✓ Index: idx_notifications_user_created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_type 
      ON notifications(user_id, type)
    `);
    console.log('✓ Index: idx_notifications_type');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_read 
      ON notifications(user_id, is_read) WHERE is_read = false
    `);
    console.log('✓ Index: idx_notifications_read');

    console.log('\n✓ Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization error:', err.message);
    process.exit(1);
  }
}

initializeDatabase();

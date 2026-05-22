// utils/db.js — thin parameterized wrapper around node-postgres
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Allow boot without a DB so the operator can read the error and configure Railway.
  // eslint-disable-next-line no-console
  console.warn('[db] DATABASE_URL is not set — queries will fail until it is configured.');
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production' && connectionString && !connectionString.includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] idle client error', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function one(text, params) {
  const r = await pool.query(text, params);
  return r.rows[0] || null;
}

async function many(text, params) {
  const r = await pool.query(text, params);
  return r.rows;
}

async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, one, many, tx };

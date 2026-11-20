import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // SEC-004: no statement runs longer than 2 min (import transactions that
  // refresh aggregates raise it to 15 min with SET LOCAL), and a transaction
  // left idle is closed after 1 min so it cannot keep rows such as
  // app_users locked.
  statement_timeout: 120000,
  idle_in_transaction_session_timeout: 60000,
})
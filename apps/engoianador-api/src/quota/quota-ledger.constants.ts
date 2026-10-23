export const SECONDS_PER_DAY = 86_400;
export const ANONYMOUS_KEY = 'anon';
export const GLOBAL_OBJECT_PREFIX = 'global:';
export const NETWORK_OBJECT_PREFIX = 'net:';
export const RESERVATION_SEPARATOR = '|';

export const LEDGER_PATHS = {
  reserve: '/reserve',
  refund: '/refund',
} as const;

export const QUOTA_STATEMENTS = {
  createLedger:
    'CREATE TABLE IF NOT EXISTS ledger (key TEXT NOT NULL, day INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (key, day))',
  createReservations:
    'CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, key TEXT NOT NULL, day INTEGER NOT NULL)',
  purgeLedger: 'DELETE FROM ledger WHERE day < ?',
  purgeReservations: 'DELETE FROM reservations WHERE day < ?',
  selectCount: 'SELECT count FROM ledger WHERE key = ? AND day = ?',
  incrementCount:
    'INSERT INTO ledger (key, day, count) VALUES (?, ?, 1) ON CONFLICT (key, day) DO UPDATE SET count = count + 1',
  insertReservation: 'INSERT OR IGNORE INTO reservations (id, key, day) VALUES (?, ?, ?)',
  selectReservation: 'SELECT key, day FROM reservations WHERE id = ?',
  deleteReservation: 'DELETE FROM reservations WHERE id = ?',
  decrementCount: 'UPDATE ledger SET count = MAX(count - 1, 0) WHERE key = ? AND day = ?',
} as const;

import path from 'node:path';
import fs from 'node:fs';

process.env.NODE_ENV = 'test';
const testDbPath = path.resolve(process.cwd(), 'data', `test_finora_${process.pid}.db`);
process.env.DB_PATH = testDbPath;

// Clean any previous test database for this process
try {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
  if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
} catch {}

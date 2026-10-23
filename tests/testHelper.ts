import path from 'node:path';
import fs from 'node:fs';
import { Server } from 'node:http';

export const TEST_DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'test_finora.db');

import app from '../server/index.ts';
import { db, initDatabase } from '../server/db.ts';

let serverInstance: Server | null = null;
let serverPort = 0;

export async function startTestServer(): Promise<{ baseUrl: string; port: number }> {
  await initDatabase();

  return new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const address = serverInstance!.address() as any;
      serverPort = address.port;
      resolve({ baseUrl: `http://127.0.0.1:${serverPort}`, port: serverPort });
    });
  });
}

export async function stopTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (serverInstance) {
      if (typeof (serverInstance as any).closeAllConnections === 'function') {
        (serverInstance as any).closeAllConnections();
      }
      serverInstance.close(() => {
        serverInstance = null;
        try {
          db.close();
        } catch {}
        try {
          if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
          if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
          if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
        } catch {}
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  token?: string,
  customHeaders?: Record<string, string>
) {
  if (!serverPort) {
    throw new Error('Test server is not running. Call startTestServer() first.');
  }

  const url = `http://127.0.0.1:${serverPort}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    status: response.status,
    headers: response.headers,
    data,
    ok: response.ok,
  };
}

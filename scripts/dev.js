import { spawn } from 'node:child_process';
import process from 'node:process';

console.log('✨ Starting Finora Full-Stack Development Environment...');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

// 1. Start Backend Server
const server = spawn(npxCmd, ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' },
});

// 2. Start Vite Client
const client = spawn(npxCmd, ['vite', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

const cleanup = () => {
  console.log('\n🛑 Shutting down Finora servers...');
  if (isWindows) {
    if (server.pid) spawn('taskkill', ['/pid', server.pid.toString(), '/f', '/t']);
    if (client.pid) spawn('taskkill', ['/pid', client.pid.toString(), '/f', '/t']);
  } else {
    server.kill('SIGINT');
    client.kill('SIGINT');
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`Backend server exited with code ${code}`);
  }
});

client.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`Client server exited with code ${code}`);
  }
});

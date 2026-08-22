const { spawn } = require('child_process');
const http = require('http');

function waitForServer(proc, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const onData = (chunk) => {
      const s = String(chunk || '');
      if (s.includes('DPM Form Server running')) {
        proc.stdout.off('data', onData);
        resolve();
      }
      if (Date.now() > deadline) {
        proc.stdout.off('data', onData);
        reject(new Error('Server did not start within timeout'));
      }
    };
    proc.stdout.on('data', onData);
  });
}

async function simpleGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: 'localhost', port: 3000, path, timeout: 5000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
  });
}

(async () => {
  console.log('Starting dist/server.cjs...');
  const proc = spawn('node', ['dist/server.cjs'], { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');

  proc.stderr.on('data', (d) => console.error('[server stderr]', d));
  proc.on('exit', (code) => console.log('server process exited with', code));

  try {
    await waitForServer(proc, 10000);
    console.log('Server started; checking /api/health');
    const health = await simpleGet('/api/health');
    console.log('/api/health', health.status);

    console.log('Checking admin submissions endpoint without auth (expect 401)');
    const adminResp = await simpleGet('/api/admin/submissions');
    console.log('/api/admin/submissions status:', adminResp.status);

    // Done
    proc.kill();
    if (health.status === 200 && adminResp.status === 401) {
      console.log('Smoke test passed');
      process.exit(0);
    } else {
      console.error('Smoke test failed: unexpected statuses', { health: health.status, admin: adminResp.status });
      process.exit(2);
    }
  } catch (err) {
    console.error('Smoke test error', err);
    proc.kill();
    process.exit(3);
  }
})();

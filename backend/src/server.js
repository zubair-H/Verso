const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 4000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      looks: Array.isArray(parsed.looks) ? parsed.looks : [],
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch {
    return { looks: [], jobs: [] };
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'lookr-backend',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (method === 'GET' && pathname === '/') {
    sendJson(res, 200, {
      ok: true,
      message: 'Lookr backend is running',
      endpoints: [
        'GET /health',
        'GET /v1/looks?deviceId=...',
        'POST /v1/looks',
        'PATCH /v1/looks/:id/favorite',
        'DELETE /v1/looks/:id',
        'POST /v1/generate',
        'GET /v1/jobs/:id',
      ],
    });
    return;
  }

  if (method === 'GET' && pathname === '/v1/looks') {
    const db = readDb();
    const deviceId = url.searchParams.get('deviceId');
    const looks = deviceId ? db.looks.filter((look) => look.deviceId === deviceId) : db.looks;
    sendJson(res, 200, { looks });
    return;
  }

  if (method === 'POST' && pathname === '/v1/looks') {
    try {
      const body = await parseBody(req);
      const { selfie, reference, result, elements, deviceId = 'anonymous' } = body;

      if (!selfie || !reference || !result || !Array.isArray(elements)) {
        sendJson(res, 400, {
          error: 'Missing required fields: selfie, reference, result, elements[]',
        });
        return;
      }

      const db = readDb();
      const look = {
        id: randomUUID(),
        selfie,
        reference,
        result,
        elements,
        deviceId,
        isFavorite: false,
        createdAt: Date.now(),
      };

      db.looks.unshift(look);
      writeDb(db);
      sendJson(res, 201, { look });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Invalid request' });
    }
    return;
  }

  if (method === 'PATCH' && pathname.match(/^\/v1\/looks\/[^/]+\/favorite$/)) {
    const id = pathname.split('/')[3];

    try {
      const body = await parseBody(req);
      const db = readDb();
      const idx = db.looks.findIndex((l) => l.id === id);

      if (idx === -1) {
        notFound(res);
        return;
      }

      const nextValue =
        typeof body.isFavorite === 'boolean' ? body.isFavorite : !db.looks[idx].isFavorite;

      db.looks[idx] = { ...db.looks[idx], isFavorite: nextValue };
      writeDb(db);
      sendJson(res, 200, { look: db.looks[idx] });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Invalid request' });
    }
    return;
  }

  if (method === 'DELETE' && pathname.match(/^\/v1\/looks\/[^/]+$/)) {
    const id = pathname.split('/')[3];
    const db = readDb();
    const originalLength = db.looks.length;
    db.looks = db.looks.filter((l) => l.id !== id);

    if (db.looks.length === originalLength) {
      notFound(res);
      return;
    }

    writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === 'POST' && pathname === '/v1/generate') {
    try {
      const body = await parseBody(req);
      const { selfie, look, elements } = body;

      if (!selfie || !look || !Array.isArray(elements) || elements.length === 0) {
        sendJson(res, 400, { error: 'Missing required fields: selfie, look, elements[]' });
        return;
      }

      const db = readDb();
      const job = {
        id: randomUUID(),
        status: 'completed',
        selfie,
        look,
        elements,
        resultUrl: look,
        createdAt: Date.now(),
        completedAt: Date.now(),
      };

      db.jobs.unshift(job);
      writeDb(db);
      sendJson(res, 201, { job });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Invalid request' });
    }
    return;
  }

  if (method === 'GET' && pathname.match(/^\/v1\/jobs\/[^/]+$/)) {
    const id = pathname.split('/')[3];
    const db = readDb();
    const job = db.jobs.find((j) => j.id === id);

    if (!job) {
      notFound(res);
      return;
    }

    sendJson(res, 200, { job });
    return;
  }

  notFound(res);
});

server.listen(PORT, () => {
  console.log(`Lookr backend running on http://localhost:${PORT}`);
});

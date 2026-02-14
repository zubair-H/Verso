const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const idx = line.indexOf('=');
      if (idx < 0) continue;

      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');

      if (!key) {
        // Graceful fallback for malformed lines like "=AIza..."
        if (!process.env.GEMINI_API_KEY && value) {
          process.env.GEMINI_API_KEY = value;
        }
        continue;
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 4000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || '';
let cachedGeminiModels = null;

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      looks: Array.isArray(parsed.looks) ? parsed.looks : [],
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
    };
  } catch {
    return { looks: [], jobs: [], analyses: [] };
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
      if (data.length > 12_000_000) {
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

function extractJsonObject(text) {
  if (!text) return null;

  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  return null;
}

function extensionToMime(url) {
  const lowered = url.toLowerCase();
  if (lowered.endsWith('.png')) return 'image/png';
  if (lowered.endsWith('.webp')) return 'image/webp';
  if (lowered.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function imageUrlToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Image fetch failed (${response.status})`);
  }

  const contentType = response.headers.get('content-type') || extensionToMime(imageUrl);
  const arr = await response.arrayBuffer();
  const buffer = Buffer.from(arr);
  return { mimeType: contentType.split(';')[0], base64: buffer.toString('base64') };
}

function buildFallbackAnalysis(attributes) {
  const normalized = Array.isArray(attributes) ? attributes : [];
  const summary = normalized.length
    ? `Detected a clear portrait-style image. Focused analysis on: ${normalized.join(', ')}.`
    : 'Detected a portrait-style image with balanced lighting and visible facial detail.';

  return {
    description: summary,
    attributeInsights: normalized.map((attribute) => ({
      attribute,
      insight: `Placeholder insight for ${attribute}. Connect an AI key to get real visual analysis.`,
      confidence: 0.35,
    })),
    source: 'fallback',
  };
}

async function analyzeWithGemini({ imageBase64, imageMimeType, imageUrl, attributes }) {
  let inlineData = imageBase64;
  let mimeType = imageMimeType || 'image/jpeg';

  if (!inlineData && imageUrl) {
    const converted = await imageUrlToBase64(imageUrl);
    inlineData = converted.base64;
    mimeType = converted.mimeType || mimeType;
  }

  if (!inlineData) {
    throw new Error('Provide imageBase64 or imageUrl');
  }

  const attributeList = attributes.length ? attributes.join(', ') : 'general style';
  const prompt = [
    'You are a professional style consultant and image analyst.',
    `Analyze this image with emphasis on these user-selected attributes: ${attributeList}.`,
    'Return strict JSON with this shape:',
    '{',
    '  "description": "2-4 sentences overall summary",',
    '  "attributeInsights": [',
    '    {"attribute":"string","insight":"string","confidence":0.0}',
    '  ]',
    '}',
    'Rules:',
    '- Keep insights practical and concise.',
    '- Confidence should be between 0 and 1.',
    '- Only return valid JSON.',
  ].join('\n');

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: inlineData } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  if (!cachedGeminiModels) {
    try {
      const listResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(GEMINI_API_KEY)}`
      );
      const listText = await listResp.text();
      if (listResp.ok) {
        const parsedList = JSON.parse(listText);
        cachedGeminiModels = (parsedList.models || [])
          .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m) => String(m.name || '').replace(/^models\//, ''))
          .filter(Boolean);
      } else {
        cachedGeminiModels = [];
      }
    } catch {
      cachedGeminiModels = [];
    }
  }

  const modelCandidates = Array.from(
    new Set([
      GEMINI_MODEL,
      ...(cachedGeminiModels || []),
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
    ].filter(Boolean))
  );

  let parsed = null;
  let lastError = null;

  for (const model of modelCandidates) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const rawText = await resp.text();
    if (!resp.ok) {
      lastError = `Model ${model} failed (${resp.status}): ${rawText.slice(0, 180)}`;
      continue;
    }

    try {
      parsed = JSON.parse(rawText);
      lastError = null;
      break;
    } catch {
      lastError = `Model ${model} returned invalid JSON envelope`;
    }
  }

  if (!parsed) {
    throw new Error(lastError || 'Gemini failed for all candidate models');
  }

  const modelText = (parsed?.candidates || [])
    .flatMap((c) => c?.content?.parts || [])
    .map((p) => p?.text)
    .filter(Boolean)
    .join('\n');

  const analysis = extractJsonObject(modelText);
  if (!analysis || typeof analysis.description !== 'string' || !Array.isArray(analysis.attributeInsights)) {
    throw new Error('Gemini response missing expected analysis JSON');
  }

  return {
    description: analysis.description,
    attributeInsights: analysis.attributeInsights
      .filter((item) => item && typeof item.attribute === 'string' && typeof item.insight === 'string')
      .map((item) => ({
        attribute: item.attribute,
        insight: item.insight,
        confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : 0.5,
      })),
    source: 'gemini',
  };
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
        'POST /v1/analyze',
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

  if (method === 'POST' && pathname === '/v1/analyze') {
    try {
      const body = await parseBody(req);
      const {
        imageUrl,
        imageBase64,
        imageMimeType = 'image/jpeg',
        attributes = [],
        deviceId = 'anonymous',
      } = body;

      if (!imageUrl && !imageBase64) {
        sendJson(res, 400, { error: 'Missing required image input: imageUrl or imageBase64' });
        return;
      }

      if (!Array.isArray(attributes)) {
        sendJson(res, 400, { error: 'attributes must be an array of strings' });
        return;
      }

      let analysis;
      if (GEMINI_API_KEY) {
        try {
          analysis = await analyzeWithGemini({
            imageBase64,
            imageMimeType,
            imageUrl,
            attributes,
          });
        } catch (err) {
          analysis = {
            ...buildFallbackAnalysis(attributes),
            warning: err.message || 'AI provider failed, returned fallback.',
          };
        }
      } else {
        analysis = buildFallbackAnalysis(attributes);
      }

      const db = readDb();
      const item = {
        id: randomUUID(),
        deviceId,
        imageUrl: imageUrl || null,
        attributes,
        analysis,
        createdAt: Date.now(),
      };
      db.analyses.unshift(item);
      writeDb(db);

      sendJson(res, 201, { analysis: item });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Invalid request' });
    }
    return;
  }

  notFound(res);
});

server.listen(PORT, () => {
  console.log(`Lookr backend running on http://localhost:${PORT}`);
});

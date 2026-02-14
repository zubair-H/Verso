// server.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // ✅ NEW

// ============================================================================
// ENV LOADER
// ============================================================================
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvFile();

// ============================================================================
// CONFIG
// ============================================================================
const PORT = Number(process.env.PORT || 4000);
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

if (!globalThis.fetch) throw new Error('This server requires Node 18+ (fetch not found).');

const REPLICATE_HAIR_MASK_VERSION =
  'b335dc1b693b2de88040736eb426702adfc2f0c869ae9dba3569bac1beb9c0f6'; // hadilq/hair-segment

const REPLICATE_SDXL_INPAINT_VERSION =
  'aca001c8b137114d5e594c68f7084ae6d82f364758aab8d997b233e8ef3c4d93'; // sepal/sdxl-inpainting

// ============================================================================
// PRESETS
// ============================================================================
const PRESETS = [
  {
    id: 'buzz',
    name: 'Buzz Cut',
    prompt:
      'photorealistic buzz cut hairstyle, natural scalp texture, realistic short stubble hair, match head shape, preserve lighting and skin tone',
  },
  {
    id: 'taper-fade',
    name: 'Low Taper Fade',
    prompt:
      'photorealistic low taper fade haircut, clean lineup, natural hair texture, realistic fade gradient, preserve identity and lighting',
  },
  {
    id: 'curly-top',
    name: 'Curly Top',
    prompt:
      'photorealistic short curly hair on top, natural curls, slightly textured, realistic strand detail, preserve face and lighting',
  },
  {
    id: 'blonde-dye',
    name: 'Blonde Dye (Natural)',
    prompt:
      'photorealistic hair recolor to natural blonde, preserve original hair texture, keep realistic highlights and shadows, no flat color fill',
  },
  {
    id: 'jet-black',
    name: 'Jet Black',
    prompt:
      'photorealistic hair recolor to jet black, preserve original hair texture, realistic shine and shadows, no artifacts',
  },
];

function buildHairPrompt(presetPrompt) {
  return [
    presetPrompt,
    'ONLY modify hair in the masked region.',
    'Do NOT change the face, eyes, eyebrows, nose, lips, teeth, skin, background, or clothing.',
    'Keep the same identity, head angle, lighting, and camera perspective.',
    'Photorealistic, seamless hairline blending.',
  ].join(' ');
}

// ============================================================================
// HELPERS
// ============================================================================
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 12_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;
  if (pathname === '/') pathname = '/index.html';

  const safeBase = path.join(__dirname, 'public');
  const filePath = path.normalize(path.join(safeBase, pathname));
  if (!filePath.startsWith(safeBase)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === '.html'
      ? 'text/html; charset=utf-8'
      : ext === '.js'
        ? 'application/javascript; charset=utf-8'
        : ext === '.css'
          ? 'text/css; charset=utf-8'
          : 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

function isDataUri(s) {
  return typeof s === 'string' && s.startsWith('data:');
}

// ✅ URL -> Data URI (reliable for Unsplash/Pinterest/CDNs)
async function urlToDataUri(imageUrl) {
  let finalUrl = imageUrl;

  if (finalUrl.includes('images.unsplash.com')) {
    const u = new URL(finalUrl);
    // cap size for speed & reliability
    u.searchParams.set('w', u.searchParams.get('w') || '768');
    finalUrl = u.toString();
  }

  const resp = await fetch(finalUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!resp.ok) throw new Error(`Image fetch failed (${resp.status})`);

  const contentType = (resp.headers.get('content-type') || 'image/jpeg').split(';')[0];
  const arr = await resp.arrayBuffer();
  const buf = Buffer.from(arr);
  const base64 = buf.toString('base64');

  return `data:${contentType};base64,${base64}`;
}

// ✅ Fetch buffers for mask cleanup
async function fetchBuffer(urlOrDataUri) {
  if (isDataUri(urlOrDataUri)) {
    const base64 = urlOrDataUri.split(',')[1] || '';
    return Buffer.from(base64, 'base64');
  }
  const resp = await fetch(urlOrDataUri, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);
  const arr = await resp.arrayBuffer();
  return Buffer.from(arr);
}

// ✅ QUICK FIX: clean mask so it cannot repaint face
// - threshold to pure B/W
// - keep only top 60% (hair lives there for most portraits)
// - blur slightly to feather hairline
async function cleanHairMaskToDataUri(maskUrl, { keepTop = 0.60 } = {}) {
  const maskBuf = await fetchBuffer(maskUrl);
  const img = sharp(maskBuf);
  const meta = await img.metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;

  const cutY = Math.floor(h * keepTop);
  const bottomH = h - cutY;

  // black rectangle to cover lower region of mask
  const bottomBlack = await sharp({
    create: { width: w, height: bottomH, channels: 1, background: { r: 0, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();

  const cleaned = await sharp(maskBuf)
    .ensureAlpha()
    .grayscale()
    .threshold(160) // stricter threshold prevents gray bleed into face
    .composite([{ input: bottomBlack, top: cutY, left: 0, blend: 'over' }])
    .blur(1.2) // feather edges so hairline blends better
    .png()
    .toBuffer();

  return `data:image/png;base64,${cleaned.toString('base64')}`;
}

async function createReplicatePrediction({ version, input }) {
  const resp = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version, input }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`Replicate create failed (${resp.status}): ${text}`);
  return JSON.parse(text);
}

async function pollReplicatePrediction(predictionId, { maxAttempts = 120, intervalMs = 1500 } = {}) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });

    const text = await poll.text();
    if (!poll.ok) throw new Error(`Replicate poll failed (${poll.status}): ${text}`);

    const data = JSON.parse(text);

    if (attempts === 0 || attempts % 10 === 0) {
      console.log(`Replicate poll ${predictionId}: status=${data.status} (attempt ${attempts}/${maxAttempts})`);
    }

    if (data.status === 'succeeded') return { data, attempts };
    if (data.status === 'failed') throw new Error(`Prediction failed: ${data.error || 'Unknown error'}`);

    await new Promise((r) => setTimeout(r, intervalMs));
    attempts += 1;
  }

  throw new Error(`Prediction timed out after ${Math.round((maxAttempts * intervalMs) / 1000)}s`);
}

function normalizeOutputToUrl(output) {
  if (Array.isArray(output)) return output[0];
  return output;
}

// ============================================================================
// CORE PIPELINE: mask -> clean mask -> inpaint
// ============================================================================
async function generateHairMask(imageUrlOrDataUri) {
  const prediction = await createReplicatePrediction({
    version: REPLICATE_HAIR_MASK_VERSION,
    input: { image: imageUrlOrDataUri },
  });

  const { data } = await pollReplicatePrediction(prediction.id, { maxAttempts: 180, intervalMs: 1500 });
  return normalizeOutputToUrl(data.output);
}

async function inpaintHair({ imageUrlOrDataUri, maskUrlOrDataUri, prompt }) {
  const prediction = await createReplicatePrediction({
    version: REPLICATE_SDXL_INPAINT_VERSION,
    input: {
      image: imageUrlOrDataUri,
      mask: maskUrlOrDataUri,
      prompt,
      negative_prompt:
        'face, eyes, eyebrows, nose, mouth, teeth, skin, identity change, deformed face, extra facial features, cartoon, painting, blurry, artifacts, watermark, text',
      num_inference_steps: 25,  // ✅ less aggressive
      guidance_scale: 5.5,      // ✅ less aggressive
    },
  });

  const { data, attempts } = await pollReplicatePrediction(prediction.id, { maxAttempts: 140, intervalMs: 2000 });
  return { imageUrl: normalizeOutputToUrl(data.output), attempts };
}

// ============================================================================
// HTTP SERVER
// ============================================================================
const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';

  if (method === 'OPTIONS') return sendJson(res, 204, {});

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (
    method === 'GET' &&
    (pathname === '/' || pathname.startsWith('/index.html') || pathname.startsWith('/assets') || pathname.startsWith('/public'))
  ) {
    return serveStatic(req, res);
  }
  if (method === 'GET' && pathname.endsWith('.html')) return serveStatic(req, res);

  if (method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'preset-hair-tryon',
      replicateConfigured: !!REPLICATE_API_TOKEN,
      presets: PRESETS.length,
      timestamp: new Date().toISOString(),
    });
  }

  if (method === 'GET' && pathname === '/api/presets') {
    return sendJson(res, 200, {
      success: true,
      presets: PRESETS.map(({ id, name }) => ({ id, name })),
    });
  }

  if (method === 'POST' && pathname === '/api/try-on') {
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');

      const body = await parseBody(req);
      const { userImageUrl, presetId } = body;

      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing required field: userImageUrl' });
      if (!presetId) return sendJson(res, 400, { error: 'Missing required field: presetId' });

      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return sendJson(res, 400, { error: `Unknown presetId: ${presetId}` });

      const userImageData = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);

      // 1) raw hair mask from model
      const rawMaskUrl = await generateHairMask(userImageData);

      // 2) ✅ cleaned mask (prevents face repaint)
      const cleanedMaskDataUri = await cleanHairMaskToDataUri(rawMaskUrl, { keepTop: 0.60 });

      // 3) inpaint using cleaned mask
      const prompt = buildHairPrompt(preset.prompt);
      const { imageUrl, attempts } = await inpaintHair({
        imageUrlOrDataUri: userImageData,
        maskUrlOrDataUri: cleanedMaskDataUri,
        prompt,
      });

      return sendJson(res, 200, {
        success: true,
        preset: { id: preset.id, name: preset.name },
        rawMaskUrl,
        // for debugging: you can paste this into browser console to preview, or just keep it for now
        cleanedMaskPreview: cleanedMaskDataUri,
        editedImageUrl: imageUrl,
        processingTimeApproxSeconds: attempts * 2,
      });
    } catch (err) {
      console.error('Try-on error:', err);
      return sendJson(res, 500, { error: err.message || 'Try-on failed' });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`✅ Preset Hair Try-on running at http://localhost:${PORT}`);
  console.log(`   Replicate token: ${REPLICATE_API_TOKEN ? '✓ set' : '✗ missing'}`);
  console.log(`   Presets: ${PRESETS.length}`);
});

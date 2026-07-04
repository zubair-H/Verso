'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let sharp = null;
try {
  // Optional dependency: only needed for region mask generation endpoints.
  // Server can still boot without it.
  sharp = require('sharp');
} catch {
  sharp = null;
}

function loadEnvFile() {
  const candidates = [path.join(__dirname, '.env'), path.join(process.cwd(), '.env')];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
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
}
loadEnvFile();

const PORT = Number(process.env.PORT || 4000);
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const GEMINI_OUTFIT_REGION_CACHE = new Map();

if (!globalThis.fetch) throw new Error('Node 18+ required');

const REPLICATE_HAIR_MASK_VERSION =
  'b335dc1b693b2de88040736eb426702adfc2f0c869ae9dba3569bac1beb9c0f6';
const REPLICATE_SDXL_INPAINT_VERSION =
  'aca001c8b137114d5e594c68f7084ae6d82f364758aab8d997b233e8ef3c4d93';
const REPLICATE_FAST_HAIR_VERSION =
  process.env.REPLICATE_FAST_HAIR_VERSION ||
  '3c68f21745b553cc6de2c8b487d6620cde4435e927740547d89e970689902c03';
const REPLICATE_EYE_EDIT_MODEL =
  process.env.REPLICATE_EYE_EDIT_MODEL || 'black-forest-labs/flux-kontext-pro';
const REPLICATE_BODY_EDIT_MODEL =
  process.env.REPLICATE_BODY_EDIT_MODEL || 'google/nano-banana';
const REPLICATE_BODY_EDIT_FALLBACK_MODEL =
  process.env.REPLICATE_BODY_EDIT_FALLBACK_MODEL || 'black-forest-labs/flux-kontext-pro';

const HAIR_COLOR_PRESETS = [
  { id: 'current', name: 'Current', hex: '#9b9b9b', strength: 0.0 },
  { id: 'jet_black', name: 'Jet Black', hex: '#111111', strength: 0.75 },
  { id: 'dark_brown', name: 'Dark Brown', hex: '#2a1b12', strength: 0.7 },
  { id: 'light_brown', name: 'Light Brown', hex: '#6b4a2f', strength: 0.65 },
  { id: 'blonde', name: 'Blonde', hex: '#d8c07a', strength: 0.6 },
  { id: 'platinum', name: 'Platinum', hex: '#e8e4da', strength: 0.55 },
  { id: 'auburn', name: 'Auburn', hex: '#8b3a2b', strength: 0.65 },
  { id: 'silver', name: 'Silver', hex: '#c8c8c8', strength: 0.55 },
];

const HAIR_STYLE_PRESETS = [
  { id: 'no_change', name: 'Keep Current' },
  { id: 'buzz', name: 'Buzz Cut' },
  { id: 'taper-fade', name: 'Low Taper Fade' },
  { id: 'straight', name: 'Straight' },
  { id: 'wavy', name: 'Wavy' },
  { id: 'curly', name: 'Curly' },
  { id: 'bob', name: 'Bob' },
  { id: 'pixie_cut', name: 'Pixie Cut' },
  { id: 'layered', name: 'Layered' },
  { id: 'soft_waves', name: 'Soft Waves' },
  { id: 'side_parted', name: 'Side-Parted' },
  { id: 'center_parted', name: 'Center-Parted' },
  { id: 'blunt_bangs', name: 'Blunt Bangs' },
  { id: 'side_swept_bangs', name: 'Side-Swept Bangs' },
  { id: 'slicked_back', name: 'Slicked Back' },
  { id: 'shag', name: 'Shag' },
  { id: 'lob', name: 'Lob' },
  { id: 'high_ponytail', name: 'High Ponytail' },
  { id: 'low_ponytail', name: 'Low Ponytail' },
  { id: 'messy_bun', name: 'Messy Bun' },
  { id: 'top_knot', name: 'Top Knot' },
  { id: 'french_braid', name: 'French Braid' },
  { id: 'dutch_braid', name: 'Dutch Braid' },
  { id: 'fishtail_braid', name: 'Fishtail Braid' },
];

const EYE_COLOR_PRESETS = [
  { id: 'current', name: 'Current' },
  { id: 'brown', name: 'Brown' },
  { id: 'hazel', name: 'Hazel' },
  { id: 'green', name: 'Green' },
  { id: 'blue', name: 'Blue' },
  { id: 'gray', name: 'Gray' },
];

const FAST_HAIR_COLOR_BY_PRESET_ID = {
  current: 'No change',
  jet_black: 'Jet Black',
  dark_brown: 'Dark Brown',
  light_brown: 'Light Brown',
  blonde: 'Blonde',
  platinum: 'Platinum Blonde',
  auburn: 'Auburn',
  silver: 'Silver',
};

const FAST_HAIRCUT_BY_STYLE_ID = {
  no_change: 'No change',
  buzz: 'Buzz Cut',
  'taper-fade': 'Crew Cut',
  straight: 'Straight',
  wavy: 'Wavy',
  curly: 'Curly',
  bob: 'Bob',
  pixie_cut: 'Pixie Cut',
  layered: 'Layered',
  soft_waves: 'Soft Waves',
  side_parted: 'Side-Parted',
  center_parted: 'Center-Parted',
  blunt_bangs: 'Blunt Bangs',
  side_swept_bangs: 'Side-Swept Bangs',
  slicked_back: 'Slicked Back',
  shag: 'Shag',
  lob: 'Lob',
  high_ponytail: 'High Ponytail',
  low_ponytail: 'Low Ponytail',
  messy_bun: 'Messy Bun',
  top_knot: 'Top Knot',
  french_braid: 'French Braid',
  dutch_braid: 'Dutch Braid',
  fishtail_braid: 'Fishtail Braid',
};

const MODEL_VERSION_CACHE = new Map();

const OUTFIT_COLOR_PRESETS = {
  black: { name: 'Black', hex: '#111111' },
  white: { name: 'White', hex: '#F2F2F2' },
  beige: { name: 'Beige', hex: '#D8C3A5' },
  brown: { name: 'Brown', hex: '#7A4E2D' },
  navy: { name: 'Navy', hex: '#1E3A6D' },
  green: { name: 'Green', hex: '#3C8D40' },
  red: { name: 'Red', hex: '#C53939' },
  pink: { name: 'Pink', hex: '#D97AAE' },
  gray: { name: 'Gray', hex: '#8C8C8C' },
  olive: { name: 'Olive', hex: '#6B7A3D' },
  blue: { name: 'Blue', hex: '#2B6ACF' },
};

const STYLE_PROMPTS = {
  no_change: '',
  buzz: 'photorealistic buzz cut hairstyle, natural scalp texture',
  'taper-fade': 'photorealistic low taper fade haircut, clean lineup',
  straight: 'straight sleek hairstyle with natural strand flow',
  wavy: 'soft wavy hairstyle with natural movement',
  curly: 'defined natural curly hairstyle with volume',
  bob: 'classic bob haircut framing the face',
  pixie_cut: 'short pixie cut with natural texture',
  layered: 'layered haircut with soft face-framing pieces',
  soft_waves: 'gentle soft waves with natural texture',
  side_parted: 'side-parted hairstyle with natural fall',
  center_parted: 'center-parted hairstyle with balanced framing',
  blunt_bangs: 'blunt bangs with clean fringe line',
  side_swept_bangs: 'side-swept bangs with soft transition',
  slicked_back: 'slicked back hair with clean shape',
  shag: 'modern shag cut with textured layers',
  lob: 'long bob haircut with clean ends',
  high_ponytail: 'high ponytail hairstyle with natural hairline',
  low_ponytail: 'low ponytail hairstyle with natural flow',
  messy_bun: 'messy bun hairstyle with realistic loose strands',
  top_knot: 'top knot hairstyle with clean gathered shape',
  french_braid: 'french braid hairstyle with realistic braiding detail',
  dutch_braid: 'dutch braid hairstyle with raised braid texture',
  fishtail_braid: 'fishtail braid hairstyle with fine woven detail',
};

const FEATURE_PROMPTS = {
  nose: {
    slim: 'subtle slimmer nose bridge and tip, natural proportions',
    straight: 'subtle straighter nose bridge, natural profile',
    soft: 'subtle softer nose contour with smooth transitions',
    defined: 'subtle more defined nose structure with natural shading',
  },
  lips: {
    rose_nude: 'apply a soft rose nude lip color with natural realistic texture',
    warm_nude: 'apply a warm nude lip color with natural realistic texture',
    mauve: 'apply a muted mauve lip color with realistic finish',
    berry: 'apply a rich berry lip color with realistic finish',
    classic_red: 'apply a classic red lip color with realistic texture',
    deep_plum: 'apply a deep plum lip color with realistic finish',
  },
  eyebrows: {
    natural: 'natural eyebrow shape with subtle refinement',
    arched: 'subtle arched eyebrow shape, natural density',
    straight: 'subtle straighter eyebrow shape, natural density',
    feathered: 'soft feathered eyebrow texture, natural hair strokes',
  },
};

const EYEBROW_COLOR_PROMPTS = {
  soft_black: 'eyebrows recolored to soft black',
  espresso: 'eyebrows recolored to espresso dark brown',
  cool_brown: 'eyebrows recolored to cool brown',
  warm_brown: 'eyebrows recolored to warm brown',
  taupe: 'eyebrows recolored to taupe',
  auburn: 'eyebrows recolored to auburn',
};

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
      if (data.length > 16_000_000) reject(new Error('Payload too large'));
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
  if (!filePath.startsWith(safeBase)) return sendJson(res, 403, { error: 'Forbidden' });
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return sendJson(res, 404, { error: 'Not found' });
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

async function urlToDataUri(imageUrl) {
  let finalUrl = imageUrl;
  if (finalUrl.includes('images.unsplash.com')) {
    const u = new URL(finalUrl);
    u.searchParams.set('w', u.searchParams.get('w') || '960');
    finalUrl = u.toString();
  }
  const resp = await fetch(finalUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!resp.ok) throw new Error(`Image fetch failed (${resp.status})`);
  const contentType = (resp.headers.get('content-type') || 'image/jpeg').split(';')[0];
  const arr = await resp.arrayBuffer();
  const buf = Buffer.from(arr);
  return `data:${contentType};base64,${buf.toString('base64')}`;
}

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

function makeCancelledError(sessionId) {
  const err = new Error('Request cancelled by client');
  err.status = 499;
  if (sessionId) err.sessionId = sessionId;
  return err;
}

function sleep(ms, signal, sessionId) {
  if (!signal) return new Promise((resolve) => setTimeout(resolve, ms));
  if (signal.aborted) return Promise.reject(makeCancelledError(sessionId));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(makeCancelledError(sessionId));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function parseJsonSafe(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseRetryAfterSeconds(rawBodyText, headers) {
  const headerValue = Number(headers?.get?.('retry-after'));
  if (Number.isFinite(headerValue) && headerValue >= 0) return headerValue;

  const parsedBody = parseJsonSafe(rawBodyText);
  const bodyValue = Number(parsedBody?.retry_after);
  if (Number.isFinite(bodyValue) && bodyValue >= 0) return bodyValue;

  const match = /"retry_after"\s*:\s*([0-9.]+)/i.exec(rawBodyText || '');
  if (match) {
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return null;
}

let replicateNextCreateAt = 0;
let replicateObservedCreateCooldownMs = Math.max(0, Number(process.env.REPLICATE_MIN_CREATE_INTERVAL_MS || 0));

const ACTIVE_CANCELLATIONS = new Map();

function normalizeSessionId(sessionId) {
  if (typeof sessionId !== 'string') return '';
  const trimmed = sessionId.trim();
  if (!trimmed) return '';
  return trimmed.slice(0, 120);
}

function acquireCancellationContext(sessionId) {
  const id = normalizeSessionId(sessionId);
  if (!id) return null;

  let entry = ACTIVE_CANCELLATIONS.get(id);
  if (!entry || (entry.cancelled && entry.activeCount === 0)) {
    entry = {
      controller: new AbortController(),
      activeCount: 0,
      cancelled: false,
      updatedAt: Date.now(),
    };
    ACTIVE_CANCELLATIONS.set(id, entry);
  }
  entry.activeCount += 1;
  entry.updatedAt = Date.now();

  const release = () => {
    const latest = ACTIVE_CANCELLATIONS.get(id);
    if (!latest) return;
    latest.activeCount = Math.max(0, latest.activeCount - 1);
    latest.updatedAt = Date.now();
    if (latest.activeCount === 0 && latest.cancelled) {
      ACTIVE_CANCELLATIONS.delete(id);
    }
  };

  return { sessionId: id, signal: entry.controller.signal, release };
}

function cancelSessionWork(sessionId) {
  const id = normalizeSessionId(sessionId);
  if (!id) return { cancelled: false, active: 0 };
  const entry = ACTIVE_CANCELLATIONS.get(id);
  if (!entry) return { cancelled: false, active: 0 };
  entry.cancelled = true;
  entry.updatedAt = Date.now();
  entry.controller.abort();
  return { cancelled: true, active: entry.activeCount };
}

async function waitForReplicateCreateSlot({ signal, sessionId } = {}) {
  const now = Date.now();
  if (replicateNextCreateAt > now) {
    await sleep(replicateNextCreateAt - now, signal, sessionId);
  }
}

async function createReplicatePrediction({ version, input, signal, sessionId }) {
  const maxRetries = Math.max(0, Number(process.env.REPLICATE_CREATE_RETRIES || 6));

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    await waitForReplicateCreateSlot({ signal, sessionId });

    const resp = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version, input }),
      signal,
    });
    const text = await resp.text();

    if (resp.ok) {
      if (replicateObservedCreateCooldownMs > 0) {
        replicateNextCreateAt = Date.now() + replicateObservedCreateCooldownMs;
      }
      return JSON.parse(text);
    }

    if (resp.status === 429) {
      const retryAfterSeconds = parseRetryAfterSeconds(text, resp.headers);
      const retryAfterMs = Math.max(
        Math.ceil((retryAfterSeconds || 3) * 1000),
        replicateObservedCreateCooldownMs || 0,
        1000
      );
      replicateObservedCreateCooldownMs = Math.max(replicateObservedCreateCooldownMs, retryAfterMs);
      replicateNextCreateAt = Date.now() + retryAfterMs;

      if (attempt < maxRetries) {
        await sleep(retryAfterMs + Math.floor(Math.random() * 220), signal, sessionId);
        continue;
      }

      const err = new Error(`Replicate create failed (429): ${text}`);
      err.status = 429;
      err.retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      throw err;
    }

    const err = new Error(`Replicate create failed (${resp.status}): ${text}`);
    err.status = resp.status;
    throw err;
  }

  const err = new Error('Replicate create failed after retries');
  err.status = 429;
  throw err;
}

async function pollReplicatePrediction(
  predictionId,
  { maxAttempts = 120, intervalMs = 1600, signal, sessionId } = {}
) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
      signal,
    });
    const text = await poll.text();
    if (!poll.ok) {
      if (poll.status === 429) {
        const retryAfterSeconds = parseRetryAfterSeconds(text, poll.headers) || 2;
        await sleep(Math.ceil(retryAfterSeconds * 1000), signal, sessionId);
        continue;
      }
      const err = new Error(`Replicate poll failed (${poll.status}): ${text}`);
      err.status = poll.status;
      throw err;
    }
    const data = JSON.parse(text);
    if (data.status === 'succeeded') return { data, attempts };
    if (data.status === 'failed') throw new Error(`Prediction failed: ${data.error || 'Unknown error'}`);
    await sleep(intervalMs, signal, sessionId);
    attempts += 1;
  }
  throw new Error('Prediction timed out');
}

function normalizeOutputToUrl(output) {
  return Array.isArray(output) ? output[0] : output;
}

async function getReplicateLatestVersionId(modelSlug) {
  const cached = MODEL_VERSION_CACHE.get(modelSlug);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.versionId;

  const [owner, name] = String(modelSlug || '').split('/');
  if (!owner || !name) throw new Error(`Invalid model slug: ${modelSlug}`);

  const response = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
    headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Replicate model lookup failed (${response.status}): ${text}`);
  }
  const model = JSON.parse(text);
  const versionId = model?.latest_version?.id;
  if (!versionId) throw new Error(`No latest version available for model ${modelSlug}`);

  MODEL_VERSION_CACHE.set(modelSlug, { versionId, at: Date.now() });
  return versionId;
}

function resolveFastHairColorName(colorId, colorName) {
  if (FAST_HAIR_COLOR_BY_PRESET_ID[colorId]) return FAST_HAIR_COLOR_BY_PRESET_ID[colorId];
  const byName = {
    'Jet Black': 'Jet Black',
    'Dark Brown': 'Dark Brown',
    'Light Brown': 'Light Brown',
    Blonde: 'Blonde',
    Platinum: 'Platinum Blonde',
    Auburn: 'Auburn',
    Silver: 'Silver',
  };
  return byName[colorName] || 'Dark Brown';
}

function resolveFastHaircut(styleId) {
  return FAST_HAIRCUT_BY_STYLE_ID[styleId] || 'No change';
}

async function generateFastHairEditUrl({ imageDataUri, hairColorName, haircutProviderValue, cancelCtx }) {
  const input = {
    input_image: imageDataUri,
    hair_color: hairColorName,
    output_format: 'png',
    aspect_ratio: 'match_input_image',
    safety_tolerance: 2,
  };
  if (haircutProviderValue && haircutProviderValue !== 'No change') {
    input.haircut = haircutProviderValue;
  }

  const created = await createReplicatePrediction({
    version: REPLICATE_FAST_HAIR_VERSION,
    input,
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });

  const { data } = await pollReplicatePrediction(created.id, {
    maxAttempts: 180,
    intervalMs: 1500,
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });
  const outputUrl = normalizeOutputToUrl(data.output);
  if (!outputUrl) throw new Error('Fast hair model returned empty output');
  return outputUrl;
}

async function generateFastEyeEditUrl({ imageDataUri, eyeColorName, cancelCtx }) {
  const prompt = `Change only the iris color of both eyes to ${eyeColorName}. Keep face identity, hair, skin tone, lighting, and background unchanged. Photorealistic.`;
  const version = await getReplicateLatestVersionId(REPLICATE_EYE_EDIT_MODEL);
  const created = await createReplicatePrediction({
    version,
    input: {
      input_image: imageDataUri,
      prompt,
      output_format: 'png',
      aspect_ratio: 'match_input_image',
      safety_tolerance: 2,
      prompt_upsampling: false,
    },
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });
  const { data } = await pollReplicatePrediction(created.id, {
    maxAttempts: 180,
    intervalMs: 1300,
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });
  const outputUrl = normalizeOutputToUrl(data.output);
  if (!outputUrl) throw new Error('Eye color model returned empty output');
  return outputUrl;
}

function buildInstructionEditInput(modelSlug, { imageDataUri, prompt }) {
  if (modelSlug.includes('nano-banana')) {
    return { prompt, image_input: [imageDataUri], output_format: 'png' };
  }
  return {
    prompt,
    input_image: imageDataUri,
    output_format: 'png',
    aspect_ratio: 'match_input_image',
    safety_tolerance: 2,
    prompt_upsampling: false,
  };
}

async function generateBodyTransformUrl({ imageDataUri, mode, cancelCtx }) {
  const prompt = buildBodyTransformPrompt({ mode });
  const models = [...new Set([REPLICATE_BODY_EDIT_MODEL, REPLICATE_BODY_EDIT_FALLBACK_MODEL].filter(Boolean))];

  let lastError = null;
  for (const modelSlug of models) {
    try {
      const version = await getReplicateLatestVersionId(modelSlug);
      const created = await createReplicatePrediction({
        version,
        input: buildInstructionEditInput(modelSlug, { imageDataUri, prompt }),
        signal: cancelCtx?.signal,
        sessionId: cancelCtx?.sessionId,
      });
      const { data } = await pollReplicatePrediction(created.id, {
        maxAttempts: 180,
        intervalMs: 1300,
        signal: cancelCtx?.signal,
        sessionId: cancelCtx?.sessionId,
      });
      const outputUrl = normalizeOutputToUrl(data.output);
      if (!outputUrl) throw new Error(`Body transform model ${modelSlug} returned empty output`);
      return outputUrl;
    } catch (err) {
      if (cancelCtx?.signal?.aborted || err?.name === 'AbortError') throw err;
      console.error(`body-transform via ${modelSlug} failed:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('Body transform failed');
}

function parseDataUriParts(dataUri) {
  if (!isDataUri(dataUri)) throw new Error('Expected data URI');
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUri);
  if (!match) throw new Error('Invalid data URI format');
  return { mimeType: match[1], base64: match[2] };
}

function extractJsonFromText(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {}
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(trimmed);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {}
  }
  return null;
}

function clampPoint01(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

function sanitizePolygonList(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((polygon) => {
      if (!Array.isArray(polygon)) return null;
      const points = polygon
        .map((p) => clampPoint01(p))
        .filter(Boolean);
      if (points.length < 3) return null;
      return points.slice(0, 80);
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeGeminiRegions(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const upper = sanitizePolygonList(payload.upper);
  const lower = sanitizePolygonList(payload.lower);
  const skin = sanitizePolygonList(payload.skin);
  if (!upper.length && !lower.length) return null;
  return { upper, lower, skin };
}

function polygonToSvgPath(points, width, height) {
  if (!Array.isArray(points) || points.length < 3) return '';
  const [first, ...rest] = points;
  const firstX = Math.round(first.x * width);
  const firstY = Math.round(first.y * height);
  let path = `M ${firstX} ${firstY}`;
  for (const point of rest) {
    path += ` L ${Math.round(point.x * width)} ${Math.round(point.y * height)}`;
  }
  return `${path} Z`;
}

function hashBufferSha1(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex');
}

async function detectOutfitRegionsWithGemini(imageDataUri) {
  if (!GEMINI_API_KEY) return null;
  const { mimeType, base64 } = parseDataUriParts(imageDataUri);
  const cacheKey = hashBufferSha1(Buffer.from(base64, 'base64'));
  const cached = GEMINI_OUTFIT_REGION_CACHE.get(cacheKey);
  if (cached) return cached;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const prompt = [
    'You are a precise clothing segmenter.',
    'Return ONLY JSON with normalized polygons (0..1) for visible human outfit regions.',
    'Output schema:',
    '{"upper":[[{"x":0.1,"y":0.1},{"x":0.2,"y":0.1},{"x":0.2,"y":0.2}]],"lower":[[...]],"skin":[[...]]}',
    'Rules:',
    '- upper: shirt/jacket/top including sleeves, exclude exposed skin and accessories.',
    '- lower: pants/shorts/skirt, exclude exposed skin.',
    '- skin: exposed neck/arms/hands polygons.',
    '- Multiple polygons allowed.',
    '- Do not include markdown or commentary.',
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    const text = await resp.text();
    if (!resp.ok) throw new Error(`Gemini detect failed (${resp.status}): ${text}`);
    const parsed = JSON.parse(text);
    const partText = parsed?.candidates?.[0]?.content?.parts?.find((p) => typeof p?.text === 'string')?.text || '';
    const rawRegions = extractJsonFromText(partText);
    const regions = normalizeGeminiRegions(rawRegions);
    if (!regions) return null;
    GEMINI_OUTFIT_REGION_CACHE.set(cacheKey, regions);
    return regions;
  } finally {
    clearTimeout(timeout);
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex) {
  const normalized = String(hex || '')
    .trim()
    .replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 128, g: 128, b: 128 };
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function skinSuppressionFactor(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  const inSkinHue = h >= 5 && h <= 50;
  const inSkinSat = s >= 0.12 && s <= 0.68;
  const inSkinLight = l >= 0.20 && l <= 0.92;
  const hslSkin = inSkinHue && inSkinSat && inSkinLight;

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const ycbcrSkin = cb >= 80 && cb <= 125 && cr >= 135 && cr <= 170;

  if (!(hslSkin && ycbcrSkin)) return 0;

  const hueCenter = 26;
  const hueDist = Math.min(Math.abs(h - hueCenter), 360 - Math.abs(h - hueCenter));
  const hueScore = clamp01(1 - hueDist / 26);
  const satScore = clamp01((s - 0.12) / 0.35);
  const lightScore = 1 - Math.abs(l - 0.58) / 0.38;
  return clamp01(hueScore * 0.5 + satScore * 0.25 + clamp01(lightScore) * 0.25);
}

async function recolorWithMaskBuffer({
  imageBuf,
  maskBuf,
  targetHex,
  strength = 0.88,
  minMaskAlpha = 36,
}) {
  if (!sharp) throw new Error('sharp is required for outfit recolor. Run: npm install sharp');

  const imageRaw = await sharp(imageBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const maskRaw = await sharp(maskBuf)
    .resize(imageRaw.info.width, imageRaw.info.height)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: imageData, info } = imageRaw;
  const { data: maskData } = maskRaw;
  const targetRgb = hexToRgb(targetHex);
  const targetHsl = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
  const channels = info.channels;
  const pixelCount = info.width * info.height;

  for (let i = 0; i < pixelCount; i += 1) {
    const m = maskData[i];
    if (m <= minMaskAlpha) continue;

    const idx = i * channels;
    const origR = imageData[idx];
    const origG = imageData[idx + 1];
    const origB = imageData[idx + 2];
    const origHsl = rgbToHsl(origR, origG, origB);

    const recoloredHsl = {
      h: targetHsl.h,
      s: clamp01(Math.max(origHsl.s * 0.45, targetHsl.s * 0.9)),
      l: clamp01(origHsl.l * 0.86 + targetHsl.l * 0.14),
    };
    const recoloredRgb = hslToRgb(recoloredHsl.h, recoloredHsl.s, recoloredHsl.l);
    const maskNorm = clamp01((m - minMaskAlpha) / (255 - minMaskAlpha));
    const smoothMask = maskNorm * maskNorm * (3 - 2 * maskNorm);
    const skinSuppression = skinSuppressionFactor(origR, origG, origB);
    const alpha = smoothMask * strength * (1 - skinSuppression * 0.92);
    if (alpha <= 0.01) continue;

    imageData[idx] = Math.round(origR * (1 - alpha) + recoloredRgb.r * alpha);
    imageData[idx + 1] = Math.round(origG * (1 - alpha) + recoloredRgb.g * alpha);
    imageData[idx + 2] = Math.round(origB * (1 - alpha) + recoloredRgb.b * alpha);
  }

  return sharp(imageData, {
    raw: { width: info.width, height: info.height, channels },
  })
    .png()
    .toBuffer();
}

async function generateHairMask(imageUrlOrDataUri, cancelCtx) {
  const prediction = await createReplicatePrediction({
    version: REPLICATE_HAIR_MASK_VERSION,
    input: { image: imageUrlOrDataUri },
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });
  const { data } = await pollReplicatePrediction(prediction.id, {
    maxAttempts: 180,
    intervalMs: 1500,
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });
  return normalizeOutputToUrl(data.output);
}

async function makeRegionMaskDataUri(sourceImage, region) {
  if (!sharp) {
    throw new Error('sharp is required for this endpoint. Run: npm install sharp');
  }
  const meta = await sharp(sourceImage).metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${w}" height="${h}" fill="black"/>`;

  if (region === 'eyes') {
    const eyeY = Math.round(h * 0.42);
    const rx = Math.round(w * 0.034);
    const ry = Math.round(h * 0.02);
    svg += `<ellipse cx="${Math.round(w * 0.38)}" cy="${eyeY}" rx="${rx}" ry="${ry}" fill="white"/>`;
    svg += `<ellipse cx="${Math.round(w * 0.62)}" cy="${eyeY}" rx="${rx}" ry="${ry}" fill="white"/>`;
  }

  if (region === 'nose') {
    svg += `<ellipse cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.52)}" rx="${Math.round(w * 0.08)}" ry="${Math.round(h * 0.11)}" fill="white"/>`;
  }

  if (region === 'lips') {
    svg += `<ellipse cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.66)}" rx="${Math.round(w * 0.11)}" ry="${Math.round(h * 0.05)}" fill="white"/>`;
  }

  if (region === 'eyebrows') {
    svg += `<ellipse cx="${Math.round(w * 0.38)}" cy="${Math.round(h * 0.36)}" rx="${Math.round(w * 0.09)}" ry="${Math.round(h * 0.02)}" fill="white"/>`;
    svg += `<ellipse cx="${Math.round(w * 0.62)}" cy="${Math.round(h * 0.36)}" rx="${Math.round(w * 0.09)}" ry="${Math.round(h * 0.02)}" fill="white"/>`;
  }

  if (region === 'face_features') {
    svg += `<ellipse cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.52)}" rx="${Math.round(w * 0.08)}" ry="${Math.round(h * 0.11)}" fill="white"/>`;
    svg += `<ellipse cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.66)}" rx="${Math.round(w * 0.11)}" ry="${Math.round(h * 0.05)}" fill="white"/>`;
    svg += `<ellipse cx="${Math.round(w * 0.38)}" cy="${Math.round(h * 0.36)}" rx="${Math.round(w * 0.09)}" ry="${Math.round(h * 0.02)}" fill="white"/>`;
    svg += `<ellipse cx="${Math.round(w * 0.62)}" cy="${Math.round(h * 0.36)}" rx="${Math.round(w * 0.09)}" ry="${Math.round(h * 0.02)}" fill="white"/>`;
  }

  if (region === 'upper_body') {
    svg += `<rect x="${Math.round(w * 0.15)}" y="${Math.round(h * 0.19)}" width="${Math.round(w * 0.70)}" height="${Math.round(h * 0.39)}" rx="${Math.round(w * 0.06)}" fill="white"/>`;
  }

  if (region === 'lower_body') {
    svg += `<rect x="${Math.round(w * 0.20)}" y="${Math.round(h * 0.60)}" width="${Math.round(w * 0.60)}" height="${Math.round(h * 0.36)}" rx="${Math.round(w * 0.06)}" fill="white"/>`;
  }

  if (region === 'outfit_combined') {
    svg += `<rect x="${Math.round(w * 0.15)}" y="${Math.round(h * 0.19)}" width="${Math.round(w * 0.70)}" height="${Math.round(h * 0.39)}" rx="${Math.round(w * 0.06)}" fill="white"/>`;
    svg += `<rect x="${Math.round(w * 0.20)}" y="${Math.round(h * 0.60)}" width="${Math.round(w * 0.60)}" height="${Math.round(h * 0.36)}" rx="${Math.round(w * 0.06)}" fill="white"/>`;
  }

  svg += '</svg>';

  const blurSigma =
    region === 'upper_body' || region === 'lower_body' || region === 'outfit_combined'
      ? 0.7
      : region === 'eyes'
        ? 0.55
        : 1.8;

  const maskBuf = await sharp(Buffer.from(svg))
    .resize(w, h)
    .grayscale()
    .blur(blurSigma)
    .png()
    .toBuffer();

  return `data:image/png;base64,${maskBuf.toString('base64')}`;
}

async function makePolygonMaskDataUri({
  sourceImage,
  includePolygons = [],
  excludePolygons = [],
  blurSigma = 0.6,
}) {
  if (!sharp) {
    throw new Error('sharp is required for this endpoint. Run: npm install sharp');
  }
  if (!Array.isArray(includePolygons) || includePolygons.length === 0) return null;

  const meta = await sharp(sourceImage).metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${w}" height="${h}" fill="black"/>`;

  for (const polygon of includePolygons) {
    const path = polygonToSvgPath(polygon, w, h);
    if (!path) continue;
    svg += `<path d="${path}" fill="white"/>`;
  }

  for (const polygon of excludePolygons) {
    const path = polygonToSvgPath(polygon, w, h);
    if (!path) continue;
    svg += `<path d="${path}" fill="black"/>`;
  }

  svg += '</svg>';

  const maskBuf = await sharp(Buffer.from(svg))
    .resize(w, h)
    .grayscale()
    .blur(blurSigma)
    .png()
    .toBuffer();

  return `data:image/png;base64,${maskBuf.toString('base64')}`;
}

async function inpaintRegion({
  imageUrlOrDataUri,
  maskUrlOrDataUri,
  prompt,
  negativePrompt,
  numInferenceSteps,
  guidanceScale,
  promptStrength,
  cancelCtx,
}) {
  const prediction = await createReplicatePrediction({
    version: REPLICATE_SDXL_INPAINT_VERSION,
    input: {
      image: imageUrlOrDataUri,
      mask: maskUrlOrDataUri,
      prompt,
      negative_prompt:
        negativePrompt ||
        'identity change, different person, deformed face, extra eyes, extra lips, artifact, text, watermark, cartoon',
      num_inference_steps: Number.isFinite(numInferenceSteps) ? numInferenceSteps : 24,
      guidance_scale: Number.isFinite(guidanceScale) ? guidanceScale : 5.5,
      prompt_strength: Number.isFinite(promptStrength) ? promptStrength : 0.8,
    },
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });
  const { data } = await pollReplicatePrediction(prediction.id, {
    maxAttempts: 140,
    intervalMs: 1800,
    signal: cancelCtx?.signal,
    sessionId: cancelCtx?.sessionId,
  });
  return normalizeOutputToUrl(data.output);
}

function buildHairPrompt(styleId, colorHex) {
  const stylePrompt = STYLE_PROMPTS[styleId] || 'natural realistic hairstyle';
  return [
    stylePrompt,
    colorHex ? `hair color tuned to ${colorHex}` : '',
    'ONLY modify hair in masked region.',
    'Do NOT change face, eyes, eyebrows, nose, lips, skin, clothing or background.',
    'Photorealistic output preserving identity and lighting.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildFeaturePrompt({ noseId, lipsId, eyebrowsId, eyebrowColorId }) {
  const parts = [];
  if (noseId && noseId !== 'no_change' && FEATURE_PROMPTS.nose[noseId]) parts.push(FEATURE_PROMPTS.nose[noseId]);
  if (lipsId && lipsId !== 'no_change' && FEATURE_PROMPTS.lips[lipsId]) parts.push(FEATURE_PROMPTS.lips[lipsId]);
  if (eyebrowsId && eyebrowsId !== 'no_change' && FEATURE_PROMPTS.eyebrows[eyebrowsId]) parts.push(FEATURE_PROMPTS.eyebrows[eyebrowsId]);
  if (eyebrowColorId && eyebrowColorId !== 'no_change' && EYEBROW_COLOR_PROMPTS[eyebrowColorId]) parts.push(EYEBROW_COLOR_PROMPTS[eyebrowColorId]);
  if (!parts.length) return '';
  return [
    ...parts,
    'ONLY modify requested feature in masked region.',
    'Do NOT alter identity, hair, eyes, skin texture, clothing or background.',
    'Keep photorealistic consistency.',
  ].join(' ');
}

function buildOutfitPrompt({ topHex, bottomHex }) {
  return [
    topHex ? `Change ONLY the top garment color to ${topHex}.` : '',
    bottomHex ? `Change ONLY the bottom garment color to ${bottomHex}.` : '',
    topHex && bottomHex
      ? 'Apply both requested colors in one pass: top and bottom must both match their requested color.'
      : '',
    'Color shift must be obvious and clearly visible.',
    'Maintain garment texture, folds, seams, and lighting.',
    'Keep skin tone, face, tattoos, jewelry, watch, and background unchanged.',
    'Photorealistic output, preserve identity and body proportions.',
    'Only modify clothing color in the masked region.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildBodyTransformPrompt({ mode = 'slim' }) {
  const preserve = [
    'Keep the exact same person and identity: same face, expression, hairstyle, skin tone, tattoos, and pose.',
    'Keep the clothing, background, camera angle, framing, and lighting exactly the same.',
    'The result must look like a real unedited photograph: natural skin texture, no airbrushing or smoothing,',
    'no warping or distortion of the background or body edges.',
  ];
  if (mode === 'slim') {
    return [
      'Edit this photo so the same person looks like they lost a significant amount of weight, around 20 kg lighter.',
      'Slim the waist, flatten and tighten the stomach, reduce chest and back fat,',
      'and slightly slim the face, neck, and arms so the whole body is consistent.',
      'The new body should be realistic and believable for this person\'s frame, not skinny or exaggerated.',
      ...preserve,
    ].join(' ');
  }
  if (mode === 'muscular') {
    return [
      'Edit this photo so the same person looks like they gained significant lean muscle after years of gym training.',
      'Broader shoulders, developed chest, muscular arms, visible abdominal definition, and lower body fat.',
      'A strong athletic physique that is realistic for this person\'s frame, not exaggerated bodybuilder proportions.',
      ...preserve,
    ].join(' ');
  }
  return '';
}

function sendRouteError(res, err, fallbackMessage) {
  const inferredAbort =
    err?.name === 'AbortError' ||
    /aborted|cancelled|canceled/i.test(String(err?.message || ''));
  const status = Number.isFinite(Number(err?.status)) ? Number(err.status) : inferredAbort ? 499 : 500;
  const payload = {
    error: err?.message || fallbackMessage,
  };
  if (Number.isFinite(Number(err?.retryAfterSeconds))) {
    payload.retryAfter = Number(err.retryAfterSeconds);
  }
  return sendJson(res, status >= 400 && status <= 599 ? status : 500, payload);
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  if (method === 'OPTIONS') return sendJson(res, 204, {});

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (method === 'GET' && (pathname === '/' || pathname.endsWith('.html'))) return serveStatic(req, res);

  if (method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'lookr-feature-transform',
      replicateConfigured: !!REPLICATE_API_TOKEN,
      geminiConfigured: !!GEMINI_API_KEY,
      sharpAvailable: !!sharp,
      timestamp: new Date().toISOString(),
    });
  }

  if (method === 'GET' && pathname === '/api/hair-colors') {
    return sendJson(res, 200, { success: true, colors: HAIR_COLOR_PRESETS });
  }

  if (method === 'GET' && pathname === '/api/hair-styles') {
    return sendJson(res, 200, { success: true, styles: HAIR_STYLE_PRESETS });
  }

  if (method === 'GET' && pathname === '/api/eye-colors') {
    return sendJson(res, 200, { success: true, colors: EYE_COLOR_PRESETS });
  }

  if (method === 'POST' && pathname === '/api/cancel-session') {
    try {
      const body = await parseBody(req);
      const sessionId = normalizeSessionId(body.sessionId);
      if (!sessionId) return sendJson(res, 400, { error: 'Missing sessionId' });
      const result = cancelSessionWork(sessionId);
      return sendJson(res, 200, {
        success: true,
        sessionId,
        cancelled: result.cancelled,
        activeRequests: result.active,
      });
    } catch (err) {
      return sendRouteError(res, err, 'Cancel failed');
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-hair-fast') {
    let cancelCtx = null;
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const { userImageUrl, colorId, hairStyleId = 'no_change', sessionId } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });
      cancelCtx = acquireCancellationContext(sessionId);

      const color = HAIR_COLOR_PRESETS.find((c) => c.id === colorId) || HAIR_COLOR_PRESETS[0];
      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      const fastHairColor = resolveFastHairColorName(color.id, color.name);
      const haircutProviderValue = resolveFastHaircut(hairStyleId);

      let editedImageUrl = source;
      if (!(fastHairColor === 'No change' && haircutProviderValue === 'No change')) {
        editedImageUrl = await generateFastHairEditUrl({
          imageDataUri: source,
          hairColorName: fastHairColor,
          haircutProviderValue,
          cancelCtx,
        });
      }

      return sendJson(res, 200, {
        success: true,
        mode: 'fast',
        editedImageUrl,
        maskUrl: '',
        chosenStyle: { id: hairStyleId, name: HAIR_STYLE_PRESETS.find((s) => s.id === hairStyleId)?.name || hairStyleId },
        chosenColor: {
          id: color.id,
          name: color.name,
          hex: color.hex,
          strength: color.strength,
          isCustomHex: false,
        },
      });
    } catch (err) {
      console.error('recolor-hair-fast error:', err);
      return sendRouteError(res, err, 'Hair transform failed');
    } finally {
      cancelCtx?.release?.();
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-hair') {
    let cancelCtx = null;
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const { userImageUrl, colorId, sessionId } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });
      cancelCtx = acquireCancellationContext(sessionId);

      const color = HAIR_COLOR_PRESETS.find((c) => c.id === colorId) || HAIR_COLOR_PRESETS[0];
      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      const rawMaskUrl = await generateHairMask(source, cancelCtx);
      const prompt = buildHairPrompt('no_change', color.hex);
      const editedImageUrl = await inpaintRegion({
        imageUrlOrDataUri: source,
        maskUrlOrDataUri: rawMaskUrl,
        prompt,
        cancelCtx,
      });
      const editedBuf = await fetchBuffer(editedImageUrl);
      const editedImageDataUri = `data:image/png;base64,${editedBuf.toString('base64')}`;

      return sendJson(res, 200, {
        success: true,
        editedImageDataUri,
        maskUrl: rawMaskUrl,
        chosenColor: {
          id: color.id,
          name: color.name,
          hex: color.hex,
          strength: color.strength,
          isCustomHex: false,
        },
      });
    } catch (err) {
      console.error('recolor-hair error:', err);
      return sendRouteError(res, err, 'Hair recolor failed');
    } finally {
      cancelCtx?.release?.();
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-eyes-fast') {
    let cancelCtx = null;
    try {
      const body = await parseBody(req);
      const { userImageUrl, eyeColorId = 'current', sessionId } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });
      cancelCtx = acquireCancellationContext(sessionId);
      if (eyeColorId === 'current') {
        return sendJson(res, 200, {
          success: true,
          mode: 'eyes-fast',
          editedImageUrl: userImageUrl,
          chosenEyeColor: { id: 'current', name: 'Current' },
        });
      }

      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      const chosenEye = EYE_COLOR_PRESETS.find((x) => x.id === eyeColorId) || { id: eyeColorId, name: eyeColorId };
      const editedImageUrl = await generateFastEyeEditUrl({
        imageDataUri: source,
        eyeColorName: chosenEye.name,
        cancelCtx,
      });

      return sendJson(res, 200, {
        success: true,
        mode: 'eyes-fast',
        editedImageUrl,
        chosenEyeColor: { id: chosenEye.id, name: chosenEye.name },
      });
    } catch (err) {
      console.error('recolor-eyes-fast error:', err);
      return sendRouteError(res, err, 'Eye transform failed');
    } finally {
      cancelCtx?.release?.();
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-face-features-fast') {
    let cancelCtx = null;
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const {
        userImageUrl,
        noseId = 'no_change',
        lipsId = 'no_change',
        eyebrowsId = 'no_change',
        eyebrowColorId = 'no_change',
        sessionId,
      } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });
      cancelCtx = acquireCancellationContext(sessionId);

      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      let output = source;
      const prompt = buildFeaturePrompt({ noseId, lipsId, eyebrowsId, eyebrowColorId });
      if (prompt) {
        const sourceBuf = await fetchBuffer(source);
        const mask = await makeRegionMaskDataUri(sourceBuf, 'face_features');
        output = await inpaintRegion({
          imageUrlOrDataUri: output,
          maskUrlOrDataUri: mask,
          prompt,
          cancelCtx,
        });
      }

      return sendJson(res, 200, {
        success: true,
        mode: 'face-features-fast',
        editedImageUrl: output,
        chosenFeatures: { noseId, lipsId, eyebrowsId, eyebrowColorId },
      });
    } catch (err) {
      console.error('recolor-face-features-fast error:', err);
      return sendRouteError(res, err, 'Face feature transform failed');
    } finally {
      cancelCtx?.release?.();
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-outfit-fast') {
    try {
      const body = await parseBody(req);
      const {
        userImageUrl,
        topColorId = 'current',
        bottomColorId = 'current',
      } = body;

      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });

      const topColor = OUTFIT_COLOR_PRESETS[topColorId] || null;
      const bottomColor = OUTFIT_COLOR_PRESETS[bottomColorId] || null;

      if (!topColor && !bottomColor) {
        return sendJson(res, 200, {
          success: true,
          mode: 'outfit-fast',
          editedImageUrl: userImageUrl,
          chosenOutfit: { topColorId, bottomColorId },
        });
      }

      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      let outputBuf = await fetchBuffer(source);
      let geminiRegions = null;
      if (GEMINI_API_KEY) {
        try {
          geminiRegions = await detectOutfitRegionsWithGemini(source);
        } catch (geminiErr) {
          console.warn('Gemini outfit regions failed, falling back to default masks:', geminiErr?.message || geminiErr);
        }
      }

      if (topColor) {
        let upperMaskDataUri = null;
        if (geminiRegions?.upper?.length) {
          upperMaskDataUri = await makePolygonMaskDataUri({
            sourceImage: outputBuf,
            includePolygons: geminiRegions.upper,
            excludePolygons: [...(geminiRegions.skin || []), ...(geminiRegions.lower || [])],
            blurSigma: 0.55,
          });
        }
        if (!upperMaskDataUri) {
          upperMaskDataUri = await makeRegionMaskDataUri(outputBuf, 'upper_body');
        }
        const upperMaskBuf = await fetchBuffer(upperMaskDataUri);
        outputBuf = await recolorWithMaskBuffer({
          imageBuf: outputBuf,
          maskBuf: upperMaskBuf,
          targetHex: topColor.hex,
          strength: 0.92,
        });
      }

      if (bottomColor) {
        let lowerMaskDataUri = null;
        if (geminiRegions?.lower?.length) {
          lowerMaskDataUri = await makePolygonMaskDataUri({
            sourceImage: outputBuf,
            includePolygons: geminiRegions.lower,
            excludePolygons: [...(geminiRegions.skin || []), ...(geminiRegions.upper || [])],
            blurSigma: 0.55,
          });
        }
        if (!lowerMaskDataUri) {
          lowerMaskDataUri = await makeRegionMaskDataUri(outputBuf, 'lower_body');
        }
        const lowerMaskBuf = await fetchBuffer(lowerMaskDataUri);
        outputBuf = await recolorWithMaskBuffer({
          imageBuf: outputBuf,
          maskBuf: lowerMaskBuf,
          targetHex: bottomColor.hex,
          strength: 0.92,
        });
      }

      const output = `data:image/png;base64,${outputBuf.toString('base64')}`;

      return sendJson(res, 200, {
        success: true,
        mode: 'outfit-fast',
        editedImageUrl: output,
        chosenOutfit: {
          topColorId,
          bottomColorId,
          topColorHex: topColor?.hex || null,
          bottomColorHex: bottomColor?.hex || null,
        },
      });
    } catch (err) {
      console.error('recolor-outfit-fast error:', err);
      return sendJson(res, 500, { error: err.message || 'Outfit recolor failed' });
    }
  }

  if (method === 'POST' && pathname === '/api/body-transform') {
    let cancelCtx = null;
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const { userImageUrl, transformMode = 'slim', sessionId } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });
      if (!['slim', 'muscular'].includes(transformMode)) {
        return sendJson(res, 400, { error: 'Invalid transformMode: must be slim or muscular' });
      }
      cancelCtx = acquireCancellationContext(sessionId);

      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      const editedImageUrl = await generateBodyTransformUrl({
        imageDataUri: source,
        mode: transformMode,
        cancelCtx,
      });

      return sendJson(res, 200, {
        success: true,
        mode: 'body-transform',
        originalImageUrl: source,
        editedImageUrl,
        transformMode,
      });
    } catch (err) {
      console.error('body-transform error:', err);
      return sendRouteError(res, err, 'Body transform failed');
    } finally {
      cancelCtx?.release?.();
    }
  }

  if (method === 'POST' && pathname === '/v1/generate') {
    try {
      const body = await parseBody(req);
      const { selfie, look, elements } = body;
      if (!selfie || !look || !Array.isArray(elements) || elements.length === 0) {
        return sendJson(res, 400, { error: 'Missing required fields: selfie, look, elements[]' });
      }

      const job = {
        id: `job_${Date.now()}`,
        status: 'completed',
        selfie,
        look,
        elements,
        // Compatibility behavior for current app flow.
        resultUrl: look,
        createdAt: Date.now(),
        completedAt: Date.now(),
      };

      return sendJson(res, 201, { job });
    } catch (err) {
      return sendJson(res, 400, { error: err.message || 'Invalid request' });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`LookR backend running at http://localhost:${PORT}`);
  console.log(`Replicate token: ${REPLICATE_API_TOKEN ? 'set' : 'missing'}`);
  console.log(`Gemini key: ${GEMINI_API_KEY ? 'set' : 'missing'} (${GEMINI_MODEL})`);
});

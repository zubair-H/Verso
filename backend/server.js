'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

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

const PORT = Number(process.env.PORT || 4000);
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

if (!globalThis.fetch) {
  throw new Error('This server requires Node 18+ (fetch not found).');
}

const REPLICATE_HAIR_SEGMENT_VERSION =
  'b335dc1b693b2de88040736eb426702adfc2f0c869ae9dba3569bac1beb9c0f6';
const REPLICATE_FAST_HAIR_VERSION =
  process.env.REPLICATE_FAST_HAIR_VERSION ||
  '3c68f21745b553cc6de2c8b487d6620cde4435e927740547d89e970689902c03';
const REPLICATE_EYE_EDIT_MODEL =
  process.env.REPLICATE_EYE_EDIT_MODEL || 'black-forest-labs/flux-kontext-pro';
const REPLICATE_INPAINTING_MODEL =
  process.env.REPLICATE_INPAINTING_MODEL || 'stability-ai/stable-diffusion-inpainting';
const REPLICATE_FACE_PARSING_MODEL =
  process.env.REPLICATE_FACE_PARSING_MODEL || 'fermatresearch/bisenet-faces';
const REPLICATE_CLOTHING_SEG_MODEL =
  process.env.REPLICATE_CLOTHING_SEG_MODEL || 'mattmdjaga/segformer-b2-clothes';
const REPLICATE_SAM2_MODEL = process.env.REPLICATE_SAM2_MODEL || 'meta/sam-2';
const REPLICATE_HAIR_SEG_MODEL = process.env.REPLICATE_HAIR_SEG_MODEL || '';
const SESSION_TTL_MS = Math.max(1, Number(process.env.SESSION_TTL_MINUTES || 30)) * 60 * 1000;
const FACE_PARSING_MODEL_FALLBACKS = [
  REPLICATE_FACE_PARSING_MODEL,
  'fermatresearch/bisenet-faces',
  'georgedavila/face-parsing',
];

const HAIR_COLORS = [
  { id: 'current', name: 'Current', hex: '#000000', strength: 0 },
  { id: 'jet_black', name: 'Jet Black', hex: '#111111', strength: 0.75 },
  { id: 'dark_brown', name: 'Dark Brown', hex: '#2a1b12', strength: 0.7 },
  { id: 'light_brown', name: 'Light Brown', hex: '#6b4a2f', strength: 0.65 },
  { id: 'blonde', name: 'Blonde', hex: '#d8c07a', strength: 0.6 },
  { id: 'platinum', name: 'Platinum', hex: '#e8e4da', strength: 0.55 },
  { id: 'auburn', name: 'Auburn', hex: '#8b3a2b', strength: 0.65 },
  { id: 'silver', name: 'Silver', hex: '#c8c8c8', strength: 0.55 },
  { id: 'ash_brown', name: 'Ash Brown', hex: '#5f544b', strength: 0.62 },
  { id: 'chestnut', name: 'Chestnut', hex: '#7b3f2a', strength: 0.66 },
  { id: 'copper', name: 'Copper', hex: '#b4663a', strength: 0.68 },
  { id: 'rose_gold', name: 'Rose Gold', hex: '#c98a86', strength: 0.58 },
  { id: 'mahogany', name: 'Mahogany', hex: '#4b1f1f', strength: 0.7 },
  { id: 'burgundy', name: 'Burgundy', hex: '#5b1f35', strength: 0.68 },
  { id: 'blue_black', name: 'Blue Black', hex: '#1a1f2c', strength: 0.74 },
  { id: 'honey_blonde', name: 'Honey Blonde', hex: '#cfa55f', strength: 0.6 },
  { id: 'caramel', name: 'Caramel', hex: '#a06a3e', strength: 0.63 },
  { id: 'chocolate', name: 'Chocolate', hex: '#4a2f23', strength: 0.69 },
  { id: 'ginger', name: 'Ginger', hex: '#b65d2b', strength: 0.67 },
  { id: 'purple_plum', name: 'Plum', hex: '#4b325f', strength: 0.62 },
  { id: 'navy_tint', name: 'Navy Tint', hex: '#273b6a', strength: 0.6 },
  { id: 'emerald_tint', name: 'Emerald Tint', hex: '#2e6a56', strength: 0.58 },
  { id: 'pastel_pink', name: 'Pastel Pink', hex: '#d9a4b2', strength: 0.52 },
  { id: 'lavender', name: 'Lavender', hex: '#9c8bbf', strength: 0.55 },
];

const HAIR_STYLES = [
  { id: 'no_change', name: 'Keep Current', providerValue: 'No change' },
  { id: 'straight', name: 'Straight', providerValue: 'Straight' },
  { id: 'wavy', name: 'Wavy', providerValue: 'Wavy' },
  { id: 'curly', name: 'Curly', providerValue: 'Curly' },
  { id: 'bob', name: 'Bob', providerValue: 'Bob' },
  { id: 'pixie_cut', name: 'Pixie Cut', providerValue: 'Pixie Cut' },
  { id: 'layered', name: 'Layered', providerValue: 'Layered' },
  { id: 'soft_waves', name: 'Soft Waves', providerValue: 'Soft Waves' },
  { id: 'side_parted', name: 'Side-Parted', providerValue: 'Side-Parted' },
  { id: 'center_parted', name: 'Center-Parted', providerValue: 'Center-Parted' },
  { id: 'blunt_bangs', name: 'Blunt Bangs', providerValue: 'Blunt Bangs' },
  { id: 'side_swept_bangs', name: 'Side-Swept Bangs', providerValue: 'Side-Swept Bangs' },
  { id: 'slicked_back', name: 'Slicked Back', providerValue: 'Slicked Back' },
  { id: 'shag', name: 'Shag', providerValue: 'Shag' },
  { id: 'lob', name: 'Lob', providerValue: 'Lob' },
  { id: 'angled_bob', name: 'Angled Bob', providerValue: 'Angled Bob' },
  { id: 'a_line_bob', name: 'A-Line Bob', providerValue: 'A-Line Bob' },
  { id: 'asymmetrical_bob', name: 'Asymmetrical Bob', providerValue: 'Asymmetrical Bob' },
  { id: 'crew_cut', name: 'Crew Cut', providerValue: 'Crew Cut' },
  { id: 'faux_hawk', name: 'Faux Hawk', providerValue: 'Faux Hawk' },
  { id: 'high_ponytail', name: 'High Ponytail', providerValue: 'High Ponytail' },
  { id: 'low_ponytail', name: 'Low Ponytail', providerValue: 'Low Ponytail' },
  { id: 'messy_bun', name: 'Messy Bun', providerValue: 'Messy Bun' },
  { id: 'top_knot', name: 'Top Knot', providerValue: 'Top Knot' },
  { id: 'french_braid', name: 'French Braid', providerValue: 'French Braid' },
  { id: 'dutch_braid', name: 'Dutch Braid', providerValue: 'Dutch Braid' },
  { id: 'fishtail_braid', name: 'Fishtail Braid', providerValue: 'Fishtail Braid' },
];

const EYE_COLORS = [
  { id: 'current', name: 'Current' },
  { id: 'brown', name: 'Brown' },
  { id: 'dark_brown', name: 'Dark Brown' },
  { id: 'hazel', name: 'Hazel' },
  { id: 'amber', name: 'Amber' },
  { id: 'green', name: 'Green' },
  { id: 'blue', name: 'Blue' },
  { id: 'gray', name: 'Gray' },
  { id: 'violet', name: 'Violet' },
];

const LIP_COLORS = [
  { id: 'nude', name: 'Nude', hex: '#c8956c' },
  { id: 'rose', name: 'Rose', hex: '#c9687a' },
  { id: 'red', name: 'Classic Red', hex: '#c0392b' },
  { id: 'berry', name: 'Berry', hex: '#7b2d5e' },
  { id: 'coral', name: 'Coral', hex: '#e8734a' },
  { id: 'mauve', name: 'Mauve', hex: '#9e6b7a' },
  { id: 'plum', name: 'Plum', hex: '#5c2d4e' },
  { id: 'terracotta', name: 'Terracotta', hex: '#b85c38' },
  { id: 'pink', name: 'Baby Pink', hex: '#e8a0b4' },
  { id: 'burgundy', name: 'Burgundy', hex: '#722f37' },
];

const NAIL_COLORS = [
  { id: 'nude', name: 'Nude', hex: '#c9a98a' },
  { id: 'french', name: 'French White', hex: '#f5f0eb' },
  { id: 'red', name: 'Red', hex: '#c0392b' },
  { id: 'hot_pink', name: 'Hot Pink', hex: '#d63384' },
  { id: 'coral', name: 'Coral', hex: '#e8734a' },
  { id: 'lavender', name: 'Lavender', hex: '#9c8bbf' },
  { id: 'mint', name: 'Mint', hex: '#4dab8c' },
  { id: 'navy', name: 'Navy', hex: '#1c3557' },
  { id: 'black', name: 'Black', hex: '#111111' },
  { id: 'gold', name: 'Gold', hex: '#c9a84c' },
];

const EYEBROW_SHAPES = [
  { id: 'natural', name: 'Natural', prompt: 'natural softly arched eyebrows, groomed' },
  { id: 'arched', name: 'High Arch', prompt: 'high arched eyebrows, defined sharp peak' },
  { id: 'straight', name: 'Straight', prompt: 'straight flat horizontal eyebrows, Korean style' },
  { id: 'thick', name: 'Thick Bushy', prompt: 'thick full bushy eyebrows, model brows' },
  { id: 'thin', name: 'Thin', prompt: 'thin pencil-thin eyebrows, retro 90s style' },
  { id: 'rounded', name: 'Rounded', prompt: 'rounded soft curved eyebrows, gentle arc' },
  { id: 'feathered', name: 'Feathered', prompt: 'feathered brushed up eyebrows, fluffy brows' },
];

const LIP_SHAPES = [
  { id: 'natural', name: 'Natural', prompt: 'natural lip shape, no alteration' },
  { id: 'full', name: 'Full', prompt: 'fuller plumper lips, naturally enhanced volume' },
  { id: 'cupids_bow', name: "Cupid's Bow", prompt: 'defined cupids bow upper lip, sharp peaks' },
  { id: 'thin', name: 'Thin', prompt: 'slimmer thinner lips, subtle and refined' },
  { id: 'heart', name: 'Heart', prompt: 'heart shaped lips, pronounced upper lip dip' },
];

const JAWLINE_PRESETS = [
  { id: 'natural', name: 'Natural', prompt: 'natural jawline, no change' },
  { id: 'defined', name: 'Defined', prompt: 'more defined sharp jawline, chiseled' },
  { id: 'soft', name: 'Soft', prompt: 'softer rounder jawline, gentle oval face shape' },
  { id: 'square', name: 'Square', prompt: 'square strong jawline, angular jaw' },
  { id: 'v_shape', name: 'V-Shape', prompt: 'V-shaped slim jawline, Korean V-face' },
  { id: 'slim', name: 'Slim', prompt: 'slimmer narrower jaw and face width' },
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
  ash_brown: 'Ash Brown',
  chestnut: 'Chestnut',
  copper: 'Copper',
  rose_gold: 'Rose Gold',
  mahogany: 'Mahogany',
  burgundy: 'Burgundy',
  blue_black: 'Blue-Black',
  honey_blonde: 'Honey Blonde',
  caramel: 'Caramel',
  chocolate: 'Medium Brown',
  ginger: 'Red',
  purple_plum: 'Purple',
  navy_tint: 'Blue',
  emerald_tint: 'Green',
  pastel_pink: 'Pink',
  lavender: 'Purple',
};

const FACE_PALETTE = [
  { id: 0, rgb: [0, 0, 0], key: 'background' },
  { id: 1, rgb: [204, 0, 0], key: 'skin' },
  { id: 2, rgb: [76, 153, 0], key: 'left_eyebrow' },
  { id: 3, rgb: [204, 204, 0], key: 'right_eyebrow' },
  { id: 4, rgb: [51, 51, 255], key: 'left_eye' },
  { id: 5, rgb: [204, 0, 204], key: 'right_eye' },
  { id: 6, rgb: [0, 255, 255], key: 'eye_glasses' },
  { id: 7, rgb: [255, 204, 204], key: 'left_ear' },
  { id: 8, rgb: [102, 51, 0], key: 'right_ear' },
  { id: 9, rgb: [255, 0, 0], key: 'earring' },
  { id: 10, rgb: [102, 204, 0], key: 'nose' },
  { id: 11, rgb: [255, 255, 0], key: 'mouth' },
  { id: 12, rgb: [0, 0, 153], key: 'upper_lip' },
  { id: 13, rgb: [0, 0, 204], key: 'lower_lip' },
  { id: 14, rgb: [255, 51, 153], key: 'neck' },
  { id: 15, rgb: [0, 204, 204], key: 'neck_l' },
  { id: 16, rgb: [0, 51, 0], key: 'cloth' },
  { id: 17, rgb: [255, 153, 51], key: 'hair' },
  { id: 18, rgb: [0, 204, 0], key: 'hat' },
];

const MODEL_VERSION_CACHE = new Map();
const SESSION_STORE = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of SESSION_STORE.entries()) {
    if (now - session.lastAccessedAt > SESSION_TTL_MS) {
      SESSION_STORE.delete(id);
      console.log(`Session ${id} expired and cleared`);
    }
  }
}, 5 * 60 * 1000);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
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

function isDataUri(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;

  const match = value.match(/^#?([a-fA-F0-9]{6})$/);
  if (!match) return null;
  return `#${match[1].toLowerCase()}`;
}

function clampStrength(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error('Invalid hex color');
  const raw = normalized.slice(1);
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h = (h * 60 + 360) % 360;
  }

  return { h, s, l };
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hh >= 0 && hh < 1) {
    r1 = c;
    g1 = x;
  } else if (hh < 2) {
    r1 = x;
    g1 = c;
  } else if (hh < 3) {
    g1 = c;
    b1 = x;
  } else if (hh < 4) {
    g1 = x;
    b1 = c;
  } else if (hh < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function makeDebug(prefix) {
  const startedAtMs = Date.now();
  const debug = {
    traceId: `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    elapsedMs: 0,
    steps: [],
  };
  const mark = (message) => {
    debug.steps.push({ atMs: Date.now() - startedAtMs, message });
  };
  const finish = () => {
    debug.finishedAt = new Date().toISOString();
    debug.elapsedMs = Date.now() - startedAtMs;
  };
  return { debug, mark, finish };
}

function toDataUriFromBuffer(buffer, mime = 'image/png') {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function extractMaskNames(masks) {
  return Object.entries(masks || {})
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
}

function sanitizeSession(session) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    lastAccessedAt: session.lastAccessedAt,
    width: session.width,
    height: session.height,
    masks: Object.fromEntries(
      Object.entries(session.masks || {}).map(([k, v]) => [k, v ? '[cached]' : null])
    ),
    landmarks: session.landmarks,
    analysisStatus: session.analysisStatus,
    analysisError: session.analysisError,
  };
}

function getSession(sessionId) {
  const session = SESSION_STORE.get(sessionId);
  if (!session) return null;
  session.lastAccessedAt = Date.now();
  return session;
}

async function maskDataToBuffer(maskData) {
  if (!maskData) return null;
  return fetchBuffer(maskData);
}

async function urlToDataUri(imageUrl) {
  let finalUrl = imageUrl;

  if (finalUrl.includes('images.unsplash.com')) {
    const parsed = new URL(finalUrl);
    if (!parsed.searchParams.get('w')) parsed.searchParams.set('w', '1024');
    finalUrl = parsed.toString();
  }

  const response = await fetch(finalUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) {
    throw new Error(`Image fetch failed (${response.status})`);
  }

  const contentType = (response.headers.get('content-type') || 'image/jpeg').split(';')[0];
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

async function fetchBuffer(urlOrDataUri) {
  if (isDataUri(urlOrDataUri)) {
    const parts = urlOrDataUri.split(',');
    return Buffer.from(parts[1] || '', 'base64');
  }

  const response = await fetch(urlOrDataUri, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function createReplicatePrediction({ version, input }, retryCount = 0) {
  const maxRetries = 3;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        input,
      }),
    });

    const text = await response.text();

    if (response.status === 429 && retryCount < maxRetries) {
      let retryAfter = 7;
      try {
        const errorData = JSON.parse(text);
        retryAfter = errorData.retry_after || 7;
      } catch {
      }

      console.log(`Rate limited. Waiting ${retryAfter}s before retry ${retryCount + 1}/${maxRetries}...`);
      await sleep(retryAfter * 1000);
      return createReplicatePrediction({ version, input }, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`Replicate create failed (${response.status}): ${text}`);
    }
    return JSON.parse(text);
  } catch (error) {
    if (error.message.includes('429') && retryCount < maxRetries) {
      console.log(`Rate limit error. Waiting 7s before retry ${retryCount + 1}/${maxRetries}...`);
      await sleep(7000);
      return createReplicatePrediction({ version, input }, retryCount + 1);
    }
    throw error;
  }
}

async function getReplicateLatestVersionId(modelSlug) {
  const cached = MODEL_VERSION_CACHE.get(modelSlug);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) {
    return cached.versionId;
  }

  const [owner, name] = modelSlug.split('/');
  if (!owner || !name) {
    throw new Error(`Invalid model slug: ${modelSlug}`);
  }

  const response = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Replicate model lookup failed (${response.status}): ${text}`);
  }

  const model = JSON.parse(text);
  const versionId = model?.latest_version?.id;
  if (!versionId) {
    throw new Error(`No latest version available for model ${modelSlug}`);
  }

  MODEL_VERSION_CACHE.set(modelSlug, { versionId, at: Date.now() });
  return versionId;
}

async function pollReplicatePrediction(predictionId, { intervalMs = 1500, timeoutMs = 240000 } = {}) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Replicate poll failed (${response.status}): ${text}`);
    }

    const prediction = JSON.parse(text);
    if (prediction.status === 'succeeded') return prediction;
    if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error || 'unknown error'}`);
    }
    if (prediction.status === 'canceled') {
      throw new Error('Prediction canceled');
    }

    await sleep(intervalMs);
  }

  throw new Error('Prediction timed out after 240s');
}

function normalizeReplicateOutput(output) {
  if (Array.isArray(output)) return output[0] || null;
  return typeof output === 'string' ? output : null;
}

async function generateHairMaskUrl(userImageDataUri) {
  const created = await createReplicatePrediction({
    version: REPLICATE_HAIR_SEGMENT_VERSION,
    input: { image: userImageDataUri },
  });
  const finalPrediction = await pollReplicatePrediction(created.id, {
    intervalMs: 1500,
    timeoutMs: 240000,
  });

  const maskUrl = normalizeReplicateOutput(finalPrediction.output);
  if (!maskUrl) {
    throw new Error('Replicate returned an empty hair mask output');
  }

  return maskUrl;
}

async function generateFastHairEditUrl({ imageDataUri, hairColorName, haircutProviderValue }) {
  const input = {
    input_image: imageDataUri,
    hair_color: hairColorName,
    output_format: 'png',
    aspect_ratio: 'match_input_image',
    safety_tolerance: 2,
  };
  if (haircutProviderValue) {
    input.haircut = haircutProviderValue;
  }

  const created = await createReplicatePrediction({
    version: REPLICATE_FAST_HAIR_VERSION,
    input,
  });

  const finalPrediction = await pollReplicatePrediction(created.id, {
    intervalMs: 1500,
    timeoutMs: 240000,
  });

  const outputUrl = normalizeReplicateOutput(finalPrediction.output);
  if (!outputUrl) {
    throw new Error('Fast hair model returned empty output');
  }
  return outputUrl;
}

async function generateFastEyeEditUrl({ imageDataUri, eyeColorName }) {
  const prompt = `Change only the iris color of both eyes to ${eyeColorName}. Keep face identity, hair, skin tone, lighting, and background unchanged. Photorealistic.`;
  const latestVersion = await getReplicateLatestVersionId(REPLICATE_EYE_EDIT_MODEL);
  const created = await createReplicatePrediction({
    version: latestVersion,
    input: {
      input_image: imageDataUri,
      prompt,
      output_format: 'png',
      aspect_ratio: 'match_input_image',
      safety_tolerance: 2,
      prompt_upsampling: false,
    },
  });

  const finalPrediction = await pollReplicatePrediction(created.id, {
    intervalMs: 1300,
    timeoutMs: 240000,
  });
  const outputUrl = normalizeReplicateOutput(finalPrediction.output);
  if (!outputUrl) {
    throw new Error('Eye color model returned empty output');
  }
  return outputUrl;
}

function nearestPaletteClass(r, g, b) {
  let nearest = FACE_PALETTE[0];
  let minDist = Number.POSITIVE_INFINITY;
  for (const entry of FACE_PALETTE) {
    const dr = r - entry.rgb[0];
    const dg = g - entry.rgb[1];
    const db = b - entry.rgb[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) {
      minDist = dist;
      nearest = entry;
    }
  }
  return nearest.id;
}

function computeMaskStats(maskRaw, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (maskRaw[idx] <= 0) continue;
      count += 1;
      sumX += x;
      sumY += y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!count) {
    return {
      count: 0,
      bbox: null,
      centroid: null,
    };
  }

  return {
    count,
    bbox: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
    centroid: { x: Math.round(sumX / count), y: Math.round(sumY / count) },
  };
}

function mergeMasks(rawMasks, width, height, classIds) {
  const merged = Buffer.alloc(width * height, 0);
  for (const classId of classIds) {
    const raw = rawMasks.get(classId);
    if (!raw) continue;
    for (let i = 0; i < merged.length; i += 1) {
      if (raw[i] > 0) merged[i] = 255;
    }
  }
  return merged;
}

function refineHairMask(rawHair, rawSkin, width, height) {
  const refined = Buffer.from(rawHair);
  const skinStats = computeMaskStats(rawSkin, width, height);
  const faceBox = skinStats.bbox;

  const removeDilatedSkin = (x, y) => {
    for (let oy = -2; oy <= 2; oy += 1) {
      const yy = y + oy;
      if (yy < 0 || yy >= height) continue;
      for (let ox = -2; ox <= 2; ox += 1) {
        const xx = x + ox;
        if (xx < 0 || xx >= width) continue;
        if (rawSkin[yy * width + xx] > 0) return true;
      }
    }
    return false;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (refined[idx] === 0) continue;

      // Never recolor pixels that are skin (or immediately adjacent to skin).
      if (removeDilatedSkin(x, y)) {
        refined[idx] = 0;
        continue;
      }

      if (!faceBox) continue;
      const cx1 = faceBox.x + faceBox.w * 0.14;
      const cx2 = faceBox.x + faceBox.w * 0.86;
      const faceYTop = faceBox.y + faceBox.h * 0.16;
      const faceYBottom = faceBox.y + faceBox.h * 0.96;
      const lowerFaceY = faceBox.y + faceBox.h * 0.48;

      // Strongly exclude central face ellipse to prevent skin tinting.
      const centerX = faceBox.x + faceBox.w * 0.5;
      const centerY = faceBox.y + faceBox.h * 0.57;
      const rx = faceBox.w * 0.34;
      const ry = faceBox.h * 0.43;
      const nx = (x - centerX) / Math.max(1, rx);
      const ny = (y - centerY) / Math.max(1, ry);
      if (nx * nx + ny * ny <= 1) {
        refined[idx] = 0;
        continue;
      }

      // Avoid central lower-face leakage that tints cheeks/jaw/chin.
      if (x >= cx1 && x <= cx2 && y >= lowerFaceY) {
        refined[idx] = 0;
        continue;
      }

      // Additional guardrail: remove pixels in forehead/face core zone.
      if (x >= cx1 && x <= cx2 && y >= faceYTop && y <= faceYBottom) {
        refined[idx] = 0;
      }
    }
  }

  return refined;
}

async function rawMaskToPng(maskRaw, width, height) {
  return sharp(maskRaw, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

async function computeMaskCoverage(maskData) {
  if (!maskData) return 0;
  const buffer = await fetchBuffer(maskData);
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) return 0;
  const raw = await sharp(buffer).resize(meta.width, meta.height, { fit: 'fill' }).grayscale().raw().toBuffer();
  let active = 0;
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] > 127) active += 1;
  }
  return active / Math.max(1, raw.length);
}

async function normalizeMaskBuffer(maskBuffer, width, height, threshold = 140) {
  return sharp(maskBuffer)
    .resize(width, height, { fit: 'fill' })
    .grayscale()
    .threshold(threshold)
    .erode(1)
    .blur(0.6)
    .png()
    .toBuffer();
}

async function computeMaskQuality({ maskData, skinMaskData, width, height }) {
  if (!maskData) {
    return { coverage: 0, skinOverlap: 1 };
  }
  const [maskBuffer, skinBuffer] = await Promise.all([
    fetchBuffer(maskData),
    fetchBuffer(skinMaskData),
  ]);
  const [maskRaw, skinRaw] = await Promise.all([
    sharp(maskBuffer).resize(width, height, { fit: 'fill' }).grayscale().threshold(140).raw().toBuffer(),
    sharp(skinBuffer).resize(width, height, { fit: 'fill' }).grayscale().threshold(140).raw().toBuffer(),
  ]);

  let maskCount = 0;
  let overlapCount = 0;
  for (let i = 0; i < maskRaw.length; i += 1) {
    const inMask = maskRaw[i] > 127;
    if (!inMask) continue;
    maskCount += 1;
    if (skinRaw[i] > 127) overlapCount += 1;
  }

  const total = Math.max(1, maskRaw.length);
  return {
    coverage: maskCount / total,
    skinOverlap: overlapCount / Math.max(1, maskCount),
  };
}

function isHairMaskQualityBad(quality) {
  if (!quality) return true;
  if (quality.coverage < 0.003) return true;
  if (quality.coverage > 0.6) return true;
  if (quality.skinOverlap > 0.22) return true;
  return false;
}

async function generateHairMaskWithSam2({ imageDataUri, width, height, faceBox }) {
  const version = await getReplicateLatestVersionId(REPLICATE_SAM2_MODEL);
  const faceCenterX = faceBox ? Math.round(faceBox.x + faceBox.w * 0.5) : Math.round(width * 0.5);
  const hairPointY = faceBox
    ? Math.max(2, Math.round(faceBox.y - faceBox.h * 0.15))
    : Math.round(height * 0.14);
  const created = await createReplicatePrediction({
    version,
    input: {
      image: imageDataUri,
      point_coords: [[faceCenterX, hairPointY]],
      point_labels: [1],
    },
  });
  const final = await pollReplicatePrediction(created.id, { intervalMs: 1500, timeoutMs: 240000 });
  const outputUrl = normalizeReplicateOutput(final.output);
  if (!outputUrl) throw new Error('SAM2 returned empty output for hair mask');
  const samMaskBuffer = await fetchBuffer(outputUrl);
  const normalized = await normalizeMaskBuffer(samMaskBuffer, width, height, 130);
  return toDataUriFromBuffer(normalized);
}

async function generateHairMaskWithAltModel({ imageDataUri, width, height }) {
  if (!REPLICATE_HAIR_SEG_MODEL) return null;
  const version = await getReplicateLatestVersionId(REPLICATE_HAIR_SEG_MODEL);
  const created = await createReplicatePrediction({
    version,
    input: { image: imageDataUri },
  });
  const final = await pollReplicatePrediction(created.id, { intervalMs: 1500, timeoutMs: 240000 });
  const outputUrl = normalizeReplicateOutput(final.output);
  if (!outputUrl) throw new Error('Alternate hair model returned empty output');
  const maskBuffer = await fetchBuffer(outputUrl);
  const normalized = await normalizeMaskBuffer(maskBuffer, width, height, 140);
  return toDataUriFromBuffer(normalized);
}

function pointFromStats(stats, fallback = { x: 0, y: 0 }) {
  return stats && stats.centroid ? stats.centroid : fallback;
}

async function parseFaceParsingOutput(outputUrl) {
  const segBuffer = await fetchBuffer(outputUrl);
  const image = sharp(segBuffer).ensureAlpha();
  const meta = await image.metadata();
  const width = meta.width;
  const height = meta.height;
  if (!width || !height) {
    throw new Error('Face parsing output has invalid dimensions');
  }

  const raw = await image.raw().toBuffer();
  const pixelCount = width * height;
  const labels = new Uint8Array(pixelCount);

  for (let i = 0; i < pixelCount; i += 1) {
    const base = i * 4;
    labels[i] = nearestPaletteClass(raw[base], raw[base + 1], raw[base + 2]);
  }

  const rawMasks = new Map();
  for (const entry of FACE_PALETTE) {
    rawMasks.set(entry.id, Buffer.alloc(pixelCount, 0));
  }

  for (let i = 0; i < pixelCount; i += 1) {
    const classId = labels[i];
    const target = rawMasks.get(classId);
    if (target) target[i] = 255;
  }

  const rawHairBase = mergeMasks(rawMasks, width, height, [17]);
  const rawEyebrows = mergeMasks(rawMasks, width, height, [2, 3]);
  const rawEyes = mergeMasks(rawMasks, width, height, [4, 5]);
  const rawLips = mergeMasks(rawMasks, width, height, [12, 13]);
  const rawSkin = mergeMasks(rawMasks, width, height, [1]);
  const rawHair = refineHairMask(rawHairBase, rawSkin, width, height);
  const rawNose = mergeMasks(rawMasks, width, height, [10]);
  const rawEars = mergeMasks(rawMasks, width, height, [7, 8]);
  const rawNeck = mergeMasks(rawMasks, width, height, [14, 15]);
  const rawClothing = mergeMasks(rawMasks, width, height, [16]);
  const rawBackground = mergeMasks(rawMasks, width, height, [0]);

  const skinStats = computeMaskStats(rawSkin, width, height);
  const leftEyeStats = computeMaskStats(rawMasks.get(4), width, height);
  const rightEyeStats = computeMaskStats(rawMasks.get(5), width, height);
  const noseStats = computeMaskStats(rawNose, width, height);
  const lipsStats = computeMaskStats(rawLips, width, height);

  let chinBottom = { x: pointFromStats(skinStats).x, y: pointFromStats(skinStats).y };
  if (skinStats.bbox) {
    chinBottom = {
      x: Math.round(skinStats.bbox.x + skinStats.bbox.w / 2),
      y: skinStats.bbox.y + skinStats.bbox.h - 1,
    };
  }

  const jawlinePoints = [];
  if (skinStats.bbox) {
    const y = Math.round(skinStats.bbox.y + skinStats.bbox.h * 0.88);
    for (let i = 0; i <= 8; i += 1) {
      const x = Math.round(skinStats.bbox.x + (skinStats.bbox.w * i) / 8);
      jawlinePoints.push({ x, y });
    }
  }

  const cheekboneLeft = skinStats.bbox
    ? {
        x: Math.round(skinStats.bbox.x + skinStats.bbox.w * 0.26),
        y: Math.round(skinStats.bbox.y + skinStats.bbox.h * 0.43),
      }
    : pointFromStats(skinStats);

  const cheekboneRight = skinStats.bbox
    ? {
        x: Math.round(skinStats.bbox.x + skinStats.bbox.w * 0.74),
        y: Math.round(skinStats.bbox.y + skinStats.bbox.h * 0.43),
      }
    : pointFromStats(skinStats);

  return {
    width,
    height,
    masks: {
      hair: toDataUriFromBuffer(await rawMaskToPng(rawHair, width, height)),
      eyebrows: toDataUriFromBuffer(await rawMaskToPng(rawEyebrows, width, height)),
      eyes: toDataUriFromBuffer(await rawMaskToPng(rawEyes, width, height)),
      lips: toDataUriFromBuffer(await rawMaskToPng(rawLips, width, height)),
      skin: toDataUriFromBuffer(await rawMaskToPng(rawSkin, width, height)),
      teeth: null,
      nose: toDataUriFromBuffer(await rawMaskToPng(rawNose, width, height)),
      ears: toDataUriFromBuffer(await rawMaskToPng(rawEars, width, height)),
      neck: toDataUriFromBuffer(await rawMaskToPng(rawNeck, width, height)),
      clothing: computeMaskStats(rawClothing, width, height).count
        ? toDataUriFromBuffer(await rawMaskToPng(rawClothing, width, height))
        : null,
      hands: null,
      shoes: null,
      background: toDataUriFromBuffer(await rawMaskToPng(rawBackground, width, height)),
    },
    landmarks: {
      faceBox: skinStats.bbox || { x: 0, y: 0, w: width, h: height },
      eyeLeft: pointFromStats(leftEyeStats, { x: Math.round(width * 0.35), y: Math.round(height * 0.4) }),
      eyeRight: pointFromStats(rightEyeStats, { x: Math.round(width * 0.65), y: Math.round(height * 0.4) }),
      noseTop: pointFromStats(noseStats, { x: Math.round(width * 0.5), y: Math.round(height * 0.45) }),
      mouthCenter: pointFromStats(lipsStats, { x: Math.round(width * 0.5), y: Math.round(height * 0.65) }),
      chinBottom,
      jawlinePoints,
      cheekboneLeft,
      cheekboneRight,
    },
  };
}

async function resolveFaceParsingModel() {
  const tried = new Set();
  let lastError = null;

  for (const modelSlug of FACE_PARSING_MODEL_FALLBACKS) {
    if (!modelSlug || tried.has(modelSlug)) continue;
    tried.add(modelSlug);
    try {
      const version = await getReplicateLatestVersionId(modelSlug);
      return { modelSlug, version };
    } catch (error) {
      lastError = error;
      const message = String(error?.message || '');
      const isNotFound = message.includes('404') || message.includes('Model not found');
      if (!isNotFound) throw error;
    }
  }

  throw lastError || new Error('No usable face parsing model found');
}

async function runAnalysis(sessionId) {
  const session = SESSION_STORE.get(sessionId);
  if (!session) return;

  try {
    session.analysisDebug = session.analysisDebug || [];
    session.analysisDebug.push({ at: new Date().toISOString(), message: 'Resolving face parsing model version' });
    const modelInfo = await resolveFaceParsingModel();
    session.analysisDebug.push({
      at: new Date().toISOString(),
      message: `Using face parsing model: ${modelInfo.modelSlug}`,
    });
    session.analysisDebug.push({ at: new Date().toISOString(), message: 'Creating face parsing prediction' });
    const created = await createReplicatePrediction({
      version: modelInfo.version,
      input: { image: session.originalDataUri },
    });
    session.analysisDebug.push({ at: new Date().toISOString(), message: `Prediction created: ${created.id}` });
    const finalPrediction = await pollReplicatePrediction(created.id, {
      intervalMs: 1500,
      timeoutMs: 240000,
    });
    session.analysisDebug.push({ at: new Date().toISOString(), message: 'Prediction completed, parsing masks' });
    const outputUrl = normalizeReplicateOutput(finalPrediction.output);
    if (!outputUrl) throw new Error('Face parsing returned empty output');

    const parsed = await parseFaceParsingOutput(outputUrl);
    const latest = SESSION_STORE.get(sessionId);
    if (!latest) return;
    latest.width = parsed.width;
    latest.height = parsed.height;
    latest.masks = { ...latest.masks, ...parsed.masks };
    latest.landmarks = parsed.landmarks;
    latest.analysisStatus = 'complete';
    latest.analysisError = null;
    latest.analysisDebug = latest.analysisDebug || [];
    latest.analysisDebug.push({
      at: new Date().toISOString(),
      message: `Analysis complete. Masks: ${extractMaskNames(latest.masks).join(', ') || 'none'}`,
    });
    latest.lastAccessedAt = Date.now();

    // Do not block analysis completion on dedicated hair-mask generation.
    (async () => {
      const sessionAfterComplete = SESSION_STORE.get(sessionId);
      if (!sessionAfterComplete) return;
      sessionAfterComplete.analysisDebug = sessionAfterComplete.analysisDebug || [];
      const faceBox = sessionAfterComplete.landmarks?.faceBox || null;
      try {
        sessionAfterComplete.analysisDebug.push({
          at: new Date().toISOString(),
          message: 'Generating hair mask with SAM2 (background)',
        });
        let chosenHairMask = await generateHairMaskWithSam2({
          imageDataUri: sessionAfterComplete.originalDataUri,
          width: parsed.width,
          height: parsed.height,
          faceBox,
        });
        let quality = await computeMaskQuality({
          maskData: chosenHairMask,
          skinMaskData: sessionAfterComplete.masks.skin,
          width: parsed.width,
          height: parsed.height,
        });
        sessionAfterComplete.analysisDebug.push({
          at: new Date().toISOString(),
          message: `SAM2 hair mask quality coverage=${(quality.coverage * 100).toFixed(1)}% skinOverlap=${(quality.skinOverlap * 100).toFixed(1)}%`,
        });

        if (isHairMaskQualityBad(quality)) {
          sessionAfterComplete.analysisDebug.push({
            at: new Date().toISOString(),
            message: 'SAM2 quality low; falling back to legacy hair segmentation',
          });
          const legacyMaskUrl = await generateHairMaskUrl(sessionAfterComplete.originalDataUri);
          const legacyMaskBuffer = await fetchBuffer(legacyMaskUrl);
          chosenHairMask = toDataUriFromBuffer(
            await normalizeMaskBuffer(legacyMaskBuffer, parsed.width, parsed.height, 140)
          );
          quality = await computeMaskQuality({
            maskData: chosenHairMask,
            skinMaskData: sessionAfterComplete.masks.skin,
            width: parsed.width,
            height: parsed.height,
          });
          sessionAfterComplete.analysisDebug.push({
            at: new Date().toISOString(),
            message: `Legacy hair mask quality coverage=${(quality.coverage * 100).toFixed(1)}% skinOverlap=${(quality.skinOverlap * 100).toFixed(1)}%`,
          });
        }

        if (isHairMaskQualityBad(quality) && REPLICATE_HAIR_SEG_MODEL) {
          sessionAfterComplete.analysisDebug.push({
            at: new Date().toISOString(),
            message: `Legacy quality low; trying alternate hair model ${REPLICATE_HAIR_SEG_MODEL}`,
          });
          try {
            const altMask = await generateHairMaskWithAltModel({
              imageDataUri: sessionAfterComplete.originalDataUri,
              width: parsed.width,
              height: parsed.height,
            });
            if (altMask) {
              const altQuality = await computeMaskQuality({
                maskData: altMask,
                skinMaskData: sessionAfterComplete.masks.skin,
                width: parsed.width,
                height: parsed.height,
              });
              sessionAfterComplete.analysisDebug.push({
                at: new Date().toISOString(),
                message: `Alt model quality coverage=${(altQuality.coverage * 100).toFixed(1)}% skinOverlap=${(altQuality.skinOverlap * 100).toFixed(1)}%`,
              });
              if (!isHairMaskQualityBad(altQuality)) {
                chosenHairMask = altMask;
                quality = altQuality;
              }
            }
          } catch (altError) {
            sessionAfterComplete.analysisDebug.push({
              at: new Date().toISOString(),
              message: `Alternate hair model failed: ${altError.message || 'unknown error'}`,
            });
          }
        }

        sessionAfterComplete.masks.hair = chosenHairMask;
        const hairCoverage = await computeMaskCoverage(sessionAfterComplete.masks.hair);
        const skinCoverage = await computeMaskCoverage(sessionAfterComplete.masks.skin);
        sessionAfterComplete.analysisDebug.push({
          at: new Date().toISOString(),
          message: 'Dedicated hair mask cached',
        });
        sessionAfterComplete.analysisDebug.push({
          at: new Date().toISOString(),
          message: `Mask coverage hair=${(hairCoverage * 100).toFixed(1)}% skin=${(skinCoverage * 100).toFixed(1)}%`,
        });
        sessionAfterComplete.lastAccessedAt = Date.now();
      } catch (hairMaskError) {
        sessionAfterComplete.analysisDebug.push({
          at: new Date().toISOString(),
          message: `Dedicated hair mask failed, using parsed hair mask: ${hairMaskError.message || 'unknown error'}`,
        });
        sessionAfterComplete.lastAccessedAt = Date.now();
      }
    })().catch((error) => {
      console.error('background hair mask error:', error);
    });
  } catch (error) {
    const latest = SESSION_STORE.get(sessionId);
    if (!latest) return;
    latest.analysisStatus = 'failed';
    latest.analysisError = error.message || 'Analysis failed';
    latest.analysisDebug = latest.analysisDebug || [];
    latest.analysisDebug.push({
      at: new Date().toISOString(),
      message: `Analysis failed: ${error.message || 'unknown error'}`,
    });
    latest.lastAccessedAt = Date.now();
  }
}

async function getOrFetchClothingMask(session) {
  if (session.masks.clothing) return session.masks.clothing;

  const version = await getReplicateLatestVersionId(REPLICATE_CLOTHING_SEG_MODEL);
  const created = await createReplicatePrediction({
    version,
    input: { image: session.originalDataUri },
  });
  const finalPrediction = await pollReplicatePrediction(created.id, {
    intervalMs: 1500,
    timeoutMs: 240000,
  });
  const outputUrl = normalizeReplicateOutput(finalPrediction.output);
  if (!outputUrl) throw new Error('Clothing segmentation returned empty output');

  const raw = await fetchBuffer(outputUrl);
  const normalized = await sharp(raw)
    .resize(session.width || undefined, session.height || undefined, { fit: 'fill' })
    .grayscale()
    .threshold(120)
    .png()
    .toBuffer();
  session.masks.clothing = toDataUriFromBuffer(normalized);
  session.lastAccessedAt = Date.now();
  return session.masks.clothing;
}

async function getOrFetchSamMask(session, maskKey, point) {
  if (session.masks[maskKey]) return session.masks[maskKey];
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`Missing point to generate ${maskKey} mask`);
  }

  const version = await getReplicateLatestVersionId(REPLICATE_SAM2_MODEL);
  const created = await createReplicatePrediction({
    version,
    input: {
      image: session.originalDataUri,
      point_coords: [[Math.round(point.x), Math.round(point.y)]],
      point_labels: [1],
    },
  });
  const finalPrediction = await pollReplicatePrediction(created.id, {
    intervalMs: 1500,
    timeoutMs: 240000,
  });
  const outputUrl = normalizeReplicateOutput(finalPrediction.output);
  if (!outputUrl) throw new Error(`${maskKey} segmentation returned empty output`);

  const raw = await fetchBuffer(outputUrl);
  const normalized = await sharp(raw)
    .resize(session.width || undefined, session.height || undefined, { fit: 'fill' })
    .grayscale()
    .threshold(120)
    .png()
    .toBuffer();
  session.masks[maskKey] = toDataUriFromBuffer(normalized);
  session.lastAccessedAt = Date.now();
  return session.masks[maskKey];
}

async function recolorWithMask({ userImageBuffer, maskBuffer, hex, strength }) {
  const sourceMeta = await sharp(userImageBuffer).metadata();
  const sourceWidth = sourceMeta.width;
  const sourceHeight = sourceMeta.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Unable to read input image dimensions');
  }

  const maxSide = 768;
  const resizeScale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * resizeScale));
  const height = Math.max(1, Math.round(sourceHeight * resizeScale));

  const sourceRaw = await sharp(userImageBuffer)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const processedMaskRaw = await sharp(maskBuffer)
    .resize(width, height, { fit: 'fill' })
    .grayscale()
    .threshold(160)
    .erode(1)
    .blur(0.8)
    .raw()
    .toBuffer();

  const { r, g, b } = hexToRgb(hex);
  const targetHsl = rgbToHsl(r, g, b);
  const safeStrength = clampStrength(strength, 0.65);
  const outputRaw = Buffer.from(sourceRaw);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const maskIdx = y * width + x;
      const maskAlpha = processedMaskRaw[maskIdx] / 255;
      if (maskAlpha <= 0.02) continue;

      const baseR = sourceRaw[idx];
      const baseG = sourceRaw[idx + 1];
      const baseB = sourceRaw[idx + 2];
      const baseA = sourceRaw[idx + 3];

      const baseHsl = rgbToHsl(baseR, baseG, baseB);
      const hueMix = 0.9;
      const satMix = 0.8;
      const lightMix = 0.35;

      const recolorH = lerp(baseHsl.h, targetHsl.h, hueMix);
      const recolorS = clamp01(lerp(baseHsl.s, targetHsl.s, satMix));
      const recolorL = clamp01(lerp(baseHsl.l, targetHsl.l, lightMix * safeStrength));
      const recolored = hslToRgb(recolorH, recolorS, recolorL);

      const sideMargin = Math.floor(width * 0.04);
      let edgeWeight = 1;
      if (x < sideMargin) edgeWeight = x / Math.max(1, sideMargin);
      if (x > width - 1 - sideMargin) edgeWeight = (width - 1 - x) / Math.max(1, sideMargin);

      const bottomFadeStart = Math.floor(height * 0.78);
      const bottomFadeEnd = Math.floor(height * 0.96);
      let verticalWeight = 1;
      if (y > bottomFadeStart) {
        verticalWeight = clamp01(1 - (y - bottomFadeStart) / Math.max(1, bottomFadeEnd - bottomFadeStart));
      }

      const blendAmount = clamp01(maskAlpha * safeStrength * edgeWeight * verticalWeight);
      outputRaw[idx] = Math.round(lerp(baseR, recolored.r, blendAmount));
      outputRaw[idx + 1] = Math.round(lerp(baseG, recolored.g, blendAmount));
      outputRaw[idx + 2] = Math.round(lerp(baseB, recolored.b, blendAmount));
      outputRaw[idx + 3] = baseA;
    }
  }

  const processed = await sharp(outputRaw, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .resize(sourceWidth, sourceHeight, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer();
  return processed;
}

async function expandMask(maskBuffer, width, height, expandPct = 0.15) {
  const kernel = Math.max(1, Math.min(64, Math.round(Math.min(width, height) * expandPct * 0.2)));
  return sharp(maskBuffer)
    .resize(width, height, { fit: 'fill' })
    .grayscale()
    .threshold(80)
    .dilate(kernel)
    .blur(1)
    .png()
    .toBuffer();
}

async function inpaintWithMask({ imageDataUri, maskDataUri, prompt, negativePrompt = '' }) {
  const version = await getReplicateLatestVersionId(REPLICATE_INPAINTING_MODEL);
  const created = await createReplicatePrediction({
    version,
    input: {
      image: imageDataUri,
      mask: maskDataUri,
      prompt,
      negative_prompt: negativePrompt || 'distorted, unrealistic, cartoon, blurry',
      num_inference_steps: 30,
      guidance_scale: 7.5,
    },
  });
  const final = await pollReplicatePrediction(created.id, { intervalMs: 1500, timeoutMs: 240000 });
  const outputUrl = normalizeReplicateOutput(final.output);
  if (!outputUrl) throw new Error('Inpainting returned empty output');
  return outputUrl;
}

function buildColorChoice({ colorId, hex, strength }) {
  const preset = HAIR_COLORS.find((item) => item.id === colorId);
  const normalizedHex = normalizeHex(hex);

  if (!preset && !normalizedHex) {
    return { error: 'Provide a valid colorId or hex.' };
  }

  const selectedHex = normalizedHex || (preset ? preset.hex : null);
  if (!selectedHex) {
    return { error: 'Could not resolve hair color hex value.' };
  }

  const defaultStrength = preset ? preset.strength : 0.65;
  return {
    value: {
      id: preset ? preset.id : 'custom',
      name: preset ? preset.name : 'Custom',
      hex: selectedHex,
      strength: clampStrength(strength, defaultStrength),
      isCustomHex: Boolean(normalizedHex),
      isNoChange: Boolean(preset && preset.id === 'current'),
    },
  };
}

function resolveHairStyle(styleId) {
  return HAIR_STYLES.find((item) => item.id === styleId) || HAIR_STYLES[0];
}

function resolveEyeColor(eyeColorId) {
  return EYE_COLORS.find((item) => item.id === eyeColorId) || EYE_COLORS[0];
}

function resolveFastHairColor(colorChoice) {
  const mapped = FAST_HAIR_COLOR_BY_PRESET_ID[colorChoice.id];
  if (mapped) return mapped;

  const byName = {
    'Jet Black': 'Jet Black',
    'Dark Brown': 'Dark Brown',
    'Light Brown': 'Light Brown',
    Blonde: 'Blonde',
    Platinum: 'Platinum Blonde',
    Auburn: 'Auburn',
    Silver: 'Silver',
    'Ash Brown': 'Ash Brown',
    Chestnut: 'Chestnut',
    Copper: 'Copper',
    'Rose Gold': 'Rose Gold',
    Mahogany: 'Mahogany',
    Burgundy: 'Burgundy',
    Caramel: 'Caramel',
    Lavender: 'Purple',
  };
  return byName[colorChoice.name] || 'Dark Brown';
}

function resolveHexFromCatalog(catalog, id) {
  const preset = catalog.find((item) => item.id === id);
  return preset ? preset.hex : null;
}

function resolveShapePrompt(feature, styleId, prompt) {
  if (typeof prompt === 'string' && prompt.trim()) return prompt.trim();

  if (feature === 'eyebrows') {
    return (EYEBROW_SHAPES.find((item) => item.id === styleId) || EYEBROW_SHAPES[0]).prompt;
  }
  if (feature === 'lips') {
    return (LIP_SHAPES.find((item) => item.id === styleId) || LIP_SHAPES[0]).prompt;
  }
  if (feature === 'jawline') {
    return (JAWLINE_PRESETS.find((item) => item.id === styleId) || JAWLINE_PRESETS[0]).prompt;
  }
  if (feature === 'cheekbones') {
    return prompt || 'subtle cheekbone contour and definition, photorealistic';
  }
  return 'subtle natural adjustment, photorealistic';
}

function createRegionMaskFromLandmarks(session, feature) {
  const width = session.width;
  const height = session.height;
  if (!width || !height) throw new Error('Session dimensions unavailable');
  const raw = Buffer.alloc(width * height, 0);

  const drawCircle = (cx, cy, radius) => {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    const r2 = radius * radius;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          raw[y * width + x] = 255;
        }
      }
    }
  };

  if (feature === 'jawline') {
    const jawline = session.landmarks?.jawlinePoints || [];
    const radius = Math.max(8, Math.round(Math.min(width, height) * 0.03));
    for (const point of jawline) {
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        drawCircle(point.x, point.y, radius);
      }
    }
    const chin = session.landmarks?.chinBottom;
    if (chin) drawCircle(chin.x, chin.y, radius + 4);
  }

  if (feature === 'cheekbones') {
    const radius = Math.max(10, Math.round(Math.min(width, height) * 0.04));
    const left = session.landmarks?.cheekboneLeft;
    const right = session.landmarks?.cheekboneRight;
    if (left) drawCircle(left.x, left.y, radius);
    if (right) drawCircle(right.x, right.y, radius);
  }

  return sharp(raw, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

async function resolveMaskForFeature(session, feature, value) {
  if (feature === 'hair') return session.masks.hair;
  if (feature === 'eyebrows') return session.masks.eyebrows;
  if (feature === 'lips') return session.masks.lips;
  if (feature === 'skin') return session.masks.skin;
  if (feature === 'outfit') return getOrFetchClothingMask(session);
  if (feature === 'nails') {
    if (session.masks.hands) return session.masks.hands;
    if (value?.point) return getOrFetchSamMask(session, 'hands', value.point);
    return null;
  }
  if (feature === 'shoes') {
    if (session.masks.shoes) return session.masks.shoes;
    if (value?.point) return getOrFetchSamMask(session, 'shoes', value.point);
    return null;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';

  if (method === 'OPTIONS') return sendJson(res, 204, {});

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (
    method === 'GET' &&
    (pathname === '/' ||
      pathname.startsWith('/index.html') ||
      pathname.startsWith('/assets') ||
      pathname.startsWith('/public'))
  ) {
    return serveStatic(req, res);
  }
  if (method === 'GET' && pathname.endsWith('.html')) return serveStatic(req, res);

  if (method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'hair-color-tryon',
      replicateConfigured: Boolean(REPLICATE_API_TOKEN),
      timestamp: new Date().toISOString(),
    });
  }

  if (method === 'GET' && pathname === '/api/hair-colors') {
    return sendJson(res, 200, {
      success: true,
      colors: HAIR_COLORS,
    });
  }

  if (method === 'GET' && pathname === '/api/hair-styles') {
    return sendJson(res, 200, {
      success: true,
      styles: HAIR_STYLES.map(({ id, name }) => ({ id, name })),
    });
  }

  if (method === 'GET' && pathname === '/api/eye-colors') {
    return sendJson(res, 200, {
      success: true,
      colors: EYE_COLORS,
    });
  }

  if (method === 'GET' && pathname === '/api/lip-colors') {
    return sendJson(res, 200, { success: true, colors: LIP_COLORS });
  }

  if (method === 'GET' && pathname === '/api/nail-colors') {
    return sendJson(res, 200, { success: true, colors: NAIL_COLORS });
  }

  if (method === 'GET' && pathname === '/api/eyebrow-shapes') {
    return sendJson(res, 200, { success: true, shapes: EYEBROW_SHAPES });
  }

  if (method === 'GET' && pathname === '/api/lip-shapes') {
    return sendJson(res, 200, { success: true, shapes: LIP_SHAPES });
  }

  if (method === 'GET' && pathname === '/api/jawline-presets') {
    return sendJson(res, 200, { success: true, presets: JAWLINE_PRESETS });
  }

  if (method === 'POST' && pathname === '/api/analyze') {
    const { debug, mark, finish } = makeDebug('analyze');

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        finish();
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { userImageUrl } = body;
      mark('Request body parsed');

      if (!userImageUrl || typeof userImageUrl !== 'string') {
        mark('Validation failed: userImageUrl missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required field: userImageUrl', debug });
      }

      const originalDataUri = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      mark('Input image ready as data URI');

      const originalBuffer = await fetchBuffer(originalDataUri);
      const meta = await sharp(originalBuffer).metadata();
      const sessionId = crypto.randomUUID();

      SESSION_STORE.set(sessionId, {
        id: sessionId,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        originalDataUri,
        currentImageRef: originalDataUri,
        width: meta.width || 0,
        height: meta.height || 0,
        masks: {
          hair: null,
          eyebrows: null,
          eyes: null,
          lips: null,
          skin: null,
          teeth: null,
          nose: null,
          ears: null,
          neck: null,
          clothing: null,
          hands: null,
          shoes: null,
          background: null,
        },
        landmarks: null,
        analysisStatus: 'pending',
        analysisError: null,
        analysisDebug: [{ at: new Date().toISOString(), message: 'Session created; analysis queued' }],
      });
      mark(`Session created: ${sessionId}`);

      runAnalysis(sessionId).catch((error) => {
        console.error('runAnalysis error:', error);
      });
      mark('Background analysis started');

      finish();
      return sendJson(res, 200, {
        success: true,
        sessionId,
        analysisStatus: 'pending',
        estimatedMs: 12000,
        debug,
      });
    } catch (error) {
      console.error('analyze error:', error);
      mark(`Error: ${error.message || 'Analyze failed'}`);
      finish();
      return sendJson(res, 500, { error: error.message || 'Analyze failed', debug });
    }
  }

  const analyzeMatch = pathname.match(/^\/api\/analyze\/([^/]+)$/);
  if (method === 'GET' && analyzeMatch) {
    const sessionId = analyzeMatch[1];
    const session = getSession(sessionId);
    if (!session) {
      return sendJson(res, 404, { error: 'Session not found' });
    }

    return sendJson(res, 200, {
      success: true,
      sessionId,
      analysisStatus: session.analysisStatus,
      availableMasks: extractMaskNames(session.masks),
      landmarks: session.landmarks,
      analysisError: session.analysisError,
      analysisDebug: session.analysisDebug || [],
    });
  }

  const sessionPathMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (method === 'GET' && sessionPathMatch) {
    const session = getSession(sessionPathMatch[1]);
    if (!session) {
      return sendJson(res, 404, { error: 'Session not found' });
    }
    return sendJson(res, 200, {
      success: true,
      session: sanitizeSession(session),
    });
  }

  if (method === 'DELETE' && sessionPathMatch) {
    const sessionId = sessionPathMatch[1];
    const existed = SESSION_STORE.delete(sessionId);
    return sendJson(res, 200, {
      success: true,
      sessionId,
      deleted: existed,
    });
  }

  if (method === 'POST' && pathname === '/api/edit') {
    const { debug, mark, finish } = makeDebug('edit');

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        finish();
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { sessionId, feature, action, value = {}, baseImageUrl } = body;
      mark('Request body parsed');

      if (!sessionId || !feature || !action) {
        mark('Validation failed: required fields missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required fields: sessionId, feature, action', debug });
      }

      const session = getSession(sessionId);
      if (!session) {
        mark('Session not found');
        finish();
        return sendJson(res, 404, { error: 'Session not found', debug });
      }

      if (session.analysisStatus === 'pending') {
        mark('Analysis still pending');
        finish();
        return sendJson(res, 409, { error: 'Analysis still pending', analysisStatus: 'pending', debug });
      }
      if (session.analysisStatus === 'failed') {
        mark('Analysis failed');
        finish();
        return sendJson(res, 409, {
          error: session.analysisError || 'Analysis failed',
          analysisStatus: 'failed',
          debug,
        });
      }

      const sourceImageDataUri =
        typeof baseImageUrl === 'string' && baseImageUrl
          ? (isDataUri(baseImageUrl) ? baseImageUrl : await urlToDataUri(baseImageUrl))
          : (session.currentImageRef || session.originalDataUri);

      if (feature === 'hair' && action === 'style') {
        const style = resolveHairStyle(value.styleId);
        const colorChoice = buildColorChoice({ colorId: value.colorId || 'current', hex: value.hex });
        const fastHairColor = colorChoice.value ? resolveFastHairColor(colorChoice.value) : 'No change';
        const editedImageUrl = await generateFastHairEditUrl({
          imageDataUri: sourceImageDataUri,
          hairColorName: fastHairColor,
          haircutProviderValue: style.providerValue,
        });
        mark('Hair style edit generated');
        session.currentImageRef = editedImageUrl;
        session.lastAccessedAt = Date.now();
        finish();
        return sendJson(res, 200, {
          success: true,
          tier: 2,
          feature,
          action,
          editedImageUrl,
          elapsedMs: debug.elapsedMs,
          debug,
        });
      }

      if (feature === 'eyes' && action === 'color') {
        const eyeColor = resolveEyeColor(value.eyeColorId || value.colorId || 'current');
        const editedImageUrl = eyeColor.id === 'current'
          ? sourceImageDataUri
          : await generateFastEyeEditUrl({ imageDataUri: sourceImageDataUri, eyeColorName: eyeColor.name });
        mark('Eye color edit generated');
        session.currentImageRef = editedImageUrl;
        session.lastAccessedAt = Date.now();
        finish();
        return sendJson(res, 200, {
          success: true,
          tier: 2,
          feature,
          action,
          editedImageUrl,
          elapsedMs: debug.elapsedMs,
          debug,
        });
      }

      if (
        (feature === 'eyebrows' && action === 'shape') ||
        (feature === 'lips' && action === 'shape') ||
        (feature === 'jawline' && action === 'reshape') ||
        (feature === 'cheekbones' && action === 'reshape')
      ) {
        let maskBuffer;
        if (feature === 'jawline' || feature === 'cheekbones') {
          maskBuffer = await createRegionMaskFromLandmarks(session, feature);
        } else {
          const maskData = await resolveMaskForFeature(session, feature, value);
          if (!maskData) {
            mark('Mask unavailable');
            finish();
            return sendJson(res, 400, { error: `Mask unavailable for feature: ${feature}`, debug });
          }
          maskBuffer = await maskDataToBuffer(maskData);
        }

        const expandedMaskBuffer = await expandMask(maskBuffer, session.width, session.height, 0.15);
        const prompt = resolveShapePrompt(feature, value.styleId, value.prompt);
        const editedImageUrl = await inpaintWithMask({
          imageDataUri: sourceImageDataUri,
          maskDataUri: toDataUriFromBuffer(expandedMaskBuffer),
          prompt,
          negativePrompt: value.negativePrompt,
        });
        mark('Inpainting completed');
        session.currentImageRef = editedImageUrl;
        session.lastAccessedAt = Date.now();
        finish();
        return sendJson(res, 200, {
          success: true,
          tier: 2,
          feature,
          action,
          editedImageUrl,
          elapsedMs: debug.elapsedMs,
          debug,
        });
      }

      const tier1Allowed = [
        ['hair', 'color'],
        ['eyebrows', 'color'],
        ['lips', 'color'],
        ['skin', 'tone'],
        ['outfit', 'color'],
        ['nails', 'color'],
        ['shoes', 'color'],
      ];
      const isTier1 = tier1Allowed.some(([f, a]) => f === feature && a === action);

      if (!isTier1) {
        mark('Unsupported feature/action combination');
        finish();
        return sendJson(res, 400, { error: 'Unsupported feature/action combination', debug });
      }

      const maskData = await resolveMaskForFeature(session, feature, value);
      if (!maskData) {
        mark('Mask unavailable');
        finish();
        return sendJson(res, 400, {
          error: `Mask unavailable for feature: ${feature}. For nails/shoes provide value.point {x,y} on first request.`,
          debug,
        });
      }

      const fallbackHex =
        feature === 'lips'
          ? resolveHexFromCatalog(LIP_COLORS, value.colorId)
          : feature === 'nails'
            ? resolveHexFromCatalog(NAIL_COLORS, value.colorId)
            : feature === 'hair'
              ? (buildColorChoice({ colorId: value.colorId }).value || {}).hex
              : null;
      const targetHex = normalizeHex(value.hex || fallbackHex);
      if (!targetHex) {
        mark('Invalid or missing target hex');
        finish();
        return sendJson(res, 400, { error: 'Provide value.hex or a valid colorId', debug });
      }

      const sourceBuffer = await fetchBuffer(sourceImageDataUri);
      const maskBuffer = await maskDataToBuffer(maskData);
      const editedPngBuffer = await recolorWithMask({
        userImageBuffer: sourceBuffer,
        maskBuffer,
        hex: targetHex,
        strength: clampStrength(value.strength, 0.65),
      });
      mark('Tier 1 recolor completed');
      const editedImageDataUri = toDataUriFromBuffer(editedPngBuffer);
      session.currentImageRef = editedImageDataUri;
      session.lastAccessedAt = Date.now();
      finish();
      return sendJson(res, 200, {
        success: true,
        tier: 1,
        feature,
        action,
        editedImageDataUri,
        elapsedMs: debug.elapsedMs,
        debug,
      });
    } catch (error) {
      console.error('edit error:', error);
      mark(`Error: ${error.message || 'Edit failed'}`);
      finish();
      return sendJson(res, 500, { error: error.message || 'Edit failed', debug });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-hair') {
    const { debug, mark, finish } = makeDebug('recolor');

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        finish();
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { userImageUrl, colorId, hex, strength } = body;
      mark('Request body parsed');

      if (!userImageUrl || typeof userImageUrl !== 'string') {
        mark('Validation failed: userImageUrl missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required field: userImageUrl', debug });
      }
      if (!colorId && !hex) {
        mark('Validation failed: colorId/hex missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required field: colorId or hex', debug });
      }

      const colorChoice = buildColorChoice({ colorId, hex, strength });
      if (colorChoice.error || !colorChoice.value) {
        mark(`Validation failed: ${colorChoice.error || 'Invalid color selection'}`);
        finish();
        return sendJson(res, 400, { error: colorChoice.error || 'Invalid color selection', debug });
      }
      mark(`Color resolved: ${colorChoice.value.id}`);

      const userImageDataUri = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      mark('Input image ready as data URI');

      if (colorChoice.value.isNoChange) {
        mark('No-change color selected; returning original image');
        finish();
        return sendJson(res, 200, {
          success: true,
          chosenColor: colorChoice.value,
          maskUrl: '',
          debug,
          editedImageDataUri: userImageDataUri,
        });
      }

      const maskUrl = await generateHairMaskUrl(userImageDataUri);
      mark('Hair mask generated from Replicate');
      const [maskBuffer, userImageBuffer] = await Promise.all([
        fetchBuffer(maskUrl),
        fetchBuffer(userImageDataUri),
      ]);
      mark('Mask and source image buffers loaded');

      const editedPngBuffer = await recolorWithMask({
        userImageBuffer,
        maskBuffer,
        hex: colorChoice.value.hex,
        strength: colorChoice.value.strength,
      });
      mark('Local Sharp recolor completed');
      finish();

      return sendJson(res, 200, {
        success: true,
        chosenColor: colorChoice.value,
        maskUrl,
        debug,
        editedImageDataUri: `data:image/png;base64,${editedPngBuffer.toString('base64')}`,
      });
    } catch (error) {
      console.error('recolor-hair error:', error);
      mark(`Error: ${error.message || 'Hair recolor failed'}`);
      finish();
      return sendJson(res, 500, { error: error.message || 'Hair recolor failed', debug });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-hair-fast') {
    const { debug, mark, finish } = makeDebug('fast');

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        finish();
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { userImageUrl, colorId, hairStyleId } = body;
      mark('Request body parsed');

      if (!userImageUrl || typeof userImageUrl !== 'string') {
        mark('Validation failed: userImageUrl missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required field: userImageUrl', debug });
      }
      if (!colorId) {
        mark('Validation failed: colorId missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required field: colorId', debug });
      }

      const colorChoice = buildColorChoice({ colorId });
      if (colorChoice.error || !colorChoice.value) {
        mark(`Validation failed: ${colorChoice.error || 'Invalid color selection'}`);
        finish();
        return sendJson(res, 400, { error: colorChoice.error || 'Invalid color selection', debug });
      }
      const hairStyle = resolveHairStyle(hairStyleId);
      const fastHairColor = resolveFastHairColor(colorChoice.value);
      mark(`Color resolved: ${colorChoice.value.name}`);
      mark(`Fast color mapped: ${fastHairColor}`);
      mark(`Hair style resolved: ${hairStyle.name}`);

      const userImageDataUri = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      mark('Input image ready as data URI');

      if (fastHairColor === 'No change' && hairStyle.id === 'no_change') {
        mark('No-change color + keep-current style selected; returning original image');
        finish();
        return sendJson(res, 200, {
          success: true,
          mode: 'fast',
          chosenColor: colorChoice.value,
          chosenStyle: { id: hairStyle.id, name: hairStyle.name },
          editedImageUrl: userImageDataUri,
          debug,
        });
      }

      const editedImageUrl = await generateFastHairEditUrl({
        imageDataUri: userImageDataUri,
        hairColorName: fastHairColor,
        haircutProviderValue: hairStyle.providerValue,
      });
      mark('Fast model output received');
      finish();

      return sendJson(res, 200, {
        success: true,
        mode: 'fast',
        chosenColor: colorChoice.value,
        chosenStyle: { id: hairStyle.id, name: hairStyle.name },
        editedImageUrl,
        debug,
      });
    } catch (error) {
      console.error('recolor-hair-fast error:', error);
      mark(`Error: ${error.message || 'Fast recolor failed'}`);
      finish();
      return sendJson(res, 500, { error: error.message || 'Fast recolor failed', debug });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-eyes-fast') {
    const { debug, mark, finish } = makeDebug('eyes');

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        finish();
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { userImageUrl, eyeColorId } = body;
      mark('Request body parsed');

      if (!userImageUrl || typeof userImageUrl !== 'string') {
        mark('Validation failed: userImageUrl missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required field: userImageUrl', debug });
      }
      if (!eyeColorId) {
        mark('Validation failed: eyeColorId missing');
        finish();
        return sendJson(res, 400, { error: 'Missing required field: eyeColorId', debug });
      }

      const eyeColor = resolveEyeColor(eyeColorId);
      mark(`Eye color resolved: ${eyeColor.name}`);

      const userImageDataUri = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      mark('Input image ready as data URI');

      if (eyeColor.id === 'current') {
        mark('No-change eye color selected; returning original image');
        finish();
        return sendJson(res, 200, {
          success: true,
          mode: 'eyes-fast',
          chosenEyeColor: eyeColor,
          editedImageUrl: userImageDataUri,
          debug,
        });
      }

      const editedImageUrl = await generateFastEyeEditUrl({
        imageDataUri: userImageDataUri,
        eyeColorName: eyeColor.name,
      });
      mark('Eye color model output received');
      finish();

      return sendJson(res, 200, {
        success: true,
        mode: 'eyes-fast',
        chosenEyeColor: eyeColor,
        editedImageUrl,
        debug,
      });
    } catch (error) {
      console.error('recolor-eyes-fast error:', error);
      mark(`Error: ${error.message || 'Eye recolor failed'}`);
      finish();
      return sendJson(res, 500, { error: error.message || 'Eye recolor failed', debug });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Hair Color Try-on running at http://localhost:${PORT}`);
  console.log(`Replicate token: ${REPLICATE_API_TOKEN ? 'set' : 'missing'}`);
  console.log(`Hair colors: ${HAIR_COLORS.length}`);
});

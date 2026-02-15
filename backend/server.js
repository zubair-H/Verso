'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
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

if (!globalThis.fetch) throw new Error('Node 18+ required');

const REPLICATE_HAIR_MASK_VERSION =
  'b335dc1b693b2de88040736eb426702adfc2f0c869ae9dba3569bac1beb9c0f6';
const REPLICATE_SDXL_INPAINT_VERSION =
  'aca001c8b137114d5e594c68f7084ae6d82f364758aab8d997b233e8ef3c4d93';

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

const EYE_COLOR_DESCRIPTIONS = {
  brown: 'rich warm brown irises',
  hazel: 'hazel irises with mixed green-brown tones',
  green: 'natural emerald green irises',
  blue: 'natural ocean blue irises',
  gray: 'soft cool gray irises',
};

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

async function pollReplicatePrediction(predictionId, { maxAttempts = 120, intervalMs = 1600 } = {}) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const text = await poll.text();
    if (!poll.ok) throw new Error(`Replicate poll failed (${poll.status}): ${text}`);
    const data = JSON.parse(text);
    if (data.status === 'succeeded') return { data, attempts };
    if (data.status === 'failed') throw new Error(`Prediction failed: ${data.error || 'Unknown error'}`);
    await new Promise((r) => setTimeout(r, intervalMs));
    attempts += 1;
  }
  throw new Error('Prediction timed out');
}

function normalizeOutputToUrl(output) {
  return Array.isArray(output) ? output[0] : output;
}

async function generateHairMask(imageUrlOrDataUri) {
  const prediction = await createReplicatePrediction({
    version: REPLICATE_HAIR_MASK_VERSION,
    input: { image: imageUrlOrDataUri },
  });
  const { data } = await pollReplicatePrediction(prediction.id, { maxAttempts: 180, intervalMs: 1500 });
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
    const rx = Math.round(w * 0.07);
    const ry = Math.round(h * 0.03);
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

  if (region === 'upper_body') {
    svg += `<rect x="${Math.round(w * 0.11)}" y="${Math.round(h * 0.12)}" width="${Math.round(w * 0.78)}" height="${Math.round(h * 0.49)}" rx="${Math.round(w * 0.06)}" fill="white"/>`;
  }

  if (region === 'lower_body') {
    svg += `<rect x="${Math.round(w * 0.14)}" y="${Math.round(h * 0.48)}" width="${Math.round(w * 0.72)}" height="${Math.round(h * 0.48)}" rx="${Math.round(w * 0.06)}" fill="white"/>`;
  }

  svg += '</svg>';

  const maskBuf = await sharp(Buffer.from(svg))
    .resize(w, h)
    .grayscale()
    .blur(1.8)
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
  });
  const { data } = await pollReplicatePrediction(prediction.id, { maxAttempts: 140, intervalMs: 1800 });
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

function buildEyePrompt(eyeColorId) {
  const tone = EYE_COLOR_DESCRIPTIONS[eyeColorId] || 'natural eye color';
  return [
    `Adjust iris color to ${tone}.`,
    'ONLY modify iris in masked region.',
    'Do NOT alter eyelids, eyebrows, nose, lips, skin, face shape or background.',
    'Photorealistic and preserve identity.',
  ].join(' ');
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
    topHex ? `Force upper garment color to ${topHex}.` : '',
    bottomHex ? `Force lower garment color to ${bottomHex}.` : '',
    'Color shift must be obvious and clearly visible.',
    'Maintain garment texture, folds, seams, and lighting.',
    'Keep skin tone, face, tattoos, jewelry, watch, and background unchanged.',
    'Photorealistic output, preserve identity and body proportions.',
    'Only modify clothing color in the masked region.',
  ]
    .filter(Boolean)
    .join(' ');
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

  if (method === 'POST' && pathname === '/api/recolor-hair-fast') {
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const { userImageUrl, colorId, hairStyleId = 'no_change' } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });

      const color = HAIR_COLOR_PRESETS.find((c) => c.id === colorId) || HAIR_COLOR_PRESETS[0];
      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      const rawMaskUrl = await generateHairMask(source);
      const prompt = buildHairPrompt(hairStyleId, color.hex);
      const editedImageUrl = await inpaintRegion({ imageUrlOrDataUri: source, maskUrlOrDataUri: rawMaskUrl, prompt });

      return sendJson(res, 200, {
        success: true,
        mode: 'fast',
        editedImageUrl,
        maskUrl: rawMaskUrl,
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
      return sendJson(res, 500, { error: err.message || 'Hair transform failed' });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-hair') {
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const { userImageUrl, colorId } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });

      const color = HAIR_COLOR_PRESETS.find((c) => c.id === colorId) || HAIR_COLOR_PRESETS[0];
      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      const rawMaskUrl = await generateHairMask(source);
      const prompt = buildHairPrompt('no_change', color.hex);
      const editedImageUrl = await inpaintRegion({ imageUrlOrDataUri: source, maskUrlOrDataUri: rawMaskUrl, prompt });
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
      return sendJson(res, 500, { error: err.message || 'Hair recolor failed' });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-eyes-fast') {
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const { userImageUrl, eyeColorId = 'current' } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });
      if (eyeColorId === 'current') {
        return sendJson(res, 200, {
          success: true,
          mode: 'eyes-fast',
          editedImageUrl: userImageUrl,
          chosenEyeColor: { id: 'current', name: 'Current' },
        });
      }

      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      const eyesMaskDataUri = await makeRegionMaskDataUri(await fetchBuffer(source), 'eyes');
      const editedImageUrl = await inpaintRegion({
        imageUrlOrDataUri: source,
        maskUrlOrDataUri: eyesMaskDataUri,
        prompt: buildEyePrompt(eyeColorId),
      });

      return sendJson(res, 200, {
        success: true,
        mode: 'eyes-fast',
        editedImageUrl,
        chosenEyeColor: { id: eyeColorId, name: EYE_COLOR_PRESETS.find((x) => x.id === eyeColorId)?.name || eyeColorId },
      });
    } catch (err) {
      console.error('recolor-eyes-fast error:', err);
      return sendJson(res, 500, { error: err.message || 'Eye transform failed' });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-face-features-fast') {
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
      const body = await parseBody(req);
      const {
        userImageUrl,
        noseId = 'no_change',
        lipsId = 'no_change',
        eyebrowsId = 'no_change',
        eyebrowColorId = 'no_change',
      } = body;
      if (!userImageUrl) return sendJson(res, 400, { error: 'Missing userImageUrl' });

      const source = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      let output = source;
      const sourceBuf = await fetchBuffer(source);

      if (noseId !== 'no_change') {
        const mask = await makeRegionMaskDataUri(sourceBuf, 'nose');
        output = await inpaintRegion({ imageUrlOrDataUri: output, maskUrlOrDataUri: mask, prompt: buildFeaturePrompt({ noseId }) });
      }

      if (lipsId !== 'no_change') {
        const mask = await makeRegionMaskDataUri(sourceBuf, 'lips');
        output = await inpaintRegion({ imageUrlOrDataUri: output, maskUrlOrDataUri: mask, prompt: buildFeaturePrompt({ lipsId }) });
      }

      if (eyebrowsId !== 'no_change' || eyebrowColorId !== 'no_change') {
        const mask = await makeRegionMaskDataUri(sourceBuf, 'eyebrows');
        output = await inpaintRegion({
          imageUrlOrDataUri: output,
          maskUrlOrDataUri: mask,
          prompt: buildFeaturePrompt({ eyebrowsId, eyebrowColorId }),
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
      return sendJson(res, 500, { error: err.message || 'Face feature transform failed' });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-outfit-fast') {
    try {
      if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is not configured');
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
      let output = source;

      if (topColor) {
        const upperMask = await makeRegionMaskDataUri(await fetchBuffer(output), 'upper_body');
        output = await inpaintRegion({
          imageUrlOrDataUri: output,
          maskUrlOrDataUri: upperMask,
          prompt: buildOutfitPrompt({ topHex: topColor.hex }),
          numInferenceSteps: 34,
          guidanceScale: 8.5,
          promptStrength: 0.92,
          negativePrompt:
            'identity change, different person, altered face, altered body shape, altered tattoos, altered jewelry, text, watermark, cartoon',
        });
      }

      if (bottomColor) {
        const lowerMask = await makeRegionMaskDataUri(await fetchBuffer(output), 'lower_body');
        output = await inpaintRegion({
          imageUrlOrDataUri: output,
          maskUrlOrDataUri: lowerMask,
          prompt: buildOutfitPrompt({ bottomHex: bottomColor.hex }),
          numInferenceSteps: 34,
          guidanceScale: 8.5,
          promptStrength: 0.92,
          negativePrompt:
            'identity change, different person, altered face, altered body shape, altered tattoos, altered jewelry, text, watermark, cartoon',
        });
      }

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
});

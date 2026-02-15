'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
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

const MODEL_VERSION_CACHE = new Map();

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
    
    // Handle rate limiting with automatic retry
    if (response.status === 429 && retryCount < maxRetries) {
      let retryAfter = 7; // default
      try {
        const errorData = JSON.parse(text);
        retryAfter = errorData.retry_after || 7;
      } catch (e) {
        // Use default retry_after if parsing fails
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
    // If it's a rate limit error and we haven't exceeded retries, try again
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

async function recolorHairWithMask({ userImageBuffer, maskBuffer, hex, strength }) {
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

  if (method === 'POST' && pathname === '/api/recolor-hair') {
    const startedAt = Date.now();
    const debug = {
      traceId: `recolor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      startedAt: new Date().toISOString(),
      finishedAt: '',
      elapsedMs: 0,
      steps: [],
    };
    const mark = (message) => {
      debug.steps.push({ atMs: Date.now() - startedAt, message });
    };

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { userImageUrl, colorId, hex, strength } = body;
      mark('Request body parsed');

      if (!userImageUrl || typeof userImageUrl !== 'string') {
        mark('Validation failed: userImageUrl missing');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 400, { error: 'Missing required field: userImageUrl', debug });
      }
      if (!colorId && !hex) {
        mark('Validation failed: colorId/hex missing');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 400, { error: 'Missing required field: colorId or hex', debug });
      }

      const colorChoice = buildColorChoice({ colorId, hex, strength });
      if (colorChoice.error || !colorChoice.value) {
        mark(`Validation failed: ${colorChoice.error || 'Invalid color selection'}`);
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 400, { error: colorChoice.error || 'Invalid color selection', debug });
      }
      mark(`Color resolved: ${colorChoice.value.id}`);

      const userImageDataUri = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      mark('Input image ready as data URI');

      if (colorChoice.value.isNoChange) {
        mark('No-change color selected; returning original image');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
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

      const editedPngBuffer = await recolorHairWithMask({
        userImageBuffer,
        maskBuffer,
        hex: colorChoice.value.hex,
        strength: colorChoice.value.strength,
      });
      mark('Local Sharp recolor completed');
      debug.finishedAt = new Date().toISOString();
      debug.elapsedMs = Date.now() - startedAt;

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
      debug.finishedAt = new Date().toISOString();
      debug.elapsedMs = Date.now() - startedAt;
      return sendJson(res, 500, { error: error.message || 'Hair recolor failed', debug });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-hair-fast') {
    const startedAt = Date.now();
    const debug = {
      traceId: `fast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      startedAt: new Date().toISOString(),
      finishedAt: '',
      elapsedMs: 0,
      steps: [],
    };
    const mark = (message) => {
      debug.steps.push({ atMs: Date.now() - startedAt, message });
    };

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { userImageUrl, colorId, hairStyleId } = body;
      mark('Request body parsed');

      if (!userImageUrl || typeof userImageUrl !== 'string') {
        mark('Validation failed: userImageUrl missing');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 400, { error: 'Missing required field: userImageUrl', debug });
      }
      if (!colorId) {
        mark('Validation failed: colorId missing');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 400, { error: 'Missing required field: colorId', debug });
      }

      const colorChoice = buildColorChoice({ colorId });
      if (colorChoice.error || !colorChoice.value) {
        mark(`Validation failed: ${colorChoice.error || 'Invalid color selection'}`);
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
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
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
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
      debug.finishedAt = new Date().toISOString();
      debug.elapsedMs = Date.now() - startedAt;

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
      debug.finishedAt = new Date().toISOString();
      debug.elapsedMs = Date.now() - startedAt;
      return sendJson(res, 500, { error: error.message || 'Fast recolor failed', debug });
    }
  }

  if (method === 'POST' && pathname === '/api/recolor-eyes-fast') {
    const startedAt = Date.now();
    const debug = {
      traceId: `eyes_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      startedAt: new Date().toISOString(),
      finishedAt: '',
      elapsedMs: 0,
      steps: [],
    };
    const mark = (message) => {
      debug.steps.push({ atMs: Date.now() - startedAt, message });
    };

    try {
      mark('Request received');
      if (!REPLICATE_API_TOKEN) {
        mark('Missing REPLICATE_API_TOKEN');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 500, { error: 'REPLICATE_API_TOKEN is not configured', debug });
      }

      const body = await parseBody(req);
      const { userImageUrl, eyeColorId } = body;
      mark('Request body parsed');

      if (!userImageUrl || typeof userImageUrl !== 'string') {
        mark('Validation failed: userImageUrl missing');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 400, { error: 'Missing required field: userImageUrl', debug });
      }
      if (!eyeColorId) {
        mark('Validation failed: eyeColorId missing');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
        return sendJson(res, 400, { error: 'Missing required field: eyeColorId', debug });
      }

      const eyeColor = resolveEyeColor(eyeColorId);
      mark(`Eye color resolved: ${eyeColor.name}`);

      const userImageDataUri = isDataUri(userImageUrl) ? userImageUrl : await urlToDataUri(userImageUrl);
      mark('Input image ready as data URI');

      if (eyeColor.id === 'current') {
        mark('No-change eye color selected; returning original image');
        debug.finishedAt = new Date().toISOString();
        debug.elapsedMs = Date.now() - startedAt;
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
      debug.finishedAt = new Date().toISOString();
      debug.elapsedMs = Date.now() - startedAt;

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
      debug.finishedAt = new Date().toISOString();
      debug.elapsedMs = Date.now() - startedAt;
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

const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================================
// ENVIRONMENT VARIABLE LOADER
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

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

// ============================================================================
// CONFIGURATION
// ============================================================================
const PORT = Number(process.env.PORT || 4000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// ============================================================================
// HELPER FUNCTIONS
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
  return { 
    mimeType: contentType.split(';')[0], 
    base64: buffer.toString('base64') 
  };
}

function extractJsonFromText(text) {
  if (!text) return null;

  // Try to extract from markdown code fence
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }

  // Try to extract from first { to last }
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

// ============================================================================
// GEMINI VISION API - STEP 1: EXTRACT ATTRIBUTE DESCRIPTION
// ============================================================================
async function extractAttributeDescription({ imageBase64, imageMimeType, imageUrl, attribute }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Convert image URL to base64 if needed
  let inlineData = imageBase64;
  let mimeType = imageMimeType || 'image/jpeg';

  if (!inlineData && imageUrl) {
    const converted = await imageUrlToBase64(imageUrl);
    inlineData = converted.base64;
    mimeType = converted.mimeType;
  }

  if (!inlineData) {
    throw new Error('Provide imageBase64 or imageUrl');
  }

  // Build attribute-specific prompt
  const attributePrompts = {
    eyes: 'Describe the eye shape, color (including any flecks or variations), eyelid type, eyelash characteristics, and any distinctive features in extreme detail.',
    eye_color: 'Describe the eye color in extreme detail, including base color, any flecks, patterns, rings, or color variations from center to edge.',
    hair_color: 'Describe the hair color including base tone, highlights, lowlights, undertones, and any color variations in extreme detail.',
    hair_style: 'Describe the hairstyle including cut, length, texture, volume, layers, parting, and styling in extreme detail.',
    skin_tone: 'Describe the skin tone including undertones, texture, and any distinctive characteristics in extreme detail.',
    face_shape: 'Describe the face shape, jawline, cheekbones, and overall facial structure in extreme detail.',
    lips: 'Describe the lip shape, fullness, color, and distinctive features in extreme detail.',
    nose: 'Describe the nose shape, bridge, tip, and distinctive features in extreme detail.',
    eyebrows: 'Describe the eyebrow shape, thickness, arch, and color in extreme detail.',
  };

  const specificPrompt = attributePrompts[attribute] || `Describe the ${attribute} in extreme detail.`;

  const prompt = [
    'You are a professional image analyst specializing in detailed visual descriptions.',
    `Analyze this image and focus on: ${attribute}.`,
    '',
    specificPrompt,
    '',
    'Provide a detailed, precise description that could be used to recreate this visual characteristic.',
    'Be specific about colors, shapes, textures, and any unique features.',
    'Write 3-5 sentences of pure description.',
  ].join('\n');

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { 
            inline_data: { 
              mime_type: mimeType, 
              data: inlineData 
            } 
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
    },
  };

  // Try multiple Gemini models
  const modelCandidates = [
   'gemini-3-flash-preview'
  ];

  let description = null;
  let lastError = null;

  for (const model of modelCandidates) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const rawText = await resp.text();
      
      if (!resp.ok) {
        lastError = `Model ${model} failed (${resp.status}): ${rawText.slice(0, 200)}`;
        continue;
      }

      const parsed = JSON.parse(rawText);
      const modelText = (parsed?.candidates || [])
        .flatMap((c) => c?.content?.parts || [])
        .map((p) => p?.text)
        .filter(Boolean)
        .join('\n');

      if (modelText) {
        description = modelText.trim();
        break;
      }
    } catch (err) {
      lastError = `Model ${model} error: ${err.message}`;
    }
  }

  if (!description) {
    throw new Error(lastError || 'All Gemini models failed');
  }

  return {
    attribute,
    description,
    model: 'gemini-vision',
  };
}

// ============================================================================
// REPLICATE IMAGEN API - STEP 2: EDIT USER IMAGE
// ============================================================================
async function editImageWithImagen({ userImage, userImageMimeType, userImageUrl, attributeDescription, attribute }) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  // Convert user image to base64 if needed
  let imageData = userImage;
  if (!imageData && userImageUrl) {
    const converted = await imageUrlToBase64(userImageUrl);
    imageData = `data:${converted.mimeType};base64,${converted.base64}`;
  }

  if (!imageData) {
    throw new Error('Provide userImage (base64 with data URI) or userImageUrl');
  }

  // Build the editing prompt based on attribute
  const editPrompt = `Transform the ${attribute} to match this description: ${attributeDescription}. Keep the rest of the face and image unchanged. Maintain natural appearance and lighting.`;

  // Replicate Imagen model (you'll need to verify the exact model version)
  // Example model - UPDATE THIS with the actual Imagen 4 model you found
  const model = 'google-deepmind/imagen-3'; // UPDATE THIS!
  const version = 'latest'; // Or specific version hash

  // Start the prediction
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: version,
      input: {
        image: imageData,
        prompt: editPrompt,
        // Add any other Imagen-specific parameters here
        // Examples: strength, guidance_scale, etc.
      },
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Replicate API failed (${createResponse.status}): ${errorText}`);
  }

  const prediction = await createResponse.json();
  const predictionId = prediction.id;

  // Poll for completion
  let result = prediction;
  let attempts = 0;
  const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max

  while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!pollResponse.ok) {
      throw new Error(`Polling failed (${pollResponse.status})`);
    }

    result = await pollResponse.json();
    attempts++;
  }

  if (result.status === 'failed') {
    throw new Error(`Image generation failed: ${result.error || 'Unknown error'}`);
  }

  if (result.status !== 'succeeded') {
    throw new Error('Image generation timed out');
  }

  return {
    editedImageUrl: result.output, // Replicate returns image URL(s) in output
    attribute,
    processingTime: attempts * 2, // Approximate seconds
  };
}

// ============================================================================
// HTTP SERVER
// ============================================================================
const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  // Health check
  if (method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'celebrity-attribute-transfer',
      timestamp: new Date().toISOString(),
      geminiConfigured: !!GEMINI_API_KEY,
      replicateConfigured: !!REPLICATE_API_TOKEN,
    });
    return;
  }

  // Root endpoint
  if (method === 'GET' && pathname === '/') {
    sendJson(res, 200, {
      ok: true,
      message: 'Celebrity Attribute Transfer API',
      endpoints: [
        'GET /health - Check API status',
        'POST /api/extract-attribute - Extract attribute description from celebrity image',
        'POST /api/edit-image - Apply attribute to user image',
      ],
    });
    return;
  }

  // ========================================================================
  // ENDPOINT 1: Extract Attribute Description
  // ========================================================================
  if (method === 'POST' && pathname === '/api/extract-attribute') {
    try {
      const body = await parseBody(req);
      const { imageUrl, imageBase64, imageMimeType, attribute } = body;

      if (!imageUrl && !imageBase64) {
        sendJson(res, 400, { 
          error: 'Missing required field: imageUrl or imageBase64' 
        });
        return;
      }

      if (!attribute) {
        sendJson(res, 400, { 
          error: 'Missing required field: attribute (e.g., "eyes", "hair_color")' 
        });
        return;
      }

      const result = await extractAttributeDescription({
        imageBase64,
        imageMimeType,
        imageUrl,
        attribute,
      });

      sendJson(res, 200, {
        success: true,
        ...result,
      });
    } catch (err) {
      console.error('Extract attribute error:', err);
      sendJson(res, 500, { 
        error: err.message || 'Failed to extract attribute description' 
      });
    }
    return;
  }

  // ========================================================================
  // ENDPOINT 2: Edit User Image
  // ========================================================================
  if (method === 'POST' && pathname === '/api/edit-image') {
    try {
      const body = await parseBody(req);
      const { 
        userImage, 
        userImageMimeType, 
        userImageUrl, 
        attributeDescription, 
        attribute 
      } = body;

      if (!userImage && !userImageUrl) {
        sendJson(res, 400, { 
          error: 'Missing required field: userImage or userImageUrl' 
        });
        return;
      }

      if (!attributeDescription) {
        sendJson(res, 400, { 
          error: 'Missing required field: attributeDescription' 
        });
        return;
      }

      if (!attribute) {
        sendJson(res, 400, { 
          error: 'Missing required field: attribute' 
        });
        return;
      }

      const result = await editImageWithImagen({
        userImage,
        userImageMimeType,
        userImageUrl,
        attributeDescription,
        attribute,
      });

      sendJson(res, 200, {
        success: true,
        ...result,
      });
    } catch (err) {
      console.error('Edit image error:', err);
      sendJson(res, 500, { 
        error: err.message || 'Failed to edit image' 
      });
    }
    return;
  }

  // 404 for unknown routes
  sendJson(res, 404, { error: 'Not found' });
});

// ============================================================================
// START SERVER
// ============================================================================
server.listen(PORT, () => {
  console.log(`
🚀 Celebrity Attribute Transfer API running on http://localhost:${PORT}

Configuration:
  - Gemini API: ${GEMINI_API_KEY ? '✓ Configured' : '✗ Missing GEMINI_API_KEY'}
  - Replicate API: ${REPLICATE_API_TOKEN ? '✓ Configured' : '✗ Missing REPLICATE_API_TOKEN'}

Endpoints:
  - POST /api/extract-attribute
  - POST /api/edit-image
  `);
});
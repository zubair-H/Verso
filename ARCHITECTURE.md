# Facial Analysis & Style Try-On — Full Architecture for Codex

## Overview

Extend the existing `server.js` (Node 18+, native `http`, `sharp`, Replicate) into a full
facial-analysis and style try-on platform. The current server already handles hair color,
hair style, and eye color. This document defines every new feature, the exact Replicate
models to use, the API contract, and the data-flow rules Codex must follow.

---

## Core Design Rules (do not break these)

1. **Analyze once, apply many.** Every user selfie goes through one `/api/analyze` call that
   returns a `sessionId` + all segmentation masks. Every subsequent edit call references that
   `sessionId`. Never re-segment per edit.

2. **Two-tier edits:**
   - **Tier 1 – Compositing (no Replicate call):** Color swaps on existing geometry —
     hair color, eye color, lip color, eyebrow tint, skin tone, nail color, outfit color,
     shoe color. Use `sharp` pixel manipulation (already implemented for hair). Fast, free.
   - **Tier 2 – Generative (Replicate call):** Shape/structure changes — hairstyle, eyebrow
     reshape, jawline, cheekbone, lip shape. One Replicate call per user action.

3. **Session store in memory** (`Map<sessionId, SessionData>`). Sessions expire after 30
   minutes of inactivity. No database needed.

4. **All existing endpoints (`/api/recolor-hair`, `/api/recolor-hair-fast`,
   `/api/recolor-eyes-fast`) must remain unchanged** — full backward compatibility.

5. Keep the same coding style as existing `server.js`: plain `http`, no Express, `sendJson`,
   `parseBody`, `pollReplicatePrediction`, `createReplicatePrediction` helpers.

---

## Session Data Structure

```js
// Stored in Map<string, SessionData>
{
  id: string,                  // uuid v4
  createdAt: number,           // Date.now()
  lastAccessedAt: number,
  originalDataUri: string,     // original selfie
  width: number,
  height: number,
  masks: {
    hair: string | null,       // URL or base64 PNG mask
    eyebrows: string | null,
    eyes: string | null,
    lips: string | null,
    skin: string | null,
    teeth: string | null,
    nose: string | null,
    ears: string | null,
    neck: string | null,
    clothing: string | null,
    hands: string | null,      // for nails
    shoes: string | null,
    background: string | null,
  },
  landmarks: {                 // from face-parsing model output
    faceBox: { x, y, w, h },
    eyeLeft: { x, y },
    eyeRight: { x, y },
    noseTop: { x, y },
    mouthCenter: { x, y },
    chinBottom: { x, y },
    jawlinePoints: Array<{x,y}>,
    cheekboneLeft: { x, y },
    cheekboneRight: { x, y },
  } | null,
  analysisStatus: 'pending' | 'complete' | 'failed',
  analysisError: string | null,
}
```

---

## Replicate Models to Use

### 1. Face Parsing / Segmentation (runs ONCE per session)
- **Model:** `sczhou/face-parsing` on Replicate
- **Version slug:** resolve dynamically via `getReplicateLatestVersionId`
- **Input:** `{ image: dataUri }`
- **Output:** multi-class segmentation map; parse each class into individual masks
- **Classes to extract:** hair, left_eyebrow, right_eyebrow, left_eye, right_eye,
  nose, upper_lip, lower_lip, skin, left_ear, right_ear, neck, cloth, background
- **Merge rule:** combine left_eyebrow + right_eyebrow → `masks.eyebrows`;
  left_eye + right_eye → `masks.eyes`; upper_lip + lower_lip → `masks.lips`

### 2. Hair Style + Color (already implemented as fast model)
- **Model version:** `REPLICATE_FAST_HAIR_VERSION` (already in env)
- Keep existing `generateFastHairEditUrl` function unchanged

### 3. Inpainting — Eyebrow / Jawline / Cheekbone / Lip Shape (Tier 2)
- **Model:** `stability-ai/stable-diffusion-inpainting`
- **Version:** resolve dynamically
- **Input:** `{ image, mask, prompt, negative_prompt, num_inference_steps: 30, guidance_scale: 7.5 }`
- **Mask expansion rule:** expand mask bounding box by 15% on each side before sending
  to inpainting to allow geometry changes outside existing boundary

### 4. Eye Color (already implemented)
- Keep existing `generateFastEyeEditUrl` using `flux-kontext-pro`

### 5. Clothing Segmentation (for outfit color swap)
- **Model:** `mattmdjaga/segformer-b2-clothes`
- **Version:** resolve dynamically
- **Input:** `{ image: dataUri }`
- **Output:** clothing mask PNG
- **Note:** run this only when user first requests an outfit color change; cache result
  in `session.masks.clothing`

### 6. General Object Segmentation — Shoes, Nails (Tier 1 color only)
- **Model:** `meta/sam-2` on Replicate
- **Input:** `{ image: dataUri, point_coords: [[x, y]], point_labels: [1] }`
- **Use for:** shoe isolation, hand/nail isolation when face-parsing mask is insufficient
- Run lazily and cache in session masks

---

## New API Endpoints

### POST `/api/analyze`
**Purpose:** Segment the selfie once. Returns `sessionId`. All further calls use this ID.

**Request body:**
```json
{ "userImageUrl": "data:image/jpeg;base64,..." }
```

**Response:**
```json
{
  "success": true,
  "sessionId": "abc-123",
  "analysisStatus": "pending",
  "estimatedMs": 12000
}
```

**Flow:**
1. Validate image, generate `sessionId` (use `crypto.randomUUID()`).
2. Store session with `analysisStatus: 'pending'` immediately.
3. Kick off `runAnalysis(sessionId)` **async** (do not await).
4. Return `sessionId` immediately so UI can show loading state.

**`runAnalysis(sessionId)` internal function:**
1. Call face-parsing model → get segmentation output URL.
2. Download segmentation image, parse each pixel class into separate mask buffers using `sharp`.
3. Save each mask buffer as base64 PNG in `session.masks`.
4. Extract face bounding box and landmark coordinates from the segmentation output.
5. Set `session.analysisStatus = 'complete'`.
6. If error → set `session.analysisStatus = 'failed'`, store error message.

---

### GET `/api/analyze/:sessionId`
**Purpose:** Poll analysis status.

**Response:**
```json
{
  "success": true,
  "sessionId": "abc-123",
  "analysisStatus": "complete",
  "availableMasks": ["hair", "eyes", "eyebrows", "lips", "skin", "clothing"],
  "landmarks": { ... }
}
```

---

### POST `/api/edit`
**Purpose:** Universal edit endpoint. Routes to Tier 1 (compositing) or Tier 2 (generative).

**Request body:**
```json
{
  "sessionId": "abc-123",
  "feature": "lips",
  "action": "color",
  "value": { "hex": "#c94070" }
}
```

**Feature + Action routing table:**

| feature       | action       | tier | method                                      |
|---------------|--------------|------|---------------------------------------------|
| hair          | color        | 1    | `recolorWithMask(masks.hair, hex)`          |
| hair          | style        | 2    | `generateFastHairEditUrl()`                 |
| eyebrows      | color        | 1    | `recolorWithMask(masks.eyebrows, hex)`      |
| eyebrows      | shape        | 2    | `inpaintWithMask(masks.eyebrows, prompt)`   |
| eyes          | color        | 2    | `generateFastEyeEditUrl()`                  |
| lips          | color        | 1    | `recolorWithMask(masks.lips, hex)`          |
| lips          | shape        | 2    | `inpaintWithMask(masks.lips, prompt)`       |
| skin          | tone         | 1    | `recolorWithMask(masks.skin, hex)`          |
| jawline       | reshape      | 2    | `inpaintWithMask(landmarks.jawline, prompt)`|
| cheekbones    | reshape      | 2    | `inpaintWithMask(landmarks.cheekbones, prompt)` |
| outfit        | color        | 1    | `recolorWithMask(masks.clothing, hex)`      |
| nails         | color        | 1    | `recolorWithMask(masks.hands, hex)`         |
| shoes         | color        | 1    | `recolorWithMask(masks.shoes, hex)`         |

**Value schema per action:**
```json
// color action
{ "hex": "#rrggbb", "strength": 0.0-1.0 }

// style/shape action
{ "styleId": "string", "prompt": "string (optional override)" }
```

**Response (Tier 1 — fast):**
```json
{
  "success": true,
  "tier": 1,
  "feature": "lips",
  "action": "color",
  "editedImageDataUri": "data:image/png;base64,...",
  "elapsedMs": 180
}
```

**Response (Tier 2 — generative):**
```json
{
  "success": true,
  "tier": 2,
  "feature": "hairstyle",
  "action": "style",
  "editedImageUrl": "https://replicate.delivery/...",
  "elapsedMs": 7400
}
```

---

### GET `/api/sessions/:sessionId`
**Purpose:** Debug/inspect a session (dev only).
Returns full session object minus the raw image buffers.

---

### DELETE `/api/sessions/:sessionId`
**Purpose:** Explicitly clear a session and free memory.

---

## Preset Catalogs to Add

### Lip Colors (add to server constants)
```js
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
```

### Nail Colors
```js
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
```

### Eyebrow Shapes (Tier 2 prompts)
```js
const EYEBROW_SHAPES = [
  { id: 'natural', name: 'Natural', prompt: 'natural softly arched eyebrows, groomed' },
  { id: 'arched', name: 'High Arch', prompt: 'high arched eyebrows, defined sharp peak' },
  { id: 'straight', name: 'Straight', prompt: 'straight flat horizontal eyebrows, Korean style' },
  { id: 'thick', name: 'Thick Bushy', prompt: 'thick full bushy eyebrows, model brows' },
  { id: 'thin', name: 'Thin', prompt: 'thin pencil-thin eyebrows, retro 90s style' },
  { id: 'rounded', name: 'Rounded', prompt: 'rounded soft curved eyebrows, gentle arc' },
  { id: 'feathered', name: 'Feathered', prompt: 'feathered brushed up eyebrows, fluffy brows' },
];
```

### Lip Shapes (Tier 2 prompts)
```js
const LIP_SHAPES = [
  { id: 'natural', name: 'Natural', prompt: 'natural lip shape, no alteration' },
  { id: 'full', name: 'Full', prompt: 'fuller plumper lips, naturally enhanced volume' },
  { id: 'cupids_bow', name: "Cupid's Bow", prompt: 'defined cupids bow upper lip, sharp peaks' },
  { id: 'thin', name: 'Thin', prompt: 'slimmer thinner lips, subtle and refined' },
  { id: 'heart', name: 'Heart', prompt: 'heart shaped lips, pronounced upper lip dip' },
];
```

### Jawline Presets (Tier 2 prompts)
```js
const JAWLINE_PRESETS = [
  { id: 'natural', name: 'Natural', prompt: 'natural jawline, no change' },
  { id: 'defined', name: 'Defined', prompt: 'more defined sharp jawline, chiseled' },
  { id: 'soft', name: 'Soft', prompt: 'softer rounder jawline, gentle oval face shape' },
  { id: 'square', name: 'Square', prompt: 'square strong jawline, angular jaw' },
  { id: 'v_shape', name: 'V-Shape', prompt: 'V-shaped slim jawline, Korean V-face' },
  { id: 'slim', name: 'Slim', prompt: 'slimmer narrower jaw and face width' },
];
```

---

## New GET Endpoints for Catalogs

Add these following the same pattern as existing `/api/hair-colors`:

```
GET /api/lip-colors        → { success, colors: LIP_COLORS }
GET /api/nail-colors       → { success, colors: NAIL_COLORS }
GET /api/eyebrow-shapes    → { success, shapes: EYEBROW_SHAPES }
GET /api/lip-shapes        → { success, shapes: LIP_SHAPES }
GET /api/jawline-presets   → { success, presets: JAWLINE_PRESETS }
```

---

## Helper Functions to Add

### `recolorWithMask({ userImageBuffer, maskBuffer, hex, strength })` 
This already exists as `recolorHairWithMask`. **Rename it to `recolorWithMask`** and make it
generic — it takes any mask, any target hex. Keep the existing HSL logic and edge-fade exactly
as-is. Update the old `/api/recolor-hair` to call the renamed function.

### `inpaintWithMask({ imageDataUri, maskDataUri, prompt, negativePrompt })`
New function:
```js
async function inpaintWithMask({ imageDataUri, maskDataUri, prompt, negativePrompt = '' }) {
  const version = await getReplicateLatestVersionId('stability-ai/stable-diffusion-inpainting');
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
```

### `expandMask(maskBuffer, width, height, expandPct = 0.15)`
New function that dilates a mask buffer outward by `expandPct` of the image dimension.
Use `sharp` morphological dilation. Needed for all Tier 2 shape edits so generative model
has room to add geometry outside the current boundary.

### `parseFaceParsingOutput(outputUrl)`
New function:
1. Download the segmentation color map PNG from Replicate.
2. Map each pixel color to a class label using the face-parsing model's color legend.
3. Return `{ masks: { hair, eyes, eyebrows, lips, skin, ... }, landmarks }`.
4. Each mask is a binary PNG buffer (white = region, black = not region).

### `getOrFetchClothingMask(session)`
Lazy-load clothing mask:
```js
async function getOrFetchClothingMask(session) {
  if (session.masks.clothing) return session.masks.clothing;
  const version = await getReplicateLatestVersionId('mattmdjaga/segformer-b2-clothes');
  // ... call Replicate, download mask, store in session.masks.clothing
  return session.masks.clothing;
}
```

---

## Session Cleanup

Add a cleanup interval at server startup:
```js
setInterval(() => {
  const now = Date.now();
  const TTL = 30 * 60 * 1000; // 30 minutes
  for (const [id, session] of SESSION_STORE.entries()) {
    if (now - session.lastAccessedAt > TTL) {
      SESSION_STORE.delete(id);
      console.log(`Session ${id} expired and cleared`);
    }
  }
}, 5 * 60 * 1000); // run every 5 minutes
```

---

## Environment Variables to Add to `.env`

```
REPLICATE_API_TOKEN=your_token_here           # already exists
REPLICATE_FAST_HAIR_VERSION=...               # already exists
REPLICATE_EYE_EDIT_MODEL=...                  # already exists
REPLICATE_INPAINTING_MODEL=stability-ai/stable-diffusion-inpainting   # new
REPLICATE_FACE_PARSING_MODEL=sczhou/face-parsing                       # new
REPLICATE_CLOTHING_SEG_MODEL=mattmdjaga/segformer-b2-clothes           # new
REPLICATE_SAM2_MODEL=meta/sam-2                                        # new
SESSION_TTL_MINUTES=30                         # new, optional
```

---

## File Structure

```
project/
├── server.js           ← extend this file (all logic stays in one file per existing pattern)
├── public/
│   └── index.html      ← frontend (separate task)
├── .env
└── package.json
```

Keep everything in `server.js`. Do not split into multiple files unless the file exceeds
2000 lines, in which case extract helpers to `lib/replicate.js` and `lib/imageUtils.js`.

---

## Error Handling Rules

Follow the existing `debug` + `mark()` trace pattern for every new POST endpoint.
Every endpoint must:
1. Create a `debug` object with `traceId`, `startedAt`, `steps[]`.
2. Use `mark(message)` at each major step.
3. Always set `debug.finishedAt` and `debug.elapsedMs` before returning.
4. Return `{ error, debug }` on failure, `{ success: true, ..., debug }` on success.

---

## What NOT to Change

- `HAIR_COLORS`, `HAIR_STYLES`, `EYE_COLORS` constants — add to them but don't rename
- `sendJson`, `parseBody`, `serveStatic`, `sleep`, `urlToDataUri`, `fetchBuffer` — unchanged
- `createReplicatePrediction`, `pollReplicatePrediction`, `getReplicateLatestVersionId` — unchanged
- All existing POST/GET endpoints — fully backward compatible
- Port, CORS headers, health endpoint — unchanged

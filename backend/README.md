# Lookr Backend (MVP)

Simple Node.js backend for your React Native app, with no external dependencies.

## Run

From project root:

```bash
npm run api:start
```

Default URL: `http://localhost:4000`

## Endpoints

- `GET /health`
- `GET /v1/looks?deviceId=...`
- `POST /v1/looks`
- `PATCH /v1/looks/:id/favorite`
- `DELETE /v1/looks/:id`
- `POST /v1/generate`
- `GET /v1/jobs/:id`

## Example Payloads

### Create look

`POST /v1/looks`

```json
{
  "selfie": "file://selfie.jpg",
  "reference": "https://example.com/look.jpg",
  "result": "https://example.com/result.jpg",
  "elements": ["Hair texture", "Jawline"],
  "deviceId": "ios-sim-001"
}
```

### Generate (mock)

`POST /v1/generate`

```json
{
  "selfie": "file://selfie.jpg",
  "look": "https://example.com/look.jpg",
  "elements": ["Hair texture", "Eye makeup"]
}
```

Returns a completed job with `resultUrl` (currently mocked to `look`).

## Data storage

Data is persisted in:

- `backend/data/db.json`

You can override this path with env var `DB_PATH`.

## Next step

Swap `/v1/generate` internals with your real AI service, and keep the same response shape so mobile integration stays stable.

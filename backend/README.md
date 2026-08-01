# Vaani Sahayak Backend (free-tier build)

Real, running backend for the snap-to-speech pipeline. Deliberately scoped
to what a single free Gemini API key and a laptop with no GPU can actually
support — see the honesty notes at the bottom before you deploy this
anywhere with real users.

## What changed vs. the original README's architecture, and why

| Original plan | This build | Why |
|---|---|---|
| Self-hosted Gemma via `ml-service/` container | Google Gemini API (free tier) | Your device has no dedicated GPU and 8GB RAM total. A vision-capable model won't run locally with usable latency or accuracy. Gemini's free tier gives you a real multimodal model over HTTP instead. |
| Postgres | SQLite | Zero setup cost, plenty for single-instance/small-scale use. Swap `DATABASE_URL` in `.env` if you outgrow it. |
| Celery + Redis (required) | Synchronous Flask, Redis optional | Gemini's free tier is rate-limited to roughly 10-15 requests/minute — a task queue isn't solving a bottleneck you have yet. Redis is still supported for session context if you set `REDIS_URL`; otherwise it falls back to in-memory. |
| Cloud/offline TTS+STT unspecified | gTTS (TTS) + faster-whisper (STT, local CPU) | Both are free. gTTS needs internet; faster-whisper runs fully offline/local once the model's downloaded once. |

## Setup

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# edit .env and paste your free key from https://aistudio.google.com/apikey
python wsgi.py
```

Runs at `http://localhost:5000`. Point the mobile app's API base URL here
(over your machine's LAN IP, not `localhost`, when testing on a physical
phone).

### Or with Docker

```bash
docker compose up --build
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Sanity check, confirms `GEMINI_API_KEY` is set |
| POST | `/api/scan` | multipart: `image`, `session_id` → OCR → classify → simplify → TTS |
| POST | `/api/ask` | multipart or JSON: `session_id` + `question` (text) or `audio` → grounded answer + TTS |
| GET | `/api/audio/doc/<id>` | Stream a scan's generated audio |
| GET | `/api/audio/answer/<id>` | Stream a follow-up answer's generated audio |
| GET | `/api/history?session_id=` | Past scans for a session |
| GET | `/api/history/<document_id>/conversation` | Follow-up Q&A for one scan |

`session_id` is a client-generated UUID (e.g. from `expo-crypto` or
`react-native-uuid`), persisted on-device, not a real login system.

## Honest caveats — read before you build on top of this

- **Free tier is genuinely limited.** Gemini's free tier is roughly 10-15
  requests/minute and a low three-digit daily cap, per project/key. Fine
  for you developing and demoing solo. Not fine for multiple simultaneous
  users — you will hit 429s. The code surfaces this as a clean `502
  upstream_error` instead of crashing, but it will still block real usage
  at scale.
- **gTTS is an unofficial free wrapper** around Google Translate's TTS
  voice, not an SLA'd product. It occasionally 403s depending on network/
  IP reputation. Don't ship this as the sole TTS path for a real launch —
  budget for a paid Nepali TTS (or self-hosted Piper, if/when Piper adds
  a real Nepali voice) before you have real users depending on it.
- **faster-whisper on Nepali is mediocre, not great.** Whisper's Nepali
  support exists but isn't best-in-class. Expect worse follow-up-question
  transcription than the vision/simplification quality.
- **No auth, no rate limiting, no input size hardening beyond a basic
  8MB upload cap.** This is a dev-scoped backend, not a hardened one.
- **The React Native frontend you attached (`NepVoice1-main.zip`) is not
  wired to any backend yet** — worth flagging clearly since it changes
  what "building the backend" gets you today. `app/(tabs)/index.tsx`
  returns a hardcoded random result from a `sampleResults` array on every
  snap; there's no `fetch`/`axios` call anywhere in the repo, no camera
  capture writing to a file, and no real audio playback (the waveform is
  a decorative animation, not tied to an audio file). None of these
  endpoints will actually get called by the app as it stands — you'd
  need to wire `CameraScreen`, `result.tsx`, and `AppContext` to call
  `/api/scan` and `/api/ask` and play back the returned `audio_url`
  before this backend does anything visible in the app.

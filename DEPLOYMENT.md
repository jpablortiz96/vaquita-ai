# Deployment Guide

Two services:

| Service | Folder | Host | Public URL example |
|---|---|---|---|
| Frontend (Next.js 15 PWA) | `web/` | Vercel | `https://vaquita-ai.vercel.app` |
| Backend (agent / WhatsApp bot, Fastify) | `agent/` | Render | `https://vaquita-ai-agent.onrender.com` |

The frontend reads vaquita state directly from Arbitrum via wagmi, so it works
standalone. `NEXT_PUBLIC_AGENT_URL` is the wiring point for future agent API calls.
The Twilio WhatsApp webhook must point at the **Render** backend.

---

## 1. Backend on Render

A `render.yaml` blueprint is included at the repo root. You can deploy via
Blueprint (auto-reads the file) or configure a Web Service manually with:

- **Root Directory:** `agent`
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

`npm run build` compiles TypeScript to `agent/dist/`; `npm start` runs
`node dist/server.js`. The server binds `0.0.0.0` and reads `process.env.PORT`
(Render sets it automatically).

### Required environment variables (Render dashboard)

The server refuses to boot without the first three:

| Variable | Notes |
|---|---|
| `ANTHROPIC_API_KEY` | Claude (intent + risk scoring) — **required** |
| `ARBITRUM_SEPOLIA_RPC` | e.g. `https://sepolia-rollup.arbitrum.io/rpc` — **required** |
| `DEPLOYER_PRIVATE_KEY` | Signer for onchain actions — **required**, never commit |
| `PUBLIC_URL` | This service's Render URL, e.g. `https://vaquita-ai-agent.onrender.com` |
| `FRONTEND_URL` | The Vercel URL, for CORS |
| `ALLOWED_ORIGINS` | Optional extra origins, comma-separated |
| `TWILIO_ACCOUNT_SID` | WhatsApp bot |
| `TWILIO_AUTH_TOKEN` | WhatsApp bot |
| `TWILIO_WHATSAPP_FROM` | e.g. `whatsapp:+14155238886` |
| `ELEVENLABS_API_KEY` | Voice (optional) |
| `ELEVENLABS_VOICE_ID_ES` | Voice (optional) |
| `BITSO_API_KEY` / `BITSO_API_SECRET` | Bitso (optional) |
| `BITSO_API_BASE_URL` | `https://api.bitso.com/api/v3` (prod, read-only) or `-sandbox` |
| `ARBISCAN_API_KEY` | Optional |

Full list with placeholders: [`agent/.env.example`](./agent/.env.example).

### Test `/health`
```bash
curl https://vaquita-ai-agent.onrender.com/health
# {"status":"ok","botConfigured":true,"timestamp":"..."}
```

### Configure the Twilio WhatsApp webhook
In the Twilio Console → Messaging → WhatsApp Sandbox (or your number) →
"When a message comes in":

```
https://vaquita-ai-agent.onrender.com/webhook/twilio    (POST)
```

> **G — final webhook URL:** `https://<your-render-service>.onrender.com/webhook/twilio`

Once `PUBLIC_URL` is the Render URL, ElevenLabs audio is served from
`{PUBLIC_URL}/audio/...` and Twilio can fetch it.

---

## 2. Frontend on Vercel

- **Root Directory:** `web`
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** `next build` (default)
- **Install Command:** `npm install` (default)
- **Output:** managed by Next.js (no override needed)

No `vercel.json` is required — Vercel auto-detects Next.js. Just set the root
directory to `web` in the project settings.

### Environment variables (Vercel dashboard)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy app ID (from privy.io) |
| `NEXT_PUBLIC_AGENT_URL` | The Render backend URL, e.g. `https://vaquita-ai-agent.onrender.com` |

Both are `NEXT_PUBLIC_*` (exposed to the browser by design — Privy app ID and a
public backend URL are not secrets). Reference: [`web/.env.local.example`](./web/.env.local.example).

### Connect frontend → backend
`web/lib/config.ts` exposes `AGENT_URL` derived from `NEXT_PUBLIC_AGENT_URL`
(falls back to `http://localhost:3001` in dev). Use it for any agent API call.

### Test the public link
Open `https://<your-app>.vercel.app` → landing loads → `/vaquitas`, `/demo`,
`/qr` render → language toggle (ES/EN) works.

---

## 3. Local testing

```bash
# Backend (compiled, production-like)
cd agent
npm install
npm run build
PORT=3001 npm start
curl http://localhost:3001/health

# Backend (dev, hot reload)
npm run dev:bot

# Frontend
cd web
npm install
npm run dev          # http://localhost:3002
npm run build        # production build check
```

---

## 4. Hackathon checklist

- [ ] Render service live, `/health` returns 200
- [ ] All required env vars set in Render (`ANTHROPIC_API_KEY`, `ARBITRUM_SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`)
- [ ] `PUBLIC_URL` in Render = the Render URL
- [ ] Twilio webhook = `{RENDER_URL}/webhook/twilio`
- [ ] Vercel project live, root dir = `web`
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` + `NEXT_PUBLIC_AGENT_URL` set in Vercel
- [ ] `FRONTEND_URL` in Render = the Vercel URL (CORS)
- [ ] WhatsApp sandbox refreshed (`join <keyword>`) before demo
- [ ] No `.env` committed (`git ls-files | grep .env` → only `.example`)

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Render boot crash: "Environment validation failed" | Missing required var | Set `ANTHROPIC_API_KEY`, `ARBITRUM_SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY` |
| App listens on wrong port | Hardcoded PORT | Don't set `PORT` manually on Render — it injects it; server reads `process.env.PORT` |
| Browser CORS error calling agent | Origin not allowed | Set `FRONTEND_URL` (and/or `ALLOWED_ORIGINS`) in Render to the Vercel URL |
| Frontend hits `localhost:3001` in prod | `NEXT_PUBLIC_AGENT_URL` unset | Set it in Vercel and redeploy (NEXT_PUBLIC vars are baked at build time) |
| Twilio webhook 404/timeout | Wrong URL or service asleep | Use `{RENDER_URL}/webhook/twilio`; see free-tier sleep below |
| First WhatsApp message after idle is slow / times out | Render free tier sleeps after ~15 min | Hit `/health` to wake it before demo, or use a uptime pinger / paid plan |
| Build failure on Render | Wrong root dir | Root Directory must be `agent` |
| Build failure on Vercel | Wrong root dir | Root Directory must be `web` |
| Twilio "signature invalid" historically | ngrok/sandbox quirk | Signature check is non-blocking by design (logged, not enforced) — see Security note |

---

## 6. Security notes

- No secrets are committed. `.env*` is gitignored; only `*.env.example` files are tracked.
- The Twilio signature check is **non-blocking** (logs a warning, still processes)
  because it does not validate reliably behind the WhatsApp sandbox / tunnel.
  This is an accepted V1 tradeoff; in production with a dedicated Twilio number it
  validates correctly and can be enforced.
- Bitso, when pointed at production (`api.bitso.com`), is hard-guarded to **GET-only**
  at the code level on top of a read-only API key (see ADR-17).
- `DEPLOYER_PRIVATE_KEY` is a server-side secret — set it only in the Render dashboard.

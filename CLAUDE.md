# CLAUDE.md — VaquitaAI Project Context

> This file is read automatically by Claude Code at the start of every session. Keep it updated as the project evolves.

## 1. Project Identity

**Name:** VaquitaAI
**Tagline:** "Tu confianza, programable" (Your trust, programmable)
**Type:** Onchain rotating savings protocol with AI risk management
**Target market:** LATAM, primary launch in Mexico
**Primary user:** People who already participate in tandas/vaquitas/cundinas (50M+ in Mexico alone)

## 2. Hackathon Context

**Event:** Ethereum México x Bitso Hybrid Hackathon 2026
**Duration:** May 6 — June 6, 2026 (5 weeks)
**Submission deadline:** June 6, 2026, 9:00 AM CST
**Format:** Hybrid (online + in-person CDMX June 1, 4–5, 12, 15–16)
**Tracks targeted:**
- Bitso General Track (PRIMARY — MXNB integration is mandatory)
- Ethereum México General Track (PRIMARY — LATAM impact narrative)
- Arbitrum General Track (PRIMARY — deployment on Arbitrum One)
- Rare Protocol Pool Prize (BONUS — NFT receipts via Rare CLI)
- Arbitrum Stylus track (BONUS — if time allows in Week 4)

## 3. Working Model

The user (Juan Pablo / Eduky) is the strategic lead and executor. Claude Code is the technical implementer. Rules:

- ALWAYS deliver complete code files, never partial fragments
- ALWAYS provide step-by-step terminal commands for Windows PowerShell
- ALWAYS include verification steps after each phase ("how do you know it worked")
- Working language with the user: Spanish
- Code, comments, commit messages, and documentation: English
- The user has limited time — prioritize execution speed over theoretical perfection
- After every meaningful change, update PROMPT_HISTORY.md and DECISIONS.md

## 4. Tech Stack (Locked)

### Smart Contracts
- Language: Solidity 0.8.24
- Framework: Foundry (forge, cast, anvil)
- Libraries: OpenZeppelin Contracts v5
- Networks: Arbitrum Sepolia (development) → Arbitrum One (production demo)
- Optional: Arbitrum Stylus (Rust) for risk verification contract — Week 4 stretch goal

### AI Agent Backend
- Runtime: Node.js 20+ with TypeScript
- LLM: Claude Sonnet 4 via Anthropic SDK (model: claude-sonnet-4-20250514)
- Orchestration: Custom state machine (no LangGraph — keep it simple)
- Database: Supabase (Postgres + pgvector for embeddings)
- WhatsApp: Twilio WhatsApp Business API
- Voice TTS: ElevenLabs (Spanish voice)

### Frontend
- Framework: Next.js 15 with App Router
- Styling: Tailwind CSS + shadcn/ui
- Wallet: Privy (email/social login → embedded wallet, critical for non-crypto users)
- Onchain reads: wagmi + viem
- Deployment: Vercel

### Payments / Fiat Bridge
- Mint/Redeem MXNB: Bitso Business API (sandbox: api-sandbox.bitso.com/api/v3/)
- SPEI: Mexican bank rail (handled by Bitso)

### Optional / Bonus
- Rare CLI: @rareprotocol/rare-cli for NFT receipts
- Stylus: cargo-stylus toolchain for Rust contracts

## 5. Architecture Overview
User (WhatsApp)
↓
Twilio WhatsApp API
↓
Agent Service (Node.js)
├→ Claude Sonnet 4 (intent + risk scoring + orchestration)
├→ Supabase (state, user data, embeddings)
├→ Bitso API (MXN ↔ MXNB conversion)
└→ Arbitrum (smart contract calls via viem)
↓
Smart Contracts
├─ VaquitaFactory.sol
├─ Vaquita.sol (per-vaquita escrow + collateral logic)
└─ RiskOracle.sol (signed AI scores)
User (Web/PWA)
↓
Next.js Frontend
├→ Privy (auth + embedded wallet)
├→ wagmi/viem (read contract state)
└→ Agent API (proxy to backend)

## 6. Project Structure
vaquita-ai/
├── CLAUDE.md            ← this file
├── README.md            ← public-facing
├── ARCHITECTURE.md      ← detailed tech decisions
├── ROADMAP.md           ← 5-week plan with checkpoints
├── PROMPT_HISTORY.md    ← log of major prompts
├── DECISIONS.md         ← Architecture Decision Records
├── contracts/           ← Foundry project (Solidity)
├── web/                 ← Next.js 15 app
├── agent/               ← AI agent + WhatsApp bot
└── docs/
    ├── sponsor-integrations/
    ├── screenshots/
    └── pitch/

## 7. Conventions

- Branch strategy: `main` (stable) + feature branches `feat/<short-name>`
- Commit format: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Solidity style: follow OpenZeppelin conventions, NatSpec for all public functions
- TypeScript: strict mode ON, no `any` unless justified in comment
- Environment variables: NEVER commit `.env`, always update `.env.example`
- Tests: every smart contract function must have a Foundry test before deploying anywhere

## 8. Sponsor Integration Requirements (Non-negotiable)

### Bitso (PRIMARY)
- MXNB must be the native currency of the entire app
- Must use Bitso Business API for at least one mint or redeem flow
- Document API usage with screenshots in `docs/sponsor-integrations/bitso.md`

### Arbitrum
- Final demo must run on Arbitrum One mainnet (not just testnet)
- Document deployment addresses, gas reports, and Arbiscan links in `docs/sponsor-integrations/arbitrum.md`

### Ethereum México
- Narrative must explicitly center on LATAM financial inclusion
- Demo must work in Spanish
- Document impact data (AMAI, INEGI sources) in `docs/sponsor-integrations/ethereum-mexico.md`

### Rare Protocol (Bonus)
- If time permits in Week 4, generate NFT receipts for completed vaquitas using Rare CLI
- Document in `docs/sponsor-integrations/rare-protocol.md`

## 9. Demo Strategy (Multisensorial — Lessons from CodeSonify victory)

The demo must engage MORE THAN ONE SENSE:
- Visual: clean UI, real-time Arbiscan transactions, AI reasoning visualizations
- Audio: ElevenLabs Spanish voice notifications when user receives their turn
- Interactive (in-person CDMX): judge creates a vaquita on their own WhatsApp during demo
- Onchain reality: live Arbiscan transactions visible during demo

## 10. Common Commands

```powershell
# Smart contracts — IMPORTANT: always run forge commands from contracts/ directory
cd contracts
forge build
forge test -vvv
forge script script/Deploy.s.sol --rpc-url $env:ARBITRUM_SEPOLIA_RPC --broadcast --verify

# Frontend
cd web
npm run dev

# Agent
cd agent
npm run dev
```

> **Note:** After cloning, run `git submodule update --init --recursive` from root to restore `contracts/lib/`.

## 11. "Nadie Más Va a Hacer Esto" Filter

Before building ANY new feature, ask: "Would 80% of other hackathon teams build this?"
- If YES → reconsider or transform until the answer is NO
- The winning concept (vaquita on blockchain with AI risk scoring) IS the differentiator
- Stay weird, stay LATAM-specific, stay opinionated

## 12. Onchain Reference Data

### MXNB Token
- **Mainnet (Arbitrum One):** `0xF197FFC28c23E0309B5559e7a166f2c6164C80aA`
- **Testnet (Arbitrum Sepolia):** Use deployed `MockMXNB` (`mMXNB`) — real MXNB is not officially on Sepolia.
- **Decimals:** 6 (NOT 18). This is critical — every amount calculation must respect this.
- **Symbol on production:** `MXNB`. On testnet via mock: `mMXNB`.

### Chain IDs
- Arbitrum One (production demo): `42161`
- Arbitrum Sepolia (development): `421614`

### Public RPCs (free, suitable for dev — switch to Alchemy/QuickNode if rate-limited)
- Arbitrum One: `https://arb1.arbitrum.io/rpc`
- Arbitrum Sepolia: `https://sepolia-rollup.arbitrum.io/rpc`

### Block explorers
- Arbitrum One: https://arbiscan.io
- Arbitrum Sepolia: https://sepolia.arbiscan.io

### Live deployments (Arbitrum Sepolia)
After running `Deploy.s.sol`, the canonical addresses live in `deployments/arbitrum-sepolia.json`. Example:

| Contract | Purpose |
|---|---|
| MockMXNB | Test stablecoin with 6 decimals + faucet |
| Vaquita (implementation) | Locked logic contract used by all clones |
| VaquitaFactory | Deploys vaquita clones |
| Genesis Vaquita | First demo vaquita (4 members, 100 mMXNB / 7 days) |

The frontend and AI agent must read these addresses from `deployments/arbitrum-sepolia.json` (committed to the repo) — do not hardcode them.

## 13. Vaquita Contract State Machine

```
┌──────────┐  setPayoutOrder    ┌──────────┐
│ Created  │ ──────────────────▶│ Created  │
│          │  (creator only)    │ +order   │
└─────┬────┘                    └─────┬────┘
      │ join() x N                    │ start()
      │ (collateral escrowed)         │ (creator only)
      ▼                               ▼
   waiting                       ┌──────────┐
                                 │  Active  │
                                 │ cycle 1  │
                                 └─────┬────┘
                                       │ contribute() x N
                                       │ + executeCycle()
                                       │ (after deadline,
                                       │  permissionless)
                                       ▼
                                  ┌──────────┐  if collateral
                                  │  Active  │  insufficient
                                  │ cycle k  │ ───────────────▶ Defaulted
                                  └─────┬────┘
                                        │ k = N → Completed
                                        ▼
                                   Completed
                                        │ claimCollateral()
                                        ▼
                                   collateral
                                   returned
```

### Key invariants
- Total token balance held by the contract = sum of unclaimed collateral + pool of in-flight cycle.
- After `Completed`, only collateral remains; all cycle pools have been distributed.
- `payoutOrder.length == totalMembers` and contains each member exactly once.
- A member is `hasDefaulted` if they ever missed a contribution, regardless of subsequent cycles.

### Trust model (V1)
- `creator` is trusted to set a fair payout order. V2 sources order from `IRiskOracle`.
- All members are trusted not to collude. V2 adds optional ZK-attested KYC.
- The contract does not need an admin during operation — `executeCycle` is permissionless.

## 14. Factory Pattern (EIP-1167 Clones)

The factory deploys vaquitas as minimal proxies pointing to a single `Vaquita` implementation:

```
   ┌──────────────────┐
   │ Vaquita          │
   │ (implementation) │  ← deployed once, holds all logic
   └─────────▲────────┘
             │ delegatecall
             │
   ┌─────────┴────────┐  ┌─────────────────┐  ┌─────────────────┐
   │ Vaquita Clone #1 │  │Vaquita Clone #2│ ...│Vaquita Clone #N│
   │ (per-group state)│  │                │   │                │
   └──────────────────┘  └─────────────────┘  └─────────────────┘
```

Why:
- Each clone costs ~50K gas to deploy vs ~1.5M for a full deploy. 30× cheaper.
- All clones share storage layout but have isolated state per address.
- `initialize` replaces the constructor; the implementation is locked in its own constructor so it can never be initialized directly.

Implications:
- The Vaquita contract has no immutables — they were converted to regular storage variables.
- Anyone calling `initialize` on a clone before the factory does could hijack it; we mitigate this by only ever creating clones via the factory's `createVaquita`, which initializes atomically in the same transaction.

## 15. Agent Service Architecture

```
agent/
├── src/
│   ├── config/
│   │   ├── env.ts          ← typed env validation (zod)
│   │   └── deployments.ts  ← reads deployments/arbitrum-sepolia.json
│   ├── chain/
│   │   ├── client.ts       ← viem public + wallet clients
│   │   └── abis.ts         ← typed ABIs for the 3 core contracts
│   ├── ai/
│   │   ├── claude.ts       ← Anthropic SDK wrapper, JSON helper
│   │   └── risk-scorer.ts  ← scoreMember + suggestPayoutOrder
│   ├── core/
│   │   ├── orchestrator.ts ← coordinates scoring + ordering
│   │   └── vaquita-service.ts ← read/write contract helpers
│   ├── types/index.ts
│   └── index.ts            ← boot check
├── test/                    ← vitest
└── package.json             ← ESM, type:"module"
```

### Service responsibilities
- **vaquita-service**: stateless wrappers around the contracts. Does NOT decide anything.
- **risk-scorer**: pure AI calls. Returns scores. Does NOT touch chain.
- **orchestrator**: combines AI calls into a setup plan. Returns a plan; does NOT submit txs.
- The eventual HTTP/WhatsApp layer (Part 2) will be the only place that signs and submits.

### Why this separation matters
- Each layer is independently testable.
- The orchestrator can be reused by the WhatsApp bot AND the web frontend.
- AI cost stays bounded — services don't make redundant Claude calls.

## 16. WhatsApp Bot Architecture

```
User WhatsApp ─→ Twilio Sandbox ─→ webhook POST /webhook/twilio ─→ Fastify server
                                                                      │
                                                                      ▼
                                                              normalizePhone
                                                                      │
                                                                      ▼
                                                              getOrCreateSession
                                                                      │
                                       ┌──────────────────────────────┤
                                       │                              ▼
                              if in multi-step flow             classifyIntent
                                       │                       (Claude Sonnet 4.5)
                                       ▼                              │
                              advance state                           ▼
                                       │                       route by kind
                                       └──────────────┬──────────────┘
                                                      ▼
                                          handleMessage → string[]
                                                      │
                                                      ▼
                                            sendWhatsApp(...) via Twilio
```

### V1 limitations (documented honestly)
- Sessions are in-memory: lost on server restart. V2 = Supabase.
- Signing: the deployer wallet signs every onchain action regardless of which user requested it. V2 = per-user Privy wallets.
- `list_my_vaquitas` shows everything created by the deployer signer, not per-user. V2 = filter by user wallet.

### Why these are acceptable for the hackathon
- Demo flow is conversational, not custodial: judges care about the AI + UX magic.
- The contracts already enforce per-user roles (creator, member). Custody can be swapped without redeploying.
- Documented in DECISIONS.md; we're explicit about what's V1 vs V2.

## 17. Risk Scorer Integration in Join Flow

```
Creator                                Candidate
  │                                      │
  │ "invitar"                            │
  ├─→ generate 8-char code               │
  ├─→ message with code + onboarding     │
  │   instructions                       │
  │                                      │
  │   shares code via WhatsApp/SMS       │
  │ ───────────────────────────────────▶ │
  │                                      │ join sandbox + "código abc12345"
  │                                      ├─→ ask name
  │                                      ├─→ ask occupation
  │                                      ├─→ ask income
  │                                      ├─→ ask relation months
  │                                      │
  │                                      └─→ scoreMember() ← Claude Sonnet 4.5
  │                                          │
  │  ◀─── proactive WhatsApp ────────────────┤
  │ "Nueva solicitud, score 78..."
  │ "¿Apruebas?"                         │
  │                                      │
  │ "sí"                                 │
  ├─→ approveToken()                     │
  ├─→ joinVaquita()                      │
  │                                      │
  │  ───── proactive WhatsApp ──────────▶ │
  │                                      │ "🎉 ¡Te aprobaron!"
```

### V1 limitations (documented honestly)
- Invitations are in-memory; lost on restart. V2 = Supabase.
- The deployer signer executes `join()` on behalf of the candidate. V2 = candidate's own Privy wallet.
- The candidate's "address" sent to the risk scorer is a hash of their phone, not a real wallet. V2 = real wallet history.
- Approval is binary; we don't yet apply the scorer's suggested position to the on-chain payout order. V2 = automated ordering based on accumulated scores.

### Why these work for the hackathon
- Judges experience the FULL conversational AI flow: invite → ask → score → review → approve → join onchain.
- Every onchain action is real and verifiable on Arbiscan.
- The risk scorer is genuinely using Claude Sonnet 4.5 — not a mock.

## 18. Voice Notifications (ElevenLabs)

### Architecture
```
User approves a candidate
   │
   ▼
executeApproval()
   ├─→ onchain join() via deployer signer
   ├─→ resetSession(candidate)
   ├─→ sendToOther(text "🎉 ¡Te aprobaron!")
   │
   ▼
   if (isVoiceConfigured())
   ├─→ synthesizeSpanish(welcomeScript) ── caches in agent/audio/
   ├─→ audioPublicUrl(filename) ── public via ngrok
   └─→ sendWhatsAppMedia(audio.mp3) ── Twilio downloads + delivers
```

### Caching strategy
Files are named `audio_<sha1(voiceId|text)>.mp3`. Identical (voice, text) pairs reuse the same MP3, so re-approvals don't burn ElevenLabs characters.

### Fallback
If `ELEVENLABS_API_KEY` or `ELEVENLABS_VOICE_ID_ES` are missing, the bot still sends the text-only message and logs the skip. Voice ENHANCES the experience; never blocks it.

### Free tier limits
- 10,000 characters/month on free ElevenLabs
- Average approval message: ~250 chars → ~40 approvals/month before refill
- Production plan ($5/mo): 30,000 chars

## 19. Bitso Business Integration

VaquitaAI integrates the Bitso Business Trading API for live MXN/MXNB market data and account management.

```
User WhatsApp                  Bot (Fastify)                Bitso Sandbox API
   │                                │                            │
   │ "saldo bitso"                  │                            │
   ├────────────────────────────────▶                            │
   │                                │ HMAC-signed GET /balance   │
   │                                ├────────────────────────────▶
   │                                │                            │
   │                                ◀─── { balances: [...] } ────┤
   │                                │                            │
   │ "💰 Saldo: 100 MXNB"           │                            │
   ◀────────────────────────────────┤                            │
```

### Signature implementation
HMAC SHA256 per Bitso docs. Code: `agent/src/bitso/client.ts`. Tested in `agent/test/bitso/client.test.ts` without making real API calls.

### Endpoints integrated
- Public: `/ticker`, `/order_book`, `/available_books`
- Private (signed): `/account_status`, `/balance`, `/funding_destinations`

### Bot commands
- `saldo bitso` → live balance check
- `cotizar` → MXNB/MXN ticker
- `bitso info` → explainer
- HTTP: `GET /bitso/health` for sponsors

### V1 → V2 path
V1: read-only sandbox calls for the demo. V2: SPEI on/off-ramp with real MXNB on Arbitrum One mainnet.

## 20. Frontend PWA (Next.js 15 + Privy + wagmi)

### Stack
- Next.js 15 App Router
- TypeScript strict
- Tailwind v3 (classic `@tailwind` directives + tailwind.config.ts)
- Privy SDK (embedded wallets + Email/Google/Twitter login)
- wagmi v2 + viem (reads onchain); viem pinned to 2.51.2 (Privy peer requirement)
- Mobile-first, theme oscuro

### Páginas
- `/` — landing con hero, stats, showcase del Risk Score
- `/vaquitas` — lista de vaquitas del usuario logueado
- `/vaquitas/[address]` — detalle con miembros y sus Risk Score gauges
- `/join/[code]` — onboarding desde código de invitación → redirige a WhatsApp

### Componentes estrella
- `RiskScoreGauge` — SVG circular animado con gradiente turquesa→morado, número en el centro, label dinámico
- `VaquitaCard` — card glass-morphism con métricas
- `Header` — login/logout vía Privy, muestra wallet abreviada

### PWA
- `manifest.json` configurado
- Instalable en celular (mobile-first)
- Theme color matching el bg

### Dev port
3002 (no conflicta con el agent en 3001).

### V1 limitations
- Reads onchain solo. Crear vaquita / join / arrancar todavía solo desde WhatsApp.
- Member scores en `/vaquitas/[address]` son pseudo-aleatorios derivados del address en V1. V2 = API del agent expone los scores reales.

## 21. Operating Reminders for Claude Code

- This project must pass the WTF→WOW test (judges say "wait, what?" then "that's brilliant")
- Every layer of depth matters: target 8-10 distinct technical layers (CodeSonify had 5+)
- Document sponsor tool usage with screenshots — most teams forget this and lose points
- Working demo > perfect code. A broken demo = instant elimination
- The user is fast but not necessarily an expert in every part of this stack — explain assumptions step by step

## 22. QR Code Onboarding (Feature G)

### Routes
- `/qr` — full-screen QR code page. Shows a 400px QR with center logo. Designed to be displayed on a phone at the demo booth.
- `/demo` — simplified landing for visitors who scan the QR but want to "see first". Animated Risk Score, feature grid, dual CTAs (WhatsApp + see vaquitas).

### QR generation
SSR via `qrcode` npm package. Generates SVG at request time. Error correction level H allows the center logo overlay without breaking scanability.

### Deep link
QR encodes: `https://wa.me/14155238886?text=join%20till-breathing`
When scanned, opens WhatsApp with the sandbox activation message pre-filled. User just hits send.

### Demo flow at CDMX
1. Open `/qr` on your phone, full-screen brightness up
2. Show it to a judge at the booth
3. Judge scans with their camera
4. WhatsApp opens with "join till-breathing" pre-filled
5. They hit send -> bot welcomes them
6. They can immediately type "hacer una vaquita" and start a flow
7. Total time from scan to first vaquita: ~30 seconds

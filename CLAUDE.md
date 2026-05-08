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

## 15. Operating Reminders for Claude Code

- This project must pass the WTF→WOW test (judges say "wait, what?" then "that's brilliant")
- Every layer of depth matters: target 8-10 distinct technical layers (CodeSonify had 5+)
- Document sponsor tool usage with screenshots — most teams forget this and lose points
- Working demo > perfect code. A broken demo = instant elimination
- The user is fast but not necessarily an expert in every part of this stack — explain assumptions step by step

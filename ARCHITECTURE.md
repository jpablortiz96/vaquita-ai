# VaquitaAI — Architecture

> Detailed architecture documentation. This file will be expanded with each phase.

## High-Level Diagram
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User      │────▶│  Twilio          │────▶│   AI Agent      │
│  (WhatsApp) │     │  WhatsApp API    │     │   (Node.js +    │
└─────────────┘     └──────────────────┘     │   Claude API)   │
                                             └────────┬────────┘
                                                      │
          ┌──────────────────┬───────────┼───────────┬──────────────────┐
          ▼                  ▼           ▼           ▼                  ▼
    ┌─────────┐      ┌──────────┐  ┌────────┐  ┌──────────┐    ┌──────────────┐
    │ Bitso   │      │ Supabase │  │Arbitrum│  │ElevenLabs│    │  Privy       │
    │ API     │      │(Postgres)│  │  One   │  │  (TTS)   │    │ (Wallets)    │
    └─────────┘      └──────────┘  └────────┘  └──────────┘    └──────────────┘

## Components

### `Vaquita.sol` (implemented in Step 2)
The core escrow + payout state machine. One instance per vaquita group. Stores collateral, accepts contributions, distributes the per-cycle pool to the next recipient, and handles defaults via collateral consumption. Permissionless `executeCycle` settlement after deadline. Independent of the AI agent — the agent only writes the payout order at setup time.

### `IRiskOracle.sol` (interface defined in Step 1, implementation in Week 2)
On-chain oracle that the off-chain AI agent populates with member risk scores. The Vaquita contract does not yet read from it in V1 — the creator-set payout order is sufficient. V2 will consume scores directly from the oracle and reorder cycles dynamically.

### `MockMXNB.sol` (implemented in Step 1)
6-decimal ERC-20 token mimicking real MXNB on Arbitrum One. Includes a public faucet so judges can self-serve testnet tokens during the demo.

### Pending components
- `VaquitaFactory.sol` (Step 3): clones-based factory to spin up vaquitas cheaply.
- AI Agent Service (Week 2): risk scorer + orchestrator + recovery bot.
- WhatsApp Bot (Week 2): conversational interface.
- PWA Frontend (Week 3): mobile-first dashboard with Privy auth.
- Bitso Integration (Week 3): MXN ↔ MXNB on/off-ramp.

## Data Flow (Coming in Step 1)

To be documented after smart contracts are written.

## Security Considerations (Coming in Week 2)

To be documented after AI Risk Scorer is implemented.

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

## Components (to be detailed in upcoming phases)

- Smart Contracts: `VaquitaFactory.sol`, `Vaquita.sol`, `RiskOracle.sol`
- AI Agent: Risk Scorer, Orchestrator, Recovery Bot
- Frontend: Next.js PWA with Privy auth
- WhatsApp Bot: Conversational flow for the entire user journey
- Bitso Integration: MXN ↔ MXNB on/off-ramp via SPEI

## Data Flow (Coming in Step 1)

To be documented after smart contracts are written.

## Security Considerations (Coming in Week 2)

To be documented after AI Risk Scorer is implemented.

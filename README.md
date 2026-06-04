<div align="center">

# 🐄 VaquitaAI

### Onchain rotating savings (vaquitas / tandas) with AI-powered trust scoring

**The traditional Mexican savings circle, supercharged with AI, WhatsApp, voice notifications, and an immutable on-chain ledger.**

[![Arbitrum](https://img.shields.io/badge/Arbitrum-Sepolia-blue?style=for-the-badge)](https://sepolia.arbiscan.io)
[![MXNB](https://img.shields.io/badge/Bitso-MXNB-orange?style=for-the-badge)](https://bitso.com/business/products/mxnb-stablecoin)
[![Tests](https://img.shields.io/badge/Tests-44%20passing-success?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)]()

[**🌐 Live Demo**](http://localhost:3002) · [**📱 WhatsApp Bot**](https://wa.me/14155238886?text=join%20till-breathing) · [**📜 Smart Contracts**](https://sepolia.arbiscan.io/address/0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E)

</div>

---

## 🎯 The Problem

In Latin America, **80% of households** save through informal rotating savings groups called *vaquitas*, *tandas*, or *cundinas*. Trillions of pesos move through these circles every year.

But they have problems:
- 📓 The "treasurer's notebook" gets lost
- 😱 Someone disappears with the pot ("se voló con la lana")
- 💔 Disputes about "who paid this month"
- 🚫 Members need to meet in person
- ⚠️ No protection when someone defaults

## ✨ The Solution

VaquitaAI is the same traditional vaquita, but:

- 📱 **WhatsApp-native** — no apps to install, works on any phone
- 🤖 **AI evaluates trust** — Claude Sonnet 4.5 scores each member and proposes a fair payout order
- 🎙️ **Voice notifications** — every important update arrives as natural Spanish audio
- ⛓️ **Onchain protected** — smart contracts on Arbitrum hold the collateral; nobody can disappear with the money
- 🇲🇽 **Mexican pesos digital** — uses MXNB from Bitso (1:1 to MXN)

## 🎬 In 30 Seconds

```
User (WhatsApp): "hacer una vaquita de 500 al mes con 4 amigos"
                         ↓
Bot creates onchain vaquita, generates invite code
                         ↓
Each friend sends "quiero unirme con código X" → answers 4 questions
                         ↓
AI evaluates trust → creator approves → onchain join executed
                         ↓
When everyone's in: AI computes optimal payout order
                         ↓
Each member receives Spanish voice message with their position
                         ↓
Vaquita runs automatically. Forever. Verifiable on Arbiscan.
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       USER                                  │
│           WhatsApp ┃ Web (Next.js PWA)                      │
└──────────────┬──────────────────┬───────────────────────────┘
               │                  │
               ▼                  ▼
        ┌──────────────┐    ┌──────────────┐
        │  Twilio API  │    │   Privy SDK  │
        └──────┬───────┘    └──────┬───────┘
               │                   │
               ▼                   ▼
        ┌─────────────────────────────────┐
        │     Agent Backend (Fastify)     │
        │  - Intent classifier (Claude)   │
        │  - Risk Scorer (Claude)         │
        │  - Voice synth (ElevenLabs)     │
        │  - Bitso API integration        │
        └────────────┬────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────┐
        │   Smart Contracts (Arbitrum)    │
        │  - VaquitaFactory (EIP-1167)    │
        │  - Vaquita implementations      │
        │  - MockMXNB (test) / MXNB (real)│
        └─────────────────────────────────┘
```

## 🧰 Tech Stack

| Layer | Stack |
|---|---|
| **Smart Contracts** | Solidity 0.8.24 · Foundry · OpenZeppelin v5 · EIP-1167 Clones |
| **Chain** | Arbitrum Sepolia (V1) · Arbitrum One (V2 ready) |
| **Backend Agent** | Node.js 20 · TypeScript strict · Fastify · viem · Anthropic SDK |
| **AI** | Claude Sonnet 4.5 (intent + risk scoring) |
| **Voice** | ElevenLabs (Spanish text-to-speech) |
| **Messaging** | Twilio WhatsApp Sandbox (Production-ready) |
| **Frontend** | Next.js 15 · App Router · Tailwind · Privy embedded wallets · wagmi v2 |
| **Stablecoin** | MXNB by Bitso (Mexican Peso, on-chain) |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Foundry
- A wallet with Arbitrum Sepolia ETH (for testing)

### Clone & Install
```bash
git clone https://github.com/jpablortiz96/vaquita-ai
cd vaquita-ai
```

### Run Smart Contract Tests
```bash
cd contracts
forge install
forge test
# Expected: 44 tests passing
```

### Run the AI Agent
```bash
cd ../agent
npm install
cp .env.example .env  # Then fill in your API keys
npm run dev:bot
# Listens on http://localhost:3001
```

### Run the Frontend
```bash
cd ../web
npm install
cp .env.local.example .env.local
npm run dev
# Visit http://localhost:3002
```

## 📁 Project Structure

```
vaquita-ai/
├── contracts/              # Foundry smart contracts
│   ├── src/
│   │   ├── Vaquita.sol           # Core state machine
│   │   ├── VaquitaFactory.sol    # EIP-1167 clone factory
│   │   ├── MockMXNB.sol          # Test token
│   │   └── IRiskOracle.sol       # Risk oracle interface
│   ├── test/                     # 44 Foundry tests
│   └── script/                   # Deployment scripts
│
├── agent/                  # Node.js TypeScript agent
│   ├── src/
│   │   ├── ai/             # Claude integration + ElevenLabs voice
│   │   ├── bitso/          # Bitso Business API integration
│   │   ├── bot/            # WhatsApp conversational bot
│   │   ├── chain/          # viem chain client + ABIs
│   │   ├── core/           # Vaquita service + orchestrator
│   │   └── server.ts       # Fastify HTTP server
│   └── test/               # Vitest tests
│
├── web/                    # Next.js 15 PWA
│   ├── app/
│   │   ├── page.tsx              # Landing (humanized)
│   │   ├── vaquitas/             # Vaquita list + detail
│   │   ├── join/[code]/          # Onboarding by invite code
│   │   ├── qr/                   # In-person QR onboarding
│   │   └── demo/                 # Simplified showcase
│   ├── components/         # React components
│   └── lib/                # Helpers + contracts ABI
│
├── docs/
│   └── sponsor-integrations/     # Per-sponsor documentation
│
├── deployments/            # Network deployment manifests
└── CLAUDE.md              # Persistent context for AI assistants
```

## 🎯 Hackathon Track Submissions

VaquitaAI competes in 4 tracks. See [SUBMISSION.md](./SUBMISSION.md) for the full per-track texts.

| Track | Sponsor | Doc |
|---|---|---|
| **General Hybrid** | Ethereum México | [docs/sponsor-integrations/ethereum-mexico.md](./docs/sponsor-integrations/ethereum-mexico.md) |
| **Bitso Track** | Bitso | [docs/sponsor-integrations/bitso.md](./docs/sponsor-integrations/bitso.md) |
| **Arbitrum Track** | Arbitrum | [docs/sponsor-integrations/arbitrum.md](./docs/sponsor-integrations/arbitrum.md) |
| **Rare Protocol Bonus** | Rare Protocol | [docs/sponsor-integrations/rare-protocol.md](./docs/sponsor-integrations/rare-protocol.md) (V2) |

## 📊 What's Deployed (Arbitrum Sepolia)

| Contract | Address | Verified |
|---|---|---|
| **VaquitaFactory** | [0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E](https://sepolia.arbiscan.io/address/0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E) | ✅ |
| **Vaquita Implementation** | [0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717](https://sepolia.arbiscan.io/address/0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717) | ✅ |
| **MockMXNB** | [0xBA717164E68625e5e9E9C5Cd380c38ecFACf481c](https://sepolia.arbiscan.io/address/0xBA717164E68625e5e9E9C5Cd380c38ecFACf481c) | ✅ |

## 🧪 Verifiable Quality Bar

- ✅ **44 Foundry tests** passing — every state transition, every edge case
- ✅ **3 smart contracts verified** on Arbiscan with source code visible
- ✅ **20+ Vitest tests** for the agent
- ✅ **0 TypeScript errors** in strict mode across all 3 workspaces
- ✅ **Live AI scoring** with calibrated outputs (range 30–85 across test profiles)
- ✅ **ElevenLabs voice** confirmed natural Spanish
- ✅ **Twilio WhatsApp** end-to-end conversation tested
- ✅ **Bitso API** integrated and health-checked

## 🔮 Roadmap

### V1 (Hackathon - Current)
- ✅ Smart contracts on Arbitrum Sepolia
- ✅ WhatsApp bot in Spanish
- ✅ AI risk scoring + payout ordering
- ✅ Voice notifications
- ✅ Web PWA with embedded wallets

### V2 (Post-Hackathon)
- Migrate to Arbitrum One mainnet with real MXNB
- Real SPEI on/off-ramp via Bitso Business
- Each user gets their own Privy wallet (not shared deployer)
- Supabase persistence (replace in-memory stores)
- NFT receipts via Rare Protocol
- Multi-language (Spanish + English)
- Push notifications

## 🤝 Built By

**[Juan Pablo Enríquez](https://github.com/jpablortiz96)** — Solo builder
Industrial engineer turned data + AI + automation educator. Founder of [Eduky](https://eduky.co).
Based in Cali, Colombia 🇨🇴 · Building for LATAM 🌎

## 📄 License

MIT

---

<div align="center">

**🐄 Made with care for Latin American families.**

[Twitter](https://twitter.com/_eduky) · [Instagram](https://instagram.com/_eduky) · [LinkedIn](https://linkedin.com/in/jpablortiz96)

</div>

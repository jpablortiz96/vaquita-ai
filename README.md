# 🐄 VaquitaAI

> **Your trust, programmable.** Onchain rotating savings powered by AI for Latin America.

[![Built for Ethereum México x Bitso Hackathon 2026](https://img.shields.io/badge/Hackathon-EthMexico%20x%20Bitso%202026-blue)](https://ethereummexico.org)
[![Powered by MXNB](https://img.shields.io/badge/Stablecoin-MXNB-green)](https://bitso.com/business/products/mxnb-stablecoin)
[![Deployed on Arbitrum](https://img.shields.io/badge/L2-Arbitrum%20One-orange)](https://arbitrum.io)
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)](#)

## The Problem

In Mexico alone, **50+ million people participate in "vaquitas"** (also known as tandas, cundinas) — informal rotating savings groups where members contribute monthly and take turns receiving the pool. Every year, **millions of these groups break** because someone disappears with the money. There is no recourse, no contract, no protection.

## The Solution

VaquitaAI puts vaquitas onchain in Mexican peso stablecoin (MXNB). An AI agent scores each member's risk, decides the optimal payout order, and smart contracts on Arbitrum guarantee that if someone defaults, their collateral covers the group. All accessible through WhatsApp — no app download, no crypto knowledge required.

## How It Works

1. A user starts a vaquita via WhatsApp: amount, members, frequency.
2. Each member joins by scanning a link (Privy creates an embedded wallet automatically).
3. Members deposit MXN through SPEI; Bitso mints MXNB into the smart contract.
4. The AI agent scores each member and proposes a payout order; the group confirms.
5. Each cycle, the contract automatically transfers MXNB to the next recipient.
6. If someone defaults, the AI triggers collateral execution and notifies the group.

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.24, Foundry, OpenZeppelin |
| Blockchain | Arbitrum One (production), Arbitrum Sepolia (dev) |
| Stablecoin | MXNB (Bitso Business) |
| AI Agent | Claude Sonnet 4, Node.js, TypeScript |
| Frontend | Next.js 15, Tailwind, shadcn/ui, Privy, wagmi/viem |
| Bot | Twilio WhatsApp API, ElevenLabs TTS |
| Database | Supabase (Postgres + pgvector) |
| Deployment | Vercel (web), Railway (agent) |

## Project Structure

- `contracts/` — Solidity smart contracts (Foundry)
- `web/` — Next.js frontend (PWA)
- `agent/` — AI agent and WhatsApp bot
- `docs/` — Architecture, sponsor integrations, screenshots

## Status

🚧 **In active development for Ethereum México x Bitso Hackathon 2026**

Submission deadline: June 6, 2026.

## Built by

[Eduky (Juan Pablo Enríquez Ortiz)](https://eduky.co) — solo founder, Colombia 🇨🇴
GitHub: [@jpablortiz96](https://github.com/jpablortiz96)

## License

MIT

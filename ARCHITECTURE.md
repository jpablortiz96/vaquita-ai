# VaquitaAI Architecture

## Overview

VaquitaAI is a 3-layer system:
1. **Smart contracts** — Solidity on Arbitrum (the source of truth for state and money)
2. **AI agent backend** — Node.js + TypeScript Fastify server (the brain)
3. **User interfaces** — WhatsApp (primary) + Next.js PWA (secondary)

```
┌──────────────────────────────────────────────────────────────┐
│                          USER LAYER                          │
├──────────────────────────────────────────────────────────────┤
│  📱 WhatsApp (95% of users)                                  │
│     └─ Twilio Sandbox / Production                           │
│  🌐 Next.js 15 PWA (secondary)                               │
│     └─ Privy embedded wallets + wagmi                        │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS webhooks + RPC reads
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       AGENT LAYER                            │
├──────────────────────────────────────────────────────────────┤
│  Fastify server :3001                                        │
│     ├─ /webhook/twilio  ── inbound WhatsApp                  │
│     ├─ /voice/synthesize ── on-demand TTS                    │
│     ├─ /audio/:filename  ── public audio serving             │
│     ├─ /bitso/health     ── sponsor health check             │
│     └─ /health           ── server liveness                  │
│                                                              │
│  Services:                                                   │
│     ├─ Intent classifier (Claude Sonnet 4.5)                 │
│     ├─ Risk scorer (Claude Sonnet 4.5)                       │
│     ├─ Payout orchestrator (AI + onchain)                    │
│     ├─ Voice synthesis (ElevenLabs)                          │
│     ├─ Bitso API client (HMAC signed)                        │
│     └─ Conversation state machine                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ viem reads + writes
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                          │
├──────────────────────────────────────────────────────────────┤
│  Arbitrum Sepolia (V1) / Arbitrum One (V2)                   │
│                                                              │
│  VaquitaFactory  (EIP-1167 minimal proxies)                  │
│     │                                                        │
│     ├─ Vaquita #1                                            │
│     ├─ Vaquita #2     ← each is a clone (~306K gas)          │
│     ├─ Vaquita #3                                            │
│     └─ ...                                                   │
│                                                              │
│  MockMXNB (Sepolia) / MXNB by Bitso (mainnet)                │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow: Create a Vaquita

```
User WhatsApp                Agent                    Blockchain
     │                         │                          │
     │ "hacer una vaquita..."  │                          │
     ├────────────────────────▶                           │
     │                         │ Classify intent (Claude) │
     │                         │ Extract: contribution,   │
     │                         │   members, cycle         │
     │                         │                          │
     │ Bot asks for missing    │                          │
     │   params (state ML)     │                          │
     ◀─────────────────────────┤                          │
     │                         │                          │
     │ User confirms "sí"      │                          │
     ├────────────────────────▶                           │
     │                         │ Factory.createVaquita()  │
     │                         ├──────────────────────────▶
     │                         │                          │
     │                         │ Receipt + address        │
     │                         ◀──────────────────────────┤
     │                         │                          │
     │ "🎉 Tu vaquita está     │                          │
     │  onchain en 0x..."      │                          │
     ◀─────────────────────────┤                          │
```

## Data Flow: Risk-Scored Join

```
Creator              Candidate              Agent                Claude              Blockchain
   │                     │                    │                    │                     │
   │ "invitar"           │                    │                    │                     │
   ├────────────────────────────────────────▶                      │                     │
   │ ← invite code       │                    │                    │                     │
   │                     │                    │                    │                     │
   │      shares code    │                    │                    │                     │
   ├────────────────────▶│                    │                    │                     │
   │                     │ "unirme con código"│                    │                     │
   │                     ├──────────────────▶│                    │                     │
   │                     │  ← ask name        │                    │                     │
   │                     ◀───────────────────┤                    │                     │
   │                     │ "María"            │                    │                     │
   │                     ├──────────────────▶│                    │                     │
   │                     │  (4 questions)     │                    │                     │
   │                     │                    │                    │                     │
   │                     │                    │ Score member       │                     │
   │                     │                    ├──────────────────▶│                     │
   │                     │                    │  ← {score: 78,     │                     │
   │                     │                    │     reasoning,     │                     │
   │                     │                    │     position}      │                     │
   │                     │                    ◀───────────────────┤                     │
   │                     │                    │                    │                     │
   │ ← "Solicitud + AI   │                    │                    │                     │
   │   score 78..."      │                    │                    │                     │
   ◀──────────────────────────────────────────┤                    │                     │
   │                     │                    │                    │                     │
   │ "sí" (approve)      │                    │                    │                     │
   ├────────────────────────────────────────▶│                    │                     │
   │                     │                    │ approveToken() +   │                     │
   │                     │                    │ joinVaquita()      │                     │
   │                     │                    ├────────────────────────────────────────▶│
   │                     │                    │   ← onchain join   │                     │
   │                     │                    ◀────────────────────────────────────────┤
   │                     │                    │                    │                     │
   │                     │ ← "Aprobada!"      │                    │                     │
   │                     │  + voice MP3       │                    │                     │
   │                     ◀───────────────────┤                    │                     │
```

## Key Design Decisions

| Decision | Reasoning | ADR |
|---|---|---|
| EIP-1167 clones for vaquitas | 4.9× cheaper than full deploys | ADR-9 |
| In-memory state for V1 | Faster development; V2 = Supabase | ADR-10 |
| Single deployer signer for V1 | Simpler UX; V2 = per-user Privy wallets | ADR-10 |
| Pseudo-address from phone hash | Lets risk scorer work without real wallets | ADR-12 |
| Local audio storage + Fastify static | Zero infra overhead | ADR-13 |
| Human-in-loop approval | AI suggests, human decides | ADR-14 |
| Bitso adapter pattern | Isolated, testable, swappable | ADR-15 |
| Privy embedded wallets | UX matches WhatsApp simplicity | ADR-16 |

See [DECISIONS.md](./DECISIONS.md) for full ADR details.

## Security Considerations

- All onchain transactions signed by the deployer in V1 (multi-sig planned for V2)
- API keys never committed (.env always gitignored)
- HMAC signatures for Bitso (per their docs)
- ReentrancyGuard on all token operations
- Twilio webhook signature validation (when PUBLIC_URL is set)
- No user PII stored beyond what's needed for the AI scorer

## Operational Considerations

- **ngrok dev tunnel:** required while Twilio webhook is on localhost
- **Twilio sandbox limits:** 50 messages/day, 24h messaging window, 3-day session expiry
- **Free tier limits:** ElevenLabs 10K chars/mo, Anthropic limited by API key, Bitso unlimited reads in sandbox
- **Gas costs (Arbitrum Sepolia):** ~$0 (testnet); ~$0.10 per vaquita on mainnet

---

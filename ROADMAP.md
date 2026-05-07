# VaquitaAI — 5-Week Roadmap

## Week 1 (May 6–12) — Foundation
**Goal:** Stack set up, smart contracts on Arbitrum Sepolia, basic WhatsApp bot working.

- [x] Step 0: Project foundation (this commit)
- [ ] Step 1: Foundry setup + first smart contracts (`VaquitaFactory.sol`, `Vaquita.sol`)
- [ ] Step 2: Foundry tests for happy path + 3 attack scenarios
- [ ] Step 3: Deploy to Arbitrum Sepolia, verify on Arbiscan
- [ ] Step 4: Twilio WhatsApp sandbox + Node.js basic bot
- [ ] Step 5: First end-to-end test (create vaquita via WhatsApp → escrow on Sepolia)

**Verification:** A user can create a vaquita via WhatsApp, funds enter escrow on Arbitrum Sepolia, txn is visible on Arbiscan.

## Week 2 (May 13–19) — AI Agent
**Goal:** Risk scorer + orchestrator working.

- [ ] AI Risk Scorer service — Claude API + onchain history fetcher + scoring logic
- [ ] AI Orchestrator — payout order decision with explainable reasoning
- [ ] Recovery Bot — default detection + automatic collateral execution
- [ ] Integration tests across all three agents

**Verification:** With 5 test wallets, the AI gives reasoned scores, the contract respects the proposed order, defaults trigger collateral correctly.

## Week 3 (May 20–26) — Bitso Integration + UX
**Goal:** Real MXNB mint/redeem, mobile-first PWA polished.

- [ ] Bitso Sandbox API — MXN deposit via SPEI mock → MXNB mint
- [ ] Bitso redeem flow — MXNB → MXN to Mexican bank account
- [ ] Mobile-first PWA dashboard
- [ ] ElevenLabs voice notifications integrated

**Verification:** Full end-to-end flow: deposit MXN → mint MXNB → join vaquita → receive turn → hear Spanish voice → redeem to bank.

## Week 4 (May 27 – Jun 2) — Polish + Demo Assets
**Goal:** Production deployment, all docs, recorded demo.

- [ ] Migrate to Arbitrum One mainnet, smoke tests with small amounts
- [ ] Professional README with badges, architecture, screenshots
- [ ] Demo video (3 min): hook + problem + live demo + tech + impact
- [ ] Pitch deck (10 slides max)
- [ ] STRETCH GOALS: Rare CLI NFT receipts, Stylus risk contract in Rust

**Verification:** README looks like a Series A product, demo video is understandable without context.

## Week 5 (Jun 3–6) — Submission + In-Person CDMX
**Goal:** Multiple track submissions + in-person presence.

- [ ] Submit to Bitso General + Ethereum México General + Arbitrum General (same project, descriptions tailored to each judge)
- [ ] In-person CDMX (Jun 4–5): networking, mentorships, last-minute polish
- [ ] Final submission June 6, 9:00 AM CST

**Verification:** All track submissions filed before deadline. Project is live and reachable.

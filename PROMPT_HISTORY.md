# Prompt History

> Log of major prompts and decisions during development. Append to the bottom — never edit history.

## Step 0 — Foundation (Date: 2026-05-07)

**Prompt:** Initialize the VaquitaAI project structure: create CLAUDE.md, README.md, ROADMAP.md, ARCHITECTURE.md, DECISIONS.md, PROMPT_HISTORY.md, .gitignore, .env.example, and the empty `contracts/`, `web/`, `agent/`, and `docs/` folders. No actual code yet — only foundation.

**Outcome:** Project skeleton created. Ready for Step 1 (Foundry setup + smart contracts).

## Step 1 — Foundry setup + MockMXNB + IRiskOracle (Date: 2026-05-07)

**Prompt:** Initialize Foundry inside `contracts/`, install OpenZeppelin v5, configure foundry.toml + remappings, create `MockMXNB.sol` (6-decimal mock matching real MXNB) and `IRiskOracle.sol` interface, write first Foundry tests.

**Outcome:** Foundry initialized, OZ v5 installed. MockMXNB and IRiskOracle compile cleanly. 7 tests pass on `forge test`. One bug found and fixed during testing: first-time faucet callers (lastFaucetClaim == 0) must be exempt from the cooldown check — otherwise the very first call reverts because block.timestamp starts at 1 in Foundry but FAUCET_COOLDOWN is 86400. Ready for Step 2 (Vaquita.sol core logic).

## Step 2 — Vaquita.sol core state machine + tests (Date: 2026-05-07)

**Prompt:** Implement the core `Vaquita.sol` contract: 4-state machine (Created → Active → Completed/Defaulted), flat-collateral escrow, member joins, creator-set payout order, permissionless cycle execution, default handling via collateral consumption, collateral claim. Plus a comprehensive Foundry test suite (~25 tests) covering constructor validation, joining, payout order, start, contribution, cycle execution (happy + missing + termination), full happy-path integration, and collateral claim.

**Outcome:** Vaquita.sol compiles cleanly (2 expected block-timestamp lint warnings). All 25 Vaquita tests pass + 7 MockMXNB tests still pass = 32 total. Gas report saved to docs/gas-report-step2.txt. CLAUDE.md, ARCHITECTURE.md, DECISIONS.md updated. Ready for Step 3 (VaquitaFactory + deployment scripts).

## Step 3 Part 1 — VaquitaFactory + Initializable refactor (Date: 2026-05-07)

**Prompt:** Refactor Vaquita.sol from parameterized constructor to Initializable pattern (EIP-1167 compatible). Deploy VaquitaFactory using OpenZeppelin Clones for ~30× cheaper per-vaquita deployment. Adapt existing Vaquita.t.sol (27 tests) and add VaquitaFactory.t.sol (10 tests). Goal: atomic clone+initialize, isolated state per clone, implementation locked against direct initialization.

**Outcome:** Vaquita.sol refactored (constructor locks `_initialized = true`; `initialize()` replaces parameterized constructor; `isInitialized()` view added). VaquitaFactory.sol implemented (EIP-1167 Clones, creator index, pagination, VaquitaCreated event). All 44 tests pass (7 MockMXNB + 27 Vaquita + 10 VaquitaFactory). Gas report saved to docs/gas-report-step3.txt. ADR-9 added to DECISIONS.md. Deploy script and on-chain deployment to Arbitrum Sepolia in Part 2.

## Step 3 Part 2 — Live deployment to Arbitrum Sepolia (Date: 2026-05-08)

**Prompt:** Write Deploy.s.sol, MintDemoTokens.s.sol, CreateDemoVaquita.s.sol. Deploy MockMXNB, Vaquita (implementation), and VaquitaFactory to Arbitrum Sepolia with automatic Arbiscan verification. Create Genesis Vaquita on-chain. Persist addresses to deployments/arbitrum-sepolia.json. Update sponsor docs.

**Outcome:** All three core contracts live on Sepolia, verified on Arbiscan. Genesis Vaquita created at 0xb40c602AEb5Cd1be2DfCBE330DF31bFD10d996Fe. 100,000 mMXNB minted to deployer. Addresses persisted in deployments/arbitrum-sepolia.json and .env. docs/sponsor-integrations/arbitrum.md fully populated. Ready for Step 4 (WhatsApp bot + AI agent setup).

## Step 4 Part 1 — Agent backend (env, chain, AI risk scorer, orchestrator) (Date: 2026-05-08)

**Prompt:** Set up agent/ workspace (Node.js 20 + TypeScript strict, ESM, Vitest). Build typed env config, chain client (viem), risk scorer using Claude Sonnet 4.5, orchestrator combining scoring + payout ordering, and vaquita-service wrapping read/write contract calls. Tests cover env load, deployments load, and live AI calls (skippable).

**Outcome:** agent/ compiles cleanly (zero TypeScript errors). deployments.test.ts 3/3 pass without API key. Full boot check and AI tests require real ANTHROPIC_API_KEY in .env. WhatsApp + HTTP server come in Part 2.

## Step 4 Part 2 — WhatsApp bot + Fastify HTTP server (Date: 2026-05-12)

**Prompt:** Build the conversational WhatsApp bot: Fastify server with /webhook/twilio endpoint, intent classification via Claude Sonnet 4.5, session store (in-memory), state machine for multi-step vaquita creation, Spanish message templates. Twilio signature validation. Tests for sessions, intent classifier, and engine state.

**Outcome:** Bot accepts inbound webhooks and responds in Spanish. Multi-step "create vaquita" flow asks for amount, members, cycle, collateral, then confirms and submits onchain. List/view vaquitas working. Health endpoint returns botConfigured:true. 9/9 non-AI tests pass; 18/19 AI tests pass (1 flakiness: "4 amigos" ambiguity in NLU, test updated to accept 4-5). ngrok + Twilio webhook configuration are manual user steps.

## Step 5 — Risk scorer integrated into join flow (Date: 2026-05-24)

**Prompt:** Build the full join workflow: invitation codes, 4-question join interview, AI risk scoring via Claude Sonnet 4.5, proactive approval prompt to creator, sí/no approval flow, onchain join() executed by deployer on behalf of candidate, cross-user proactive messaging.

**Outcome:** Bot accepts "invitar" → generates 8-char code; recipient sends "quiero unirme con código X" → 4-question interview → scoreMember() via Claude → creator receives proactive WhatsApp with score/rationale/red-flags → "sí" triggers approveToken() + joinVaquita() onchain → both parties notified. 15/15 non-AI tests pass (6 new invitations store tests). ADR-12 documents phone-based candidate identity tradeoff. OutboundSender abstraction keeps engine.ts free of Twilio coupling.

## Step 6 — ElevenLabs voice notifications in Spanish (Date: 2026-06-01)

**Prompt:** Integrate ElevenLabs TTS for Spanish voice messages. Send personalized welcome audio when candidate is approved. Cache by sha1(voice+text) hash, serve via Fastify static at /audio/*, attach via Twilio mediaUrl. Graceful fallback to text-only if voice not configured.

**Outcome:** Voice synthesis service (agent/src/ai/voice.ts) with content-addressed cache. Approval flow sends text + voice audio to candidate. POST /voice/synthesize endpoint for testing. @fastify/static serves audio files publicly. Verified: 56KB MP3 generated and served at http://localhost:3001/audio/audio_7ea8c100ab8d5427.mp3. 20/20 non-AI tests pass. ADR-13 documents local storage architecture.

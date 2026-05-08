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

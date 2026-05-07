# Prompt History

> Log of major prompts and decisions during development. Append to the bottom — never edit history.

## Step 0 — Foundation (Date: 2026-05-07)

**Prompt:** Initialize the VaquitaAI project structure: create CLAUDE.md, README.md, ROADMAP.md, ARCHITECTURE.md, DECISIONS.md, PROMPT_HISTORY.md, .gitignore, .env.example, and the empty `contracts/`, `web/`, `agent/`, and `docs/` folders. No actual code yet — only foundation.

**Outcome:** Project skeleton created. Ready for Step 1 (Foundry setup + smart contracts).

## Step 1 — Foundry setup + MockMXNB + IRiskOracle (Date: 2026-05-07)

**Prompt:** Initialize Foundry inside `contracts/`, install OpenZeppelin v5, configure foundry.toml + remappings, create `MockMXNB.sol` (6-decimal mock matching real MXNB) and `IRiskOracle.sol` interface, write first Foundry tests.

**Outcome:** Foundry initialized, OZ v5 installed. MockMXNB and IRiskOracle compile cleanly. 7 tests pass on `forge test`. One bug found and fixed during testing: first-time faucet callers (lastFaucetClaim == 0) must be exempt from the cooldown check — otherwise the very first call reverts because block.timestamp starts at 1 in Foundry but FAUCET_COOLDOWN is 86400. Ready for Step 2 (Vaquita.sol core logic).

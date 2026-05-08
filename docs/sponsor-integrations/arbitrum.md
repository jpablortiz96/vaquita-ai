# Arbitrum Integration

VaquitaAI is built on Arbitrum to make rotating savings groups practical for LATAM users. At Arbitrum One's typical fees, an entire 4-member vaquita cycle (4 contributions + 1 settlement) costs less than $0.01 USD — making sub-$10 contributions economically viable for the first time.

## Why Arbitrum

- **Fees**: Cycle settlement averages ~85K gas. At 0.1 gwei (typical Arbitrum One pricing), that's roughly $0.0002 per settlement. Members can afford to participate in vaquitas with $5 monthly contributions without losing their gains to fees.
- **MXNB native**: MXNB lives natively on Arbitrum. No bridging needed for users — they receive MXN, mint MXNB via Bitso, and the entire economic flow happens on one chain.
- **Speed**: Sub-second confirmations let the WhatsApp bot give users feedback immediately after they confirm a contribution.
- **EVM compatibility**: We can use Foundry, OpenZeppelin v5, and the entire Solidity tooling ecosystem without modification.

## Deployments — Arbitrum Sepolia (testnet)

| Contract | Address | Arbiscan |
|---|---|---|
| MockMXNB (mMXNB) | `0xBA717164E68625e5e9E9C5Cd380c38ecFACf481c` | [view](https://sepolia.arbiscan.io/address/0xBA717164E68625e5e9E9C5Cd380c38ecFACf481c) |
| Vaquita (implementation) | `0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717` | [view](https://sepolia.arbiscan.io/address/0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717) |
| VaquitaFactory | `0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E` | [view](https://sepolia.arbiscan.io/address/0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E) |
| Genesis Vaquita | `0xb40c602AEb5Cd1be2DfCBE330DF31bFD10d996Fe` | [view](https://sepolia.arbiscan.io/address/0xb40c602AEb5Cd1be2DfCBE330DF31bFD10d996Fe) |

All contracts are verified on Arbiscan; their full source code is publicly readable.

## Gas Characteristics

| Operation | Gas (avg) | Cost @ 0.1 gwei (Arbitrum One) |
|---|---|---|
| Deploy implementation (one-time) | ~1.5M | ~$0.04 |
| Deploy factory (one-time) | ~700K | ~$0.02 |
| Create new vaquita (clone) | ~306K | ~$0.008 |
| Member joins (incl. collateral transfer) | ~120K | ~$0.003 |
| Contribute to a cycle | ~70K | ~$0.0017 |
| Settle a cycle (permissionless) | ~85K | ~$0.002 |

The factory pattern (EIP-1167 clones) cuts per-vaquita deployment cost from ~$0.04 to ~$0.008 — a 4.9× reduction. With 1,000 active vaquitas, this is a savings of $32 in pure gas alone, while keeping every clone fully isolated and securely initialized.

## Mainnet Plan

For the final demo on June 6, the same three contracts will be deployed to Arbitrum One. The Vaquita contracts have no admin keys, no proxy upgrade paths, and no privileged ops — once deployed, the factory is fully autonomous. The MockMXNB will NOT be deployed to mainnet; the production token will use the real MXNB at `0xF197FFC28c23E0309B5559e7a166f2c6164C80aA`.

## Screenshots

(To be added — see docs/screenshots/arbitrum/)

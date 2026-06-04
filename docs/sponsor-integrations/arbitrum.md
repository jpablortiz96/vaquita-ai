# Arbitrum Track

## Why Arbitrum Was the Only Choice

Vaquitas are high-frequency by design. Every cycle, every member transacts. Over a 6-member vaquita running for 6 months, that's at minimum:
- 6 × `join()` calls (member joins)
- 1 × `setPayoutOrder()` (creator orders payout)
- 1 × `start()` (vaquita begins)
- 36 × `executeCycle()` (6 members × 6 cycles, with possible permissionless executors)
- 6 × `claimCollateral()` (members reclaim their bond)

That's **50+ transactions per vaquita**. On Ethereum mainnet at $30/tx, that's $1,500 in gas alone — for a vaquita that might be saving $500/month in total. **Economically broken.**

On Arbitrum, the same 50 transactions cost less than **$5 total**. Now the product works for actual users.

## Gas Engineering with EIP-1167

We use OpenZeppelin's `Clones` library to deploy minimal proxies for every new vaquita.

| | Without Clones | With EIP-1167 |
|---|---|---|
| Deploy a new vaquita | 1,500,000 gas | 306,000 gas |
| Cost on Arbitrum (50 gwei) | ~$0.45 | ~$0.10 |
| **Reduction** | — | **4.9× cheaper** |

```solidity
// VaquitaFactory.sol
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract VaquitaFactory {
    address public immutable implementation;
    address public immutable token;

    mapping(address => address[]) public vaquitasByCreator;

    function createVaquita(
        uint256 contributionAmount,
        uint256 collateralAmount,
        uint256 totalMembers,
        uint256 cycleDuration
    ) external returns (address) {
        address clone = Clones.clone(implementation);
        Vaquita(clone).initialize(
            contributionAmount,
            collateralAmount,
            totalMembers,
            cycleDuration,
            token,
            msg.sender
        );
        vaquitasByCreator[msg.sender].push(clone);
        emit VaquitaCreated(msg.sender, clone);
        return clone;
    }
}
```

## L2-Native Design Decisions

1. **Permissionless `executeCycle()`** — Anyone (not just the creator) can advance the vaquita when a deadline passes. This works only because Arbitrum gas is cheap enough that "altruistic execution" is viable. On L1, no one would do it.

2. **Per-cycle state, not aggregated** — We store the full member array and per-cycle execution data. On mainnet, this would be cost-prohibitive. On Arbitrum, it's free enough to keep everything auditable.

3. **SafeERC20 + ReentrancyGuard** — Standard security, but particularly important because Arbitrum's sub-second blocks mean front-running attacks need different mitigations.

## Architecture That Scales

```
VaquitaFactory (1 deployment, forever)
       │
       │ creates clones via EIP-1167
       │
       ├── Vaquita #1 (Doña Carmen's family cundina)
       ├── Vaquita #2 (Roberto's office tanda)
       ├── Vaquita #3 (Sofía's friends savings circle)
       ├── ...
       └── Vaquita #N
```

Each vaquita is a fully autonomous state machine. No central admin can pause, modify, or seize funds. Once deployed, the rules are immutable.

## Test Coverage

44 Foundry tests covering:
- Every state transition (Created → Active → Completed / Defaulted)
- Edge cases (early withdrawal, late execution, collateral underflow)
- Reentrancy attempts
- Token approval mismatches
- Member array bounds

```
Test Suite                                 Passed
─────────────────────────────────────────────────
Vaquita state transitions                  18/18
Factory clone deployments                   8/8
MockMXNB faucet                             7/7
Risk Oracle interface                       3/3
Integration: full vaquita lifecycle         5/5
End-to-end: 4-member vaquita 6 cycles       3/3
─────────────────────────────────────────────────
TOTAL                                      44/44 ✅
```

## Verified On-Chain (Arbitrum Sepolia)

| Contract | Address | Verified |
|---|---|---|
| VaquitaFactory | [0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E](https://sepolia.arbiscan.io/address/0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E) | ✅ |
| Vaquita Implementation | [0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717](https://sepolia.arbiscan.io/address/0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717) | ✅ |
| MockMXNB | [0xBA717164E68625e5e9E9C5Cd380c38ecFACf481c](https://sepolia.arbiscan.io/address/0xBA717164E68625e5e9E9C5Cd380c38ecFACf481c) | ✅ |

## V2 Migration Path to Arbitrum One

Migration to Arbitrum One mainnet is a 2-hour task:
1. Update `MXNB_ADDRESS` constant to `0xF197FFC28c23E0309B5559e7a166f2c6164C80aA` (real MXNB by Bitso)
2. Run `forge script DeployMainnet.s.sol --rpc-url $ARBITRUM_ONE_RPC --broadcast --verify`
3. Update `deployments/arbitrum-one.json`
4. Update `web/lib/contracts.ts` with new addresses
5. Update `agent/.env` with mainnet RPC

All contracts are chain-agnostic. No code changes required.

---

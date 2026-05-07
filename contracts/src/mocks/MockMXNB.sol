// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockMXNB
 * @notice A test token that mimics the real MXNB stablecoin on Arbitrum.
 * @dev    The real MXNB token (0xF197FFC28c23E0309B5559e7a166f2c6164C80aA on Arbitrum One)
 *         is fiat-backed and uses 6 decimals. This mock exposes the same decimals and
 *         allows the deployer (and the Vaquita team during demos) to mint freely on testnet.
 *         DO NOT use this contract on mainnet — it is for local and Sepolia testing only.
 */
contract MockMXNB is ERC20, Ownable {
    /// @notice Decimals for MXNB. The real token uses 6, so we mirror that here.
    uint8 private constant _DECIMALS = 6;

    /// @notice Maximum amount that can be minted in a single faucet call (1,000,000 MXNB).
    uint256 public constant FAUCET_LIMIT = 1_000_000 * 10 ** _DECIMALS;

    /// @notice Tracks whether an address has used the public faucet.
    mapping(address => uint256) public lastFaucetClaim;

    /// @notice Cooldown between faucet claims (24 hours).
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    error FaucetCooldownNotElapsed(uint256 nextAllowed);
    error AmountExceedsFaucetLimit(uint256 requested, uint256 maxAllowed);

    constructor(
        address initialOwner
    )
        ERC20("Mexican Peso Bitso (Mock)", "mMXNB")
        Ownable(initialOwner)
    { }

    /// @notice Returns the number of decimals for display purposes.
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @notice Owner-only mint, used for setting up tests and demos.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Public faucet — anyone can pull up to FAUCET_LIMIT once per cooldown period.
    /// @dev Useful so judges and teammates can self-serve test tokens during the demo.
    ///      First-time callers (lastFaucetClaim == 0) are exempt from the cooldown check.
    function faucet(uint256 amount) external {
        if (amount > FAUCET_LIMIT) {
            revert AmountExceedsFaucetLimit(amount, FAUCET_LIMIT);
        }
        uint256 lastClaim = lastFaucetClaim[msg.sender];
        if (lastClaim != 0) {
            uint256 nextAllowed = lastClaim + FAUCET_COOLDOWN;
            if (block.timestamp < nextAllowed) {
                revert FaucetCooldownNotElapsed(nextAllowed);
            }
        }
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, amount);
    }
}

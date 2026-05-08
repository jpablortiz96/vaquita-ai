import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { env } from "../config/env.js";

/**
 * Public read-only client for Arbitrum Sepolia.
 * Used for view calls, balance checks, log reads.
 */
export const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(env.ARBITRUM_SEPOLIA_RPC),
});

/**
 * Wallet account derived from the deployer private key.
 * In production we'd swap to per-user signers (Privy embedded wallets).
 */
export const account = privateKeyToAccount(env.DEPLOYER_PRIVATE_KEY as `0x${string}`);

/**
 * Wallet client for signing/sending transactions.
 */
export const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    transport: http(env.ARBITRUM_SEPOLIA_RPC),
    account,
});

/**
 * Convenience: returns the deployer's address.
 */
export const deployerAddress = account.address;

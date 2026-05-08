import { env } from "./config/env.js";
import { deployments } from "./config/deployments.js";
import { readService, SIGNER_ADDRESS } from "./core/vaquita-service.js";

/**
 * Boot script — verifies that the agent can:
 *   1. Load env without errors
 *   2. Read deployments
 *   3. Connect to Arbitrum Sepolia
 *   4. Read on-chain state
 *
 * This does NOT start the WhatsApp bot or HTTP server — those come in Step 4 Part 2.
 */
async function main() {
    console.log("VaquitaAI Agent — boot check");
    console.log(`Log level: ${env.LOG_LEVEL}`);
    console.log(`Network: ${deployments.network} (chain ${deployments.chainId})`);
    console.log(`Signer: ${SIGNER_ADDRESS}`);
    console.log(`Factory: ${deployments.contracts.VaquitaFactory.address}`);

    const total = await readService.getFactoryTotalVaquitas();
    console.log(`Total vaquitas created: ${total}`);

    const balance = await readService.getTokenBalance(SIGNER_ADDRESS);
    console.log(`Signer balance: ${readService.formatTokenAmount(balance)} mMXNB`);

    console.log("Agent boot OK");
}

main().catch((err) => {
    console.error("Agent boot failed:", err);
    process.exit(1);
});

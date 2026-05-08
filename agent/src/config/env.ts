import "dotenv/config";
import { z } from "zod";

/**
 * Strongly-typed environment configuration for the agent.
 * Variables are loaded from the project-root .env (D:/vaquita-ai/.env)
 * because dotenv looks up the directory tree by default.
 */
const envSchema = z.object({
    // Anthropic
    ANTHROPIC_API_KEY: z.string().min(20, "ANTHROPIC_API_KEY required"),

    // Onchain — Arbitrum Sepolia
    ARBITRUM_SEPOLIA_RPC: z.string().url(),
    ARBISCAN_API_KEY: z.string().optional(),
    DEPLOYER_PRIVATE_KEY: z
        .string()
        .regex(/^(0x)?[0-9a-fA-F]{64}$/, "Invalid private key")
        .transform((k) => (k.startsWith("0x") ? k : (`0x${k}` as `0x${string}`))),

    // Optional: only required when running on-chain tests
    RUN_ONCHAIN_TESTS: z.enum(["true", "false"]).optional().default("false"),

    // Logging
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Environment validation failed");
}

export const env = parsed.data;
export type Env = typeof env;

import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from repo root, regardless of where the agent is invoked from.
dotenvConfig({ path: join(__dirname, "../../../.env") });

const envSchema = z.object({
    // Anthropic
    ANTHROPIC_API_KEY: z.string().min(20, "ANTHROPIC_API_KEY required"),

    // Onchain — Arbitrum Sepolia
    ARBITRUM_SEPOLIA_RPC: z.string().url(),
    ARBISCAN_API_KEY: z.string().optional(),
    DEPLOYER_PRIVATE_KEY: z
        .string()
        .regex(/^(0x)?[0-9a-fA-F]{64}$/, "Invalid private key")
        .transform((k) => (k.startsWith("0x") ? k : `0x${k}`)),

    // Twilio (WhatsApp)
    TWILIO_ACCOUNT_SID: z.string().regex(/^AC[a-f0-9]{32}$/, "Invalid Twilio Account SID").optional(),
    TWILIO_AUTH_TOKEN: z.string().min(20, "TWILIO_AUTH_TOKEN required for bot").optional(),
    TWILIO_WHATSAPP_FROM: z.string().startsWith("whatsapp:+", "Format: whatsapp:+1234567890").optional(),

    // HTTP server
    PORT: z.coerce.number().int().positive().default(3001),
    HOST: z.string().default("0.0.0.0"),
    PUBLIC_URL: z.string().url().optional(),

    // Logging
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info"),

    // Test toggles
    RUN_ONCHAIN_TESTS: z.enum(["true", "false"]).optional().default("false"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Environment validation failed");
}

export const env = parsed.data;
export type Env = typeof env;

/** True when all Twilio bot variables are configured. */
export function isBotConfigured(): boolean {
    return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM);
}

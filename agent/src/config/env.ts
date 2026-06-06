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

    // ElevenLabs (voice notifications) — optional
    ELEVENLABS_API_KEY: z.string().min(10, "ELEVENLABS_API_KEY required for voice").optional(),
    ELEVENLABS_VOICE_ID_ES: z.string().min(10, "ELEVENLABS_VOICE_ID_ES required for voice").optional(),

    // Bitso Business API — optional
    BITSO_API_KEY: z.string().min(10, "BITSO_API_KEY required for Bitso integration").optional(),
    BITSO_API_SECRET: z.string().min(10, "BITSO_API_SECRET required for Bitso integration").optional(),
    BITSO_API_BASE_URL: z.string().url().default("https://api-sandbox.bitso.com/api/v3"),

    // HTTP server
    PORT: z.coerce.number().int().positive().default(3001),
    HOST: z.string().default("0.0.0.0"),
    PUBLIC_URL: z.string().url().optional(),

    // CORS — who may call this API from a browser. Comma-separated list of origins.
    // FRONTEND_URL is the canonical Vercel deployment; ALLOWED_ORIGINS adds extras.
    FRONTEND_URL: z.string().url().optional(),
    ALLOWED_ORIGINS: z.string().optional(),

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

/** True when ElevenLabs voice is configured. */
export function isVoiceConfigured(): boolean {
    return Boolean(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID_ES);
}

/** True when Bitso Business API is configured. */
export function isBitsoConfigured(): boolean {
    return Boolean(env.BITSO_API_KEY && env.BITSO_API_SECRET);
}

/**
 * Browser origins allowed to call this API via CORS. Always includes local dev
 * ports; adds FRONTEND_URL (Vercel) and any extra ALLOWED_ORIGINS (comma-separated).
 */
export function allowedOrigins(): string[] {
    const dev = ["http://localhost:3002", "http://localhost:3000"];
    const extra = (env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    const list = [...dev, ...extra];
    if (env.FRONTEND_URL) list.push(env.FRONTEND_URL);
    return [...new Set(list)];
}

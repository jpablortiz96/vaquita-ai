import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createHash } from "node:crypto";
import { writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { env, isVoiceConfigured } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Directory where generated .mp3 files are cached.
 * agent/src/ai/voice.ts → ../../audio/
 */
const AUDIO_DIR = join(__dirname, "../../audio");

let cachedClient: ElevenLabsClient | null = null;

function getClient(): ElevenLabsClient {
    if (!isVoiceConfigured()) {
        throw new Error("ElevenLabs not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID_ES.");
    }
    if (cachedClient) return cachedClient;
    cachedClient = new ElevenLabsClient({
        apiKey: env.ELEVENLABS_API_KEY!,
    });
    return cachedClient;
}

/**
 * Returns a deterministic filename for a given text + voice combination.
 * Two identical (text, voice) calls produce the same filename, enabling cache reuse.
 */
function fileNameFor(text: string, voiceId: string): string {
    const hash = createHash("sha1")
        .update(`${voiceId}|${text}`)
        .digest("hex")
        .slice(0, 16);
    return `audio_${hash}.mp3`;
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generates (or fetches from cache) an MP3 of the given text spoken in Spanish.
 * Returns the absolute path on disk and the filename (used by the public endpoint).
 *
 * @throws Error if voice is not configured. Callers should fall back to text-only.
 */
export async function synthesizeSpanish(text: string): Promise<{ path: string; filename: string }> {
    if (!isVoiceConfigured()) {
        throw new Error("Voice synthesis not configured");
    }

    const voiceId = env.ELEVENLABS_VOICE_ID_ES!;
    const filename = fileNameFor(text, voiceId);

    await mkdir(AUDIO_DIR, { recursive: true });
    const fullPath = join(AUDIO_DIR, filename);

    if (await fileExists(fullPath)) {
        console.log(`[VOICE] cache hit: ${filename}`);
        return { path: fullPath, filename };
    }

    console.log(`[VOICE] synthesizing ${text.length} chars for voice=${voiceId}`);
    const client = getClient();

    // ElevenLabs returns a readable stream — collect to Buffer and write to disk.
    const audio = await client.textToSpeech.convert(voiceId, {
        text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
    }
    const buffer = Buffer.concat(chunks);

    await writeFile(fullPath, buffer);
    console.log(`[VOICE] saved ${filename} (${buffer.length} bytes)`);
    return { path: fullPath, filename };
}

/**
 * Returns the public URL where the audio file can be downloaded by Twilio.
 * Returns null if PUBLIC_URL is not configured — caller should skip voice sending.
 */
export function audioPublicUrl(filename: string): string | null {
    if (!env.PUBLIC_URL) {
        console.warn("[VOICE] PUBLIC_URL is not set — voice messages cannot be delivered. Set PUBLIC_URL in .env (e.g. https://your-ngrok.ngrok-free.dev)");
        return null;
    }
    // Twilio rejects URLs that contain localhost or 127.0.0.1, must be a real public URL.
    if (env.PUBLIC_URL.includes("localhost") || env.PUBLIC_URL.includes("127.0.0.1")) {
        console.warn(`[VOICE] PUBLIC_URL appears to be localhost: ${env.PUBLIC_URL} — Twilio cannot download from here.`);
        return null;
    }
    return `${env.PUBLIC_URL}/audio/${filename}`;
}

export const AUDIO_DIRECTORY = AUDIO_DIR;

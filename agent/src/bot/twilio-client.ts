import twilio from "twilio";
import { env, isBotConfigured } from "../config/env.js";

let cachedClient: ReturnType<typeof twilio> | null = null;

export function getTwilioClient(): ReturnType<typeof twilio> {
    if (!isBotConfigured()) {
        throw new Error("Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.");
    }
    if (cachedClient) return cachedClient;
    cachedClient = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
    return cachedClient;
}

export async function sendWhatsApp(args: { to: string; body: string }): Promise<string> {
    const client = getTwilioClient();
    // Twilio's `to` for WhatsApp must be prefixed with "whatsapp:"
    const to = args.to.startsWith("whatsapp:") ? args.to : `whatsapp:${args.to}`;
    const message = await client.messages.create({
        from: env.TWILIO_WHATSAPP_FROM!,
        to,
        body: args.body,
    });
    return message.sid;
}

/** Validates a Twilio webhook signature so we know it's really Twilio calling us. */
export function validateTwilioSignature(args: {
    signature: string | undefined;
    url: string;
    params: Record<string, string>;
}): boolean {
    if (!env.TWILIO_AUTH_TOKEN) return false;
    if (!args.signature) return false;
    return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, args.signature, args.url, args.params);
}

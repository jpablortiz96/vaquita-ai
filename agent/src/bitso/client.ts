import { createHmac } from "node:crypto";
import { env, isBitsoConfigured } from "../config/env.js";
import type { BitsoResponse } from "./types.js";

/**
 * Low-level HTTP client for the Bitso Business Trading API.
 *
 * Implements HMAC SHA256 request signing per https://docs.bitso.com/bitso-api/docs/general-concepts
 *
 * Signature format:
 *   nonce + http_method + request_path + json_body
 *
 * The signature is sent in the Authorization header as:
 *   Bitso <api_key>:<nonce>:<signature>
 */
export class BitsoClient {
    private readonly baseUrl: string;
    private readonly apiKey: string | undefined;
    private readonly apiSecret: string | undefined;

    constructor() {
        this.baseUrl = env.BITSO_API_BASE_URL;
        this.apiKey = env.BITSO_API_KEY;
        this.apiSecret = env.BITSO_API_SECRET;
    }

    isConfigured(): boolean {
        return isBitsoConfigured();
    }

    /** Public GET — no authentication required. Used for market data. */
    async publicGet<T>(path: string, query?: Record<string, string>): Promise<T> {
        const url = new URL(`${this.baseUrl}${path}`);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                url.searchParams.set(k, v);
            }
        }
        console.log(`[BITSO] GET ${url.toString()}`);
        const res = await fetch(url.toString(), {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = (await res.json()) as BitsoResponse<T>;
        if (!data.success) {
            throw new Error(`Bitso public GET failed: ${data.error?.message ?? "unknown"}`);
        }
        return data.payload;
    }

    /** Private GET — HMAC-signed. Used for account-specific data. */
    async privateGet<T>(path: string): Promise<T> {
        if (!this.apiKey || !this.apiSecret) {
            throw new Error("Bitso credentials not configured");
        }
        const nonce = Date.now().toString();
        const message = `${nonce}GET${path}`;
        const signature = createHmac("sha256", this.apiSecret).update(message).digest("hex");
        const auth = `Bitso ${this.apiKey}:${nonce}:${signature}`;

        console.log(`[BITSO] GET (signed) ${path}`);
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: auth },
        });
        const data = (await res.json()) as BitsoResponse<T>;
        if (!data.success) {
            throw new Error(`Bitso private GET failed: ${data.error?.message ?? "unknown"}`);
        }
        return data.payload;
    }

    /** Private POST — HMAC-signed with JSON body in signature. */
    async privatePost<T>(path: string, body: Record<string, unknown>): Promise<T> {
        if (!this.apiKey || !this.apiSecret) {
            throw new Error("Bitso credentials not configured");
        }
        const nonce = Date.now().toString();
        const jsonBody = JSON.stringify(body);
        const message = `${nonce}POST${path}${jsonBody}`;
        const signature = createHmac("sha256", this.apiSecret).update(message).digest("hex");
        const auth = `Bitso ${this.apiKey}:${nonce}:${signature}`;

        console.log(`[BITSO] POST (signed) ${path}`);
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: auth },
            body: jsonBody,
        });
        const data = (await res.json()) as BitsoResponse<T>;
        if (!data.success) {
            throw new Error(`Bitso private POST failed: ${data.error?.message ?? "unknown"}`);
        }
        return data.payload;
    }
}

let cachedClient: BitsoClient | null = null;

export function getBitsoClient(): BitsoClient {
    if (cachedClient) return cachedClient;
    cachedClient = new BitsoClient();
    return cachedClient;
}

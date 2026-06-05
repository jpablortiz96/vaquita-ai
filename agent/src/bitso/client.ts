import { createHmac } from "node:crypto";
import { env, isBitsoConfigured } from "../config/env.js";
import type { BitsoResponse } from "./types.js";

/**
 * SAFETY GUARD: When pointing to production Bitso (api.bitso.com without -sandbox),
 * physically block any HTTP method that is not GET. This is defense-in-depth on top
 * of using a read-only API key.
 *
 * The user's API key SHOULD be read-only, but this code-level guard ensures that
 * even if a future code change accidentally adds a POST/PUT/DELETE, the request
 * will throw before reaching Bitso's servers.
 */
function assertReadOnlyOnProduction(method: string, baseUrl: string): void {
    const isProduction = baseUrl.includes("api.bitso.com") && !baseUrl.includes("-sandbox");
    if (!isProduction) return;
    const upperMethod = method.toUpperCase();
    if (upperMethod !== "GET") {
        throw new Error(
            `[BITSO SAFETY] Blocked ${upperMethod} request to production Bitso (${baseUrl}). ` +
                `Only GET is allowed when pointing to api.bitso.com. ` +
                `If you need write operations, switch to sandbox (BITSO_API_BASE_URL=https://api-sandbox.bitso.com/api/v3).`,
        );
    }
}

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
        assertReadOnlyOnProduction("GET", this.baseUrl);
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

    /**
     * The Bitso HMAC signature is computed over the FULL request path, including
     * the `/api/v3` version prefix and any query string — e.g.
     * `/api/v3/account_status`, not just `/account_status`. baseUrl already carries
     * the prefix, so we derive the path from the full URL's pathname + search.
     */
    private signedPath(path: string): string {
        const u = new URL(`${this.baseUrl}${path}`);
        return u.pathname + u.search;
    }

    /** Private GET — HMAC-signed. Used for account-specific data. */
    async privateGet<T>(path: string): Promise<T> {
        assertReadOnlyOnProduction("GET", this.baseUrl);
        if (!this.apiKey || !this.apiSecret) {
            throw new Error("Bitso credentials not configured");
        }
        const nonce = Date.now().toString();
        const message = `${nonce}GET${this.signedPath(path)}`;
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
        assertReadOnlyOnProduction("POST", this.baseUrl);
        if (!this.apiKey || !this.apiSecret) {
            throw new Error("Bitso credentials not configured");
        }
        const nonce = Date.now().toString();
        const jsonBody = JSON.stringify(body);
        const message = `${nonce}POST${this.signedPath(path)}${jsonBody}`;
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

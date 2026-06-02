import { getBitsoClient } from "./client.js";
import type { BitsoAccountStatus, BitsoBalancesResponse, BitsoBalance } from "./types.js";

/** Get the authenticated account status. */
export async function getAccountStatus(): Promise<BitsoAccountStatus> {
    const client = getBitsoClient();
    return client.privateGet<BitsoAccountStatus>("/account_status");
}

/** Get balances for all currencies in the account. */
export async function getBalances(): Promise<BitsoBalance[]> {
    const client = getBitsoClient();
    const result = await client.privateGet<BitsoBalancesResponse>("/balance");
    return result.balances;
}

/** Get balance for a specific currency (e.g. "mxn", "mxnb", "btc"). Returns null if not held. */
export async function getBalance(currency: string): Promise<BitsoBalance | null> {
    const all = await getBalances();
    return all.find((b) => b.currency.toLowerCase() === currency.toLowerCase()) ?? null;
}

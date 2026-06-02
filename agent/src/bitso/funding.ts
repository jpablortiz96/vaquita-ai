import { getBitsoClient } from "./client.js";

/** Get funding destinations available for this account (e.g. SPEI bank details for deposits). */
export async function getFundingDestinations(): Promise<
    Array<{ method: string; account_identifier: string; account_identifier_name: string }>
> {
    const client = getBitsoClient();
    const result = await client.privateGet<{
        funding_destinations: Array<{ method: string; account_identifier: string; account_identifier_name: string }>;
    }>("/funding_destinations");
    return result.funding_destinations;
}

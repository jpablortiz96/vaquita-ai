import { getBitsoClient } from "./client.js";
import type { BitsoTicker, BitsoOrderBook } from "./types.js";

/**
 * Get ticker for a trading pair. Examples of valid books:
 *   - mxnb_mxn  → MXNB / MXN
 *   - btc_mxn   → BTC / MXN
 */
export async function getTicker(book: string): Promise<BitsoTicker> {
    const client = getBitsoClient();
    const result = await client.publicGet<{ book: string } & BitsoTicker>(`/ticker`, { book });
    return result as BitsoTicker;
}

/** Get order book for a trading pair. */
export async function getOrderBook(book: string): Promise<BitsoOrderBook> {
    const client = getBitsoClient();
    return client.publicGet<BitsoOrderBook>(`/order_book`, { book });
}

/** List available trading pairs in this Bitso account. */
export async function getAvailableBooks(): Promise<Array<{ book: string; minimum_amount: string; maximum_amount: string }>> {
    const client = getBitsoClient();
    const result = await client.publicGet<{ books: Array<{ book: string; minimum_amount: string; maximum_amount: string }> }>("/available_books");
    return result.books;
}

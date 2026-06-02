export interface BitsoResponse<T> {
    success: boolean;
    payload: T;
    error?: {
        code: number;
        message: string;
    };
}

export interface BitsoAccountStatus {
    client_id: string;
    status: string;
    cellphone_number: string | null;
    daily_limit: string;
    monthly_limit: string;
    daily_remaining: string;
    monthly_remaining: string;
}

export interface BitsoBalance {
    currency: string;
    available: string;
    locked: string;
    total: string;
    pending_deposit: string;
    pending_withdrawal: string;
}

export interface BitsoBalancesResponse {
    balances: BitsoBalance[];
}

export interface BitsoTicker {
    book: string;
    volume: string;
    high: string;
    last: string;
    low: string;
    vwap: string;
    ask: string;
    bid: string;
    change_24: string;
    created_at: string;
}

export interface BitsoOrderBookEntry {
    book: string;
    price: string;
    amount: string;
    oid?: string;
}

export interface BitsoOrderBook {
    bids: BitsoOrderBookEntry[];
    asks: BitsoOrderBookEntry[];
    updated_at: string;
    sequence: string;
}

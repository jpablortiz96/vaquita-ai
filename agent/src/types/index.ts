import type { Address, Hash } from "viem";

export type { Address, Hash };

/** On-chain enum mirror of Vaquita.Status */
export enum VaquitaStatus {
    Created = 0,
    Active = 1,
    Completed = 2,
    Defaulted = 3,
}

export interface VaquitaConfig {
    contributionAmount: bigint;
    collateralAmount: bigint;
    totalMembers: number;
    cycleDuration: bigint;
}

export interface VaquitaState {
    address: Address;
    status: VaquitaStatus;
    creator: Address;
    config: VaquitaConfig;
    members: Address[];
    currentCycle: number;
    currentRecipient: Address | null;
    cycleDeadline: bigint;
}

/** Input data for risk scoring a candidate member */
export interface RiskInput {
    address: Address;
    selfReported?: {
        name?: string;
        occupation?: string;
        monthlyIncomeMXN?: number;
        timeInCommunityMonths?: number;
    };
    references?: Address[];
    onchain?: {
        firstTxAgeDays?: number;
        totalTxCount?: number;
        currentBalanceMXNB?: bigint;
    };
}

/** Output from the risk scorer */
export interface RiskScore {
    address: Address;
    score: number; // 0-100, higher = lower risk
    rationale: string;
    redFlags: string[];
    suggestedPayoutPosition: "early" | "middle" | "late";
}

/** Suggested payout order with reasoning */
export interface PayoutOrderSuggestion {
    order: Address[];
    reasoning: string;
}

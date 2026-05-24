import { randomBytes } from "node:crypto";
import type { Address } from "viem";

/**
 * Invitation tokens map a short code to the vaquita + creator that issued it.
 * In-memory store for V1. V2 = Supabase.
 */
export interface Invitation {
    code: string;
    vaquitaAddress: Address;
    creatorPhone: string;
    createdAt: number;
}

/**
 * Pending approvals represent a candidate who finished the join interview and
 * is waiting for the creator to approve or reject.
 */
export interface PendingApproval {
    candidatePhone: string;
    candidateName: string;
    candidateData: {
        name: string;
        occupation: string;
        monthlyIncomeMXN: number;
        timeInCommunityMonths: number;
    };
    vaquitaAddress: Address;
    creatorPhone: string;
    score: number;
    rationale: string;
    redFlags: string[];
    suggestedPosition: "early" | "middle" | "late";
    createdAt: number;
}

const invitations = new Map<string, Invitation>();
const pendingApprovals = new Map<string, PendingApproval>();

/** Generate a short, friendly invite code (8 chars, lowercase alphanumeric). */
export function generateInviteCode(): string {
    const bytes = randomBytes(6);
    return bytes
        .toString("base64")
        .replace(/[+/=]/g, "")
        .slice(0, 8)
        .toLowerCase();
}

export function createInvitation(args: { vaquitaAddress: Address; creatorPhone: string }): Invitation {
    let code = generateInviteCode();
    while (invitations.has(code)) {
        code = generateInviteCode();
    }
    const invitation: Invitation = {
        code,
        vaquitaAddress: args.vaquitaAddress,
        creatorPhone: args.creatorPhone,
        createdAt: Date.now(),
    };
    invitations.set(code, invitation);
    return invitation;
}

export function getInvitation(code: string): Invitation | null {
    return invitations.get(code.toLowerCase()) ?? null;
}

export function listInvitationsByCreator(creatorPhone: string): Invitation[] {
    return [...invitations.values()].filter((i) => i.creatorPhone === creatorPhone);
}

// ─── Pending approvals ──────────────────────────────────────────────

export function addPendingApproval(approval: PendingApproval): void {
    pendingApprovals.set(approval.candidatePhone, approval);
}

export function getPendingApproval(candidatePhone: string): PendingApproval | null {
    return pendingApprovals.get(candidatePhone) ?? null;
}

export function findPendingApprovalsForCreator(creatorPhone: string): PendingApproval[] {
    return [...pendingApprovals.values()].filter((a) => a.creatorPhone === creatorPhone);
}

export function removePendingApproval(candidatePhone: string): void {
    pendingApprovals.delete(candidatePhone);
}

export function _clearAllInvitations(): void {
    invitations.clear();
    pendingApprovals.clear();
}

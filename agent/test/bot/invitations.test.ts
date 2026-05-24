import { describe, it, expect, beforeEach } from "vitest";
import {
    _clearAllInvitations,
    createInvitation,
    getInvitation,
    listInvitationsByCreator,
    generateInviteCode,
    addPendingApproval,
    getPendingApproval,
    findPendingApprovalsForCreator,
    removePendingApproval,
} from "../../src/bot/invitations.js";
import type { Address } from "viem";

describe("invitations store", () => {
    beforeEach(() => _clearAllInvitations());

    it("generates lowercase alphanumeric codes of length 8", () => {
        const code = generateInviteCode();
        expect(code).toMatch(/^[a-z0-9]{8}$/);
    });

    it("creates and retrieves an invitation", () => {
        const inv = createInvitation({
            vaquitaAddress: "0x1234567890123456789012345678901234567890" as Address,
            creatorPhone: "+5215512345678",
        });
        expect(getInvitation(inv.code)).toEqual(inv);
        expect(getInvitation(inv.code.toUpperCase())).toEqual(inv);
    });

    it("returns null for unknown codes", () => {
        expect(getInvitation("zzzzzzzz")).toBeNull();
    });

    it("lists invitations by creator", () => {
        createInvitation({
            vaquitaAddress: "0x1111111111111111111111111111111111111111" as Address,
            creatorPhone: "+521",
        });
        createInvitation({
            vaquitaAddress: "0x2222222222222222222222222222222222222222" as Address,
            creatorPhone: "+521",
        });
        createInvitation({
            vaquitaAddress: "0x3333333333333333333333333333333333333333" as Address,
            creatorPhone: "+522",
        });
        expect(listInvitationsByCreator("+521")).toHaveLength(2);
        expect(listInvitationsByCreator("+522")).toHaveLength(1);
    });
});

describe("pending approvals", () => {
    beforeEach(() => _clearAllInvitations());

    it("stores and retrieves pending approvals", () => {
        addPendingApproval({
            candidatePhone: "+5215511111111",
            candidateName: "María",
            candidateData: { name: "María", occupation: "maestra", monthlyIncomeMXN: 15000, timeInCommunityMonths: 12 },
            vaquitaAddress: "0xaaaa000000000000000000000000000000000000" as Address,
            creatorPhone: "+5215522222222",
            score: 72,
            rationale: "buena",
            redFlags: [],
            suggestedPosition: "middle",
            createdAt: Date.now(),
        });
        expect(getPendingApproval("+5215511111111")?.candidateName).toBe("María");
        expect(findPendingApprovalsForCreator("+5215522222222")).toHaveLength(1);
    });

    it("removes pending approvals", () => {
        addPendingApproval({
            candidatePhone: "+521",
            candidateName: "X",
            candidateData: { name: "X", occupation: "y", monthlyIncomeMXN: 0, timeInCommunityMonths: 0 },
            vaquitaAddress: "0xaaaa000000000000000000000000000000000000" as Address,
            creatorPhone: "+522",
            score: 50,
            rationale: "ok",
            redFlags: [],
            suggestedPosition: "middle",
            createdAt: Date.now(),
        });
        removePendingApproval("+521");
        expect(getPendingApproval("+521")).toBeNull();
    });
});

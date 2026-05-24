import type { Address } from "viem";
import { classifyIntent } from "./intent-classifier.js";
import { getOrCreateSession, setState, resetSession } from "./sessions.js";
import { MESSAGES } from "./messages.js";
import { writeService, readService, SIGNER_ADDRESS } from "../core/vaquita-service.js";
import { deployments } from "../config/deployments.js";
import { vaquitaFactoryAbi } from "../chain/abis.js";
import { publicClient } from "../chain/client.js";
import { scoreMember } from "../ai/risk-scorer.js";
import {
    createInvitation,
    getInvitation,
    addPendingApproval,
    getPendingApproval,
    removePendingApproval,
    findPendingApprovalsForCreator,
    type PendingApproval,
} from "./invitations.js";
import type { CreateStep, JoinStep, CreateVaquitaInput, JoinInput } from "./types.js";

/**
 * The bot may need to push messages to a user OTHER than the one who triggered
 * the current message (e.g. notifying the creator about a new join request).
 * The server passes in this sender so engine.ts stays free of Twilio coupling.
 */
export type OutboundSender = (args: { toPhone: string; body: string }) => Promise<void>;

export async function handleMessage(args: {
    phone: string;
    body: string;
    sendToOther?: OutboundSender;
}): Promise<string[]> {
    const { phone, body, sendToOther } = args;
    const text = body.trim();

    if (/^(cancelar|cancel|salir|atr[aá]s|reset)$/i.test(text)) {
        resetSession(phone);
        return [MESSAGES.cancelled];
    }

    const session = getOrCreateSession(phone);

    if (session.state.kind === "creating_vaquita") {
        return handleCreateFlow(phone, text, session.state.step, session.state.partial);
    }
    if (session.state.kind === "joining_vaquita") {
        return handleJoinFlow({
            phone,
            text,
            step: session.state.step,
            partial: session.state.partial,
            vaquitaAddress: session.state.vaquitaAddress,
            creatorPhone: session.state.creatorPhone,
            inviteCode: session.state.inviteCode,
            sendToOther,
        });
    }

    const intent = await classifyIntent(text);

    switch (intent.kind) {
        case "greeting":
            return [MESSAGES.greeting];

        case "help":
            return [MESSAGES.help];

        case "create_vaquita":
            return startCreateFlow(phone, intent.partial);

        case "invite_to_vaquita":
            return startInviteFlow(phone);

        case "join_vaquita":
            return startJoinFlow(phone, intent.code);

        case "list_my_vaquitas":
            return listVaquitas();

        case "view_vaquita":
            if (intent.address) return viewVaquita(intent.address);
            return [MESSAGES.help];

        case "confirm":
            return handleConfirmIntent(phone, sendToOther);

        case "deny":
            return handleDenyIntent(phone, sendToOther);

        case "cancel":
            resetSession(phone);
            return [MESSAGES.cancelled];

        case "unknown":
        default:
            return [MESSAGES.unknown];
    }
}

// ─── Create flow ─────────────────────────────────────────────────────

function startCreateFlow(phone: string, partial: Partial<CreateVaquitaInput>): string[] {
    return advanceCreateFlow(phone, partial);
}

function advanceCreateFlow(phone: string, partial: Partial<CreateVaquitaInput>): string[] {
    if (partial.contributionMXN === undefined) {
        setState(phone, { kind: "creating_vaquita", step: "ask_amount", partial });
        return [MESSAGES.askAmount];
    }
    if (partial.totalMembers === undefined) {
        setState(phone, { kind: "creating_vaquita", step: "ask_members", partial });
        return [MESSAGES.askMembers];
    }
    if (partial.cycleDays === undefined) {
        setState(phone, { kind: "creating_vaquita", step: "ask_cycle", partial });
        return [MESSAGES.askCycle];
    }
    if (partial.collateralMXN === undefined) {
        setState(phone, { kind: "creating_vaquita", step: "ask_collateral", partial });
        return [MESSAGES.askCollateral(partial.contributionMXN)];
    }
    setState(phone, { kind: "creating_vaquita", step: "confirm", partial });
    return [MESSAGES.confirmation(partial as CreateVaquitaInput)];
}

async function handleCreateFlow(
    phone: string,
    text: string,
    step: CreateStep,
    partial: Partial<CreateVaquitaInput>,
): Promise<string[]> {
    if (step === "confirm") {
        if (/^(s[ií]|dale|ok|confirmo|sip|claro)/i.test(text)) {
            return performCreation(phone, partial as CreateVaquitaInput);
        }
        if (/^(no|cancelar|mejor no)/i.test(text)) {
            resetSession(phone);
            return [MESSAGES.cancelled];
        }
        return [MESSAGES.confirmation(partial as CreateVaquitaInput), "Responde *sí* o *no*."];
    }

    if (step === "ask_collateral" && /^recomendado$/i.test(text) && partial.contributionMXN) {
        partial.collateralMXN = partial.contributionMXN * 3;
        return advanceCreateFlow(phone, partial);
    }

    const num = parseFloat(text.replace(/[^\d.]/g, ""));
    if (Number.isNaN(num) || num <= 0) return [MESSAGES.invalidNumber];

    switch (step) {
        case "ask_amount":
            partial.contributionMXN = num;
            break;
        case "ask_members": {
            const m = Math.floor(num);
            if (m < 2 || m > 50) return [MESSAGES.invalidMembers];
            partial.totalMembers = m;
            break;
        }
        case "ask_cycle": {
            const d = Math.floor(num);
            if (d < 1 || d > 365) return [MESSAGES.invalidDays];
            partial.cycleDays = d;
            break;
        }
        case "ask_collateral":
            partial.collateralMXN = num;
            break;
    }

    return advanceCreateFlow(phone, partial);
}

async function performCreation(phone: string, input: CreateVaquitaInput): Promise<string[]> {
    try {
        const cycleSec = input.cycleDays * 24 * 60 * 60;
        const vaquitaAddr = await writeService.createVaquita({
            contributionHuman: input.contributionMXN.toString(),
            collateralHuman: input.collateralMXN.toString(),
            totalMembers: input.totalMembers,
            cycleDurationSec: cycleSec,
        });
        resetSession(phone);
        const explorerUrl = `https://sepolia.arbiscan.io/address/${vaquitaAddr}`;
        return [MESSAGES.creating, MESSAGES.created(vaquitaAddr, explorerUrl)];
    } catch (err) {
        console.error("Failed to create vaquita on-chain:", err);
        resetSession(phone);
        return [MESSAGES.error];
    }
}

// ─── Invite flow ─────────────────────────────────────────────────────

async function startInviteFlow(creatorPhone: string): Promise<string[]> {
    try {
        const list = await publicClient.readContract({
            address: deployments.contracts.VaquitaFactory.address as Address,
            abi: vaquitaFactoryAbi,
            functionName: "getVaquitasByCreator",
            args: [SIGNER_ADDRESS as Address],
        });
        const arr = [...list] as Address[];
        if (arr.length === 0) return [MESSAGES.noVaquitaToInvite];

        // V1: always invite to the most recently created vaquita (last in array).
        const vaquitaAddress = arr[arr.length - 1]!;
        const invitation = createInvitation({ vaquitaAddress, creatorPhone });
        return [MESSAGES.inviteCreated(invitation.code, vaquitaAddress)];
    } catch (err) {
        console.error("Failed to create invitation:", err);
        return [MESSAGES.error];
    }
}

// ─── Join flow ───────────────────────────────────────────────────────

function startJoinFlow(phone: string, code?: string): string[] {
    if (!code) {
        setState(phone, {
            kind: "joining_vaquita",
            step: "ask_name",
            partial: {},
            vaquitaAddress: "0x0000000000000000000000000000000000000000" as Address,
            creatorPhone: "",
            inviteCode: "__pending__",
        });
        return [MESSAGES.askInviteCode];
    }
    return resolveInviteAndStart(phone, code);
}

function resolveInviteAndStart(phone: string, code: string): string[] {
    const invitation = getInvitation(code);
    if (!invitation) return [MESSAGES.invalidInviteCode];

    setState(phone, {
        kind: "joining_vaquita",
        step: "ask_name",
        partial: {},
        vaquitaAddress: invitation.vaquitaAddress,
        creatorPhone: invitation.creatorPhone,
        inviteCode: invitation.code,
    });
    return [MESSAGES.joinIntro(invitation.vaquitaAddress), MESSAGES.askName];
}

async function handleJoinFlow(args: {
    phone: string;
    text: string;
    step: JoinStep;
    partial: Partial<JoinInput>;
    vaquitaAddress: Address;
    creatorPhone: string;
    inviteCode: string;
    sendToOther?: OutboundSender;
}): Promise<string[]> {
    const { phone, text, step, partial, vaquitaAddress, creatorPhone, inviteCode, sendToOther } = args;

    // Still waiting for invite code
    if (inviteCode === "__pending__") {
        const cleaned = text.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleaned.length < 4) return [MESSAGES.invalidInviteCode];
        const inv = getInvitation(cleaned);
        if (!inv) return [MESSAGES.invalidInviteCode];
        setState(phone, {
            kind: "joining_vaquita",
            step: "ask_name",
            partial: {},
            vaquitaAddress: inv.vaquitaAddress,
            creatorPhone: inv.creatorPhone,
            inviteCode: inv.code,
        });
        return [MESSAGES.joinIntro(inv.vaquitaAddress), MESSAGES.askName];
    }

    switch (step) {
        case "ask_name": {
            const name = text.trim();
            if (name.length < 2) return [MESSAGES.invalidName];
            partial.name = name;
            setState(phone, { kind: "joining_vaquita", step: "ask_occupation", partial, vaquitaAddress, creatorPhone, inviteCode });
            return [MESSAGES.askOccupation];
        }
        case "ask_occupation": {
            const occ = text.trim();
            if (occ.length < 2) return [MESSAGES.invalidName];
            partial.occupation = occ;
            setState(phone, { kind: "joining_vaquita", step: "ask_income", partial, vaquitaAddress, creatorPhone, inviteCode });
            return [MESSAGES.askIncome];
        }
        case "ask_income": {
            const n = parseFloat(text.replace(/[^\d.]/g, ""));
            if (Number.isNaN(n) || n <= 0) return [MESSAGES.invalidNumber];
            partial.monthlyIncomeMXN = n;
            setState(phone, { kind: "joining_vaquita", step: "ask_relation", partial, vaquitaAddress, creatorPhone, inviteCode });
            return [MESSAGES.askRelation];
        }
        case "ask_relation": {
            const n = parseFloat(text.replace(/[^\d.]/g, ""));
            if (Number.isNaN(n) || n < 0) return [MESSAGES.invalidNumber];
            partial.timeInCommunityMonths = n;
            setState(phone, { kind: "joining_vaquita", step: "scoring", partial, vaquitaAddress, creatorPhone, inviteCode });
            scoreAndNotify({
                candidatePhone: phone,
                vaquitaAddress,
                creatorPhone,
                data: partial as JoinInput,
                sendToOther,
            }).catch((err) => console.error("Scoring failed:", err));
            return [MESSAGES.scoring, MESSAGES.awaitingApproval];
        }
        case "scoring":
            return [MESSAGES.awaitingApproval];
    }
}

async function scoreAndNotify(args: {
    candidatePhone: string;
    vaquitaAddress: Address;
    creatorPhone: string;
    data: JoinInput;
    sendToOther?: OutboundSender;
}): Promise<void> {
    const { candidatePhone, vaquitaAddress, creatorPhone, data, sendToOther } = args;

    // Derive a deterministic pseudo-address from the candidate's phone (V1 limitation).
    // This is used only as an internal key for the AI scorer — never touches a real tx.
    const pseudoAddress = `0x${Buffer.from(candidatePhone).toString("hex").padStart(40, "0").slice(0, 40)}` as Address;

    const score = await scoreMember({
        address: pseudoAddress,
        selfReported: {
            name: data.name,
            occupation: data.occupation,
            monthlyIncomeMXN: data.monthlyIncomeMXN,
            timeInCommunityMonths: data.timeInCommunityMonths,
        },
    });

    addPendingApproval({
        candidatePhone,
        candidateName: data.name,
        candidateData: data,
        vaquitaAddress,
        creatorPhone,
        score: score.score,
        rationale: score.rationale,
        redFlags: score.redFlags,
        suggestedPosition: score.suggestedPayoutPosition,
        createdAt: Date.now(),
    });

    if (sendToOther) {
        await sendToOther({
            toPhone: creatorPhone,
            body: MESSAGES.approvalPrompt({
                candidateName: data.name,
                candidateOccupation: data.occupation,
                score: score.score,
                rationale: score.rationale,
                redFlags: score.redFlags,
                suggestedPosition: score.suggestedPayoutPosition,
                vaquitaAddress,
            }),
        });
    }
}

// ─── Approval flow (creator side) ────────────────────────────────────

async function handleConfirmIntent(phone: string, sendToOther?: OutboundSender): Promise<string[]> {
    const pendings = findPendingApprovalsForCreator(phone);
    if (pendings.length === 0) return [MESSAGES.greeting];
    const oldest = pendings.sort((a, b) => a.createdAt - b.createdAt)[0]!;
    return executeApproval({ approval: oldest, approve: true, sendToOther });
}

async function handleDenyIntent(phone: string, sendToOther?: OutboundSender): Promise<string[]> {
    const pendings = findPendingApprovalsForCreator(phone);
    if (pendings.length === 0) return [MESSAGES.greeting];
    const oldest = pendings.sort((a, b) => a.createdAt - b.createdAt)[0]!;
    return executeApproval({ approval: oldest, approve: false, sendToOther });
}

async function executeApproval(args: {
    approval: PendingApproval;
    approve: boolean;
    sendToOther?: OutboundSender;
}): Promise<string[]> {
    const { approval, approve, sendToOther } = args;
    removePendingApproval(approval.candidatePhone);

    if (!approve) {
        if (sendToOther) {
            await sendToOther({ toPhone: approval.candidatePhone, body: MESSAGES.rejected });
        }
        return [MESSAGES.rejectionConfirmedByCreator(approval.candidateName)];
    }

    try {
        const state = await readService.getVaquitaState(approval.vaquitaAddress);
        if (state.config.collateralAmount > 0n) {
            await writeService.approveToken(approval.vaquitaAddress, state.config.collateralAmount);
        }
        await writeService.joinVaquita(approval.vaquitaAddress);

        resetSession(approval.candidatePhone);
        if (sendToOther) {
            await sendToOther({
                toPhone: approval.candidatePhone,
                body: MESSAGES.approved(approval.vaquitaAddress),
            });
        }
        return [MESSAGES.approvalConfirmedByCreator(approval.candidateName)];
    } catch (err) {
        console.error("Failed to execute onchain join:", err);
        return [MESSAGES.onchainJoinFailed];
    }
}

// ─── List & view ─────────────────────────────────────────────────────

async function listVaquitas(): Promise<string[]> {
    try {
        const list = await publicClient.readContract({
            address: deployments.contracts.VaquitaFactory.address as Address,
            abi: vaquitaFactoryAbi,
            functionName: "getVaquitasByCreator",
            args: [SIGNER_ADDRESS as Address],
        });
        const arr = [...list];
        if (arr.length === 0) return [MESSAGES.listEmpty];
        if (arr.length === 1) {
            const addr = arr[0] as Address;
            const state = await readService.getVaquitaState(addr);
            return [MESSAGES.listOne(addr, state.members.length, state.config.totalMembers)];
        }
        const lines = arr.map((a, i) => `${i + 1}. \`${a}\``).join("\n");
        return [MESSAGES.listMany(arr.length, lines)];
    } catch (err) {
        console.error("Failed to list vaquitas:", err);
        return [MESSAGES.error];
    }
}

async function viewVaquita(address: Address): Promise<string[]> {
    try {
        const state = await readService.getVaquitaState(address);
        const lines = [
            `🐄 *Vaquita ${address.slice(0, 10)}...*`,
            ``,
            `Estado: ${["Creada", "Activa", "Completada", "Defaulted"][state.status]}`,
            `Miembros: ${state.members.length}/${state.config.totalMembers}`,
            `Aporte: ${readService.formatTokenAmount(state.config.contributionAmount)} mMXNB`,
            `Colateral: ${readService.formatTokenAmount(state.config.collateralAmount)} mMXNB`,
            ``,
            `🔗 https://sepolia.arbiscan.io/address/${address}`,
        ].join("\n");
        return [lines];
    } catch (err) {
        console.error("Failed to view vaquita:", err);
        return [MESSAGES.error];
    }
}

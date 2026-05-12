import type { Address } from "viem";
import { classifyIntent } from "./intent-classifier.js";
import { getOrCreateSession, setState, resetSession } from "./sessions.js";
import { MESSAGES } from "./messages.js";
import { writeService, readService } from "../core/vaquita-service.js";
import { deployments } from "../config/deployments.js";
import { vaquitaFactoryAbi } from "../chain/abis.js";
import { publicClient } from "../chain/client.js";
import type { CreateStep, CreateVaquitaInput } from "./types.js";

/**
 * Process a single inbound user message and produce a reply (or replies).
 * Returns an array of strings — the bot may want to send multiple messages.
 *
 * NOTE on signing model in V1:
 *   The deployer wallet signs all transactions. In V2, each user has their own
 *   Privy embedded wallet. For the hackathon demo, this is acceptable because
 *   the focus is the conversational + AI experience, not custody design.
 */
export async function handleMessage(args: { phone: string; body: string }): Promise<string[]> {
    const { phone, body } = args;
    const text = body.trim();

    // Hard-coded "cancel" command — works regardless of state.
    if (/^(cancelar|cancel|salir|atr[aá]s|reset)$/i.test(text)) {
        resetSession(phone);
        return [MESSAGES.cancelled];
    }

    const session = getOrCreateSession(phone);

    // If we're inside a multi-step flow, handle that first based on the current state.
    if (session.state.kind === "creating_vaquita") {
        return handleCreateFlow(phone, text, session.state.step, session.state.partial);
    }

    // Otherwise, classify intent.
    const intent = await classifyIntent(text);

    switch (intent.kind) {
        case "greeting":
            return [MESSAGES.greeting];

        case "help":
            return [MESSAGES.help];

        case "create_vaquita":
            return startCreateFlow(phone, intent.partial);

        case "list_my_vaquitas":
            return listVaquitas();

        case "confirm":
        case "deny":
            // Confirms outside of a flow — just route to greeting.
            return [MESSAGES.greeting];

        case "view_vaquita":
            if (intent.address) {
                return viewVaquita(intent.address);
            }
            return [MESSAGES.help];

        case "cancel":
            resetSession(phone);
            return [MESSAGES.cancelled];

        case "unknown":
        default:
            return [MESSAGES.unknown];
    }
}

// ─── Create flow ──────────────────────────────────────────────────────

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
    if (Number.isNaN(num) || num <= 0) {
        return [MESSAGES.invalidNumber];
    }

    switch (step) {
        case "ask_amount":
            partial.contributionMXN = num;
            break;
        case "ask_members": {
            const intMembers = Math.floor(num);
            if (intMembers < 2 || intMembers > 50) return [MESSAGES.invalidMembers];
            partial.totalMembers = intMembers;
            break;
        }
        case "ask_cycle": {
            const days = Math.floor(num);
            if (days < 1 || days > 365) return [MESSAGES.invalidDays];
            partial.cycleDays = days;
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

// ─── List flow ────────────────────────────────────────────────────────

async function listVaquitas(): Promise<string[]> {
    // V1 limitation: we list vaquitas created by the SIGNER address, since the
    // bot signs on behalf of all users in this demo. V2 will use per-user wallets.
    const { SIGNER_ADDRESS } = await import("../core/vaquita-service.js");
    try {
        const list = await publicClient.readContract({
            address: deployments.contracts.VaquitaFactory.address as Address,
            abi: vaquitaFactoryAbi,
            functionName: "getVaquitasByCreator",
            args: [SIGNER_ADDRESS as Address],
        });
        const arr = [...list];
        if (arr.length === 0) {
            return [MESSAGES.listEmpty];
        }
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

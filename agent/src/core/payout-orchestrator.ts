import type { Address } from "viem";
import { readService, writeService, SIGNER_ADDRESS } from "./vaquita-service.js";
import { suggestPayoutOrder } from "../ai/risk-scorer.js";
import { getMembersScores } from "../bot/invitations.js";
import { publicClient } from "../chain/client.js";
import { vaquitaFactoryAbi } from "../chain/abis.js";
import { deployments } from "../config/deployments.js";
import { VaquitaStatus } from "../types/index.js";

export interface PayoutPlan {
    vaquitaAddress: Address;
    proposedOrder: Address[];
    memberDetails: Array<{
        position: number;
        address: Address;
        phone: string | null;
        name: string;
        score: number;
        cycleStartEstimate: Date;
        cycleEndEstimate: Date;
    }>;
    reasoning: string;
    isReadyToExecute: boolean;
    reason?: string;
}

/**
 * Build the payout plan for a vaquita. Returns the proposed order, member details,
 * and whether the vaquita is in a state where the order can be submitted onchain.
 *
 * V1 limitation: all members share the deployer signer onchain, so the onchain member
 * array contains the same address repeated. We track phones separately via memberScores.
 */
export async function buildPayoutPlan(vaquitaAddress: Address): Promise<PayoutPlan> {
    const state = await readService.getVaquitaState(vaquitaAddress);

    if (state.status !== VaquitaStatus.Created) {
        return {
            vaquitaAddress,
            proposedOrder: [],
            memberDetails: [],
            reasoning: "",
            isReadyToExecute: false,
            reason: `La vaquita está en estado ${VaquitaStatus[state.status]}, no se puede arrancar.`,
        };
    }
    if (state.members.length !== state.config.totalMembers) {
        return {
            vaquitaAddress,
            proposedOrder: [],
            memberDetails: [],
            reasoning: "",
            isReadyToExecute: false,
            reason: `Faltan miembros: ${state.members.length}/${state.config.totalMembers} se han unido.`,
        };
    }

    const records = getMembersScores(vaquitaAddress);
    const cycleDurationMs = Number(state.config.cycleDuration) * 1000;
    const now = Date.now();

    // No AI scores yet — fall back to member array order.
    if (records.length === 0) {
        return {
            vaquitaAddress,
            proposedOrder: state.members,
            memberDetails: state.members.map((addr, i) => ({
                position: i + 1,
                address: addr,
                phone: null,
                name: `Miembro ${i + 1}`,
                score: 50,
                cycleStartEstimate: new Date(now + i * cycleDurationMs),
                cycleEndEstimate: new Date(now + (i + 1) * cycleDurationMs),
            })),
            reasoning: "Sin scores de IA — usando orden de llegada por defecto.",
            isReadyToExecute: true,
        };
    }

    // Build pseudo-addresses from phones and call the AI orchestrator.
    const scoresForAI = records.map((r) => ({
        address: `0x${Buffer.from(r.candidatePhone).toString("hex").padStart(40, "0").slice(0, 40)}` as Address,
        score: r.score,
        rationale: r.rationale,
        redFlags: [] as string[],
        suggestedPayoutPosition: r.suggestedPosition,
    }));

    const suggestion = await suggestPayoutOrder(scoresForAI);

    // Map pseudo-addresses back to records to build ordered member details.
    const pseudoToRecord = new Map<string, (typeof records)[number]>();
    for (const r of records) {
        const pseudo = `0x${Buffer.from(r.candidatePhone).toString("hex").padStart(40, "0").slice(0, 40)}`.toLowerCase();
        pseudoToRecord.set(pseudo, r);
    }

    const orderedRecords = suggestion.order
        .map((addr) => pseudoToRecord.get(addr.toLowerCase()))
        .filter((r): r is (typeof records)[number] => Boolean(r));

    const memberDetails: PayoutPlan["memberDetails"] = orderedRecords.map((r, i) => ({
        position: i + 1,
        address: state.members[i] ?? state.members[0]!,
        phone: r.candidatePhone as string | null,
        name: r.candidateName,
        score: r.score,
        cycleStartEstimate: new Date(now + i * cycleDurationMs),
        cycleEndEstimate: new Date(now + (i + 1) * cycleDurationMs),
    }));

    // Fill any gaps (members without scores) with defaults.
    while (memberDetails.length < state.config.totalMembers) {
        const i = memberDetails.length;
        memberDetails.push({
            position: i + 1,
            address: state.members[i] ?? state.members[0]!,
            phone: null,
            name: `Miembro ${i + 1}`,
            score: 50,
            cycleStartEstimate: new Date(now + i * cycleDurationMs),
            cycleEndEstimate: new Date(now + (i + 1) * cycleDurationMs),
        });
    }

    return {
        vaquitaAddress,
        proposedOrder: state.members,
        memberDetails,
        reasoning: suggestion.reasoning,
        isReadyToExecute: true,
    };
}

/**
 * Execute the payout plan onchain: setPayoutOrder + start.
 */
export async function executePayoutPlan(plan: PayoutPlan): Promise<{
    setOrderTx: `0x${string}`;
    startTx: `0x${string}`;
}> {
    if (!plan.isReadyToExecute) {
        throw new Error(`Plan not ready: ${plan.reason}`);
    }

    console.log(`[PAYOUT] setting order onchain for ${plan.vaquitaAddress}`);
    const setOrderTx = await writeService.setPayoutOrder(plan.vaquitaAddress, plan.proposedOrder);
    await publicClient.waitForTransactionReceipt({ hash: setOrderTx });

    console.log(`[PAYOUT] starting vaquita ${plan.vaquitaAddress}`);
    const startTx = await writeService.startVaquita(plan.vaquitaAddress);
    await publicClient.waitForTransactionReceipt({ hash: startTx });

    return { setOrderTx, startTx };
}

/** Returns the most recently created vaquita by the deployer signer. */
export async function getMostRecentVaquita(): Promise<Address | null> {
    const list = await publicClient.readContract({
        address: deployments.contracts.VaquitaFactory.address as Address,
        abi: vaquitaFactoryAbi,
        functionName: "getVaquitasByCreator",
        args: [SIGNER_ADDRESS as Address],
    });
    const arr = [...list] as Address[];
    return arr.length > 0 ? arr[arr.length - 1]! : null;
}

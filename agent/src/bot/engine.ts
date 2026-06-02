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
    saveMemberScore,
    getMembersScores,
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

    // ─── GLOBAL COMMANDS — work in ANY state ─────────────────────────

    if (/^(cancelar|cancel|salir|atr[aá]s|reset)$/i.test(text)) {
        resetSession(phone);
        return [MESSAGES.cancelled];
    }

    // "/pendientes" or "pendientes" — lists pending approvals for the creator
    if (/^\/?pendientes?$/i.test(text)) {
        const pendings = findPendingApprovalsForCreator(phone);
        if (pendings.length === 0) {
            return ["🐄 No tienes solicitudes pendientes en este momento."];
        }
        // Show the FULL detail of the oldest pending — that's the one "sí" will approve.
        const oldest = pendings.sort((a, b) => a.createdAt - b.createdAt)[0]!;
        const detailMsg = MESSAGES.pendingDetail({
            candidateName: oldest.candidateName,
            candidateOccupation: oldest.candidateData.occupation,
            score: oldest.score,
            rationale: oldest.rationale,
            suggestedPosition: oldest.suggestedPosition,
            vaquitaAddress: oldest.vaquitaAddress,
        });

        if (pendings.length === 1) {
            return [detailMsg];
        }

        // If multiple pending, show detail of oldest + summary of the rest
        const summaryLines = pendings.slice(1).map((p, i) =>
            `${i + 2}. *${p.candidateName}* — Score: ${p.score}/100`,
        );
        return [
            detailMsg,
            `\n📋 *Otras pendientes (verás éstas después):*\n${summaryLines.join("\n")}`,
        ];
    }

    // "/estado" or "estado" — shows current session state (debug helper)
    if (/^\/?estado$/i.test(text)) {
        const s = getOrCreateSession(phone);
        const stateDesc =
            s.state.kind === "idle"
                ? "Sin operación en curso. Puedes escribir _hacer vaquita_, _invitar_, o _unirme_."
                : s.state.kind === "creating_vaquita"
                  ? `Creando una vaquita (paso: ${s.state.step}). Escribe _cancelar_ para abortar.`
                  : s.state.kind === "joining_vaquita"
                    ? `Uniéndote a una vaquita (paso: ${s.state.step}). Escribe _cancelar_ para abortar.`
                    : "Estado desconocido.";
        return [`🐄 *Tu estado actual:*\n\n${stateDesc}`];
    }

    // ─── MULTI-STEP FLOWS ────────────────────────────────────────────

    const session = getOrCreateSession(phone);

    if (session.state.kind === "creating_vaquita") {
        return handleCreateFlow(phone, text, session.state.step, session.state.partial);
    }
    if (session.state.kind === "confirming_payout") {
        if (/^(s[ií]|dale|ok|confirmo|sip|claro)/i.test(text)) {
            const replies = [MESSAGES.starting];
            const result = await executeArrancar({ creatorPhone: phone, plan: session.state.plan, sendToOther });
            return [...replies, ...result];
        }
        if (/^(no|cancelar|mejor no)/i.test(text)) {
            resetSession(phone);
            return [MESSAGES.cancelled];
        }
        return ["Responde *sí* para confirmar el orden propuesto, o *no* para cancelar."];
    }

    if (session.state.kind === "joining_vaquita") {
        // Candidate is waiting for creator approval — explain and offer an escape hatch.
        if (session.state.step === "scoring") {
            return [
                "⏳ Tu solicitud está con el organizador esperando aprobación.\n\nEscribe *cancelar* para retirar tu solicitud, o *estado* para ver más detalles.",
            ];
        }
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

        case "start_vaquita":
            return startArrancarFlow(phone, sendToOther);

        case "when_my_turn":
            return whenMyTurn(phone);

        case "bitso_balance":
            return bitsoBalance();

        case "bitso_quote":
            return bitsoQuote();

        case "bitso_info":
            return bitsoInfo();

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
    console.log(`[INVITE] startInviteFlow called by creatorPhone=${creatorPhone}`);
    try {
        const list = await publicClient.readContract({
            address: deployments.contracts.VaquitaFactory.address as Address,
            abi: vaquitaFactoryAbi,
            functionName: "getVaquitasByCreator",
            args: [SIGNER_ADDRESS as Address],
        });
        const arr = [...list] as Address[];
        console.log(`[INVITE] found ${arr.length} vaquitas owned by deployer signer`);
        if (arr.length === 0) return [MESSAGES.noVaquitaToInvite];

        const vaquitaAddress = arr[arr.length - 1]!;
        const invitation = createInvitation({ vaquitaAddress, creatorPhone });
        console.log(`[INVITE] created code=${invitation.code} vaquita=${invitation.vaquitaAddress} creator=${invitation.creatorPhone}`);
        return [MESSAGES.inviteCreated(invitation.code, vaquitaAddress)];
    } catch (err) {
        console.error("[INVITE] failed:", err);
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

    console.log(`[SCORE] start candidate=${candidatePhone} creator=${creatorPhone} vaquita=${vaquitaAddress}`);

    const pseudoAddress = `0x${Buffer.from(candidatePhone).toString("hex").padStart(40, "0").slice(0, 40)}` as Address;

    let score;
    try {
        score = await scoreMember({
            address: pseudoAddress,
            selfReported: {
                name: data.name,
                occupation: data.occupation,
                monthlyIncomeMXN: data.monthlyIncomeMXN,
                timeInCommunityMonths: data.timeInCommunityMonths,
            },
        });
        console.log(`[SCORE] Claude returned score=${score.score} position=${score.suggestedPayoutPosition}`);
    } catch (err) {
        console.error(`[SCORE] Claude scoring FAILED`, err);
        throw err;
    }

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
    console.log(`[SCORE] pending approval stored for creator=${creatorPhone}`);

    if (!sendToOther) {
        console.error(`[SCORE] sendToOther is UNDEFINED — cannot notify creator`);
        return;
    }

    if (!creatorPhone || creatorPhone.length < 5) {
        console.error(`[SCORE] creatorPhone is INVALID: "${creatorPhone}"`);
        return;
    }

    const body = MESSAGES.approvalPrompt({
        candidateName: data.name,
        candidateOccupation: data.occupation,
        score: score.score,
        rationale: score.rationale,
        redFlags: score.redFlags,
        suggestedPosition: score.suggestedPayoutPosition,
        vaquitaAddress,
    });

    console.log(`[SCORE] about to send approval prompt to creator=${creatorPhone} body.length=${body.length}`);

    // Try to notify the creator. If it fails (sandbox quirks), the creator can
    // still see the pending approval via "pendientes" command.
    try {
        await sendToOther({
            toPhone: creatorPhone,
            body,
        });
        console.log(`[SCORE] sendToOther completed for creator=${creatorPhone}`);
    } catch (err) {
        console.error(`[SCORE] sendToOther threw for creator=${creatorPhone}`, err);
    }

    // Always send a confirmation to the candidate so they know what to expect.
    // This is independent of whether the creator notification succeeded.
    try {
        await sendToOther({
            toPhone: candidatePhone,
            body: `📤 *Tu solicitud fue enviada.*\n\nEl organizador recibirá una notificación. Si en un par de minutos no responde, *pídele que escriba "pendientes"* en este chat para ver tu solicitud directamente.\n\n🤖 Tu score de IA: *${score.score}/100*\n📊 Posición sugerida: *${score.suggestedPayoutPosition}*`,
        });
    } catch (candidateErr) {
        console.error(`[SCORE] candidate notification failed:`, candidateErr);
    }
}

// ─── Approval flow (creator side) ────────────────────────────────────

async function handleConfirmIntent(phone: string, sendToOther?: OutboundSender): Promise<string[]> {
    const pendings = findPendingApprovalsForCreator(phone);
    console.log(`[APPROVE] confirm intent received from ${phone}, ${pendings.length} pending approvals`);
    if (pendings.length === 0) {
        return ["🐄 No tienes solicitudes pendientes para aprobar.\n\n¿En qué más te ayudo?"];
    }
    const oldest = pendings.sort((a, b) => a.createdAt - b.createdAt)[0]!;
    console.log(`[APPROVE] approving oldest pending: ${oldest.candidateName} (${oldest.candidatePhone})`);
    return executeApproval({ approval: oldest, approve: true, sendToOther });
}

async function handleDenyIntent(phone: string, sendToOther?: OutboundSender): Promise<string[]> {
    const pendings = findPendingApprovalsForCreator(phone);
    console.log(`[APPROVE] deny intent received from ${phone}, ${pendings.length} pending approvals`);
    if (pendings.length === 0) {
        return ["🐄 No tienes solicitudes pendientes para rechazar."];
    }
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

        // Save the risk score for later — when the creator runs "arrancar",
        // we'll use these scores to compute the optimal payout order.
        saveMemberScore({
            vaquitaAddress: approval.vaquitaAddress,
            candidatePhone: approval.candidatePhone,
            candidateName: approval.candidateName,
            score: approval.score,
            rationale: approval.rationale,
            suggestedPosition: approval.suggestedPosition,
            approvedAt: Date.now(),
        });
        console.log(`[APPROVE] saved member score for vaquita=${approval.vaquitaAddress} candidate=${approval.candidatePhone}`);

        resetSession(approval.candidatePhone);

        // Notify the candidate with text + optional voice.
        if (sendToOther) {
            await sendToOther({
                toPhone: approval.candidatePhone,
                body: MESSAGES.approved(approval.vaquitaAddress),
            });

            // Try to add a voice welcome message. Fail silently if voice isn't configured.
            try {
                const { isVoiceConfigured } = await import("../config/env.js");
                if (isVoiceConfigured()) {
                    const { synthesizeSpanish, audioPublicUrl } = await import("../ai/voice.js");
                    const { welcomeApprovedScript } = await import("../ai/voice-scripts.js");
                    const { sendWhatsAppMedia } = await import("./twilio-client.js");

                    const contributionHuman = readService.formatTokenAmount(state.config.contributionAmount);
                    const cycleDays = Math.round(Number(state.config.cycleDuration) / 86400);
                    const script = welcomeApprovedScript({
                        candidateName: approval.candidateName,
                        contributionAmount: contributionHuman,
                        totalMembers: state.config.totalMembers,
                        cycleDays,
                    });

                    const { filename } = await synthesizeSpanish(script);
                    const url = audioPublicUrl(filename);

                    const to = approval.candidatePhone.startsWith("whatsapp:")
                        ? approval.candidatePhone
                        : `whatsapp:${approval.candidatePhone}`;
                    await sendWhatsAppMedia({ to, body: "🎙️ Mensaje de bienvenida personalizado", mediaUrl: url });
                    console.log(`[APPROVE] voice welcome sent to ${approval.candidatePhone}`);
                }
            } catch (voiceErr) {
                console.error(`[APPROVE] voice welcome failed (non-fatal):`, voiceErr);
            }
        }

        return [MESSAGES.approvalConfirmedByCreator(approval.candidateName)];
    } catch (err) {
        console.error("[APPROVE] Failed to execute onchain join:", err);
        // Always reset candidate session so they don't stay stuck in "scoring" state.
        resetSession(approval.candidatePhone);
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

// ─── Start (arrancar) flow ──────────────────────────────────────────

async function startArrancarFlow(creatorPhone: string, sendToOther?: OutboundSender): Promise<string[]> {
    const { buildPayoutPlan, getMostRecentVaquita } = await import("../core/payout-orchestrator.js");
    try {
        const vaquitaAddress = await getMostRecentVaquita();
        if (!vaquitaAddress) return [MESSAGES.arrancarNoVaquita];

        const plan = await buildPayoutPlan(vaquitaAddress);
        if (!plan.isReadyToExecute) {
            return [MESSAGES.arrancarNotReady(plan.reason ?? "razón desconocida")];
        }

        setState(creatorPhone, { kind: "confirming_payout", vaquitaAddress, plan });
        return [MESSAGES.proposedOrder({ vaquitaAddress, memberDetails: plan.memberDetails, reasoning: plan.reasoning })];
    } catch (err) {
        console.error("[ARRANCAR] buildPayoutPlan failed:", err);
        return [MESSAGES.error];
    }
}

async function executeArrancar(args: {
    creatorPhone: string;
    plan: import("../core/payout-orchestrator.js").PayoutPlan;
    sendToOther?: OutboundSender;
}): Promise<string[]> {
    const { creatorPhone, plan, sendToOther } = args;
    const { executePayoutPlan } = await import("../core/payout-orchestrator.js");

    try {
        const { setOrderTx, startTx } = await executePayoutPlan(plan);
        resetSession(creatorPhone);

        const state = await readService.getVaquitaState(plan.vaquitaAddress);
        const contributionHuman = readService.formatTokenAmount(state.config.contributionAmount);
        const cycleDays = Math.round(Number(state.config.cycleDuration) / 86400);

        for (const m of plan.memberDetails) {
            if (!m.phone || !sendToOther) continue;
            await sendToOther({
                toPhone: m.phone,
                body: MESSAGES.memberStartedNotification({
                    memberName: m.name,
                    position: m.position,
                    totalMembers: plan.memberDetails.length,
                    receiveDate: m.cycleStartEstimate,
                    contributionAmount: contributionHuman,
                    cycleDays,
                }),
            });
            // Optional voice notification.
            try {
                const { isVoiceConfigured } = await import("../config/env.js");
                if (isVoiceConfigured()) {
                    const { synthesizeSpanish, audioPublicUrl } = await import("../ai/voice.js");
                    const { sendWhatsAppMedia } = await import("./twilio-client.js");
                    const first = m.name.split(" ")[0] ?? m.name;
                    const text = `Hola ${first}, la vaquita acaba de arrancar. Eres la posición ${m.position} de ${plan.memberDetails.length}. Te tocará recibir el ${m.cycleStartEstimate.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}. Cada ${cycleDays} días vas a aportar ${contributionHuman} pesos digitales. ¡Mucha suerte!`;
                    const { filename } = await synthesizeSpanish(text);
                    const url = audioPublicUrl(filename);
                    const to = m.phone.startsWith("whatsapp:") ? m.phone : `whatsapp:${m.phone}`;
                    await sendWhatsAppMedia({ to, body: "🎙️ Tu posición en la vaquita", mediaUrl: url });
                }
            } catch (vErr) {
                console.error("[ARRANCAR] voice notify failed (non-fatal):", vErr);
            }
        }

        return [MESSAGES.started({ vaquitaAddress: plan.vaquitaAddress, setOrderTx, startTx })];
    } catch (err) {
        console.error("[ARRANCAR] executePayoutPlan failed:", err);
        resetSession(creatorPhone);
        return [MESSAGES.error];
    }
}

async function whenMyTurn(phone: string): Promise<string[]> {
    const { getMostRecentVaquita, buildPayoutPlan } = await import("../core/payout-orchestrator.js");
    try {
        const vaq = await getMostRecentVaquita();
        if (!vaq) return ["🤔 No encuentro una vaquita activa donde estés inscrito."];

        const scores = getMembersScores(vaq);
        const mine = scores.find((s) => s.candidatePhone === phone);
        if (!mine) {
            return [`🤔 No te encuentro como miembro aprobado de la vaquita actual.`];
        }

        const plan = await buildPayoutPlan(vaq);
        const myEntry = plan.memberDetails.find((m) => m.phone === phone);
        if (!myEntry) {
            return [`🤔 Aún no se ha definido el orden de pagos. Cuando el creador escriba _arrancar_, te avisaré.`];
        }
        return [
            `📊 *Tu posición:* ${myEntry.position}/${plan.memberDetails.length}\n📅 *Te toca recibir:* ${myEntry.cycleStartEstimate.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`,
        ];
    } catch (err) {
        console.error("[WHEN_MY_TURN] failed:", err);
        return [MESSAGES.error];
    }
}

// ─── Bitso commands ──────────────────────────────────────────────────

async function bitsoBalance(): Promise<string[]> {
    const { isBitsoConfigured } = await import("../config/env.js");
    if (!isBitsoConfigured()) {
        return ["⚠️ La integración con Bitso no está configurada. Configura BITSO_API_KEY y BITSO_API_SECRET en .env."];
    }
    try {
        const { getBalances } = await import("../bitso/account.js");
        const balances = await getBalances();
        const meaningful = balances.filter((b) => parseFloat(b.total) > 0);
        if (meaningful.length === 0) {
            return ["💰 Tu cuenta Bitso sandbox no tiene saldo en ninguna moneda. (Saldos cero — es esperado en una cuenta nueva.)"];
        }
        const lines = meaningful
            .map((b) => `• *${b.currency.toUpperCase()}*: ${parseFloat(b.total).toFixed(4)} (disponible: ${parseFloat(b.available).toFixed(4)})`)
            .join("\n");
        return [`💰 *Saldo en Bitso Sandbox:*\n\n${lines}`];
    } catch (err) {
        console.error("[BITSO] balance failed:", err);
        return [`⚠️ Error al consultar Bitso: ${(err as Error).message}`];
    }
}

async function bitsoQuote(): Promise<string[]> {
    const { isBitsoConfigured } = await import("../config/env.js");
    if (!isBitsoConfigured()) {
        return ["⚠️ La integración con Bitso no está configurada."];
    }
    try {
        const { getTicker, getAvailableBooks } = await import("../bitso/market.js");
        try {
            const ticker = await getTicker("mxnb_mxn");
            return [
                `📊 *Cotización MXNB / MXN (Bitso Sandbox):*\n\n• Último: $${parseFloat(ticker.last).toFixed(4)} MXN\n• Ask: $${parseFloat(ticker.ask).toFixed(4)}\n• Bid: $${parseFloat(ticker.bid).toFixed(4)}\n• Volumen 24h: ${parseFloat(ticker.volume).toFixed(2)}\n• Cambio 24h: ${ticker.change_24}%\n\n📍 Fuente: Bitso Business API`,
            ];
        } catch {
            const books = await getAvailableBooks();
            const list = books.slice(0, 10).map((b) => `• ${b.book}`).join("\n");
            return [`📊 *Books disponibles en Bitso Sandbox:*\n\n${list}\n\n(MXNB/MXN puede no estar listado en sandbox.)`];
        }
    } catch (err) {
        console.error("[BITSO] quote failed:", err);
        return [`⚠️ Error al consultar Bitso: ${(err as Error).message}`];
    }
}

async function bitsoInfo(): Promise<string[]> {
    return [
        `🇲🇽 *Integración con Bitso Business*

VaquitaAI usa la API de Bitso Business para:
- Cotización en vivo MXNB ↔ MXN
- Consulta de saldo onchain de la vaquita
- On/off-ramp vía SPEI (próximamente)

📚 Comandos disponibles:
- _saldo bitso_ → ver saldo de la cuenta Bitso
- _cotizar_ → precio actual MXNB/MXN
- _bitso info_ → este mensaje

🔗 Sandbox: api-sandbox.bitso.com/api/v3
📖 Docs: docs.bitso.com/bitso-api`,
    ];
}

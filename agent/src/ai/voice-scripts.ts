/**
 * Templates for voice notifications. Kept short and natural — ElevenLabs charges
 * by character, so we trim every word that doesn't add emotional value.
 */

export interface ApprovalAudioInput {
    candidateName: string;
    contributionAmount: string;
    totalMembers: number;
    cycleDays: number;
}

export function welcomeApprovedScript(input: ApprovalAudioInput): string {
    const first = input.candidateName.split(" ")[0] ?? input.candidateName;
    return `Hola ${first}, bienvenido a la vaquita. Acabamos de aprobarte. Cada ${input.cycleDays} días vas a aportar ${input.contributionAmount} pesos digitales, y cuando te toque tu turno vas a recibir el bote completo. Somos ${input.totalMembers} en total. ¡Bienvenido a la familia!`;
}

export interface TurnAudioInput {
    recipientName: string;
    amountReceived: string;
}

export function yourTurnScript(input: TurnAudioInput): string {
    const first = input.recipientName.split(" ")[0] ?? input.recipientName;
    return `¡Felicidades ${first}! Te tocó la vaquita esta semana. Acabas de recibir ${input.amountReceived} pesos digitales. Disfrútalos, te lo ganaste.`;
}

export interface CreatorConfirmationInput {
    candidateName: string;
}

export function creatorApprovedScript(input: CreatorConfirmationInput): string {
    const first = input.candidateName.split(" ")[0] ?? input.candidateName;
    return `Listo, ${first} ya está dentro de tu vaquita. Le mandé un mensaje de bienvenida y registramos su entrada onchain.`;
}

export function vaquitaCompletedScript(memberName: string): string {
    const first = memberName.split(" ")[0] ?? memberName;
    return `¡${first}, tu vaquita acaba de terminar! Todos los miembros recibieron su turno. Ya puedes reclamar tu colateral. ¡Muchas gracias por confiar en VaquitaAI!`;
}

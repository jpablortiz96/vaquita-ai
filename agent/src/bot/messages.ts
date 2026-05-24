import type { CreateVaquitaInput, JoinInput } from "./types.js";

export const MESSAGES = {
    greeting: `🐄 *¡Hola! Soy VaquitaAI*

Te ayudo a crear y manejar vaquitas (tandas) onchain — seguras, sin papeles, en pesos digitales.

*¿Qué puedo hacer?*
- Crear una vaquita: _"hacer una vaquita de 500 al mes con 4 amigos"_
- Invitar amigos: _"invitar a mi vaquita"_
- Unirme a una: _"me uno con código ___"_
- Ver tus vaquitas: _"mis vaquitas"_
- Ayuda: _"ayuda"_

¿En qué te ayudo hoy?`,

    help: `🐄 *VaquitaAI — Ayuda*

*¿Qué es una vaquita?*
Es un ahorro rotativo grupal. Cada mes (o cada quincena) todos aportan la misma cantidad, y un miembro recibe el bote completo. Cuando todos han recibido una vez, la vaquita termina.

*¿Por qué onchain?*
Porque si alguien quiere desaparecer con la plata, no puede — el contrato inteligente la protege con colateral.

*¿Cómo se decide el orden?*
Una IA evalúa el riesgo de cada miembro (sin invasión: solo preguntas básicas + historial onchain) y sugiere el orden óptimo. Quien tenga más confianza recibe antes; quien tenga menos, después.

*Comandos:*
- _hacer vaquita_ → crear una nueva
- _invitar_ → compartir tu vaquita con amigos
- _unirme_ → entrar a una vaquita ajena
- _mis vaquitas_ → ver las tuyas
- _cancelar_ → cancelar lo que estás haciendo

¿Qué quieres hacer?`,

    // ─── Create flow ───
    askAmount: `💰 ¿De cuántos pesos será cada aporte?\n\nPor ejemplo: _500_ (cada miembro pondrá 500 pesos por ciclo)`,

    askMembers: `👥 ¿Cuántos miembros van a participar?\n\nMínimo 2, máximo 50. Por ejemplo: _4_`,

    askCycle: `📅 ¿Cada cuántos días es un ciclo?\n\nPor ejemplo: _30_ (mensual), _15_ (quincenal), _7_ (semanal)`,

    askCollateral: (contribution: number) =>
        `🛡️ ¿Cuánto colateral por miembro?\n\nEsto protege a la vaquita si alguien falla. Recomendado: *${contribution * 3}* pesos (3x la contribución).\n\nManda el monto o escribe _recomendado_ para usar ${contribution * 3}.`,

    confirmation: (input: CreateVaquitaInput) => {
        const total = input.contributionMXN * input.totalMembers;
        return `✅ *Confirma tu vaquita:*

- 💰 Aporte por ciclo: *${input.contributionMXN} mMXNB*
- 👥 Miembros: *${input.totalMembers}*
- 📅 Ciclo: *${input.cycleDays} días*
- 🛡️ Colateral: *${input.collateralMXN} mMXNB*

Cada miembro recibirá *${total} mMXNB* cuando le toque su turno.

Responde *sí* para crearla onchain, o *no* para cancelar.`;
    },

    creating: `⏳ Creando tu vaquita en Arbitrum Sepolia...\n\nEsto tarda unos segundos. Te aviso cuando esté lista.`,

    created: (address: string, explorerUrl: string) =>
        `🎉 *¡Tu vaquita está onchain!*

📍 Dirección: \`${address}\`

🔗 Ver en Arbiscan:
${explorerUrl}

*Próximo paso:* invita a tus amigos a unirse escribiendo _invitar_.`,

    // ─── Invite flow ───
    noVaquitaToInvite: `🤔 Aún no has creado ninguna vaquita. Escribe _hacer vaquita_ para empezar.`,

    pickVaquitaToInvite: (list: string) =>
        `🐄 Tienes varias vaquitas. ¿A cuál quieres invitar amigos?\n\n${list}\n\nResponde con el número (ej. _1_).`,

    inviteCreated: (code: string, vaquitaAddress: string) =>
        `✅ *Código de invitación creado*

Comparte este mensaje con tus amigos:

━━━━━━━━━━━━━━━━━━━━
🐄 *Te invito a mi vaquita en VaquitaAI*

Tu código de entrada: \`${code}\`

Para unirte: escríbele a este número (+14155238886) por WhatsApp:
1️⃣ Manda: *join till-breathing* (para activar el sandbox)
2️⃣ Luego manda: *quiero unirme con código ${code}*
━━━━━━━━━━━━━━━━━━━━

📍 Vaquita: \`${vaquitaAddress}\`

Cuando un amigo termine sus preguntas, te aviso con su perfil de confianza y tú apruebas.`,

    // ─── Join flow ───
    askInviteCode: `🔑 Mándame el código de invitación que te compartieron (8 caracteres).\n\nPor ejemplo: _abc12345_`,

    invalidInviteCode: `🤔 Ese código no existe o ya no es válido. Pídele al organizador que te mande uno nuevo.`,

    joinIntro: (vaquitaAddress: string) =>
        `🐄 *¡Bienvenido a una vaquita en VaquitaAI!*

📍 Vaquita: \`${vaquitaAddress}\`

Para unirte, necesito hacerte *4 preguntas rápidas*. Esto le ayuda a la IA a recomendarte una posición justa en la cola de pagos.

Tu información es solo para evaluación interna y la ve el organizador.

¿Listo? Empecemos. 👇`,

    askName: `👋 ¿Cuál es tu nombre?\n\n(Solo nombre, no apellido completo si no quieres)`,

    askOccupation: `💼 ¿A qué te dedicas?\n\nPor ejemplo: _maestra_, _comerciante_, _ingeniero_, _empleado_`,

    askIncome: `💵 ¿Cuál es tu ingreso mensual aproximado en pesos?\n\nPor ejemplo: _15000_. (Esto es solo para evaluar capacidad de aporte — nadie más lo verá.)`,

    askRelation: `🤝 ¿Hace cuántos *meses* conoces al organizador de la vaquita?\n\nPor ejemplo: _12_ (un año), _24_ (dos años)`,

    scoring: `🤖 Analizando tu perfil con IA...\n\nVoy a calcular tu score de confianza y mandarle un resumen al organizador. Te aviso cuando responda.`,

    awaitingApproval: `⏳ Tu solicitud está con el organizador.\n\nTe aviso en cuanto la apruebe o rechace.`,

    approved: (vaquitaAddress: string) =>
        `🎉 *¡Te aprobaron en la vaquita!*

Ya estás dentro. La IA te asignó una posición en el orden de pagos.

📍 Vaquita: \`${vaquitaAddress}\`
🔗 https://sepolia.arbiscan.io/address/${vaquitaAddress}

Te avisaré cuando empiece la vaquita y cuando te toque aportar o cobrar.`,

    rejected: `😔 El organizador no aprobó tu solicitud en este momento. Puedes intentar con otra vaquita.`,

    // ─── Approval prompt to creator ───
    approvalPrompt: (args: {
        candidateName: string;
        candidateOccupation: string;
        score: number;
        rationale: string;
        redFlags: string[];
        suggestedPosition: string;
        vaquitaAddress: string;
    }) => {
        const positionLabel: Record<string, string> = {
            early: "temprana (recibe pronto)",
            middle: "media",
            late: "tardía (recibe después)",
        };
        const flagsLine = args.redFlags.length > 0 ? `\n⚠️ Banderas: ${args.redFlags.join(", ")}` : "";
        return `🐄 *Nueva solicitud para tu vaquita*

👤 *${args.candidateName}* (${args.candidateOccupation})

📊 *Score:* ${args.score}/100
💡 *Posición recomendada:* ${positionLabel[args.suggestedPosition] ?? args.suggestedPosition}

📝 *Análisis de la IA:*
${args.rationale}${flagsLine}

📍 Vaquita: \`${args.vaquitaAddress.slice(0, 10)}...\`

*¿Apruebas?* Responde _sí_ o _no_.`;
    },

    approvalConfirmedByCreator: (candidateName: string) =>
        `✅ Aprobado. Le avisé a *${candidateName}* que está dentro y le hice el join onchain en su nombre.`,

    rejectionConfirmedByCreator: (candidateName: string) =>
        `❌ Rechazado. Le avisé a *${candidateName}* que su solicitud no se aprobó.`,

    onchainJoinFailed: `⚠️ Aprobé al miembro pero el join onchain falló. Revisa el log del servidor.`,

    // ─── List & misc ───
    listEmpty: `📭 Aún no has creado ninguna vaquita.\n\nEscribe _hacer vaquita_ para empezar.`,

    listOne: (address: string, members: number, total: number) =>
        `🐄 *Una de tus vaquitas:*\n\n📍 \`${address}\`\n👥 ${members}/${total} miembros\n🔗 https://sepolia.arbiscan.io/address/${address}`,

    listMany: (count: number, list: string) =>
        `🐄 *Tienes ${count} vaquitas:*\n\n${list}\n\nEscribe _detalles 0x...DIRECCION_ para ver una en particular.`,

    cancelled: `❌ Cancelado. ¿En qué más te ayudo?`,

    unknown: `🤔 No entendí. Escribe _ayuda_ para ver qué puedo hacer.`,

    invalidNumber: `🤔 Eso no parece un número. Inténtalo de nuevo.`,
    invalidMembers: `🤔 Necesito un número entre 2 y 50.`,
    invalidDays: `🤔 Necesito un número entre 1 y 365.`,
    invalidName: `🤔 Por favor mándame un nombre válido (al menos 2 letras).`,

    error: `⚠️ Algo salió mal de mi lado. Intenta otra vez en un momento.`,
};

// Suppress unused import warning — JoinInput is used by callers who import from this file.
export type { JoinInput };

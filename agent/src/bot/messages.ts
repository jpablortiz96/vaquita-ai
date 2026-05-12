import type { CreateVaquitaInput } from "./types.js";

export const MESSAGES = {
    greeting: `🐄 *¡Hola! Soy VaquitaAI*

Te ayudo a crear y manejar vaquitas (tandas) onchain — seguras, sin papeles, en pesos digitales.

*¿Qué puedo hacer?*
- Crear una vaquita: _"hacer una vaquita de 500 al mes con 4 amigos"_
- Ver tus vaquitas: _"mis vaquitas"_
- Ayuda: _"ayuda"_

¿En qué te ayudo hoy?`,

    help: `🐄 *VaquitaAI — Ayuda*

*¿Qué es una vaquita?*
Es un ahorro rotativo grupal. Cada mes (o cada quincena) todos aportan la misma cantidad, y un miembro recibe el bote completo. Cuando todos han recibido una vez, la vaquita termina.

*¿Por qué onchain?*
Porque si alguien quiere desaparecer con la plata, no puede — el contrato inteligente la protege con colateral.

*Comandos:*
- _hacer vaquita_ → crear una nueva
- _mis vaquitas_ → ver las tuyas
- _cancelar_ → cancelar lo que estás haciendo
- _ayuda_ → ver este mensaje

¿Qué quieres hacer?`,

    askAmount: `💰 ¿De cuántos pesos será cada aporte?

Por ejemplo: _500_ (cada miembro pondrá 500 pesos por ciclo)`,

    askMembers: `👥 ¿Cuántos miembros van a participar?

Mínimo 2, máximo 50. Por ejemplo: _4_`,

    askCycle: `📅 ¿Cada cuántos días es un ciclo?

Por ejemplo: _30_ (mensual), _15_ (quincenal), _7_ (semanal)`,

    askCollateral: (contribution: number) =>
        `🛡️ ¿Cuánto colateral por miembro?

Esto protege a la vaquita si alguien falla. Recomendado: *${contribution * 3}* pesos (3x la contribución).

Manda el monto o escribe _recomendado_ para usar ${contribution * 3}.`,

    confirmation: (input: CreateVaquitaInput) => {
        const total = input.contributionMXN * input.totalMembers;
        return `✅ *Confirma tu vaquita:*

- 💰 Aporte por ciclo: *${input.contributionMXN} mMXNB* (pesos digitales de prueba)
- 👥 Miembros: *${input.totalMembers}*
- 📅 Ciclo: *${input.cycleDays} días*
- 🛡️ Colateral: *${input.collateralMXN} mMXNB*

Cada miembro recibirá *${total} mMXNB* cuando le toque su turno.

Responde *sí* para crearla onchain, o *no* para cancelar.`;
    },

    creating: `⏳ Creando tu vaquita en Arbitrum Sepolia...

Esto tarda unos segundos. Te aviso cuando esté lista.`,

    created: (address: string, explorerUrl: string) =>
        `🎉 *¡Tu vaquita está onchain!*

📍 Dirección: \`${address}\`

🔗 Verla en Arbiscan:
${explorerUrl}

*Próximo paso:* invita a tus amigos a unirse. Cuando todos estén dentro, podrás definir el orden de pagos y arrancar.

(En el demo del hackathon, esto lo hará el AI automáticamente.)`,

    listEmpty: `📭 Aún no has creado ninguna vaquita.

Escribe _hacer vaquita_ para empezar.`,

    listOne: (address: string, members: number, total: number) =>
        `🐄 *Una de tus vaquitas:*

📍 \`${address}\`
👥 ${members}/${total} miembros
🔗 https://sepolia.arbiscan.io/address/${address}`,

    listMany: (count: number, list: string) =>
        `🐄 *Tienes ${count} vaquitas:*

${list}

Escribe _detalles 0x...DIRECCION_ para ver una en particular.`,

    cancelled: `❌ Cancelado. ¿En qué más te ayudo?`,

    unknown: `🤔 No entendí. Escribe _ayuda_ para ver qué puedo hacer.`,

    invalidNumber: `🤔 Eso no parece un número. Inténtalo de nuevo.`,

    invalidMembers: `🤔 Necesito un número entre 2 y 50.`,

    invalidDays: `🤔 Necesito un número entre 1 y 365.`,

    error: `⚠️ Algo salió mal de mi lado. Intenta otra vez en un momento.`,
};

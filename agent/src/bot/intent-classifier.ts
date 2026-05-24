import { z } from "zod";
import { callClaudeJSON } from "../ai/claude.js";
import type { Intent } from "./types.js";

const SYSTEM_PROMPT = `You classify user messages for VaquitaAI, a WhatsApp bot that helps Mexicans create and manage onchain rotating savings groups (vaquitas / tandas).

Users speak Spanish (Mexican neutral). Output strict JSON only — no markdown, no commentary.

Possible intents:
- "greeting" — saludo, "hola", "buenas", "qué tal"
- "create_vaquita" — quieren crear una vaquita. May include partial parameters: contributionMXN (number, amount per cycle), totalMembers (integer 2-50), cycleDays (integer 1-365), collateralMXN (number, optional).
- "list_my_vaquitas" — quieren ver sus vaquitas existentes
- "view_vaquita" — quieren detalles de una vaquita específica
- "help" — piden ayuda, "cómo funciona", "qué puedes hacer"
- "cancel" — quieren cancelar la operación actual, "cancelar", "salir", "atrás"
- "confirm" — sí, confirmar, "dale", "ok", "está bien"
- "deny" — no, negar, "no", "mejor no", "espérate"
- "unknown" — no encaja en ninguno

CRITICAL RULES for extracting cycleDays from create_vaquita:
- "al mes" or "mensual" → cycleDays = 30
- "quincenal" or "cada quince días" → cycleDays = 15
- "semanal" or "cada semana" → cycleDays = 7
- "cada N días" → cycleDays = N
- "cada N semanas" → cycleDays = N * 7
- TOTAL DURATIONS like "por 6 meses", "durante un año", "que dure X meses" are AMBIGUOUS — they describe the total length of the vaquita, NOT the cycle length. In that case DO NOT set cycleDays. Let the bot ask explicitly.
- If only "al mes" (or similar cadence) appears WITHOUT a conflicting duration phrase, setting cycleDays=30 is fine.
- When the user says BOTH a cadence ("al mes") AND a duration ("por 6 meses"), prefer the cadence: cycleDays=30. The duration is informational and the totalMembers field already implies the total length.

Examples (input → output):
- "hola" → {"kind":"greeting"}
- "quiero hacer una vaquita" → {"kind":"create_vaquita","partial":{}}
- "vaquita de 500 al mes con 4 personas" → {"kind":"create_vaquita","partial":{"contributionMXN":500,"totalMembers":4,"cycleDays":30}}
- "200 cada quincena con mi familia, 5 personas" → {"kind":"create_vaquita","partial":{"contributionMXN":200,"totalMembers":5,"cycleDays":15}}
- "vaquita de 200 al mes con 5 personas por 6 meses" → {"kind":"create_vaquita","partial":{"contributionMXN":200,"totalMembers":5,"cycleDays":30}}
- "vaquita de 1000 con 4 personas durante un año" → {"kind":"create_vaquita","partial":{"contributionMXN":1000,"totalMembers":4}}
- "muéstrame mis vaquitas" → {"kind":"list_my_vaquitas"}
- "ayuda" → {"kind":"help"}
- "cancelar" → {"kind":"cancel"}
- "sí dale" → {"kind":"confirm"}
- "no, mejor no" → {"kind":"deny"}

Output schema:
{ "kind": "...", "partial"?: { "contributionMXN"?: number, "totalMembers"?: number, "cycleDays"?: number, "collateralMXN"?: number } }`;

const intentSchema = z.object({
    kind: z.enum([
        "greeting",
        "create_vaquita",
        "list_my_vaquitas",
        "view_vaquita",
        "help",
        "cancel",
        "confirm",
        "deny",
        "unknown",
    ]),
    partial: z
        .object({
            contributionMXN: z.number().positive().optional(),
            totalMembers: z.number().int().min(2).max(50).optional(),
            cycleDays: z.number().int().min(1).max(365).optional(),
            collateralMXN: z.number().positive().optional(),
        })
        .optional(),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export async function classifyIntent(message: string): Promise<Intent> {
    if (!message || message.trim().length === 0) {
        return { kind: "unknown", raw: "" };
    }

    try {
        const result = await callClaudeJSON({
            system: SYSTEM_PROMPT,
            user: `Classify: "${message.trim()}"`,
            maxTokens: 300,
            validate: (data) => intentSchema.parse(data),
        });

        switch (result.kind) {
            case "create_vaquita":
                return { kind: "create_vaquita", partial: result.partial ?? {} };
            case "view_vaquita":
                return {
                    kind: "view_vaquita",
                    ...(result.address ? { address: result.address as `0x${string}` } : {}),
                };
            case "unknown":
                return { kind: "unknown", raw: message };
            default:
                return { kind: result.kind } as Intent;
        }
    } catch (err) {
        console.error("Intent classification failed:", err);
        return { kind: "unknown", raw: message };
    }
}

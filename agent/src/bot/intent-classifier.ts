import { z } from "zod";
import { callClaudeJSON } from "../ai/claude.js";
import type { Intent } from "./types.js";

const SYSTEM_PROMPT = `You classify user messages for VaquitaAI, a WhatsApp bot that helps Mexicans create, join, and manage onchain rotating savings groups (vaquitas / tandas).

Users speak Spanish (Mexican neutral). Output strict JSON only — no markdown, no commentary.

Possible intents:
- "greeting" — saludo, "hola", "buenas", "qué tal"
- "create_vaquita" — quieren crear una vaquita. May include partial parameters.
- "invite_to_vaquita" — el creador quiere invitar a alguien a SU vaquita. "invitar a mi vaquita", "compartir mi vaquita", "agregar amigos"
- "join_vaquita" — alguien quiere unirse a una vaquita ajena. "quiero unirme", "me uno", "código abc123", "unirme con código xyz". Si menciona un código, extraerlo en "code".
- "list_my_vaquitas" — quieren ver sus vaquitas existentes
- "view_vaquita" — quieren detalles de una vaquita específica
- "help" — piden ayuda, "cómo funciona"
- "cancel" — quieren cancelar, "cancelar", "salir", "atrás"
- "confirm" — sí, "dale", "ok", "está bien"
- "deny" — no, "mejor no", "espérate"
- "unknown" — no encaja

CRITICAL RULES for create_vaquita parameter extraction:
- "al mes"/"mensual" → cycleDays=30; "quincenal" → 15; "semanal" → 7; "cada N días" → N
- Total durations like "por 6 meses", "durante un año" are AMBIGUOUS — DO NOT set cycleDays.
- When BOTH a cadence and a duration appear, prefer the cadence.

Examples (input → output):
- "hola" → {"kind":"greeting"}
- "quiero hacer una vaquita" → {"kind":"create_vaquita","partial":{}}
- "vaquita de 500 al mes con 4 personas" → {"kind":"create_vaquita","partial":{"contributionMXN":500,"totalMembers":4,"cycleDays":30}}
- "vaquita de 200 al mes con 5 personas por 6 meses" → {"kind":"create_vaquita","partial":{"contributionMXN":200,"totalMembers":5,"cycleDays":30}}
- "vaquita de 1000 con 4 personas durante un año" → {"kind":"create_vaquita","partial":{"contributionMXN":1000,"totalMembers":4}}
- "invitar a mi vaquita" → {"kind":"invite_to_vaquita"}
- "compartir mi vaquita" → {"kind":"invite_to_vaquita"}
- "quiero unirme a la vaquita" → {"kind":"join_vaquita"}
- "me uno con código abc12345" → {"kind":"join_vaquita","code":"abc12345"}
- "código xyz98765" → {"kind":"join_vaquita","code":"xyz98765"}
- "muéstrame mis vaquitas" → {"kind":"list_my_vaquitas"}
- "ayuda" → {"kind":"help"}
- "cancelar" → {"kind":"cancel"}
- "sí dale" → {"kind":"confirm"}
- "no" → {"kind":"deny"}

Output schema:
{ "kind": "...", "partial"?: {...}, "code"?: "...", "address"?: "0x..." }`;

const intentSchema = z.object({
    kind: z.enum([
        "greeting",
        "create_vaquita",
        "invite_to_vaquita",
        "join_vaquita",
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
    code: z.string().regex(/^[a-z0-9]{4,20}$/i).optional(),
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
            case "join_vaquita":
                return {
                    kind: "join_vaquita",
                    ...(result.code ? { code: result.code } : {}),
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

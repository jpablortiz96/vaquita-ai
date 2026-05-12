import { describe, it, expect } from "vitest";
import { classifyIntent } from "../../src/bot/intent-classifier.js";

const skip = process.env.SKIP_AI_TESTS === "true";

describe.skipIf(skip)("intent classifier (live AI)", () => {
    it("recognizes greetings", async () => {
        const intent = await classifyIntent("hola");
        expect(intent.kind).toBe("greeting");
    }, 30_000);

    it("recognizes help requests", async () => {
        const intent = await classifyIntent("ayuda");
        expect(intent.kind).toBe("help");
    }, 30_000);

    it("recognizes create_vaquita intent and extracts parameters", async () => {
        const intent = await classifyIntent("quiero hacer una vaquita de 500 al mes con 4 amigos");
        expect(intent.kind).toBe("create_vaquita");
        if (intent.kind === "create_vaquita") {
            expect(intent.partial.contributionMXN).toBe(500);
            // "4 amigos" is ambiguous: Claude may count 4 (members only) or 5 (friends + creator).
            // Both interpretations are valid NLU; we accept either.
            expect(intent.partial.totalMembers).toBeGreaterThanOrEqual(4);
            expect(intent.partial.totalMembers).toBeLessThanOrEqual(5);
        }
    }, 30_000);

    it("recognizes confirmation", async () => {
        const intent = await classifyIntent("sí dale");
        expect(intent.kind).toBe("confirm");
    }, 30_000);

    it("recognizes cancellation", async () => {
        const intent = await classifyIntent("cancelar");
        expect(intent.kind).toBe("cancel");
    }, 30_000);

    it("recognizes list intent", async () => {
        const intent = await classifyIntent("muéstrame mis vaquitas");
        expect(intent.kind).toBe("list_my_vaquitas");
    }, 30_000);
});

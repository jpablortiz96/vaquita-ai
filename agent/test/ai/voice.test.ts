import { describe, it, expect, vi, beforeEach } from "vitest";

describe("voice synthesis", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("throws gracefully when not configured", async () => {
        vi.doMock("../../src/config/env.js", () => ({
            env: { PORT: 3001 },
            isVoiceConfigured: () => false,
            isBotConfigured: () => false,
        }));

        const { synthesizeSpanish } = await import("../../src/ai/voice.js");
        await expect(synthesizeSpanish("hola")).rejects.toThrow(/not configured/i);
    });

    it("exports the expected functions when module loads", async () => {
        vi.doMock("../../src/config/env.js", () => ({
            env: { PORT: 3001, ELEVENLABS_API_KEY: "test-key-xxx", ELEVENLABS_VOICE_ID_ES: "test-voice-yyy" },
            isVoiceConfigured: () => true,
            isBotConfigured: () => false,
        }));
        const mod = await import("../../src/ai/voice.js");
        expect(typeof mod.synthesizeSpanish).toBe("function");
        expect(typeof mod.audioPublicUrl).toBe("function");
        expect(typeof mod.AUDIO_DIRECTORY).toBe("string");
    });
});

describe("voice scripts", () => {
    it("welcomeApprovedScript produces natural Spanish", async () => {
        const { welcomeApprovedScript } = await import("../../src/ai/voice-scripts.js");
        const text = welcomeApprovedScript({
            candidateName: "María González",
            contributionAmount: "100",
            totalMembers: 4,
            cycleDays: 7,
        });
        expect(text).toContain("María");
        expect(text).toContain("100");
        expect(text).toContain("7");
        expect(text).toContain("vaquita");
        expect(text.length).toBeLessThan(500);
    });

    it("yourTurnScript greets and announces the amount", async () => {
        const { yourTurnScript } = await import("../../src/ai/voice-scripts.js");
        const text = yourTurnScript({
            recipientName: "Carlos",
            amountReceived: "400",
        });
        expect(text).toContain("Carlos");
        expect(text).toContain("400");
        expect(text).toContain("Felicidades");
    });

    it("uses only the first name from full names", async () => {
        const { welcomeApprovedScript } = await import("../../src/ai/voice-scripts.js");
        const text = welcomeApprovedScript({
            candidateName: "Juan Pablo Ortiz",
            contributionAmount: "500",
            totalMembers: 5,
            cycleDays: 30,
        });
        expect(text).toContain("Juan");
        expect(text).not.toContain("Pablo");
    });
});

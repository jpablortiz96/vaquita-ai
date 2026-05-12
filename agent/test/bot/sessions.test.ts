import { describe, it, expect, beforeEach } from "vitest";
import {
    _clearAllSessions,
    getOrCreateSession,
    normalizePhone,
    resetSession,
    setState,
} from "../../src/bot/sessions.js";

describe("sessions", () => {
    beforeEach(() => _clearAllSessions());

    it("normalizes WhatsApp phone format", () => {
        expect(normalizePhone("whatsapp:+5215512345678")).toBe("+5215512345678");
        expect(normalizePhone("+5215512345678")).toBe("+5215512345678");
    });

    it("stores conversation state across calls", () => {
        setState("+5215512345678", {
            kind: "creating_vaquita",
            step: "ask_amount",
            partial: {},
        });
        const s = getOrCreateSession("+5215512345678");
        expect(s.state.kind).toBe("creating_vaquita");
    });

    it("resets to idle", () => {
        setState("+5215512345678", { kind: "creating_vaquita", step: "ask_amount", partial: {} });
        resetSession("+5215512345678");
        const s = getOrCreateSession("+5215512345678");
        expect(s.state.kind).toBe("idle");
    });
});

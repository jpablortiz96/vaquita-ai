import { describe, it, expect, beforeEach } from "vitest";
import { _clearAllSessions, getOrCreateSession } from "../../src/bot/sessions.js";

describe("bot engine — state machine paths (no AI)", () => {
    beforeEach(() => {
        _clearAllSessions();
    });

    it("creates a session for a new phone", () => {
        const s = getOrCreateSession("+5215512345678");
        expect(s.phone).toBe("+5215512345678");
        expect(s.state.kind).toBe("idle");
    });

    it("returns the same session on subsequent calls", () => {
        const a = getOrCreateSession("+5215512345678");
        const b = getOrCreateSession("+5215512345678");
        expect(a).toBe(b);
    });
});

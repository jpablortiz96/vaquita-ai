import type { Session, ConversationState } from "./types.js";

const sessions = new Map<string, Session>();

/** Normalize a phone like "whatsapp:+5215512345678" to "+5215512345678". */
export function normalizePhone(twilioFrom: string): string {
    return twilioFrom.replace(/^whatsapp:/, "").trim();
}

export function getOrCreateSession(phone: string): Session {
    const existing = sessions.get(phone);
    if (existing) return existing;
    const fresh: Session = {
        phone,
        state: { kind: "idle" },
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    sessions.set(phone, fresh);
    return fresh;
}

export function setState(phone: string, state: ConversationState): Session {
    const s = getOrCreateSession(phone);
    s.state = state;
    s.updatedAt = Date.now();
    sessions.set(phone, s);
    return s;
}

export function resetSession(phone: string): void {
    setState(phone, { kind: "idle" });
}

export function allSessions(): Session[] {
    return [...sessions.values()];
}

/** For testing only — wipes all sessions. */
export function _clearAllSessions(): void {
    sessions.clear();
}

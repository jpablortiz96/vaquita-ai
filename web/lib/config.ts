/**
 * Public base URL of the agent backend (Render in production, localhost in dev).
 *
 * The current V1 frontend reads vaquita state directly from the chain via wagmi,
 * so it does not yet call the agent. This constant is the single wiring point for
 * when the frontend starts talking to the agent API (e.g. real member scores).
 * Set NEXT_PUBLIC_AGENT_URL in Vercel to the Render backend URL.
 */
export const AGENT_URL =
    process.env.NEXT_PUBLIC_AGENT_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

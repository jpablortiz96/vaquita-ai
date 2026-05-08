import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

/**
 * Shared Anthropic client. We use Claude Sonnet 4.5 as the workhorse model.
 */
export const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-5";

/**
 * Helper that calls Claude with a JSON-only system prompt and parses the response.
 * Strips markdown fences and validates the result shape.
 */
export async function callClaudeJSON<T>(args: {
    system: string;
    user: string;
    maxTokens?: number;
    validate: (data: unknown) => T;
}): Promise<T> {
    const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: args.maxTokens ?? 1500,
        system: args.system,
        messages: [{ role: "user", content: args.user }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
        throw new Error("Claude returned no text content");
    }
    const cleaned = textBlock.text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error(`Failed to parse Claude response as JSON: ${cleaned.slice(0, 200)}`);
    }
    return args.validate(parsed);
}

import type { Address } from "viem";

/** Conversation states the bot can be in. */
export type ConversationState =
    | { kind: "idle" }
    | { kind: "creating_vaquita"; step: CreateStep; partial: Partial<CreateVaquitaInput> }
    | {
          kind: "joining_vaquita";
          step: JoinStep;
          partial: Partial<JoinInput>;
          vaquitaAddress: Address;
          creatorPhone: string;
          inviteCode: string;
      }
    | { kind: "viewing_vaquita"; vaquita: Address };

export type CreateStep =
    | "ask_amount"
    | "ask_members"
    | "ask_cycle"
    | "ask_collateral"
    | "confirm";

export type JoinStep =
    | "ask_name"
    | "ask_occupation"
    | "ask_income"
    | "ask_relation"
    | "scoring";

export interface CreateVaquitaInput {
    contributionMXN: number;
    totalMembers: number;
    cycleDays: number;
    collateralMXN: number;
}

export interface JoinInput {
    name: string;
    occupation: string;
    monthlyIncomeMXN: number;
    timeInCommunityMonths: number;
}

export interface Session {
    phone: string;
    state: ConversationState;
    walletAddress?: Address;
    createdAt: number;
    updatedAt: number;
}

/** Result of intent classification by Claude. */
export type Intent =
    | { kind: "greeting" }
    | { kind: "create_vaquita"; partial: Partial<CreateVaquitaInput> }
    | { kind: "invite_to_vaquita" }
    | { kind: "join_vaquita"; code?: string }
    | { kind: "list_my_vaquitas" }
    | { kind: "view_vaquita"; address?: Address }
    | { kind: "help" }
    | { kind: "cancel" }
    | { kind: "confirm" }
    | { kind: "deny" }
    | { kind: "unknown"; raw: string };

import { Address } from "viem";

export * from "./trading";

export interface IUserMetadata {
    user_address: Address;
    is_whitelisted: boolean;
    gm_count: number;
    gm_last_claimed_at: Date;
    streak_count: number;
    metadata: Record<string, unknown>;
    created_at: Date;
    invited_by: string;
    invite_codes: {
        code: string;
        is_used: boolean;
    }[];
}

export interface IAgent {
    name: string;
    address: Address;
    privateKey: string;
}

export interface IPendingAgentPayload {
    params: {
        agentName: string;
        agent: Address;
        forAccount: Address;
        signature: string;
        validUntil: number;
        nonce: number;
    };
    signature: string;
    privateKey: string;
}



/**
 * Minimal ABIs needed by the agent. We only export the function/event signatures
 * we actually call so the bundle stays light. Full ABIs are still available in
 * contracts/out/ if needed for debugging.
 */

export const mockMXNBAbi = [
    {
        type: "function",
        name: "decimals",
        stateMutability: "pure",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        type: "function",
        name: "mint",
        stateMutability: "nonpayable",
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "faucet",
        stateMutability: "nonpayable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: [],
    },
] as const;

export const vaquitaFactoryAbi = [
    {
        type: "function",
        name: "createVaquita",
        stateMutability: "nonpayable",
        inputs: [
            { name: "token", type: "address" },
            { name: "contributionAmount", type: "uint256" },
            { name: "collateralAmount", type: "uint256" },
            { name: "totalMembers", type: "uint8" },
            { name: "cycleDuration", type: "uint256" },
        ],
        outputs: [{ name: "vaquita", type: "address" }],
    },
    {
        type: "function",
        name: "totalVaquitas",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "getVaquitasByCreator",
        stateMutability: "view",
        inputs: [{ name: "creator", type: "address" }],
        outputs: [{ name: "", type: "address[]" }],
    },
    {
        type: "event",
        name: "VaquitaCreated",
        inputs: [
            { indexed: true, name: "vaquita", type: "address" },
            { indexed: true, name: "creator", type: "address" },
            { indexed: true, name: "token", type: "address" },
            { indexed: false, name: "contributionAmount", type: "uint256" },
            { indexed: false, name: "collateralAmount", type: "uint256" },
            { indexed: false, name: "totalMembers", type: "uint8" },
            { indexed: false, name: "cycleDuration", type: "uint256" },
            { indexed: false, name: "index", type: "uint256" },
        ],
        anonymous: false,
    },
] as const;

export const vaquitaAbi = [
    {
        type: "function",
        name: "status",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
    {
        type: "function",
        name: "creator",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
    },
    {
        type: "function",
        name: "contributionAmount",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "collateralAmount",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "totalMembers",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
    {
        type: "function",
        name: "cycleDuration",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "currentCycle",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
    {
        type: "function",
        name: "getMembers",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "address[]" }],
    },
    {
        type: "function",
        name: "getCurrentRecipient",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
    },
    {
        type: "function",
        name: "getCycleDeadline",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "join",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
    {
        type: "function",
        name: "setPayoutOrder",
        stateMutability: "nonpayable",
        inputs: [{ name: "order", type: "address[]" }],
        outputs: [],
    },
    {
        type: "function",
        name: "start",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
    {
        type: "function",
        name: "contribute",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
    {
        type: "function",
        name: "executeCycle",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
] as const;

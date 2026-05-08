// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console } from "forge-std/Script.sol";
import { MockMXNB } from "../src/mocks/MockMXNB.sol";
import { Vaquita } from "../src/Vaquita.sol";
import { VaquitaFactory } from "../src/VaquitaFactory.sol";

/**
 * @title Deploy
 * @notice Deploys the VaquitaAI core contracts to Arbitrum Sepolia (or any EVM chain).
 *
 *         Deploys in order:
 *           1. MockMXNB        — testnet stand-in for the real MXNB token (6 decimals).
 *           2. Vaquita         — implementation contract (locked at construction).
 *           3. VaquitaFactory  — uses Vaquita as the clone implementation.
 *
 * Usage (from contracts/):
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $ARBITRUM_SEPOLIA_RPC \
 *     --broadcast \
 *     --verify
 */
contract Deploy is Script {
    /// @dev Reads a private key stored with or without the 0x prefix.
    function _loadKey(string memory envVar) internal view returns (uint256) {
        string memory raw = vm.envString(envVar);
        bytes memory b = bytes(raw);
        string memory hex32 = (b.length >= 2 && b[0] == bytes1("0") && b[1] == bytes1("x"))
            ? raw
            : string.concat("0x", raw);
        return uint256(vm.parseBytes32(hex32));
    }

    function run() external returns (MockMXNB token, Vaquita implementation, VaquitaFactory factory) {
        uint256 deployerKey = _loadKey("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("=== VaquitaAI deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Deployer balance (wei):", deployer.balance);

        vm.startBroadcast(deployerKey);

        // 1. MockMXNB
        token = new MockMXNB(deployer);
        console.log("MockMXNB deployed at:", address(token));

        // 2. Vaquita implementation (locked in its constructor)
        implementation = new Vaquita();
        console.log("Vaquita implementation deployed at:", address(implementation));

        // 3. Factory pointing at the implementation
        factory = new VaquitaFactory(address(implementation));
        console.log("VaquitaFactory deployed at:", address(factory));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Copy these into your .env / frontend / agent ===");
        console.log("MOCK_MXNB_ADDRESS=", address(token));
        console.log("VAQUITA_IMPLEMENTATION_ADDRESS=", address(implementation));
        console.log("VAQUITA_FACTORY_ADDRESS=", address(factory));
    }
}

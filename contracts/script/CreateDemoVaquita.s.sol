// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MockMXNB } from "../src/mocks/MockMXNB.sol";
import { VaquitaFactory } from "../src/VaquitaFactory.sol";

/**
 * @title CreateDemoVaquita
 * @notice Creates the "VaquitaAI Genesis" demo vaquita on the configured network.
 *         Uses 4 members, 100 mMXNB contribution per cycle, 300 mMXNB collateral,
 *         7-day cycle. The deployer is the creator and will need to add members
 *         later via the frontend / WhatsApp bot.
 *
 * Usage:
 *   forge script script/CreateDemoVaquita.s.sol:CreateDemoVaquita \
 *     --rpc-url $ARBITRUM_SEPOLIA_RPC \
 *     --broadcast
 */
contract CreateDemoVaquita is Script {
    function _loadKey(string memory envVar) internal view returns (uint256) {
        string memory raw = vm.envString(envVar);
        bytes memory b = bytes(raw);
        string memory hex32 = (b.length >= 2 && b[0] == bytes1("0") && b[1] == bytes1("x"))
            ? raw
            : string.concat("0x", raw);
        return uint256(vm.parseBytes32(hex32));
    }

    function run() external returns (address vaquita) {
        uint256 deployerKey = _loadKey("DEPLOYER_PRIVATE_KEY");
        address token = vm.envAddress("MOCK_MXNB_ADDRESS");
        address factoryAddr = vm.envAddress("VAQUITA_FACTORY_ADDRESS");

        console.log("=== Creating Genesis Vaquita ===");
        console.log("Deployer:", vm.addr(deployerKey));
        console.log("Factory:", factoryAddr);
        console.log("Token:", token);

        vm.startBroadcast(deployerKey);

        VaquitaFactory factory = VaquitaFactory(factoryAddr);
        vaquita = factory.createVaquita(
            IERC20(token),
            100 * 10 ** 6, // 100 mMXNB per cycle
            300 * 10 ** 6, // 300 mMXNB collateral
            4, // 4 members
            7 days // 7-day cycle
        );

        vm.stopBroadcast();

        console.log("Genesis Vaquita deployed at:", vaquita);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Script, console } from "forge-std/Script.sol";
import { MockMXNB } from "../src/mocks/MockMXNB.sol";

/**
 * @title MintDemoTokens
 * @notice Mints 100,000 mMXNB to the deployer for use in demos and manual testing.
 *
 * Usage:
 *   forge script script/MintDemoTokens.s.sol:MintDemoTokens \
 *     --rpc-url $ARBITRUM_SEPOLIA_RPC \
 *     --broadcast
 */
contract MintDemoTokens is Script {
    function _loadKey(string memory envVar) internal view returns (uint256) {
        string memory raw = vm.envString(envVar);
        bytes memory b = bytes(raw);
        string memory hex32 = (b.length >= 2 && b[0] == bytes1("0") && b[1] == bytes1("x"))
            ? raw
            : string.concat("0x", raw);
        return uint256(vm.parseBytes32(hex32));
    }

    function run() external {
        uint256 deployerKey = _loadKey("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address tokenAddr = vm.envAddress("MOCK_MXNB_ADDRESS");

        console.log("Minting 100,000 mMXNB to:", deployer);

        vm.startBroadcast(deployerKey);
        MockMXNB(tokenAddr).mint(deployer, 100_000 * 10 ** 6);
        vm.stopBroadcast();

        console.log("Done. Balance:", MockMXNB(tokenAddr).balanceOf(deployer));
    }
}

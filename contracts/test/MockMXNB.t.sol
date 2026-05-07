// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { MockMXNB } from "../src/mocks/MockMXNB.sol";

contract MockMXNBTest is Test {
    MockMXNB internal token;
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        vm.prank(owner);
        token = new MockMXNB(owner);
    }

    function test_DecimalsAreSix() public view {
        assertEq(token.decimals(), 6, "MXNB must use 6 decimals like the real token");
    }

    function test_MetadataMatchesMock() public view {
        assertEq(token.name(), "Mexican Peso Bitso (Mock)");
        assertEq(token.symbol(), "mMXNB");
    }

    function test_OwnerCanMint() public {
        uint256 amount = 1_000 * 10 ** 6; // 1,000 MXNB

        vm.prank(owner);
        token.mint(alice, amount);

        assertEq(token.balanceOf(alice), amount);
        assertEq(token.totalSupply(), amount);
    }

    function test_NonOwnerCannotMint() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1_000 * 10 ** 6);
    }

    function test_FaucetWorksOncePerCooldown() public {
        uint256 amount = 100 * 10 ** 6; // 100 MXNB

        vm.prank(alice);
        token.faucet(amount);
        assertEq(token.balanceOf(alice), amount);

        // Second call immediately should revert.
        vm.prank(alice);
        vm.expectRevert();
        token.faucet(amount);

        // After cooldown, second call works.
        vm.warp(block.timestamp + 24 hours + 1);
        vm.prank(alice);
        token.faucet(amount);
        assertEq(token.balanceOf(alice), amount * 2);
    }

    function test_FaucetRespectsLimit() public {
        uint256 over = token.FAUCET_LIMIT() + 1;

        vm.prank(alice);
        vm.expectRevert();
        token.faucet(over);
    }

    function test_TransferWorks() public {
        uint256 amount = 500 * 10 ** 6;
        vm.prank(owner);
        token.mint(alice, amount);

        vm.prank(alice);
        bool success = token.transfer(bob, amount);
        assertTrue(success);

        assertEq(token.balanceOf(alice), 0);
        assertEq(token.balanceOf(bob), amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Vaquita } from "../src/Vaquita.sol";
import { MockMXNB } from "../src/mocks/MockMXNB.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaquitaTest is Test {
    // ─── Test fixtures ─────────────────────────────────────────────────
    MockMXNB internal token;
    Vaquita internal vaquita;

    address internal owner = makeAddr("owner");
    address internal creator = makeAddr("creator");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal dave = makeAddr("dave");

    // 4-member vaquita constants.
    uint8 internal constant N_MEMBERS = 4;
    uint256 internal constant CONTRIBUTION = 100 * 10 ** 6; // 100 MXNB
    uint256 internal constant COLLATERAL = 300 * 10 ** 6; // 300 MXNB (3x contribution)
    uint256 internal constant CYCLE = 7 days;
    uint256 internal constant SEED = 10_000 * 10 ** 6; // 10,000 MXNB seed per member

    function setUp() public virtual {
        // Deploy token, mint plenty to every test address, deploy vaquita.
        vm.prank(owner);
        token = new MockMXNB(owner);

        address[4] memory people = [alice, bob, carol, dave];
        for (uint256 i = 0; i < people.length; i++) {
            vm.prank(owner);
            token.mint(people[i], SEED);
        }

        vaquita = new Vaquita(IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    function _approveAndJoin(address user) internal {
        vm.startPrank(user);
        token.approve(address(vaquita), COLLATERAL);
        vaquita.join();
        vm.stopPrank();
    }

    function _joinAllMembers() internal {
        _approveAndJoin(alice);
        _approveAndJoin(bob);
        _approveAndJoin(carol);
        _approveAndJoin(dave);
    }

    function _defaultOrder() internal view returns (address[] memory order) {
        order = new address[](4);
        order[0] = alice;
        order[1] = bob;
        order[2] = carol;
        order[3] = dave;
    }

    function _setOrderAndStart() internal {
        _joinAllMembers();
        vm.prank(creator);
        vaquita.setPayoutOrder(_defaultOrder());
        vm.prank(creator);
        vaquita.start();
    }

    function _contribute(address user) internal {
        vm.startPrank(user);
        token.approve(address(vaquita), CONTRIBUTION);
        vaquita.contribute();
        vm.stopPrank();
    }

    function _contributeAll() internal {
        _contribute(alice);
        _contribute(bob);
        _contribute(carol);
        _contribute(dave);
    }

    // ─── Constructor ───────────────────────────────────────────────────

    function test_ConstructorSetsState() public view {
        assertEq(address(vaquita.token()), address(token));
        assertEq(vaquita.creator(), creator);
        assertEq(vaquita.contributionAmount(), CONTRIBUTION);
        assertEq(vaquita.collateralAmount(), COLLATERAL);
        assertEq(vaquita.totalMembers(), N_MEMBERS);
        assertEq(vaquita.cycleDuration(), CYCLE);
        assertEq(uint256(vaquita.status()), uint256(Vaquita.Status.Created));
        assertEq(vaquita.currentCycle(), 0);
    }

    function test_ConstructorRejectsBadParams() public {
        // zero token
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        new Vaquita(IERC20(address(0)), creator, CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        // zero creator
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        new Vaquita(IERC20(address(token)), address(0), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        // zero contribution
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        new Vaquita(IERC20(address(token)), creator, 0, COLLATERAL, N_MEMBERS, CYCLE);
        // too few members
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        new Vaquita(IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, 1, CYCLE);
        // too many members
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        new Vaquita(IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, 51, CYCLE);
        // zero cycle duration
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        new Vaquita(IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, N_MEMBERS, 0);
    }

    // ─── Joining ───────────────────────────────────────────────────────

    function test_MemberJoinsAndCollateralIsTaken() public {
        uint256 balanceBefore = token.balanceOf(alice);
        _approveAndJoin(alice);

        assertEq(token.balanceOf(alice), balanceBefore - COLLATERAL);
        assertEq(token.balanceOf(address(vaquita)), COLLATERAL);
        assertEq(vaquita.collateralBalance(alice), COLLATERAL);
        assertTrue(vaquita.isMember(alice));

        address[] memory ms = vaquita.getMembers();
        assertEq(ms.length, 1);
        assertEq(ms[0], alice);
    }

    function test_CannotJoinTwice() public {
        _approveAndJoin(alice);
        vm.startPrank(alice);
        token.approve(address(vaquita), COLLATERAL);
        vm.expectRevert(Vaquita.AlreadyMember.selector);
        vaquita.join();
        vm.stopPrank();
    }

    function test_CannotJoinWhenFull() public {
        _joinAllMembers();
        address eve = makeAddr("eve");
        vm.prank(owner);
        token.mint(eve, SEED);
        vm.startPrank(eve);
        token.approve(address(vaquita), COLLATERAL);
        vm.expectRevert(Vaquita.VaquitaFull.selector);
        vaquita.join();
        vm.stopPrank();
    }

    function test_CannotJoinWithoutApproval() public {
        vm.startPrank(alice);
        // No approval given.
        vm.expectRevert(); // SafeERC20 reverts on insufficient allowance
        vaquita.join();
        vm.stopPrank();
    }

    function test_CannotJoinAfterStart() public {
        _setOrderAndStart();
        address eve = makeAddr("eve");
        vm.prank(owner);
        token.mint(eve, SEED);
        vm.startPrank(eve);
        token.approve(address(vaquita), COLLATERAL);
        vm.expectRevert();
        vaquita.join();
        vm.stopPrank();
    }

    // ─── Payout order ──────────────────────────────────────────────────

    function test_CreatorSetsPayoutOrder() public {
        _joinAllMembers();
        address[] memory order = _defaultOrder();
        vm.prank(creator);
        vaquita.setPayoutOrder(order);

        assertTrue(vaquita.payoutOrderSet());
        address[] memory stored = vaquita.getPayoutOrder();
        for (uint256 i = 0; i < 4; i++) {
            assertEq(stored[i], order[i]);
        }
    }

    function test_NonCreatorCannotSetOrder() public {
        _joinAllMembers();
        vm.prank(alice);
        vm.expectRevert(Vaquita.NotCreator.selector);
        vaquita.setPayoutOrder(_defaultOrder());
    }

    function test_CannotSetOrderBeforeAllJoined() public {
        _approveAndJoin(alice);
        _approveAndJoin(bob);
        vm.prank(creator);
        vm.expectRevert(Vaquita.AllMembersHaveNotJoined.selector);
        vaquita.setPayoutOrder(_defaultOrder());
    }

    function test_RejectsOrderWithDuplicates() public {
        _joinAllMembers();
        address[] memory bad = new address[](4);
        bad[0] = alice;
        bad[1] = bob;
        bad[2] = bob; // duplicate
        bad[3] = dave;
        vm.prank(creator);
        vm.expectRevert(Vaquita.InvalidPayoutOrder.selector);
        vaquita.setPayoutOrder(bad);
    }

    function test_RejectsOrderWithNonMember() public {
        _joinAllMembers();
        address[] memory bad = new address[](4);
        bad[0] = alice;
        bad[1] = bob;
        bad[2] = carol;
        bad[3] = makeAddr("stranger");
        vm.prank(creator);
        vm.expectRevert(Vaquita.InvalidPayoutOrder.selector);
        vaquita.setPayoutOrder(bad);
    }

    function test_RejectsOrderWithWrongLength() public {
        _joinAllMembers();
        address[] memory bad = new address[](3);
        bad[0] = alice;
        bad[1] = bob;
        bad[2] = carol;
        vm.prank(creator);
        vm.expectRevert(Vaquita.InvalidPayoutOrder.selector);
        vaquita.setPayoutOrder(bad);
    }

    // ─── Start ─────────────────────────────────────────────────────────

    function test_CreatorStartsVaquita() public {
        _setOrderAndStart();
        assertEq(uint256(vaquita.status()), uint256(Vaquita.Status.Active));
        assertEq(vaquita.currentCycle(), 1);
        assertEq(vaquita.getCurrentRecipient(), alice);
    }

    function test_CannotStartWithoutPayoutOrder() public {
        _joinAllMembers();
        vm.prank(creator);
        vm.expectRevert(Vaquita.PayoutOrderNotSet.selector);
        vaquita.start();
    }

    // ─── Contributing ──────────────────────────────────────────────────

    function test_MemberContributesInActiveCycle() public {
        _setOrderAndStart();
        uint256 vaultBefore = token.balanceOf(address(vaquita));
        _contribute(alice);
        assertTrue(vaquita.hasContributed(1, alice));
        assertEq(token.balanceOf(address(vaquita)), vaultBefore + CONTRIBUTION);
    }

    function test_CannotContributeTwiceInSameCycle() public {
        _setOrderAndStart();
        _contribute(alice);
        vm.startPrank(alice);
        token.approve(address(vaquita), CONTRIBUTION);
        vm.expectRevert(Vaquita.AlreadyContributed.selector);
        vaquita.contribute();
        vm.stopPrank();
    }

    function test_NonMemberCannotContribute() public {
        _setOrderAndStart();
        address eve = makeAddr("eve");
        vm.prank(owner);
        token.mint(eve, SEED);
        vm.startPrank(eve);
        token.approve(address(vaquita), CONTRIBUTION);
        vm.expectRevert(Vaquita.NotMember.selector);
        vaquita.contribute();
        vm.stopPrank();
    }

    // ─── Cycle execution ───────────────────────────────────────────────

    function test_CycleExecutesAndPaysCorrectRecipient() public {
        _setOrderAndStart();
        _contributeAll();

        uint256 aliceBefore = token.balanceOf(alice);
        vm.warp(block.timestamp + CYCLE + 1);
        vaquita.executeCycle();

        // Alice was first in payout order; she should have received the full pool.
        uint256 expectedPool = uint256(N_MEMBERS) * CONTRIBUTION;
        assertEq(token.balanceOf(alice), aliceBefore + expectedPool);
        assertEq(vaquita.currentCycle(), 2);
        assertEq(vaquita.getCurrentRecipient(), bob);
    }

    function test_CannotExecuteBeforeDeadline() public {
        _setOrderAndStart();
        _contributeAll();
        vm.expectRevert(Vaquita.CycleStillActive.selector);
        vaquita.executeCycle();
    }

    function test_MissingContributionCoveredByCollateral() public {
        _setOrderAndStart();
        // Only 3 of 4 contribute; carol skips.
        _contribute(alice);
        _contribute(bob);
        _contribute(dave);

        vm.warp(block.timestamp + CYCLE + 1);
        vaquita.executeCycle();

        // Carol should be marked defaulted; her collateral reduced by contribution.
        assertTrue(vaquita.hasDefaulted(carol));
        assertEq(vaquita.collateralBalance(carol), COLLATERAL - CONTRIBUTION);
        // Cycle still settled; alice received pool.
        assertEq(vaquita.currentCycle(), 2);
    }

    function test_VaquitaTerminatesIfCollateralInsufficient() public {
        // Deploy a vaquita where collateral == contribution, so a member can default once
        // and then fail the second time.
        Vaquita tight = new Vaquita(IERC20(address(token)), creator, CONTRIBUTION, CONTRIBUTION, N_MEMBERS, CYCLE);

        address[4] memory people = [alice, bob, carol, dave];
        for (uint256 i = 0; i < 4; i++) {
            vm.startPrank(people[i]);
            token.approve(address(tight), CONTRIBUTION);
            tight.join();
            vm.stopPrank();
        }
        address[] memory order = _defaultOrder();
        vm.prank(creator);
        tight.setPayoutOrder(order);
        vm.prank(creator);
        tight.start();

        // Cycle 1: carol skips → covered by her collateral → she's now defaulted with 0 collateral.
        vm.startPrank(alice);
        token.approve(address(tight), CONTRIBUTION);
        tight.contribute();
        vm.stopPrank();
        vm.startPrank(bob);
        token.approve(address(tight), CONTRIBUTION);
        tight.contribute();
        vm.stopPrank();
        vm.startPrank(dave);
        token.approve(address(tight), CONTRIBUTION);
        tight.contribute();
        vm.stopPrank();

        vm.warp(block.timestamp + CYCLE + 1);
        tight.executeCycle();
        assertEq(uint256(tight.status()), uint256(Vaquita.Status.Active));
        assertEq(tight.collateralBalance(carol), 0);

        // Cycle 2: carol skips again, her collateral is now 0 → vaquita terminates.
        vm.startPrank(alice);
        token.approve(address(tight), CONTRIBUTION);
        tight.contribute();
        vm.stopPrank();
        vm.startPrank(bob);
        token.approve(address(tight), CONTRIBUTION);
        tight.contribute();
        vm.stopPrank();
        vm.startPrank(dave);
        token.approve(address(tight), CONTRIBUTION);
        tight.contribute();
        vm.stopPrank();

        vm.warp(block.timestamp + CYCLE + 1);
        tight.executeCycle();
        assertEq(uint256(tight.status()), uint256(Vaquita.Status.Defaulted));
    }

    // ─── Full integration ──────────────────────────────────────────────

    function test_FullHappyPath() public {
        _setOrderAndStart();

        address[4] memory order = [alice, bob, carol, dave];
        uint256[4] memory balancesBefore;
        for (uint256 i = 0; i < 4; i++) {
            balancesBefore[i] = token.balanceOf(order[i]);
        }

        // Run all 4 cycles.
        for (uint256 c = 0; c < 4; c++) {
            _contributeAll();
            vm.warp(block.timestamp + CYCLE + 1);
            vaquita.executeCycle();
        }

        assertEq(uint256(vaquita.status()), uint256(Vaquita.Status.Completed));

        // Each member contributed 4*CONTRIBUTION, received 1*4*CONTRIBUTION = pool.
        // Net cash flow before collateral claim should be 0 vs balancesBefore.
        for (uint256 i = 0; i < 4; i++) {
            uint256 expected = balancesBefore[i] - 4 * CONTRIBUTION + 4 * CONTRIBUTION;
            assertEq(token.balanceOf(order[i]), expected);
        }

        // Each member can claim collateral back.
        for (uint256 i = 0; i < 4; i++) {
            vm.prank(order[i]);
            vaquita.claimCollateral();
            assertEq(vaquita.collateralBalance(order[i]), 0);
        }

        // Vaquita contract should now hold zero balance.
        assertEq(token.balanceOf(address(vaquita)), 0);
    }

    // ─── Collateral claim ──────────────────────────────────────────────

    function test_CannotClaimCollateralBeforeFinish() public {
        _setOrderAndStart();
        vm.prank(alice);
        vm.expectRevert();
        vaquita.claimCollateral();
    }

    function test_DefaulterGetsReducedCollateral() public {
        _setOrderAndStart();

        // Cycle 1: carol skips, gets defaulted, collateral reduced.
        _contribute(alice);
        _contribute(bob);
        _contribute(dave);
        vm.warp(block.timestamp + CYCLE + 1);
        vaquita.executeCycle();
        // Cycles 2-4: everyone contributes (carol resumes).
        for (uint256 c = 0; c < 3; c++) {
            _contributeAll();
            vm.warp(block.timestamp + CYCLE + 1);
            vaquita.executeCycle();
        }

        assertEq(uint256(vaquita.status()), uint256(Vaquita.Status.Completed));

        // Carol's claim should be COLLATERAL - CONTRIBUTION (one cycle covered by her collateral).
        uint256 carolBefore = token.balanceOf(carol);
        vm.prank(carol);
        vaquita.claimCollateral();
        assertEq(token.balanceOf(carol), carolBefore + (COLLATERAL - CONTRIBUTION));
    }
}

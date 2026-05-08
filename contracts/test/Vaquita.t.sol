// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Vaquita } from "../src/Vaquita.sol";
import { MockMXNB } from "../src/mocks/MockMXNB.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";

contract VaquitaTest is Test {
    MockMXNB internal token;
    Vaquita internal implementation;
    Vaquita internal vaquita;

    address internal owner = makeAddr("owner");
    address internal factory = makeAddr("factory");
    address internal creator = makeAddr("creator");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal dave = makeAddr("dave");

    uint8 internal constant N_MEMBERS = 4;
    uint256 internal constant CONTRIBUTION = 100 * 10 ** 6;
    uint256 internal constant COLLATERAL = 300 * 10 ** 6;
    uint256 internal constant CYCLE = 7 days;
    uint256 internal constant SEED = 10_000 * 10 ** 6;

    function setUp() public virtual {
        vm.prank(owner);
        token = new MockMXNB(owner);

        address[4] memory people = [alice, bob, carol, dave];
        for (uint256 i = 0; i < people.length; i++) {
            vm.prank(owner);
            token.mint(people[i], SEED);
        }

        // Deploy a single implementation, then clone for each test.
        implementation = new Vaquita();
        vaquita = _deployClone(CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
    }

    function _deployClone(
        uint256 contribution,
        uint256 collateral,
        uint8 nMembers,
        uint256 cycleSecs
    )
        internal
        returns (Vaquita v)
    {
        v = Vaquita(Clones.clone(address(implementation)));
        v.initialize(factory, IERC20(address(token)), creator, contribution, collateral, nMembers, cycleSecs);
    }

    function _approveAndJoin(Vaquita v, address user, uint256 collateral) internal {
        vm.startPrank(user);
        token.approve(address(v), collateral);
        v.join();
        vm.stopPrank();
    }

    function _approveAndJoin(address user) internal {
        _approveAndJoin(vaquita, user, COLLATERAL);
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

    // ─── Initialization ────────────────────────────────────────────────

    function test_InitializeSetsState() public view {
        assertEq(address(vaquita.token()), address(token));
        assertEq(vaquita.creator(), creator);
        assertEq(vaquita.factory(), factory);
        assertEq(vaquita.contributionAmount(), CONTRIBUTION);
        assertEq(vaquita.collateralAmount(), COLLATERAL);
        assertEq(vaquita.totalMembers(), N_MEMBERS);
        assertEq(vaquita.cycleDuration(), CYCLE);
        assertEq(uint256(vaquita.status()), uint256(Vaquita.Status.Created));
    }

    function test_CannotInitializeTwice() public {
        vm.expectRevert(Vaquita.AlreadyInitialized.selector);
        vaquita.initialize(factory, IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
    }

    function test_ImplementationCannotBeInitialized() public {
        // The implementation was locked in its constructor.
        vm.expectRevert(Vaquita.AlreadyInitialized.selector);
        implementation.initialize(factory, IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
    }

    function test_InitializeRejectsBadParams() public {
        Vaquita v = Vaquita(Clones.clone(address(implementation)));
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        v.initialize(factory, IERC20(address(0)), creator, CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);

        v = Vaquita(Clones.clone(address(implementation)));
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        v.initialize(factory, IERC20(address(token)), address(0), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);

        v = Vaquita(Clones.clone(address(implementation)));
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        v.initialize(factory, IERC20(address(token)), creator, 0, COLLATERAL, N_MEMBERS, CYCLE);

        v = Vaquita(Clones.clone(address(implementation)));
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        v.initialize(factory, IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, 1, CYCLE);

        v = Vaquita(Clones.clone(address(implementation)));
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        v.initialize(factory, IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, 51, CYCLE);

        v = Vaquita(Clones.clone(address(implementation)));
        vm.expectRevert(Vaquita.InvalidParameters.selector);
        v.initialize(factory, IERC20(address(token)), creator, CONTRIBUTION, COLLATERAL, N_MEMBERS, 0);
    }

    // ─── Joining ───────────────────────────────────────────────────────

    function test_MemberJoinsAndCollateralIsTaken() public {
        uint256 balanceBefore = token.balanceOf(alice);
        _approveAndJoin(alice);

        assertEq(token.balanceOf(alice), balanceBefore - COLLATERAL);
        assertEq(token.balanceOf(address(vaquita)), COLLATERAL);
        assertEq(vaquita.collateralBalance(alice), COLLATERAL);
        assertTrue(vaquita.isMember(alice));
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
        vm.expectRevert();
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
        bad[2] = bob;
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
        _contribute(alice);
        _contribute(bob);
        _contribute(dave);
        vm.warp(block.timestamp + CYCLE + 1);
        vaquita.executeCycle();
        assertTrue(vaquita.hasDefaulted(carol));
        assertEq(vaquita.collateralBalance(carol), COLLATERAL - CONTRIBUTION);
        assertEq(vaquita.currentCycle(), 2);
    }

    function test_VaquitaTerminatesIfCollateralInsufficient() public {
        Vaquita tight = _deployClone(CONTRIBUTION, CONTRIBUTION, N_MEMBERS, CYCLE);

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

        // Cycle 1: carol skips → covered by collateral → carol's collateral is now 0.
        for (uint256 i = 0; i < 4; i++) {
            if (people[i] == carol) continue;
            vm.startPrank(people[i]);
            token.approve(address(tight), CONTRIBUTION);
            tight.contribute();
            vm.stopPrank();
        }
        vm.warp(block.timestamp + CYCLE + 1);
        tight.executeCycle();
        assertEq(uint256(tight.status()), uint256(Vaquita.Status.Active));
        assertEq(tight.collateralBalance(carol), 0);

        // Cycle 2: carol skips again → no collateral → vaquita defaults.
        for (uint256 i = 0; i < 4; i++) {
            if (people[i] == carol) continue;
            vm.startPrank(people[i]);
            token.approve(address(tight), CONTRIBUTION);
            tight.contribute();
            vm.stopPrank();
        }
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

        for (uint256 c = 0; c < 4; c++) {
            _contributeAll();
            vm.warp(block.timestamp + CYCLE + 1);
            vaquita.executeCycle();
        }

        assertEq(uint256(vaquita.status()), uint256(Vaquita.Status.Completed));
        for (uint256 i = 0; i < 4; i++) {
            assertEq(token.balanceOf(order[i]), balancesBefore[i]);
        }

        for (uint256 i = 0; i < 4; i++) {
            vm.prank(order[i]);
            vaquita.claimCollateral();
            assertEq(vaquita.collateralBalance(order[i]), 0);
        }

        assertEq(token.balanceOf(address(vaquita)), 0);
    }

    function test_CannotClaimCollateralBeforeFinish() public {
        _setOrderAndStart();
        vm.prank(alice);
        vm.expectRevert();
        vaquita.claimCollateral();
    }

    function test_DefaulterGetsReducedCollateral() public {
        _setOrderAndStart();

        _contribute(alice);
        _contribute(bob);
        _contribute(dave);
        vm.warp(block.timestamp + CYCLE + 1);
        vaquita.executeCycle();

        for (uint256 c = 0; c < 3; c++) {
            _contributeAll();
            vm.warp(block.timestamp + CYCLE + 1);
            vaquita.executeCycle();
        }

        assertEq(uint256(vaquita.status()), uint256(Vaquita.Status.Completed));

        uint256 carolBefore = token.balanceOf(carol);
        vm.prank(carol);
        vaquita.claimCollateral();
        assertEq(token.balanceOf(carol), carolBefore + (COLLATERAL - CONTRIBUTION));
    }
}

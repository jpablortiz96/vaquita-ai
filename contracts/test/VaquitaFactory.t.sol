// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { Vm } from "forge-std/Vm.sol";
import { Vaquita } from "../src/Vaquita.sol";
import { VaquitaFactory } from "../src/VaquitaFactory.sol";
import { MockMXNB } from "../src/mocks/MockMXNB.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaquitaFactoryTest is Test {
    MockMXNB internal token;
    Vaquita internal implementation;
    VaquitaFactory internal factory;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant CONTRIBUTION = 100 * 10 ** 6;
    uint256 internal constant COLLATERAL = 300 * 10 ** 6;
    uint8 internal constant N_MEMBERS = 4;
    uint256 internal constant CYCLE = 7 days;

    function setUp() public {
        vm.prank(owner);
        token = new MockMXNB(owner);

        implementation = new Vaquita();
        factory = new VaquitaFactory(address(implementation));
    }

    // ─── Constructor ───────────────────────────────────────────────────

    function test_ConstructorStoresImplementation() public view {
        assertEq(factory.implementation(), address(implementation));
    }

    function test_ConstructorRejectsZeroImplementation() public {
        vm.expectRevert(VaquitaFactory.InvalidImplementation.selector);
        new VaquitaFactory(address(0));
    }

    function test_ConstructorRejectsUninitializedImplementation() public {
        // A contract that is not Vaquita-shaped will revert when calling isInitialized().
        // We can simulate this by passing the token's address.
        vm.expectRevert();
        new VaquitaFactory(address(token));
    }

    // ─── Vaquita creation ──────────────────────────────────────────────

    function test_CreateVaquitaReturnsValidClone() public {
        vm.prank(alice);
        address vaqAddr = factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);

        assertTrue(vaqAddr != address(0));
        assertTrue(vaqAddr != address(implementation));

        Vaquita v = Vaquita(vaqAddr);
        assertEq(v.creator(), alice);
        assertEq(v.factory(), address(factory));
        assertEq(v.contributionAmount(), CONTRIBUTION);
        assertEq(v.collateralAmount(), COLLATERAL);
        assertEq(v.totalMembers(), N_MEMBERS);
        assertEq(v.cycleDuration(), CYCLE);
        assertEq(uint256(v.status()), uint256(Vaquita.Status.Created));
    }

    function test_CreateVaquitaIndexesByCreator() public {
        vm.prank(alice);
        address v1 = factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        vm.prank(alice);
        address v2 = factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        vm.prank(bob);
        address v3 = factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);

        assertEq(factory.totalVaquitas(), 3);
        assertEq(factory.vaquitaCountByCreator(alice), 2);
        assertEq(factory.vaquitaCountByCreator(bob), 1);

        address[] memory aliceVaquitas = factory.getVaquitasByCreator(alice);
        assertEq(aliceVaquitas.length, 2);
        assertEq(aliceVaquitas[0], v1);
        assertEq(aliceVaquitas[1], v2);

        address[] memory bobVaquitas = factory.getVaquitasByCreator(bob);
        assertEq(bobVaquitas.length, 1);
        assertEq(bobVaquitas[0], v3);
    }

    function test_CreateVaquitaEmitsEvent() public {
        vm.prank(alice);
        vm.recordLogs();
        address vaqAddr = factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        // First log is Initialized from Vaquita; last is VaquitaCreated from factory.
        bool found;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == VaquitaFactory.VaquitaCreated.selector) {
                found = true;
                assertEq(address(uint160(uint256(entries[i].topics[1]))), vaqAddr);
                assertEq(address(uint160(uint256(entries[i].topics[2]))), alice);
                break;
            }
        }
        assertTrue(found, "VaquitaCreated event not emitted");
    }

    function test_ClonedVaquitasHaveIsolatedState() public {
        vm.prank(alice);
        address v1Addr = factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        vm.prank(bob);
        address v2Addr =
            factory.createVaquita(IERC20(address(token)), CONTRIBUTION * 2, COLLATERAL * 2, N_MEMBERS, CYCLE);

        Vaquita v1 = Vaquita(v1Addr);
        Vaquita v2 = Vaquita(v2Addr);

        assertEq(v1.contributionAmount(), CONTRIBUTION);
        assertEq(v2.contributionAmount(), CONTRIBUTION * 2);
        assertEq(v1.creator(), alice);
        assertEq(v2.creator(), bob);
    }

    function test_CloneCannotBeReinitialized() public {
        vm.prank(alice);
        address vaqAddr = factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);

        vm.expectRevert(Vaquita.AlreadyInitialized.selector);
        Vaquita(vaqAddr).initialize(
            address(factory), IERC20(address(token)), bob, CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE
        );
    }

    // ─── Pagination ────────────────────────────────────────────────────

    function test_GetVaquitasPagination() public {
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(alice);
            factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        }

        address[] memory page0 = factory.getVaquitas(0, 3);
        assertEq(page0.length, 3);

        address[] memory page1 = factory.getVaquitas(3, 3);
        assertEq(page1.length, 2);

        address[] memory pageEmpty = factory.getVaquitas(10, 3);
        assertEq(pageEmpty.length, 0);
    }

    // ─── Gas characterization ──────────────────────────────────────────

    function test_CloneIsCheaperThanFullDeploy() public {
        // Sanity check: a clone via the factory should be far cheaper than deploying
        // a fresh Vaquita. We measure approximate gas.
        uint256 gasBeforeClone = gasleft();
        vm.prank(alice);
        factory.createVaquita(IERC20(address(token)), CONTRIBUTION, COLLATERAL, N_MEMBERS, CYCLE);
        uint256 cloneGas = gasBeforeClone - gasleft();

        // A fresh deployment will cost over 1M gas based on Step 2 measurements.
        assertLt(cloneGas, 500_000, "clone deployment should cost less than 500k gas");
    }
}

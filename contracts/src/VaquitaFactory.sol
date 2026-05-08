// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Vaquita } from "./Vaquita.sol";

/**
 * @title VaquitaFactory
 * @author VaquitaAI Team
 * @notice Deploys Vaquita instances cheaply using EIP-1167 minimal proxies (clones).
 *         Each clone shares the implementation's logic but has its own storage, so
 *         per-vaquita state is fully isolated.
 *
 * @dev    Deployment cost per vaquita drops from ~1.5M gas (full deploy) to ~50K gas
 *         (clone). The factory also indexes every vaquita it creates so the frontend
 *         and AI agent can list them without scanning logs.
 */
contract VaquitaFactory {
    /// @notice Address of the Vaquita implementation contract that all clones delegate to.
    address public immutable implementation;

    /// @notice All vaquitas created by this factory, in deployment order.
    address[] public allVaquitas;

    /// @notice Vaquitas created by a given address.
    mapping(address => address[]) public vaquitasByCreator;

    event VaquitaCreated(
        address indexed vaquita,
        address indexed creator,
        address indexed token,
        uint256 contributionAmount,
        uint256 collateralAmount,
        uint8 totalMembers,
        uint256 cycleDuration,
        uint256 index
    );

    error InvalidImplementation();

    constructor(address _implementation) {
        if (_implementation == address(0)) revert InvalidImplementation();
        // Sanity check: the implementation must already be initialized (locked) to
        // prevent someone from initializing it directly and locking storage there.
        if (!Vaquita(_implementation).isInitialized()) revert InvalidImplementation();
        implementation = _implementation;
    }

    /**
     * @notice Deploy a new vaquita as a clone of the implementation.
     * @param token              ERC-20 used for contributions and collateral.
     * @param contributionAmount Amount each member contributes per cycle.
     * @param collateralAmount   Amount each member escrows on join.
     * @param totalMembers       Total members (and cycles).
     * @param cycleDuration      Duration of each cycle in seconds.
     * @return vaquita           Address of the newly-deployed clone.
     */
    function createVaquita(
        IERC20 token,
        uint256 contributionAmount,
        uint256 collateralAmount,
        uint8 totalMembers,
        uint256 cycleDuration
    )
        external
        returns (address vaquita)
    {
        vaquita = Clones.clone(implementation);
        Vaquita(vaquita).initialize(
            address(this), token, msg.sender, contributionAmount, collateralAmount, totalMembers, cycleDuration
        );

        allVaquitas.push(vaquita);
        vaquitasByCreator[msg.sender].push(vaquita);

        emit VaquitaCreated(
            vaquita,
            msg.sender,
            address(token),
            contributionAmount,
            collateralAmount,
            totalMembers,
            cycleDuration,
            allVaquitas.length - 1
        );
    }

    /// @notice Total number of vaquitas ever created by this factory.
    function totalVaquitas() external view returns (uint256) {
        return allVaquitas.length;
    }

    /// @notice Number of vaquitas created by a specific address.
    function vaquitaCountByCreator(
        address creator
    )
        external
        view
        returns (uint256)
    {
        return vaquitasByCreator[creator].length;
    }

    /// @notice Returns a paginated slice of all vaquitas. Use offset+limit for chunking.
    function getVaquitas(
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (address[] memory page)
    {
        uint256 total = allVaquitas.length;
        if (offset >= total) {
            return new address[](0);
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        page = new address[](end - offset);
        for (uint256 i = 0; i < page.length; i++) {
            page[i] = allVaquitas[offset + i];
        }
    }

    /// @notice All vaquitas created by a given address.
    function getVaquitasByCreator(
        address creator
    )
        external
        view
        returns (address[] memory)
    {
        return vaquitasByCreator[creator];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vaquita
 * @author VaquitaAI Team
 * @notice Onchain rotating savings group (vaquita / tanda / cundina) with collateral
 *         protection and AI-driven payout ordering. Each cycle, every member contributes
 *         a fixed amount; one member receives the entire pool for that cycle. After N
 *         cycles (where N = number of members), every member has received once and the
 *         vaquita completes. Collateral is escrowed up front and used to cover any
 *         missed contribution.
 *
 * @dev    V1 trust model:
 *         - The creator submits the payout order on-chain (computed off-chain by the
 *           AI agent). V2 will source order from an on-chain RiskOracle.
 *         - Collateral is flat (same amount per member). V2 will scale by payout
 *           position so early recipients post more.
 *         - When the vaquita defaults mid-cycle (insufficient collateral), the pool
 *           collected so far is locked in the contract. Members may still claim their
 *           remaining collateral. V2 will redistribute proportionally.
 */
contract Vaquita is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Types ─────────────────────────────────────────────────────────

    enum Status {
        Created, // 0: accepting joins, awaiting setup
        Active, // 1: cycles in progress
        Completed, // 2: all cycles finished, collateral claimable
        Defaulted // 3: terminated due to under-collateralization

    }

    // ─── Constants ─────────────────────────────────────────────────────

    uint8 public constant MIN_MEMBERS = 2;
    uint8 public constant MAX_MEMBERS = 50;

    // ─── Immutables ────────────────────────────────────────────────────

    /// @notice MXNB (or any ERC-20) used for contributions and collateral.
    IERC20 public immutable token;
    /// @notice Address that deployed the vaquita and is allowed to set payout order + start.
    address public immutable creator;
    /// @notice Amount each member must contribute per cycle (token's smallest unit, 6 decimals for MXNB).
    uint256 public immutable contributionAmount;
    /// @notice Amount each member must escrow as collateral on join.
    uint256 public immutable collateralAmount;
    /// @notice Total number of members (also equals number of cycles).
    uint8 public immutable totalMembers;
    /// @notice Duration of each cycle in seconds.
    uint256 public immutable cycleDuration;

    // ─── State ─────────────────────────────────────────────────────────

    Status public status;
    address[] public members;
    address[] public payoutOrder;
    /// @notice 0 = not started; 1..totalMembers = active cycle; totalMembers+1 = completed.
    uint8 public currentCycle;
    uint256 public cycleStartTime;
    bool public payoutOrderSet;

    mapping(address => bool) public isMember;
    mapping(address => uint256) public collateralBalance;
    mapping(address => bool) public hasDefaulted;
    /// @notice cycle => member => contributed in that cycle?
    mapping(uint8 => mapping(address => bool)) public hasContributed;

    // ─── Events ────────────────────────────────────────────────────────

    event MemberJoined(address indexed member, uint8 totalJoined);
    event PayoutOrderSet(address[] order);
    event VaquitaStarted(uint256 startTime);
    event Contributed(address indexed member, uint8 indexed cycle, uint256 amount);
    event CycleExecuted(uint8 indexed cycle, address indexed recipient, uint256 amount);
    event MemberDefaulted(address indexed member, uint8 indexed cycle);
    event CollateralReturned(address indexed member, uint256 amount);
    event VaquitaCompleted();
    event VaquitaTerminated(string reason);

    // ─── Errors ────────────────────────────────────────────────────────

    error NotCreator();
    error InvalidParameters();
    error InvalidStatus(Status expected, Status actual);
    error AlreadyMember();
    error NotMember();
    error VaquitaFull();
    error AllMembersHaveNotJoined();
    error InvalidPayoutOrder();
    error PayoutOrderNotSet();
    error PayoutOrderAlreadySet();
    error AlreadyContributed();
    error CycleStillActive();

    // ─── Modifiers ─────────────────────────────────────────────────────

    modifier onlyCreator() {
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    modifier onlyMember() {
        if (!isMember[msg.sender]) revert NotMember();
        _;
    }

    modifier inStatus(Status expected) {
        if (status != expected) revert InvalidStatus(expected, status);
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────

    /**
     * @notice Deploy a new vaquita.
     * @param _token              ERC-20 token used for contributions and collateral (MXNB on mainnet).
     * @param _creator            Address allowed to set payout order and start the vaquita.
     * @param _contributionAmount Amount each member contributes per cycle.
     * @param _collateralAmount   Amount each member must escrow on join (can be 0 in low-trust setups).
     * @param _totalMembers       Total members (and total cycles); 2 <= n <= 50.
     * @param _cycleDuration      Duration of each cycle in seconds.
     */
    constructor(
        IERC20 _token,
        address _creator,
        uint256 _contributionAmount,
        uint256 _collateralAmount,
        uint8 _totalMembers,
        uint256 _cycleDuration
    ) {
        if (address(_token) == address(0)) revert InvalidParameters();
        if (_creator == address(0)) revert InvalidParameters();
        if (_contributionAmount == 0) revert InvalidParameters();
        if (_totalMembers < MIN_MEMBERS || _totalMembers > MAX_MEMBERS) revert InvalidParameters();
        if (_cycleDuration == 0) revert InvalidParameters();

        token = _token;
        creator = _creator;
        contributionAmount = _contributionAmount;
        collateralAmount = _collateralAmount;
        totalMembers = _totalMembers;
        cycleDuration = _cycleDuration;
        status = Status.Created;
    }

    // ─── Member onboarding ─────────────────────────────────────────────

    /**
     * @notice Join the vaquita and escrow collateral. Caller must have approved the contract
     *         to spend at least `collateralAmount` of the token.
     */
    function join() external inStatus(Status.Created) nonReentrant {
        if (isMember[msg.sender]) revert AlreadyMember();
        if (members.length >= totalMembers) revert VaquitaFull();

        if (collateralAmount > 0) {
            token.safeTransferFrom(msg.sender, address(this), collateralAmount);
            collateralBalance[msg.sender] = collateralAmount;
        }

        members.push(msg.sender);
        isMember[msg.sender] = true;

        emit MemberJoined(msg.sender, uint8(members.length));
    }

    // ─── Payout order ──────────────────────────────────────────────────

    /**
     * @notice Set the payout order. Callable once by the creator after all members have joined
     *         and before the vaquita starts. The order is computed off-chain by the AI agent.
     * @param order An array of length `totalMembers` containing each member exactly once.
     */
    function setPayoutOrder(
        address[] calldata order
    )
        external
        onlyCreator
        inStatus(Status.Created)
    {
        if (payoutOrderSet) revert PayoutOrderAlreadySet();
        if (members.length != totalMembers) revert AllMembersHaveNotJoined();
        if (order.length != totalMembers) revert InvalidPayoutOrder();

        // Validate composition: every entry must be a member, and every entry unique.
        uint256 len = order.length;
        for (uint256 i = 0; i < len; i++) {
            if (!isMember[order[i]]) revert InvalidPayoutOrder();
            for (uint256 j = i + 1; j < len; j++) {
                if (order[i] == order[j]) revert InvalidPayoutOrder();
            }
        }

        payoutOrder = order;
        payoutOrderSet = true;
        emit PayoutOrderSet(order);
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────

    /**
     * @notice Move vaquita from Created → Active. Only the creator may call this.
     *         Requires all members joined and payout order set.
     */
    function start() external onlyCreator inStatus(Status.Created) {
        if (members.length != totalMembers) revert AllMembersHaveNotJoined();
        if (!payoutOrderSet) revert PayoutOrderNotSet();

        status = Status.Active;
        currentCycle = 1;
        cycleStartTime = block.timestamp;

        emit VaquitaStarted(block.timestamp);
    }

    // ─── Contributions ─────────────────────────────────────────────────

    /**
     * @notice Contribute to the current cycle. Caller must have approved at least
     *         `contributionAmount` of the token.
     */
    function contribute() external inStatus(Status.Active) onlyMember nonReentrant {
        uint8 cycle = currentCycle;
        if (hasContributed[cycle][msg.sender]) revert AlreadyContributed();

        token.safeTransferFrom(msg.sender, address(this), contributionAmount);
        hasContributed[cycle][msg.sender] = true;

        emit Contributed(msg.sender, cycle, contributionAmount);
    }

    /**
     * @notice Settle the current cycle. Permissionless; anyone can call after the cycle
     *         deadline has passed. Covers any missing contributions from collateral, then
     *         distributes the full pool to the cycle's recipient and advances state.
     *
     * @dev    block.timestamp comparison is acceptable here because cycle deadlines are
     *         measured in days, not seconds. Validator-level manipulation on Arbitrum is
     *         bounded to a few seconds, which is irrelevant at this granularity.
     */
    function executeCycle() external inStatus(Status.Active) nonReentrant {
        if (block.timestamp < cycleStartTime + cycleDuration) revert CycleStillActive();

        uint8 cycle = currentCycle;
        uint256 len = members.length;

        // Cover missing contributions from collateral. If any member lacks collateral,
        // terminate the vaquita (V1 limitation: stuck pool is locked, only remaining
        // collateral is claimable).
        for (uint256 i = 0; i < len; i++) {
            address m = members[i];
            if (!hasContributed[cycle][m]) {
                if (collateralBalance[m] >= contributionAmount) {
                    collateralBalance[m] -= contributionAmount;
                    hasContributed[cycle][m] = true;
                    if (!hasDefaulted[m]) {
                        hasDefaulted[m] = true;
                        emit MemberDefaulted(m, cycle);
                    }
                } else {
                    status = Status.Defaulted;
                    emit VaquitaTerminated("under-collateralized");
                    return;
                }
            }
        }

        // Distribute pool to current cycle's recipient.
        address recipient = payoutOrder[cycle - 1];
        uint256 pool = uint256(totalMembers) * contributionAmount;
        token.safeTransfer(recipient, pool);
        emit CycleExecuted(cycle, recipient, pool);

        // Advance state.
        if (cycle == totalMembers) {
            status = Status.Completed;
            currentCycle = totalMembers + 1; // sentinel: out of valid range
            emit VaquitaCompleted();
        } else {
            currentCycle = cycle + 1;
            cycleStartTime = block.timestamp;
        }
    }

    // ─── Collateral claim ──────────────────────────────────────────────

    /**
     * @notice Claim remaining collateral. Available once the vaquita is Completed or Defaulted.
     *         Defaulters whose collateral has been fully consumed will receive 0.
     */
    function claimCollateral() external onlyMember nonReentrant {
        if (status != Status.Completed && status != Status.Defaulted) {
            revert InvalidStatus(Status.Completed, status);
        }
        uint256 balance = collateralBalance[msg.sender];
        if (balance == 0) return; // no-op for fully-defaulted or already-claimed members
        collateralBalance[msg.sender] = 0;
        token.safeTransfer(msg.sender, balance);
        emit CollateralReturned(msg.sender, balance);
    }

    // ─── Views ─────────────────────────────────────────────────────────

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getPayoutOrder() external view returns (address[] memory) {
        return payoutOrder;
    }

    function getCurrentRecipient() external view returns (address) {
        if (status != Status.Active || currentCycle == 0 || currentCycle > totalMembers) {
            return address(0);
        }
        return payoutOrder[currentCycle - 1];
    }

    function getCycleDeadline() external view returns (uint256) {
        if (status != Status.Active) return 0;
        return cycleStartTime + cycleDuration;
    }

    function poolBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}

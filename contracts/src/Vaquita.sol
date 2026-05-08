// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vaquita
 * @author VaquitaAI Team
 * @notice Onchain rotating savings group (vaquita / tanda / cundina) with collateral
 *         protection and AI-driven payout ordering.
 *
 * @dev    This contract is designed to be cloned via OpenZeppelin's Clones (EIP-1167).
 *         It exposes an `initialize` function instead of a parameterized constructor.
 *         The implementation contract itself is permanently locked at construction time
 *         to prevent it from being initialized directly.
 */
contract Vaquita is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Types ─────────────────────────────────────────────────────────

    enum Status {
        Created,
        Active,
        Completed,
        Defaulted
    }

    // ─── Constants ─────────────────────────────────────────────────────

    uint8 public constant MIN_MEMBERS = 2;
    uint8 public constant MAX_MEMBERS = 50;

    // ─── State (set in initialize) ─────────────────────────────────────

    bool private _initialized;
    bool private _initializing;

    IERC20 public token;
    address public factory;
    address public creator;
    uint256 public contributionAmount;
    uint256 public collateralAmount;
    uint8 public totalMembers;
    uint256 public cycleDuration;

    // ─── Runtime state ─────────────────────────────────────────────────

    Status public status;
    address[] public members;
    address[] public payoutOrder;
    uint8 public currentCycle;
    uint256 public cycleStartTime;
    bool public payoutOrderSet;

    mapping(address => bool) public isMember;
    mapping(address => uint256) public collateralBalance;
    mapping(address => bool) public hasDefaulted;
    mapping(uint8 => mapping(address => bool)) public hasContributed;

    // ─── Events ────────────────────────────────────────────────────────

    event Initialized(
        address indexed factory,
        address indexed creator,
        address indexed token,
        uint256 contributionAmount,
        uint256 collateralAmount,
        uint8 totalMembers,
        uint256 cycleDuration
    );
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

    error AlreadyInitialized();
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

    // ─── Constructor / Initializer ─────────────────────────────────────

    /// @notice Lock the implementation. Clones still call `initialize` normally because
    ///         each clone has its own storage.
    constructor() {
        _initialized = true;
    }

    /**
     * @notice Initialize a freshly-deployed clone of this contract.
     * @param _factory             The factory that deployed this clone (informational).
     * @param _token               ERC-20 token used for contributions and collateral.
     * @param _creator             Address allowed to set payout order and start.
     * @param _contributionAmount  Amount each member contributes per cycle.
     * @param _collateralAmount    Amount each member must escrow on join.
     * @param _totalMembers        Total members (and total cycles); MIN <= n <= MAX.
     * @param _cycleDuration       Duration of each cycle in seconds.
     */
    function initialize(
        address _factory,
        IERC20 _token,
        address _creator,
        uint256 _contributionAmount,
        uint256 _collateralAmount,
        uint8 _totalMembers,
        uint256 _cycleDuration
    )
        external
    {
        if (_initialized) revert AlreadyInitialized();
        if (address(_token) == address(0)) revert InvalidParameters();
        if (_creator == address(0)) revert InvalidParameters();
        if (_contributionAmount == 0) revert InvalidParameters();
        if (_totalMembers < MIN_MEMBERS || _totalMembers > MAX_MEMBERS) revert InvalidParameters();
        if (_cycleDuration == 0) revert InvalidParameters();

        _initialized = true;

        factory = _factory;
        token = _token;
        creator = _creator;
        contributionAmount = _contributionAmount;
        collateralAmount = _collateralAmount;
        totalMembers = _totalMembers;
        cycleDuration = _cycleDuration;
        status = Status.Created;

        emit Initialized(
            _factory,
            _creator,
            address(_token),
            _contributionAmount,
            _collateralAmount,
            _totalMembers,
            _cycleDuration
        );
    }

    // ─── Member onboarding ─────────────────────────────────────────────

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

    function start() external onlyCreator inStatus(Status.Created) {
        if (members.length != totalMembers) revert AllMembersHaveNotJoined();
        if (!payoutOrderSet) revert PayoutOrderNotSet();

        status = Status.Active;
        currentCycle = 1;
        cycleStartTime = block.timestamp;

        emit VaquitaStarted(block.timestamp);
    }

    // ─── Contributions ─────────────────────────────────────────────────

    function contribute() external inStatus(Status.Active) onlyMember nonReentrant {
        uint8 cycle = currentCycle;
        if (hasContributed[cycle][msg.sender]) revert AlreadyContributed();

        token.safeTransferFrom(msg.sender, address(this), contributionAmount);
        hasContributed[cycle][msg.sender] = true;

        emit Contributed(msg.sender, cycle, contributionAmount);
    }

    /**
     * @dev block.timestamp comparison is acceptable here because cycle deadlines are
     *      measured in days, not seconds. Validator-level manipulation on Arbitrum is
     *      bounded to a few seconds, which is irrelevant at this granularity.
     */
    function executeCycle() external inStatus(Status.Active) nonReentrant {
        if (block.timestamp < cycleStartTime + cycleDuration) revert CycleStillActive();

        uint8 cycle = currentCycle;
        uint256 len = members.length;

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

        address recipient = payoutOrder[cycle - 1];
        uint256 pool = uint256(totalMembers) * contributionAmount;
        token.safeTransfer(recipient, pool);
        emit CycleExecuted(cycle, recipient, pool);

        if (cycle == totalMembers) {
            status = Status.Completed;
            currentCycle = totalMembers + 1;
            emit VaquitaCompleted();
        } else {
            currentCycle = cycle + 1;
            cycleStartTime = block.timestamp;
        }
    }

    // ─── Collateral claim ──────────────────────────────────────────────

    function claimCollateral() external onlyMember nonReentrant {
        if (status != Status.Completed && status != Status.Defaulted) {
            revert InvalidStatus(Status.Completed, status);
        }
        uint256 balance = collateralBalance[msg.sender];
        if (balance == 0) return;
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

    function isInitialized() external view returns (bool) {
        return _initialized;
    }
}

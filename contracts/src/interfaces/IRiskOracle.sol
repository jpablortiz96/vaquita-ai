// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IRiskOracle
 * @notice Interface for the AI-powered risk oracle that scores Vaquita members.
 * @dev The off-chain AI agent (Claude Sonnet 4) computes risk scores and submits
 *      signed messages to the on-chain oracle. Vaquita contracts read scores from
 *      this oracle to determine payout order and collateral requirements.
 */
interface IRiskOracle {
    /// @notice Emitted when a member's risk score is updated by the AI agent.
    /// @param member The address of the member whose score was updated.
    /// @param score The new risk score (0-100, where 100 = lowest risk).
    /// @param timestamp Block timestamp when the score was recorded.
    event RiskScoreUpdated(address indexed member, uint8 score, uint256 timestamp);

    /// @notice Returns the most recent risk score for a member.
    /// @param member The address to query.
    /// @return score The risk score (0-100). Returns 0 if no score has been set.
    function getRiskScore(
        address member
    )
        external
        view
        returns (uint8 score);

    /// @notice Returns the timestamp of the last score update for a member.
    /// @param member The address to query.
    /// @return timestamp The Unix timestamp of the last update. Returns 0 if never updated.
    function getLastUpdated(
        address member
    )
        external
        view
        returns (uint256 timestamp);

    /// @notice Returns true if the score is fresh enough to be trusted (< 30 days old).
    /// @param member The address to query.
    /// @return fresh True if the score is recent.
    function isFresh(
        address member
    )
        external
        view
        returns (bool fresh);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IPancakePredictionV2
 * @notice Interface for PancakeSwap Prediction V2 contract
 * @dev Used by PancakePredictionAdapter to fetch prediction data
 * @author TruthBounty Team
 */
interface IPancakePredictionV2 {
    /**
     * @notice Enum representing bet position
     */
    enum Position {
        Bull, // 0 - Betting price goes up
        Bear // 1 - Betting price goes down
    }

    /**
     * @notice Struct containing round information
     * @param epoch Round number
     * @param startTimestamp When round starts
     * @param lockTimestamp When betting locks
     * @param closeTimestamp When round closes
     * @param lockPrice Price when betting locks (from Chainlink)
     * @param closePrice Price when round closes (from Chainlink)
     * @param lockOracleId Chainlink round ID at lock
     * @param closeOracleId Chainlink round ID at close
     * @param totalAmount Total amount bet in round (wei)
     * @param bullAmount Total amount bet on Bull (wei)
     * @param bearAmount Total amount bet on Bear (wei)
     * @param rewardBaseCalAmount Amount used for reward calculation
     * @param rewardAmount Total rewards distributed
     * @param oracleCalled Whether oracle price was fetched
     */
    struct Round {
        uint256 epoch;
        uint256 startTimestamp;
        uint256 lockTimestamp;
        uint256 closeTimestamp;
        int256 lockPrice;
        int256 closePrice;
        uint256 lockOracleId;
        uint256 closeOracleId;
        uint256 totalAmount;
        uint256 bullAmount;
        uint256 bearAmount;
        uint256 rewardBaseCalAmount;
        uint256 rewardAmount;
        bool oracleCalled;
    }

    /**
     * @notice Struct containing user's bet information
     * @param position Bull or Bear
     * @param amount Amount bet in wei
     * @param claimed Whether user claimed winnings
     */
    struct BetInfo {
        Position position;
        uint256 amount;
        bool claimed;
    }

    /**
     * @notice Emitted when user places Bull bet
     * @param sender Address of bettor
     * @param epoch Round number
     * @param amount Bet amount in wei
     */
    event BetBull(address indexed sender, uint256 indexed epoch, uint256 amount);

    /**
     * @notice Emitted when user places Bear bet
     * @param sender Address of bettor
     * @param epoch Round number
     * @param amount Bet amount in wei
     */
    event BetBear(address indexed sender, uint256 indexed epoch, uint256 amount);

    /**
     * @notice Emitted when user claims winnings
     * @param sender Address of claimer
     * @param epoch Round number
     * @param amount Claimed amount in wei
     */
    event Claim(address indexed sender, uint256 indexed epoch, uint256 amount);

    /**
     * @notice Emitted when round locks
     * @param epoch Round number
     * @param roundId Chainlink round ID
     * @param price Lock price
     */
    event LockRound(uint256 indexed epoch, uint256 indexed roundId, int256 price);

    /**
     * @notice Emitted when round ends
     * @param epoch Round number
     * @param roundId Chainlink round ID
     * @param price Close price
     */
    event EndRound(uint256 indexed epoch, uint256 indexed roundId, int256 price);

    /**
     * @notice Get round information by epoch
     * @param epoch Round number
     * @return Round struct
     */
    function rounds(uint256 epoch) external view returns (Round memory);

    /**
     * @notice Get user's bet info for a specific round
     * @param user Address of user
     * @param epoch Round number
     * @return BetInfo struct
     */
    function ledger(address user, uint256 epoch) external view returns (BetInfo memory);

    /**
     * @notice Get paginated list of rounds user participated in
     * @param user Address of user
     * @param cursor Starting position (0 for first page)
     * @param size Number of rounds to fetch (max 1000)
     * @return epochs Array of round numbers
     * @return betInfo Array of bet information
     * @return nextCursor Position for next page (0 if no more)
     */
    function getUserRounds(address user, uint256 cursor, uint256 size)
        external
        view
        returns (uint256[] memory epochs, BetInfo[] memory betInfo, uint256 nextCursor);

    /**
     * @notice Get current active round number
     * @return Current epoch
     */
    function currentEpoch() external view returns (uint256);

    /**
     * @notice Check if user can claim winnings from a round
     * @param epoch Round number
     * @param user Address of user
     * @return True if claimable
     */
    function claimable(uint256 epoch, address user) external view returns (bool);

    /**
     * @notice Check if round is refundable (cancelled)
     * @param epoch Round number
     * @param user Address of user
     * @return True if refundable
     */
    function refundable(uint256 epoch, address user) external view returns (bool);
}

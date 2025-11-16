// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPlatformAdapter} from "../interfaces/IPlatformAdapter.sol";
import {IPancakePredictionV2} from "../interfaces/IPancakePredictionV2.sol";

/**
 * @title PancakePredictionAdapter
 * @notice Adapter for integrating PancakeSwap Prediction V2 with TruthBounty
 * @dev Implements IPlatformAdapter to fetch and aggregate prediction data
 * @author TruthBounty Team
 */
contract PancakePredictionAdapter is IPlatformAdapter {
    // ============================================
    // State Variables
    // ============================================

    IPancakePredictionV2 public immutable pancakePrediction;
    uint256 public constant PAGE_SIZE = 1000; // Max rounds per query

    // ============================================
    // Errors
    // ============================================

    error InvalidPredictionContract();
    error InvalidBlockRange();
    error NoRoundsFound();

    // ============================================
    // Constructor
    // ============================================

    /**
     * @notice Creates adapter for PancakePrediction contract
     * @param predictionContract_ Address of PancakePredictionV2 contract
     */
    constructor(address predictionContract_) {
        if (predictionContract_ == address(0)) {
            revert InvalidPredictionContract();
        }
        pancakePrediction = IPancakePredictionV2(predictionContract_);
    }

    // ============================================
    // IPlatformAdapter Implementation
    // ============================================

    /**
     * @notice Fetches user's prediction history from PancakePrediction
     * @dev Uses getUserRounds to paginate through all user bets
     * @param user Address of the user
     * @param startIndex Starting index for pagination (not used, always returns all)
     * @param count Maximum number of predictions (not used, always returns all)
     * @return predictions Array of PredictionData structs
     * @return totalCount Total number of predictions
     */
    function fetchUserPredictions(address user, uint256 startIndex, uint256 count)
        external
        view
        override
        returns (PredictionData[] memory predictions, uint256 totalCount)
    {
        // Get all user rounds (PancakePrediction doesn't support index-based pagination)
        (uint256[] memory allEpochs, IPancakePredictionV2.BetInfo[] memory allBets,) =
            pancakePrediction.getUserRounds(user, 0, PAGE_SIZE);

        totalCount = allEpochs.length;

        if (totalCount == 0) {
            return (new PredictionData[](0), 0);
        }

        // Allocate array for predictions
        predictions = new PredictionData[](totalCount);

        // Process each round
        for (uint256 i = 0; i < totalCount; i++) {
            uint256 epoch = allEpochs[i];
            IPancakePredictionV2.BetInfo memory bet = allBets[i];
            IPancakePredictionV2.Round memory round = pancakePrediction.rounds(epoch);

            // Determine if prediction was correct
            bool isCorrect = _isWinningBet(round, bet.position);

            predictions[i] = PredictionData({
                predictionId: bytes32(epoch), // Use epoch as ID
                predictor: user,
                marketId: bytes32(epoch), // Market = round
                outcome: uint8(bet.position), // 0 = Bull, 1 = Bear
                amount: bet.amount,
                timestamp: round.lockTimestamp, // When bet was locked
                resolved: round.oracleCalled, // Whether round finished
                correct: isCorrect
            });
        }

        return (predictions, totalCount);
    }

    /**
     * @notice Gets aggregated statistics for a user
     * @dev Calculates total predictions, wins, and volume
     * @param user Address of the user
     * @return stats UserStats struct with aggregated data
     */
    function getUserStats(address user) external view override returns (UserStats memory stats) {
        // Get all user rounds
        (uint256[] memory epochs, IPancakePredictionV2.BetInfo[] memory bets,) =
            pancakePrediction.getUserRounds(user, 0, PAGE_SIZE);

        if (epochs.length == 0) {
            return UserStats({totalPredictions: 0, correctPredictions: 0, totalVolume: 0, activeMarkets: 0});
        }

        uint256 totalPredictions = 0;
        uint256 correctPredictions = 0;
        uint256 totalVolume = 0;
        uint256 activeMarkets = 0;

        // Track unique active markets (rounds that aren't finished)
        uint256 currentEpoch = pancakePrediction.currentEpoch();

        for (uint256 i = 0; i < epochs.length; i++) {
            uint256 epoch = epochs[i];
            IPancakePredictionV2.BetInfo memory bet = bets[i];
            IPancakePredictionV2.Round memory round = pancakePrediction.rounds(epoch);

            // Add to total volume
            totalVolume += bet.amount;

            // Only count finished, non-cancelled rounds for predictions
            if (round.oracleCalled && round.closePrice != round.lockPrice) {
                totalPredictions++;

                // Check if won
                if (_isWinningBet(round, bet.position)) {
                    correctPredictions++;
                }
            }

            // Count active markets (unfinished rounds)
            if (!round.oracleCalled && epoch <= currentEpoch) {
                activeMarkets++;
            }
        }

        return UserStats({
            totalPredictions: totalPredictions,
            correctPredictions: correctPredictions,
            totalVolume: totalVolume,
            activeMarkets: activeMarkets
        });
    }

    /**
     * @notice Returns the name of the platform
     * @return Platform name
     */
    function platformName() external pure override returns (string memory) {
        return "PancakePrediction";
    }

    /**
     * @notice Returns the address of the platform contract
     * @return Address of PancakePredictionV2 contract
     */
    function platformAddress() external view override returns (address) {
        return address(pancakePrediction);
    }

    /**
     * @notice Checks if a market (round) has been resolved
     * @param marketId Market identifier (epoch number as bytes32)
     * @return True if round is resolved
     */
    function isMarketResolved(bytes32 marketId) external view override returns (bool) {
        uint256 epoch = uint256(marketId);
        IPancakePredictionV2.Round memory round = pancakePrediction.rounds(epoch);
        return round.oracleCalled;
    }

    /**
     * @notice Gets the winning outcome for a resolved market
     * @param marketId Market identifier (epoch number as bytes32)
     * @return Winning outcome (0 = Bull, 1 = Bear)
     */
    function getMarketOutcome(bytes32 marketId) external view override returns (uint8) {
        uint256 epoch = uint256(marketId);
        (bool bullWon, bool resolved, bool cancelled) = _getRoundOutcome(epoch);

        if (!resolved) {
            revert("Market not resolved");
        }

        if (cancelled) {
            revert("Market was cancelled");
        }

        return bullWon ? 0 : 1; // 0 = Bull, 1 = Bear
    }

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * @dev Determines if a bet won based on round outcome
     * @param round Round data
     * @param position User's bet position (Bull or Bear)
     * @return True if bet won
     */
    function _isWinningBet(IPancakePredictionV2.Round memory round, IPancakePredictionV2.Position position)
        internal
        pure
        returns (bool)
    {
        // Round must be finished
        if (!round.oracleCalled) {
            return false;
        }

        // Round was cancelled (prices equal)
        if (round.closePrice == round.lockPrice) {
            return false;
        }

        // Bull wins if close > lock
        bool bullWon = round.closePrice > round.lockPrice;

        // Check if user's position matches winner
        if (position == IPancakePredictionV2.Position.Bull) {
            return bullWon;
        } else {
            return !bullWon;
        }
    }

    /**
     * @dev Gets the outcome of a round
     * @param epoch Round number
     * @return bullWon True if Bull won, false if Bear won
     * @return resolved True if round is finished
     * @return cancelled True if round was cancelled
     */
    function _getRoundOutcome(uint256 epoch) internal view returns (bool bullWon, bool resolved, bool cancelled) {
        IPancakePredictionV2.Round memory round = pancakePrediction.rounds(epoch);

        resolved = round.oracleCalled;

        if (!resolved) {
            return (false, false, false);
        }

        cancelled = (round.closePrice == round.lockPrice);

        if (cancelled) {
            return (false, true, true);
        }

        bullWon = round.closePrice > round.lockPrice;

        return (bullWon, true, false);
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice Gets round details by epoch
     * @param epoch Round number
     * @return Round struct
     */
    function getRound(uint256 epoch) external view returns (IPancakePredictionV2.Round memory) {
        return pancakePrediction.rounds(epoch);
    }

    /**
     * @notice Gets user's bet for a specific round
     * @param user Address of user
     * @param epoch Round number
     * @return BetInfo struct
     */
    function getUserBet(address user, uint256 epoch) external view returns (IPancakePredictionV2.BetInfo memory) {
        return pancakePrediction.ledger(user, epoch);
    }

    /**
     * @notice Checks if user won a specific round
     * @param user Address of user
     * @param epoch Round number
     * @return True if user won
     */
    function didUserWin(address user, uint256 epoch) external view returns (bool) {
        IPancakePredictionV2.Round memory round = pancakePrediction.rounds(epoch);
        IPancakePredictionV2.BetInfo memory bet = pancakePrediction.ledger(user, epoch);

        return _isWinningBet(round, bet.position);
    }

    /**
     * @notice Gets user's win rate in basis points
     * @param user Address of user
     * @return winRate Win rate (0-10000, where 7550 = 75.50%)
     */
    function getUserWinRate(address user) external view returns (uint256 winRate) {
        UserStats memory stats = this.getUserStats(user);

        if (stats.totalPredictions == 0) {
            return 0;
        }

        return (stats.correctPredictions * 10000) / stats.totalPredictions;
    }

    /**
     * @notice Gets the address of the PancakePrediction contract
     * @return Address of prediction contract
     */
    function getPredictionContract() external view returns (address) {
        return address(pancakePrediction);
    }
}

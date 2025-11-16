// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "@forge-std/Test.sol";
import {ScoreCalculator} from "../../src/core/ScoreCalculator.sol";
import {IScoreCalculator} from "../../src/interfaces/IScoreCalculator.sol";

/**
 * @title ScoreCalculatorTest
 * @notice Comprehensive tests for the ScoreCalculator contract
 */
contract ScoreCalculatorTest is Test {
    ScoreCalculator public calculator;

    // Test addresses
    address public owner = address(1);
    address public user1 = address(2);

    // Common test values
    uint256 constant ONE_BNB = 1 ether;
    uint256 constant TEN_BNB = 10 ether;
    uint256 constant HUNDRED_BNB = 100 ether;

    function setUp() public {
        calculator = new ScoreCalculator();
    }

    // ============================================
    // Basic TruthScore Calculation Tests
    // ============================================

    function test_CalculateScore_50PercentWinRate_1BNB() public view {
        // 50% win rate with 1 BNB staked
        uint256 score = calculator.calculateTruthScore(10, 5, ONE_BNB);

        // Expected: (5000 win rate) × sqrt(100 volume points) / 100 = 5000 × 10 / 100 = 500
        assertEq(score, 500, "Score should be 500 for 50% win rate with 1 BNB");
    }

    function test_CalculateScore_100PercentWinRate_1BNB() public view {
        // 100% win rate with 1 BNB staked
        uint256 score = calculator.calculateTruthScore(10, 10, ONE_BNB);

        // Expected: (10000 win rate) × sqrt(100) / 100 = 10000 × 10 / 100 = 1000
        assertEq(score, 1000, "Score should be 1000 for 100% win rate with 1 BNB");
    }

    function test_CalculateScore_75PercentWinRate_4BNB() public view {
        // 75% win rate with 4 BNB staked
        uint256 score = calculator.calculateTruthScore(100, 75, 4 * ONE_BNB);

        // Expected: (7500 win rate) × sqrt(400) / 100 = 7500 × 20 / 100 = 1500
        assertEq(score, 1500, "Score should be 1500 for 75% win rate with 4 BNB");
    }

    function test_CalculateScore_25PercentWinRate_1BNB() public view {
        // Poor performance: 25% win rate
        uint256 score = calculator.calculateTruthScore(20, 5, ONE_BNB);

        // Expected: (2500 win rate) × sqrt(100) / 100 = 2500 × 10 / 100 = 250
        assertEq(score, 250, "Score should be 250 for 25% win rate with 1 BNB");
    }

    function test_CalculateScore_LargeVolume_100BNB() public view {
        // 60% win rate with 100 BNB (whale)
        uint256 score = calculator.calculateTruthScore(50, 30, HUNDRED_BNB);

        // Expected: (6000 win rate) × sqrt(10000) / 100 = 6000 × 100 / 100 = 6000
        assertEq(score, 6000, "Score should be 6000 for 60% win rate with 100 BNB");
    }

    function test_CalculateScore_MinimalVolume() public view {
        // Good win rate but very small volume
        uint256 score = calculator.calculateTruthScore(10, 9, 0.01 ether);

        // Expected: (9000 win rate) × sqrt(1) / 100 = 9000 × 1 / 100 = 90
        assertEq(score, 90, "Score should be 90 for 90% win rate with 0.01 BNB");
    }

    // ============================================
    // Edge Case Tests
    // ============================================

    function test_CalculateScore_RevertWhen_ZeroPredictions() public {
        vm.expectRevert(IScoreCalculator.NoPredictions.selector);
        calculator.calculateTruthScore(0, 0, ONE_BNB);
    }

    function test_CalculateScore_RevertWhen_MoreCorrectThanTotal() public {
        vm.expectRevert(abi.encodeWithSelector(IScoreCalculator.InvalidPredictionData.selector, 5, 10));
        calculator.calculateTruthScore(5, 10, ONE_BNB);
    }

    function test_CalculateScore_ZeroVolume() public view {
        // Valid predictions but no volume staked
        uint256 score = calculator.calculateTruthScore(10, 5, 0);

        // Expected: (5000 win rate) × sqrt(0) / 100 = 0
        assertEq(score, 0, "Score should be 0 with zero volume");
    }

    function test_CalculateScore_OnePrediction_Correct() public view {
        // Single correct prediction
        uint256 score = calculator.calculateTruthScore(1, 1, ONE_BNB);

        // Expected: (10000 win rate) × sqrt(100) / 100 = 1000
        assertEq(score, 1000, "Score should be 1000 for single correct prediction with 1 BNB");
    }

    function test_CalculateScore_OnePrediction_Wrong() public view {
        // Single wrong prediction
        uint256 score = calculator.calculateTruthScore(1, 0, ONE_BNB);

        // Expected: (0 win rate) × sqrt(100) / 100 = 0
        assertEq(score, 0, "Score should be 0 for single wrong prediction");
    }

    // ============================================
    // ScoreBreakdown Tests
    // ============================================

    function test_CalculateScoreWithBreakdown() public view {
        IScoreCalculator.ScoreBreakdown memory breakdown =
            calculator.calculateScoreWithBreakdown(10, 7, 4 * ONE_BNB);

        assertEq(breakdown.baseScore, 7000, "Base score (win rate) should be 7000");
        assertEq(breakdown.volumeMultiplier, 20, "Volume multiplier should be 20 (sqrt(400))");
        assertEq(breakdown.consistencyBonus, 0, "Consistency bonus not implemented in MVP");
        assertEq(breakdown.finalScore, 1400, "Final score should be 1400");
    }

    // ============================================
    // Win Rate Calculation Tests
    // ============================================

    function test_CalculateWinRate_Perfect() public view {
        uint256 winRate = calculator.calculateWinRate(50, 50);
        assertEq(winRate, 10000, "Win rate should be 10000 (100.00%)");
    }

    function test_CalculateWinRate_Half() public view {
        uint256 winRate = calculator.calculateWinRate(100, 50);
        assertEq(winRate, 5000, "Win rate should be 5000 (50.00%)");
    }

    function test_CalculateWinRate_75Percent() public view {
        uint256 winRate = calculator.calculateWinRate(100, 75);
        assertEq(winRate, 7500, "Win rate should be 7500 (75.00%)");
    }

    function test_CalculateWinRate_Zero() public view {
        uint256 winRate = calculator.calculateWinRate(100, 0);
        assertEq(winRate, 0, "Win rate should be 0 (0.00%)");
    }

    function test_CalculateWinRate_Precision() public view {
        // Test precision: 33/100 = 33.00%
        uint256 winRate = calculator.calculateWinRate(100, 33);
        assertEq(winRate, 3300, "Win rate should be 3300 (33.00%)");
    }

    function test_CalculateWinRate_RevertWhen_ZeroPredictions() public {
        vm.expectRevert(IScoreCalculator.NoPredictions.selector);
        calculator.calculateWinRate(0, 0);
    }

    function test_CalculateWinRate_RevertWhen_Invalid() public {
        vm.expectRevert(abi.encodeWithSelector(IScoreCalculator.InvalidPredictionData.selector, 10, 15));
        calculator.calculateWinRate(10, 15);
    }

    // ============================================
    // Tier System Tests
    // ============================================

    function test_GetTier_Bronze() public view {
        assertEq(uint256(calculator.getTier(0)), uint256(IScoreCalculator.Tier.BRONZE), "0 should be BRONZE");
        assertEq(uint256(calculator.getTier(250)), uint256(IScoreCalculator.Tier.BRONZE), "250 should be BRONZE");
        assertEq(uint256(calculator.getTier(499)), uint256(IScoreCalculator.Tier.BRONZE), "499 should be BRONZE");
    }

    function test_GetTier_Silver() public view {
        assertEq(uint256(calculator.getTier(500)), uint256(IScoreCalculator.Tier.SILVER), "500 should be SILVER");
        assertEq(uint256(calculator.getTier(750)), uint256(IScoreCalculator.Tier.SILVER), "750 should be SILVER");
        assertEq(uint256(calculator.getTier(999)), uint256(IScoreCalculator.Tier.SILVER), "999 should be SILVER");
    }

    function test_GetTier_Gold() public view {
        assertEq(uint256(calculator.getTier(1000)), uint256(IScoreCalculator.Tier.GOLD), "1000 should be GOLD");
        assertEq(uint256(calculator.getTier(1500)), uint256(IScoreCalculator.Tier.GOLD), "1500 should be GOLD");
        assertEq(uint256(calculator.getTier(1999)), uint256(IScoreCalculator.Tier.GOLD), "1999 should be GOLD");
    }

    function test_GetTier_Platinum() public view {
        assertEq(
            uint256(calculator.getTier(2000)), uint256(IScoreCalculator.Tier.PLATINUM), "2000 should be PLATINUM"
        );
        assertEq(
            uint256(calculator.getTier(3500)), uint256(IScoreCalculator.Tier.PLATINUM), "3500 should be PLATINUM"
        );
        assertEq(
            uint256(calculator.getTier(4999)), uint256(IScoreCalculator.Tier.PLATINUM), "4999 should be PLATINUM"
        );
    }

    function test_GetTier_Diamond() public view {
        assertEq(uint256(calculator.getTier(5000)), uint256(IScoreCalculator.Tier.DIAMOND), "5000 should be DIAMOND");
        assertEq(uint256(calculator.getTier(10000)), uint256(IScoreCalculator.Tier.DIAMOND), "10000 should be DIAMOND");
    }

    function test_GetTierThreshold() public view {
        assertEq(calculator.getTierThreshold(IScoreCalculator.Tier.BRONZE), 0, "BRONZE threshold should be 0");
        assertEq(calculator.getTierThreshold(IScoreCalculator.Tier.SILVER), 500, "SILVER threshold should be 500");
        assertEq(calculator.getTierThreshold(IScoreCalculator.Tier.GOLD), 1000, "GOLD threshold should be 1000");
        assertEq(calculator.getTierThreshold(IScoreCalculator.Tier.PLATINUM), 2000, "PLATINUM threshold should be 2000");
        assertEq(calculator.getTierThreshold(IScoreCalculator.Tier.DIAMOND), 5000, "DIAMOND threshold should be 5000");
    }

    function test_GetNextTierRequirement_FromBronze() public view {
        (uint256 nextTier, uint256 pointsNeeded) = calculator.getNextTierRequirement(250);
        assertEq(nextTier, 500, "Next tier from BRONZE should be 500 (SILVER)");
        assertEq(pointsNeeded, 250, "Points needed should be 250");
    }

    function test_GetNextTierRequirement_FromSilver() public view {
        (uint256 nextTier, uint256 pointsNeeded) = calculator.getNextTierRequirement(750);
        assertEq(nextTier, 1000, "Next tier from SILVER should be 1000 (GOLD)");
        assertEq(pointsNeeded, 250, "Points needed should be 250");
    }

    function test_GetNextTierRequirement_FromGold() public view {
        (uint256 nextTier, uint256 pointsNeeded) = calculator.getNextTierRequirement(1500);
        assertEq(nextTier, 2000, "Next tier from GOLD should be 2000 (PLATINUM)");
        assertEq(pointsNeeded, 500, "Points needed should be 500");
    }

    function test_GetNextTierRequirement_FromPlatinum() public view {
        (uint256 nextTier, uint256 pointsNeeded) = calculator.getNextTierRequirement(3000);
        assertEq(nextTier, 5000, "Next tier from PLATINUM should be 5000 (DIAMOND)");
        assertEq(pointsNeeded, 2000, "Points needed should be 2000");
    }

    function test_GetNextTierRequirement_FromDiamond() public view {
        (uint256 nextTier, uint256 pointsNeeded) = calculator.getNextTierRequirement(5000);
        assertEq(nextTier, 0, "Next tier from DIAMOND should be 0 (max tier)");
        assertEq(pointsNeeded, 0, "Points needed should be 0 (already at max)");
    }

    function test_GetTierName() public view {
        assertEq(calculator.getTierName(IScoreCalculator.Tier.BRONZE), "BRONZE", "BRONZE name should match");
        assertEq(calculator.getTierName(IScoreCalculator.Tier.SILVER), "SILVER", "SILVER name should match");
        assertEq(calculator.getTierName(IScoreCalculator.Tier.GOLD), "GOLD", "GOLD name should match");
        assertEq(calculator.getTierName(IScoreCalculator.Tier.PLATINUM), "PLATINUM", "PLATINUM name should match");
        assertEq(calculator.getTierName(IScoreCalculator.Tier.DIAMOND), "DIAMOND", "DIAMOND name should match");
    }

    // ============================================
    // Helper Function Tests
    // ============================================

    function test_Sqrt_PerfectSquares() public view {
        assertEq(calculator.sqrt(0), 0, "sqrt(0) should be 0");
        assertEq(calculator.sqrt(1), 1, "sqrt(1) should be 1");
        assertEq(calculator.sqrt(4), 2, "sqrt(4) should be 2");
        assertEq(calculator.sqrt(9), 3, "sqrt(9) should be 3");
        assertEq(calculator.sqrt(16), 4, "sqrt(16) should be 4");
        assertEq(calculator.sqrt(25), 5, "sqrt(25) should be 5");
        assertEq(calculator.sqrt(100), 10, "sqrt(100) should be 10");
        assertEq(calculator.sqrt(10000), 100, "sqrt(10000) should be 100");
    }

    function test_Sqrt_NonPerfectSquares() public view {
        assertEq(calculator.sqrt(2), 1, "sqrt(2) should be 1 (floor)");
        assertEq(calculator.sqrt(3), 1, "sqrt(3) should be 1 (floor)");
        assertEq(calculator.sqrt(5), 2, "sqrt(5) should be 2 (floor)");
        assertEq(calculator.sqrt(8), 2, "sqrt(8) should be 2 (floor)");
        assertEq(calculator.sqrt(15), 3, "sqrt(15) should be 3 (floor)");
        assertEq(calculator.sqrt(99), 9, "sqrt(99) should be 9 (floor)");
    }

    function test_Sqrt_LargeNumbers() public view {
        assertEq(calculator.sqrt(1000000), 1000, "sqrt(1000000) should be 1000");
        assertEq(calculator.sqrt(1000000000000), 1000000, "sqrt(1000000000000) should be 1000000");
    }

    function test_WeiToBnb() public view {
        assertEq(calculator.weiToBnb(0), 0, "0 wei should be 0 BNB");
        assertEq(calculator.weiToBnb(ONE_BNB), 1, "1 ether should be 1 BNB");
        assertEq(calculator.weiToBnb(TEN_BNB), 10, "10 ether should be 10 BNB");
        assertEq(calculator.weiToBnb(HUNDRED_BNB), 100, "100 ether should be 100 BNB");
        assertEq(calculator.weiToBnb(0.5 ether), 0, "0.5 ether should be 0 BNB (floor)");
    }

    function test_ValidatePredictionData() public view {
        assertTrue(calculator.validatePredictionData(10, 5), "Valid data should return true");
        assertTrue(calculator.validatePredictionData(10, 10), "Equal values should return true");
        assertTrue(calculator.validatePredictionData(100, 0), "Zero correct should return true");
        assertFalse(calculator.validatePredictionData(10, 15), "More correct than total should return false");
    }

    function test_GetMaxPossibleScore() public view {
        // Max score with 1 BNB = 10000 × sqrt(100) / 100 = 1000
        assertEq(calculator.getMaxPossibleScore(ONE_BNB), 1000, "Max score for 1 BNB should be 1000");

        // Max score with 4 BNB = 10000 × sqrt(400) / 100 = 2000
        assertEq(calculator.getMaxPossibleScore(4 * ONE_BNB), 2000, "Max score for 4 BNB should be 2000");

        // Max score with 100 BNB = 10000 × sqrt(10000) / 100 = 10000
        assertEq(calculator.getMaxPossibleScore(HUNDRED_BNB), 10000, "Max score for 100 BNB should be 10000");
    }

    // ============================================
    // Realistic Scenario Tests
    // ============================================

    function test_Scenario_BeginnerTrader() public view {
        // Beginner: 10 predictions, 6 correct, 0.5 BNB total volume
        uint256 score = calculator.calculateTruthScore(10, 6, 0.5 ether);

        // Expected: 6000 × sqrt(50) / 100 ≈ 6000 × 7 / 100 = 420
        assertGt(score, 400, "Beginner score should be > 400");
        assertLt(score, 450, "Beginner score should be < 450");
        assertEq(uint256(calculator.getTier(score)), uint256(IScoreCalculator.Tier.BRONZE), "Should be BRONZE tier");
    }

    function test_Scenario_IntermediateTrader() public view {
        // Intermediate: 100 predictions, 65 correct, 10 BNB total volume
        uint256 score = calculator.calculateTruthScore(100, 65, TEN_BNB);

        // Expected: 6500 × sqrt(1000) / 100 ≈ 6500 × 31 / 100 = 2015
        assertGt(score, 2000, "Intermediate score should be > 2000");
        assertLt(score, 2100, "Intermediate score should be < 2100");
        assertEq(uint256(calculator.getTier(score)), uint256(IScoreCalculator.Tier.PLATINUM), "Should be PLATINUM tier");
    }

    function test_Scenario_ExpertTrader() public view {
        // Expert: 500 predictions, 400 correct (80%), 50 BNB total volume
        uint256 score = calculator.calculateTruthScore(500, 400, 50 * ONE_BNB);

        // Expected: 8000 × sqrt(5000) / 100 ≈ 8000 × 70 / 100 = 5600
        assertGt(score, 5500, "Expert score should be > 5500");
        assertLt(score, 5700, "Expert score should be < 5700");
        assertEq(uint256(calculator.getTier(score)), uint256(IScoreCalculator.Tier.DIAMOND), "Should be DIAMOND tier");
    }

    function test_Scenario_HighVolumeWhale() public view {
        // Whale: Mediocre win rate (55%) but massive volume (1000 BNB)
        uint256 score = calculator.calculateTruthScore(1000, 550, 1000 * ONE_BNB);

        // Expected: 5500 × sqrt(100000) / 100 ≈ 5500 × 316 / 100 = 17380
        assertGt(score, 17000, "Whale score should be > 17000");
        assertEq(uint256(calculator.getTier(score)), uint256(IScoreCalculator.Tier.DIAMOND), "Should be DIAMOND tier");
    }

    // ============================================
    // Fuzz Tests
    // ============================================

    function testFuzz_CalculateScore(uint256 total, uint256 correct, uint256 volume) public view {
        // Bound inputs to reasonable ranges
        total = bound(total, 1, 10000);
        correct = bound(correct, 0, total);
        volume = bound(volume, 0, 1000000 ether);

        // Should not revert with valid inputs
        uint256 score = calculator.calculateTruthScore(total, correct, volume);

        // Score should be reasonable
        assertTrue(score < type(uint128).max, "Score should not overflow");
    }

    function testFuzz_Sqrt(uint256 x) public view {
        x = bound(x, 0, type(uint128).max); // Bound to prevent overflow

        uint256 result = calculator.sqrt(x);

        // Verify: result^2 <= x < (result+1)^2
        if (x > 0) {
            assertTrue(result * result <= x, "sqrt result squared should be <= input");
            if (result < type(uint128).max) {
                assertTrue((result + 1) * (result + 1) > x, "sqrt result+1 squared should be > input");
            }
        } else {
            assertEq(result, 0, "sqrt(0) should be 0");
        }
    }
}

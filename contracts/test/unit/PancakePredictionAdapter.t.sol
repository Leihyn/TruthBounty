// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "@forge-std/Test.sol";
import {PancakePredictionAdapter} from "../../src/adapters/PancakePredictionAdapter.sol";
import {IPancakePredictionV2} from "../../src/interfaces/IPancakePredictionV2.sol";
import {IPlatformAdapter} from "../../src/interfaces/IPlatformAdapter.sol";

/**
 * @title PancakePredictionAdapterTest
 * @notice Unit tests for PancakePredictionAdapter
 * @dev Uses vm.mockCall to simulate PancakePrediction contract responses
 */
contract PancakePredictionAdapterTest is Test {
    PancakePredictionAdapter public adapter;
    address public mockPredictionContract;
    address public user1;
    address public user2;

    // Sample data
    uint256 constant EPOCH_1 = 12345;
    uint256 constant EPOCH_2 = 12346;
    uint256 constant EPOCH_3 = 12347;

    function setUp() public {
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        mockPredictionContract = makeAddr("pancakePrediction");

        // Deploy adapter with mock contract
        adapter = new PancakePredictionAdapter(mockPredictionContract);
    }

    // ============================================
    // Constructor Tests
    // ============================================

    function test_Constructor_Success() public view {
        assertEq(adapter.getPredictionContract(), mockPredictionContract);
        assertEq(adapter.platformName(), "PancakePrediction");
        assertEq(adapter.platformAddress(), mockPredictionContract);
    }

    function test_Constructor_RevertsOnZeroAddress() public {
        vm.expectRevert(PancakePredictionAdapter.InvalidPredictionContract.selector);
        new PancakePredictionAdapter(address(0));
    }

    // ============================================
    // Platform Info Tests
    // ============================================

    function test_PlatformName() public view {
        assertEq(adapter.platformName(), "PancakePrediction");
    }

    function test_PlatformAddress() public view {
        assertEq(adapter.platformAddress(), mockPredictionContract);
    }

    // ============================================
    // FetchUserPredictions Tests
    // ============================================

    function test_FetchUserPredictions_NoRounds() public {
        // Mock getUserRounds to return empty arrays
        uint256[] memory emptyEpochs = new uint256[](0);
        IPancakePredictionV2.BetInfo[] memory emptyBets = new IPancakePredictionV2.BetInfo[](0);

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(emptyEpochs, emptyBets, 0)
        );

        (IPlatformAdapter.PredictionData[] memory predictions, uint256 totalCount) =
            adapter.fetchUserPredictions(user1, 0, 1000);

        assertEq(predictions.length, 0);
        assertEq(totalCount, 0);
    }

    function test_FetchUserPredictions_SingleWinningBet() public {
        // Setup: User bet Bull and won
        uint256[] memory epochs = new uint256[](1);
        epochs[0] = EPOCH_1;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](1);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: false
        });

        // Mock getUserRounds
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        // Mock rounds - Bull won (closePrice > lockPrice)
        IPancakePredictionV2.Round memory round = IPancakePredictionV2.Round({
            epoch: EPOCH_1,
            startTimestamp: 1000,
            lockTimestamp: 1300,
            closeTimestamp: 1600,
            lockPrice: 300e8, // $300
            closePrice: 310e8, // $310 (Bull wins)
            lockOracleId: 1,
            closeOracleId: 2,
            totalAmount: 10 ether,
            bullAmount: 6 ether,
            bearAmount: 4 ether,
            rewardBaseCalAmount: 4 ether,
            rewardAmount: 9.7 ether,
            oracleCalled: true
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round)
        );

        // Fetch predictions
        (IPlatformAdapter.PredictionData[] memory predictions, uint256 totalCount) =
            adapter.fetchUserPredictions(user1, 0, 1000);

        assertEq(predictions.length, 1);
        assertEq(totalCount, 1);
        assertEq(predictions[0].predictor, user1);
        assertEq(predictions[0].amount, 1 ether);
        assertEq(predictions[0].outcome, uint8(IPancakePredictionV2.Position.Bull));
        assertEq(predictions[0].timestamp, 1300);
        assertTrue(predictions[0].resolved);
        assertTrue(predictions[0].correct); // Bull won
    }

    function test_FetchUserPredictions_SingleLosingBet() public {
        // Setup: User bet Bull but Bear won
        uint256[] memory epochs = new uint256[](1);
        epochs[0] = EPOCH_1;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](1);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 0.5 ether, claimed: false
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        // Mock rounds - Bear won (closePrice < lockPrice)
        IPancakePredictionV2.Round memory round = IPancakePredictionV2.Round({
            epoch: EPOCH_1,
            startTimestamp: 1000,
            lockTimestamp: 1300,
            closeTimestamp: 1600,
            lockPrice: 300e8, // $300
            closePrice: 295e8, // $295 (Bear wins)
            lockOracleId: 1,
            closeOracleId: 2,
            totalAmount: 10 ether,
            bullAmount: 6 ether,
            bearAmount: 4 ether,
            rewardBaseCalAmount: 6 ether,
            rewardAmount: 9.7 ether,
            oracleCalled: true
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round)
        );

        (IPlatformAdapter.PredictionData[] memory predictions,) = adapter.fetchUserPredictions(user1, 0, 1000);

        assertEq(predictions.length, 1);
        assertTrue(predictions[0].resolved);
        assertFalse(predictions[0].correct); // Bull lost
    }

    function test_FetchUserPredictions_MultipleBets() public {
        // Setup: 3 bets - 2 wins, 1 loss
        uint256[] memory epochs = new uint256[](3);
        epochs[0] = EPOCH_1;
        epochs[1] = EPOCH_2;
        epochs[2] = EPOCH_3;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](3);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: true
        });
        bets[1] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bear, amount: 2 ether, claimed: true
        });
        bets[2] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1.5 ether, claimed: false
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        // Round 1: Bull wins
        IPancakePredictionV2.Round memory round1 = _createRound(EPOCH_1, 300e8, 310e8, true);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round1)
        );

        // Round 2: Bear wins
        IPancakePredictionV2.Round memory round2 = _createRound(EPOCH_2, 310e8, 305e8, true);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_2),
            abi.encode(round2)
        );

        // Round 3: Bull loses
        IPancakePredictionV2.Round memory round3 = _createRound(EPOCH_3, 305e8, 300e8, true);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_3),
            abi.encode(round3)
        );

        (IPlatformAdapter.PredictionData[] memory predictions, uint256 totalCount) =
            adapter.fetchUserPredictions(user1, 0, 1000);

        assertEq(predictions.length, 3);
        assertEq(totalCount, 3);

        // Check first bet (Bull wins)
        assertTrue(predictions[0].correct);
        assertEq(predictions[0].outcome, uint8(IPancakePredictionV2.Position.Bull));

        // Check second bet (Bear wins)
        assertTrue(predictions[1].correct);
        assertEq(predictions[1].outcome, uint8(IPancakePredictionV2.Position.Bear));

        // Check third bet (Bull loses)
        assertFalse(predictions[2].correct);
        assertEq(predictions[2].outcome, uint8(IPancakePredictionV2.Position.Bull));
    }

    function test_FetchUserPredictions_CancelledRound() public {
        // Setup: Round cancelled (closePrice == lockPrice)
        uint256[] memory epochs = new uint256[](1);
        epochs[0] = EPOCH_1;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](1);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: false
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        // Cancelled round (same price)
        IPancakePredictionV2.Round memory round = _createRound(EPOCH_1, 300e8, 300e8, true);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round)
        );

        (IPlatformAdapter.PredictionData[] memory predictions,) = adapter.fetchUserPredictions(user1, 0, 1000);

        assertEq(predictions.length, 1);
        assertTrue(predictions[0].resolved);
        assertFalse(predictions[0].correct); // Cancelled rounds are not correct
    }

    function test_FetchUserPredictions_UnresolvedRound() public {
        // Setup: Round not yet resolved
        uint256[] memory epochs = new uint256[](1);
        epochs[0] = EPOCH_1;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](1);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: false
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        // Unresolved round
        IPancakePredictionV2.Round memory round = _createRound(EPOCH_1, 300e8, 0, false);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round)
        );

        (IPlatformAdapter.PredictionData[] memory predictions,) = adapter.fetchUserPredictions(user1, 0, 1000);

        assertEq(predictions.length, 1);
        assertFalse(predictions[0].resolved); // Not finished
        assertFalse(predictions[0].correct); // Can't be correct if unresolved
    }

    // ============================================
    // GetUserStats Tests
    // ============================================

    function test_GetUserStats_NoRounds() public {
        uint256[] memory emptyEpochs = new uint256[](0);
        IPancakePredictionV2.BetInfo[] memory emptyBets = new IPancakePredictionV2.BetInfo[](0);

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(emptyEpochs, emptyBets, 0)
        );

        IPlatformAdapter.UserStats memory stats = adapter.getUserStats(user1);

        assertEq(stats.totalPredictions, 0);
        assertEq(stats.correctPredictions, 0);
        assertEq(stats.totalVolume, 0);
        assertEq(stats.activeMarkets, 0);
    }

    function test_GetUserStats_AllWins() public {
        // 3 bets, all wins
        uint256[] memory epochs = new uint256[](3);
        epochs[0] = EPOCH_1;
        epochs[1] = EPOCH_2;
        epochs[2] = EPOCH_3;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](3);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: true
        });
        bets[1] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bear, amount: 2 ether, claimed: true
        });
        bets[2] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1.5 ether, claimed: true
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        // Mock current epoch
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.currentEpoch.selector),
            abi.encode(EPOCH_3)
        );

        // All wins
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(_createRound(EPOCH_1, 300e8, 310e8, true))
        );
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_2),
            abi.encode(_createRound(EPOCH_2, 310e8, 305e8, true))
        );
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_3),
            abi.encode(_createRound(EPOCH_3, 305e8, 310e8, true))
        );

        IPlatformAdapter.UserStats memory stats = adapter.getUserStats(user1);

        assertEq(stats.totalPredictions, 3);
        assertEq(stats.correctPredictions, 3);
        assertEq(stats.totalVolume, 4.5 ether);
        assertEq(stats.activeMarkets, 0); // All resolved
    }

    function test_GetUserStats_MixedResults() public {
        // 4 bets: 2 wins, 1 loss, 1 active
        uint256[] memory epochs = new uint256[](4);
        epochs[0] = EPOCH_1;
        epochs[1] = EPOCH_2;
        epochs[2] = EPOCH_3;
        epochs[3] = EPOCH_3 + 1;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](4);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: true
        });
        bets[1] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bear, amount: 2 ether, claimed: true
        });
        bets[2] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1.5 ether, claimed: false
        });
        bets[3] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 0.5 ether, claimed: false
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.currentEpoch.selector),
            abi.encode(EPOCH_3 + 1)
        );

        // Round 1: Bull wins
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(_createRound(EPOCH_1, 300e8, 310e8, true))
        );

        // Round 2: Bear wins
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_2),
            abi.encode(_createRound(EPOCH_2, 310e8, 305e8, true))
        );

        // Round 3: Bull loses (Bear won)
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_3),
            abi.encode(_createRound(EPOCH_3, 305e8, 300e8, true))
        );

        // Round 4: Active (not resolved)
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_3 + 1),
            abi.encode(_createRound(EPOCH_3 + 1, 300e8, 0, false))
        );

        IPlatformAdapter.UserStats memory stats = adapter.getUserStats(user1);

        assertEq(stats.totalPredictions, 3); // Only count resolved
        assertEq(stats.correctPredictions, 2); // 2 wins
        assertEq(stats.totalVolume, 5 ether); // All bets
        assertEq(stats.activeMarkets, 1); // 1 unresolved
    }

    function test_GetUserStats_CancelledRoundNotCounted() public {
        uint256[] memory epochs = new uint256[](2);
        epochs[0] = EPOCH_1;
        epochs[1] = EPOCH_2;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](2);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: false
        });
        bets[1] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 2 ether, claimed: true
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.currentEpoch.selector),
            abi.encode(EPOCH_2)
        );

        // Round 1: Cancelled
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(_createRound(EPOCH_1, 300e8, 300e8, true))
        );

        // Round 2: Bull wins
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_2),
            abi.encode(_createRound(EPOCH_2, 300e8, 310e8, true))
        );

        IPlatformAdapter.UserStats memory stats = adapter.getUserStats(user1);

        assertEq(stats.totalPredictions, 1); // Cancelled not counted
        assertEq(stats.correctPredictions, 1);
        assertEq(stats.totalVolume, 3 ether); // Volume includes all
    }

    // ============================================
    // Additional View Function Tests
    // ============================================

    function test_GetUserWinRate() public {
        // 3 bets: 2 wins
        uint256[] memory epochs = new uint256[](3);
        epochs[0] = EPOCH_1;
        epochs[1] = EPOCH_2;
        epochs[2] = EPOCH_3;

        IPancakePredictionV2.BetInfo[] memory bets = new IPancakePredictionV2.BetInfo[](3);
        bets[0] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: true
        });
        bets[1] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bear, amount: 2 ether, claimed: true
        });
        bets[2] = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1.5 ether, claimed: false
        });

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.getUserRounds.selector, user1, 0, 1000),
            abi.encode(epochs, bets, 0)
        );

        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.currentEpoch.selector),
            abi.encode(EPOCH_3)
        );

        // 2 wins, 1 loss
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(_createRound(EPOCH_1, 300e8, 310e8, true))
        );
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_2),
            abi.encode(_createRound(EPOCH_2, 310e8, 305e8, true))
        );
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_3),
            abi.encode(_createRound(EPOCH_3, 305e8, 300e8, true))
        );

        uint256 winRate = adapter.getUserWinRate(user1);

        // 2/3 = 66.66% = 6666 basis points
        assertEq(winRate, 6666);
    }

    function test_DidUserWin_BullWins() public {
        IPancakePredictionV2.Round memory round = _createRound(EPOCH_1, 300e8, 310e8, true);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round)
        );

        IPancakePredictionV2.BetInfo memory bet = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: false
        });
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.ledger.selector, user1, EPOCH_1),
            abi.encode(bet)
        );

        assertTrue(adapter.didUserWin(user1, EPOCH_1));
    }

    function test_DidUserWin_BearWins() public {
        IPancakePredictionV2.Round memory round = _createRound(EPOCH_1, 300e8, 295e8, true);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round)
        );

        IPancakePredictionV2.BetInfo memory bet = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bear, amount: 1 ether, claimed: false
        });
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.ledger.selector, user1, EPOCH_1),
            abi.encode(bet)
        );

        assertTrue(adapter.didUserWin(user1, EPOCH_1));
    }

    function test_DidUserWin_Loses() public {
        // Bull bet but Bear won
        IPancakePredictionV2.Round memory round = _createRound(EPOCH_1, 300e8, 295e8, true);
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.rounds.selector, EPOCH_1),
            abi.encode(round)
        );

        IPancakePredictionV2.BetInfo memory bet = IPancakePredictionV2.BetInfo({
            position: IPancakePredictionV2.Position.Bull, amount: 1 ether, claimed: false
        });
        vm.mockCall(
            mockPredictionContract,
            abi.encodeWithSelector(IPancakePredictionV2.ledger.selector, user1, EPOCH_1),
            abi.encode(bet)
        );

        assertFalse(adapter.didUserWin(user1, EPOCH_1));
    }

    // ============================================
    // Helper Functions
    // ============================================

    function _createRound(uint256 epoch, int256 lockPrice, int256 closePrice, bool oracleCalled)
        internal
        pure
        returns (IPancakePredictionV2.Round memory)
    {
        return IPancakePredictionV2.Round({
            epoch: epoch,
            startTimestamp: 1000,
            lockTimestamp: 1300,
            closeTimestamp: 1600,
            lockPrice: lockPrice,
            closePrice: closePrice,
            lockOracleId: 1,
            closeOracleId: 2,
            totalAmount: 10 ether,
            bullAmount: 6 ether,
            bearAmount: 4 ether,
            rewardBaseCalAmount: 4 ether,
            rewardAmount: 9.7 ether,
            oracleCalled: oracleCalled
        });
    }
}

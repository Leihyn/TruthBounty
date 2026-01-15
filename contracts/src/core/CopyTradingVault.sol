// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CopyTradingVault
 * @notice Allows users to automatically copy trades from top predictors
 * @dev Centralized executor model with transparency mitigations
 * @author TruthBounty Team
 */
contract CopyTradingVault is Ownable, Pausable, ReentrancyGuard {
    // ============================================
    // Constants
    // ============================================

    uint256 public constant MAX_ALLOCATION_BPS = 5000; // Max 50% per leader
    uint256 public constant MIN_DEPOSIT = 0.01 ether; // Minimum deposit
    uint256 public constant WITHDRAWAL_DELAY = 1 hours; // Time-lock for withdrawals
    uint256 public constant MAX_VAULT_SIZE = 100 ether; // Cap total vault size initially
    uint256 public constant PROTOCOL_FEE_BPS = 1000; // 10% of profits
    uint256 public constant LEADER_FEE_BPS = 1000; // 10% of profits to leader

    // PancakeSwap Prediction V2 contract on BSC
    address public constant PANCAKE_PREDICTION = 0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA;

    // ============================================
    // State Variables
    // ============================================

    // Executor address (your backend hot wallet) - publicly visible for transparency
    address public executor;

    // Total value locked across all users
    uint256 public totalValueLocked;

    // User balances
    mapping(address => uint256) public balances;

    // Pending withdrawals (time-locked)
    struct PendingWithdrawal {
        uint256 amount;
        uint256 unlockTime;
    }
    mapping(address => PendingWithdrawal) public pendingWithdrawals;

    // Follow configurations
    struct Follow {
        address leader;
        uint256 allocationBps; // Basis points (2500 = 25%)
        uint256 maxBetSize;
        bool active;
        uint256 createdAt;
    }
    mapping(address => Follow[]) public userFollows;

    // Track followers per leader (for leader rewards)
    mapping(address => address[]) public leaderFollowers;

    // Track copy trade history
    struct CopyTrade {
        address follower;
        address leader;
        uint256 epoch;
        uint256 amount;
        bool isBull;
        uint256 timestamp;
    }
    CopyTrade[] public copyTradeHistory;
    mapping(address => uint256[]) public userTradeIds;

    // Prevent duplicate copies per epoch
    mapping(address => mapping(uint256 => bool)) public hasCopiedEpoch;

    // Stats for transparency
    uint256 public totalCopyTrades;
    uint256 public totalVolumeExecuted;
    uint256 public totalFeesCollected;

    // ============================================
    // Events
    // ============================================

    event Deposited(address indexed user, uint256 amount, uint256 newBalance);
    event WithdrawalRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event WithdrawalCompleted(address indexed user, uint256 amount);
    event WithdrawalCancelled(address indexed user, uint256 amount);
    event FollowCreated(address indexed follower, address indexed leader, uint256 allocationBps, uint256 maxBet);
    event FollowUpdated(address indexed follower, address indexed leader, uint256 allocationBps, uint256 maxBet);
    event FollowRemoved(address indexed follower, address indexed leader);
    event CopyTradeExecuted(
        address indexed follower, address indexed leader, uint256 indexed epoch, uint256 amount, bool isBull
    );
    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // ============================================
    // Errors
    // ============================================

    error NotExecutor();
    error InsufficientBalance(uint256 required, uint256 available);
    error BelowMinimumDeposit(uint256 sent, uint256 minimum);
    error VaultCapExceeded(uint256 newTotal, uint256 cap);
    error AllocationTooHigh(uint256 requested, uint256 maximum);
    error FollowNotFound(address leader);
    error FollowAlreadyExists(address leader);
    error AlreadyCopiedEpoch(uint256 epoch);
    error NoActiveFollow(address follower, address leader);
    error WithdrawalNotReady(uint256 unlockTime, uint256 currentTime);
    error NoPendingWithdrawal();
    error ZeroAmount();
    error InvalidLeader();

    // ============================================
    // Modifiers
    // ============================================

    modifier onlyExecutor() {
        if (msg.sender != executor) revert NotExecutor();
        _;
    }

    // ============================================
    // Constructor
    // ============================================

    constructor(address _executor) Ownable(msg.sender) {
        executor = _executor;
        emit ExecutorUpdated(address(0), _executor);
    }

    // ============================================
    // User Functions: Deposits
    // ============================================

    /**
     * @notice Deposit BNB into the vault
     */
    function deposit() external payable whenNotPaused nonReentrant {
        if (msg.value < MIN_DEPOSIT) {
            revert BelowMinimumDeposit(msg.value, MIN_DEPOSIT);
        }

        uint256 newTotalLocked = totalValueLocked + msg.value;
        if (newTotalLocked > MAX_VAULT_SIZE) {
            revert VaultCapExceeded(newTotalLocked, MAX_VAULT_SIZE);
        }

        balances[msg.sender] += msg.value;
        totalValueLocked += msg.value;

        emit Deposited(msg.sender, msg.value, balances[msg.sender]);
    }

    /**
     * @notice Request a withdrawal (time-locked for security)
     * @param amount Amount to withdraw
     */
    function requestWithdrawal(uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance(amount, balances[msg.sender]);
        }

        // Lock the funds
        balances[msg.sender] -= amount;
        totalValueLocked -= amount;

        // Set unlock time
        uint256 unlockTime = block.timestamp + WITHDRAWAL_DELAY;
        pendingWithdrawals[msg.sender] =
            PendingWithdrawal({amount: pendingWithdrawals[msg.sender].amount + amount, unlockTime: unlockTime});

        emit WithdrawalRequested(msg.sender, amount, unlockTime);
    }

    /**
     * @notice Complete a pending withdrawal after time-lock expires
     */
    function completeWithdrawal() external nonReentrant {
        PendingWithdrawal memory pending = pendingWithdrawals[msg.sender];

        if (pending.amount == 0) revert NoPendingWithdrawal();
        if (block.timestamp < pending.unlockTime) {
            revert WithdrawalNotReady(pending.unlockTime, block.timestamp);
        }

        // Clear pending
        delete pendingWithdrawals[msg.sender];

        // Transfer funds
        (bool success,) = payable(msg.sender).call{value: pending.amount}("");
        require(success, "Transfer failed");

        emit WithdrawalCompleted(msg.sender, pending.amount);
    }

    /**
     * @notice Cancel a pending withdrawal and return funds to balance
     */
    function cancelWithdrawal() external nonReentrant {
        PendingWithdrawal memory pending = pendingWithdrawals[msg.sender];

        if (pending.amount == 0) revert NoPendingWithdrawal();

        // Return to balance
        balances[msg.sender] += pending.amount;
        totalValueLocked += pending.amount;

        // Clear pending
        delete pendingWithdrawals[msg.sender];

        emit WithdrawalCancelled(msg.sender, pending.amount);
    }

    // ============================================
    // User Functions: Follow Management
    // ============================================

    /**
     * @notice Follow a leader to copy their trades
     * @param leader Address of the leader to follow
     * @param allocationBps Percentage of your balance to allocate (in basis points)
     * @param maxBetSize Maximum bet size per trade
     */
    function follow(address leader, uint256 allocationBps, uint256 maxBetSize) external whenNotPaused {
        if (leader == address(0) || leader == msg.sender) revert InvalidLeader();
        if (allocationBps > MAX_ALLOCATION_BPS) {
            revert AllocationTooHigh(allocationBps, MAX_ALLOCATION_BPS);
        }

        // Check if already following this leader
        Follow[] storage follows = userFollows[msg.sender];
        for (uint256 i = 0; i < follows.length; i++) {
            if (follows[i].leader == leader && follows[i].active) {
                revert FollowAlreadyExists(leader);
            }
        }

        // Add new follow
        follows.push(
            Follow({
                leader: leader,
                allocationBps: allocationBps,
                maxBetSize: maxBetSize,
                active: true,
                createdAt: block.timestamp
            })
        );

        // Track follower for leader
        leaderFollowers[leader].push(msg.sender);

        emit FollowCreated(msg.sender, leader, allocationBps, maxBetSize);
    }

    /**
     * @notice Update follow settings
     * @param leader Address of the leader
     * @param allocationBps New allocation percentage
     * @param maxBetSize New maximum bet size
     */
    function updateFollow(address leader, uint256 allocationBps, uint256 maxBetSize) external whenNotPaused {
        if (allocationBps > MAX_ALLOCATION_BPS) {
            revert AllocationTooHigh(allocationBps, MAX_ALLOCATION_BPS);
        }

        Follow[] storage follows = userFollows[msg.sender];
        bool found = false;

        for (uint256 i = 0; i < follows.length; i++) {
            if (follows[i].leader == leader && follows[i].active) {
                follows[i].allocationBps = allocationBps;
                follows[i].maxBetSize = maxBetSize;
                found = true;
                break;
            }
        }

        if (!found) revert FollowNotFound(leader);

        emit FollowUpdated(msg.sender, leader, allocationBps, maxBetSize);
    }

    /**
     * @notice Stop following a leader
     * @param leader Address of the leader to unfollow
     */
    function unfollow(address leader) external {
        Follow[] storage follows = userFollows[msg.sender];
        bool found = false;

        for (uint256 i = 0; i < follows.length; i++) {
            if (follows[i].leader == leader && follows[i].active) {
                follows[i].active = false;
                found = true;
                break;
            }
        }

        if (!found) revert FollowNotFound(leader);

        // Remove from leader's followers list
        _removeFollower(leader, msg.sender);

        emit FollowRemoved(msg.sender, leader);
    }

    // ============================================
    // Executor Functions (Your Backend)
    // ============================================

    /**
     * @notice Execute a copy trade (called by executor when leader bets)
     * @param follower Address of the follower
     * @param leader Address of the leader who placed the original bet
     * @param leaderBetAmount Amount the leader bet
     * @param epoch PancakeSwap prediction round epoch
     * @param isBull True for Bull bet, false for Bear
     */
    function executeCopyTrade(address follower, address leader, uint256 leaderBetAmount, uint256 epoch, bool isBull)
        external
        onlyExecutor
        whenNotPaused
        nonReentrant
    {
        // Prevent duplicate execution
        if (hasCopiedEpoch[follower][epoch]) {
            revert AlreadyCopiedEpoch(epoch);
        }

        // Get active follow
        Follow memory activeFollow = _getActiveFollow(follower, leader);
        if (activeFollow.leader == address(0)) {
            revert NoActiveFollow(follower, leader);
        }

        // Calculate copy amount
        uint256 copyAmount = (leaderBetAmount * activeFollow.allocationBps) / 10000;

        // Apply max bet limit
        if (copyAmount > activeFollow.maxBetSize) {
            copyAmount = activeFollow.maxBetSize;
        }

        // Check balance
        if (copyAmount > balances[follower]) {
            copyAmount = balances[follower];
        }

        // Must have some amount to bet
        if (copyAmount == 0) {
            revert ZeroAmount();
        }

        // Deduct from balance
        balances[follower] -= copyAmount;
        totalValueLocked -= copyAmount;

        // Mark as copied
        hasCopiedEpoch[follower][epoch] = true;

        // Record trade
        uint256 tradeId = copyTradeHistory.length;
        copyTradeHistory.push(
            CopyTrade({
                follower: follower,
                leader: leader,
                epoch: epoch,
                amount: copyAmount,
                isBull: isBull,
                timestamp: block.timestamp
            })
        );
        userTradeIds[follower].push(tradeId);

        // Update stats
        totalCopyTrades++;
        totalVolumeExecuted += copyAmount;

        // Execute bet on PancakeSwap
        if (isBull) {
            IPancakePrediction(PANCAKE_PREDICTION).betBull{value: copyAmount}(epoch);
        } else {
            IPancakePrediction(PANCAKE_PREDICTION).betBear{value: copyAmount}(epoch);
        }

        emit CopyTradeExecuted(follower, leader, epoch, copyAmount, isBull);
    }

    /**
     * @notice Batch execute copy trades for multiple followers
     * @param followers Array of follower addresses
     * @param leader Leader address
     * @param leaderBetAmount Leader's bet amount
     * @param epoch Round epoch
     * @param isBull Bull or Bear
     */
    function batchExecuteCopyTrades(
        address[] calldata followers,
        address leader,
        uint256 leaderBetAmount,
        uint256 epoch,
        bool isBull
    ) external onlyExecutor whenNotPaused {
        for (uint256 i = 0; i < followers.length; i++) {
            // Skip if already copied or no balance
            if (hasCopiedEpoch[followers[i]][epoch]) continue;
            if (balances[followers[i]] == 0) continue;

            // Try to execute (don't revert on individual failures)
            try this.executeCopyTradeInternal(followers[i], leader, leaderBetAmount, epoch, isBull) {
            // Success
            }
                catch {
                // Skip failed executions
            }
        }
    }

    /**
     * @dev Internal function for batch execution
     */
    function executeCopyTradeInternal(
        address follower,
        address leader,
        uint256 leaderBetAmount,
        uint256 epoch,
        bool isBull
    ) external {
        require(msg.sender == address(this), "Internal only");

        Follow memory activeFollow = _getActiveFollow(follower, leader);
        if (activeFollow.leader == address(0)) return;

        uint256 copyAmount = (leaderBetAmount * activeFollow.allocationBps) / 10000;
        if (copyAmount > activeFollow.maxBetSize) copyAmount = activeFollow.maxBetSize;
        if (copyAmount > balances[follower]) copyAmount = balances[follower];
        if (copyAmount == 0) return;

        balances[follower] -= copyAmount;
        totalValueLocked -= copyAmount;
        hasCopiedEpoch[follower][epoch] = true;

        uint256 tradeId = copyTradeHistory.length;
        copyTradeHistory.push(
            CopyTrade({
                follower: follower,
                leader: leader,
                epoch: epoch,
                amount: copyAmount,
                isBull: isBull,
                timestamp: block.timestamp
            })
        );
        userTradeIds[follower].push(tradeId);

        totalCopyTrades++;
        totalVolumeExecuted += copyAmount;

        if (isBull) {
            IPancakePrediction(PANCAKE_PREDICTION).betBull{value: copyAmount}(epoch);
        } else {
            IPancakePrediction(PANCAKE_PREDICTION).betBear{value: copyAmount}(epoch);
        }

        emit CopyTradeExecuted(follower, leader, epoch, copyAmount, isBull);
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice Get user's active follows
     */
    function getUserFollows(address user) external view returns (Follow[] memory) {
        Follow[] storage allFollows = userFollows[user];

        // Count active
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allFollows.length; i++) {
            if (allFollows[i].active) activeCount++;
        }

        // Build result
        Follow[] memory result = new Follow[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < allFollows.length; i++) {
            if (allFollows[i].active) {
                result[idx] = allFollows[i];
                idx++;
            }
        }

        return result;
    }

    /**
     * @notice Get followers of a leader
     */
    function getLeaderFollowers(address leader) external view returns (address[] memory) {
        return leaderFollowers[leader];
    }

    /**
     * @notice Get follower count for a leader
     */
    function getFollowerCount(address leader) external view returns (uint256) {
        return leaderFollowers[leader].length;
    }

    /**
     * @notice Get user's copy trade history
     */
    function getUserTradeHistory(address user) external view returns (CopyTrade[] memory) {
        uint256[] storage tradeIds = userTradeIds[user];
        CopyTrade[] memory trades = new CopyTrade[](tradeIds.length);

        for (uint256 i = 0; i < tradeIds.length; i++) {
            trades[i] = copyTradeHistory[tradeIds[i]];
        }

        return trades;
    }

    /**
     * @notice Get vault stats for transparency
     */
    function getVaultStats()
        external
        view
        returns (
            uint256 _totalValueLocked,
            uint256 _totalCopyTrades,
            uint256 _totalVolumeExecuted,
            uint256 _totalFeesCollected,
            address _executor
        )
    {
        return (totalValueLocked, totalCopyTrades, totalVolumeExecuted, totalFeesCollected, executor);
    }

    // ============================================
    // Admin Functions
    // ============================================

    /**
     * @notice Update executor address
     * @param newExecutor New executor address
     */
    function setExecutor(address newExecutor) external onlyOwner {
        address oldExecutor = executor;
        executor = newExecutor;
        emit ExecutorUpdated(oldExecutor, newExecutor);
    }

    /**
     * @notice Pause the vault
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw accumulated protocol fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 contractBalance = address(this).balance;
        uint256 userFunds = totalValueLocked;

        // Calculate available fees (contract balance minus user funds)
        uint256 availableFees = contractBalance > userFunds ? contractBalance - userFunds : 0;

        if (availableFees > 0) {
            totalFeesCollected += availableFees;
            (bool success,) = payable(owner()).call{value: availableFees}("");
            require(success, "Transfer failed");
            emit FeesWithdrawn(owner(), availableFees);
        }
    }

    // ============================================
    // Internal Functions
    // ============================================

    function _getActiveFollow(address follower, address leader) internal view returns (Follow memory) {
        Follow[] storage follows = userFollows[follower];

        for (uint256 i = 0; i < follows.length; i++) {
            if (follows[i].leader == leader && follows[i].active) {
                return follows[i];
            }
        }

        return Follow(address(0), 0, 0, false, 0);
    }

    function _removeFollower(address leader, address follower) internal {
        address[] storage followers = leaderFollowers[leader];

        for (uint256 i = 0; i < followers.length; i++) {
            if (followers[i] == follower) {
                followers[i] = followers[followers.length - 1];
                followers.pop();
                break;
            }
        }
    }

    // ============================================
    // Receive function for PancakeSwap winnings
    // ============================================

    receive() external payable {
        // Accept winnings from PancakeSwap
    }
}

// ============================================
// Interface for PancakeSwap Prediction V2
// ============================================

interface IPancakePrediction {
    function betBull(uint256 epoch) external payable;
    function betBear(uint256 epoch) external payable;
    function claim(uint256[] calldata epochs) external;
    function currentEpoch() external view returns (uint256);
}

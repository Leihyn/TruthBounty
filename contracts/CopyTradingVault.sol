// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Platform prediction contract interface
interface IPredictionMarket {
    function betBull(uint256 epoch) external payable;
    function betBear(uint256 epoch) external payable;
    function claim(uint256[] calldata epochs) external;
}

/**
 * @title CopyTradingVault
 * @dev Manages funds for copy trading and executes bets on behalf of followers
 *
 * Features:
 * - Users can deposit funds to their copy trading balance
 * - Automated bet execution when followed traders place bets
 * - Configurable allocation percentages and max bet amounts
 * - Emergency pause functionality
 * - Withdrawal of unused funds
 */
contract CopyTradingVault is Ownable, ReentrancyGuard, Pausable {
    // User balance tracking
    mapping(address => uint256) public balances;

    // Copy follow settings: follower => trader => settings
    struct CopySettings {
        uint256 allocationPercentage; // 1-100
        uint256 maxBetAmount;
        bool isActive;
    }

    mapping(address => mapping(address => CopySettings)) public copySettings;

    // Platform whitelist (only allow betting on approved platforms)
    mapping(address => bool) public approvedPlatforms;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event CopyFollowActivated(
        address indexed follower, address indexed trader, uint256 allocationPercentage, uint256 maxBetAmount
    );
    event CopyFollowDeactivated(address indexed follower, address indexed trader);
    event BetCopied(
        address indexed follower,
        address indexed trader,
        address indexed platform,
        uint256 epoch,
        uint256 amount,
        string position
    );
    event PlatformApproved(address indexed platform, bool approved);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deposit funds for copy trading
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be > 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw unused funds
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Withdraw amount must be > 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Set or update copy trading settings
     */
    function setCopyFollow(address trader, uint256 allocationPercentage, uint256 maxBetAmount) external whenNotPaused {
        require(trader != address(0), "Invalid trader address");
        require(trader != msg.sender, "Cannot copy yourself");
        require(allocationPercentage >= 1 && allocationPercentage <= 100, "Allocation must be 1-100%");
        require(maxBetAmount > 0, "Max bet amount must be > 0");

        copySettings[msg.sender][trader] =
            CopySettings({allocationPercentage: allocationPercentage, maxBetAmount: maxBetAmount, isActive: true});

        emit CopyFollowActivated(msg.sender, trader, allocationPercentage, maxBetAmount);
    }

    /**
     * @dev Stop copy trading a specific trader
     */
    function stopCopyFollow(address trader) external {
        require(copySettings[msg.sender][trader].isActive, "Not following this trader");

        copySettings[msg.sender][trader].isActive = false;
        emit CopyFollowDeactivated(msg.sender, trader);
    }

    /**
     * @dev Execute a copy bet on behalf of a follower
     * Can only be called by approved operators (backend service)
     */
    function executeCopyBet(
        address follower,
        address trader,
        address platform,
        uint256 epoch,
        bool isBull,
        uint256 traderBetAmount
    ) external onlyOwner nonReentrant whenNotPaused {
        require(approvedPlatforms[platform], "Platform not approved");

        CopySettings memory settings = copySettings[follower][trader];
        require(settings.isActive, "Copy trading not active");

        // Calculate copy bet amount
        uint256 copyAmount = (traderBetAmount * settings.allocationPercentage) / 100;

        // Cap at max bet amount
        if (copyAmount > settings.maxBetAmount) {
            copyAmount = settings.maxBetAmount;
        }

        require(balances[follower] >= copyAmount, "Insufficient balance");

        // Deduct from follower's balance
        balances[follower] -= copyAmount;

        // Place bet on the platform
        IPredictionMarket market = IPredictionMarket(platform);
        if (isBull) {
            market.betBull{value: copyAmount}(epoch);
        } else {
            market.betBear{value: copyAmount}(epoch);
        }

        emit BetCopied(follower, trader, platform, epoch, copyAmount, isBull ? "Bull" : "Bear");
    }

    /**
     * @dev Claim rewards from prediction platform and credit to user balance
     * Users can call this directly or we can automate it
     */
    function claimRewards(address platform, uint256[] calldata epochs) external nonReentrant whenNotPaused {
        require(approvedPlatforms[platform], "Platform not approved");

        uint256 balanceBefore = address(this).balance;

        IPredictionMarket market = IPredictionMarket(platform);
        market.claim(epochs);

        uint256 balanceAfter = address(this).balance;
        uint256 rewards = balanceAfter - balanceBefore;

        if (rewards > 0) {
            balances[msg.sender] += rewards;
            emit RewardsClaimed(msg.sender, rewards);
        }
    }

    /**
     * @dev Get copy settings for a specific follower-trader pair
     */
    function getCopySettings(address follower, address trader)
        external
        view
        returns (uint256 allocationPercentage, uint256 maxBetAmount, bool isActive)
    {
        CopySettings memory settings = copySettings[follower][trader];
        return (settings.allocationPercentage, settings.maxBetAmount, settings.isActive);
    }

    /**
     * @dev Admin: Approve or revoke a platform
     */
    function setPlatformApproval(address platform, bool approved) external onlyOwner {
        approvedPlatforms[platform] = approved;
        emit PlatformApproved(platform, approved);
    }

    /**
     * @dev Admin: Pause the contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Admin: Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw for admin (in case of critical bug)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    /**
     * @dev Receive function to accept ETH from prediction platforms
     */
    receive() external payable {}
}

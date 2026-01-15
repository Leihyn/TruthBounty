// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IReputationNFT} from "../interfaces/IReputationNFT.sol";

/**
 * @title ReputationNFTv2
 * @notice TRANSFERABLE Reputation NFT with Verification System
 * @dev NFT can be traded, but leaderboard eligibility requires proof-of-personhood verification
 *
 * Key Changes from v1:
 * - NFTs are fully transferable (can be sold on marketplaces)
 * - Verification system separates NFT ownership from leaderboard eligibility
 * - One verified identity can only link to one NFT at a time
 * - Supports wallet migration (verify new wallet, unlink old)
 *
 * @author TruthBounty Team
 */
contract ReputationNFTv2 is ERC721, Ownable, IReputationNFT {
    using Strings for uint256;

    // ============================================
    // State Variables
    // ============================================

    // TruthBountyCore contract (only address authorized to mint/update)
    address private coreContract;

    // Verification oracle (will be WorldCoin/Gitcoin Passport in v2)
    address private verificationOracle;

    // Token ID counter
    uint256 private _nextTokenId = 1;

    // Mapping from token ID to metadata
    mapping(uint256 => NFTMetadata) private _metadata;

    // Mapping from owner to token ID (for quick lookups, multiple NFTs per address allowed)
    mapping(address => uint256[]) private _ownerTokens;

    // Verification System
    mapping(address => bool) public isVerified; // Address → verified status
    mapping(address => uint256) public verifiedNFT; // Verified address → linked NFT
    mapping(uint256 => address) public nftToVerifiedOwner; // NFT → verified owner
    mapping(bytes32 => bool) public usedNullifiers; // Prevent reuse of verification proofs

    // ============================================
    // Events
    // ============================================

    event VerificationOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event UserVerified(address indexed user, uint256 indexed tokenId, bytes32 nullifierHash);
    event UserUnverified(address indexed user, uint256 indexed tokenId);
    event NFTLinked(address indexed user, uint256 indexed tokenId);
    event NFTUnlinked(address indexed user, uint256 indexed tokenId);

    // ============================================
    // Errors
    // ============================================

    error AlreadyVerified(address user);
    error NotVerified(address user);
    error NullifierAlreadyUsed(bytes32 nullifier);
    error NFTAlreadyLinked(uint256 tokenId);
    error UserHasLinkedNFT(address user);
    error InvalidVerificationProof();

    // ============================================
    // Constructor
    // ============================================

    constructor() ERC721("TruthBounty Reputation v2", "TRUTHv2") Ownable(msg.sender) {}

    // ============================================
    // Modifiers
    // ============================================

    modifier onlyCore() {
        if (msg.sender != coreContract) {
            revert Unauthorized();
        }
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == verificationOracle, "Only oracle");
        _;
    }

    // ============================================
    // Minting (No Restrictions)
    // ============================================

    /**
     * @notice Mints a new reputation NFT to an address
     * @dev Can only be called by TruthBountyCore contract
     * @dev Multiple NFTs per address are allowed (unlike v1)
     * @param to Address to mint the NFT to
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to) external override onlyCore returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        // Initialize metadata
        _metadata[tokenId] = NFTMetadata({
            truthScore: 0,
            tier: ReputationTier.BRONZE,
            totalPredictions: 0,
            correctPredictions: 0,
            winRate: 0,
            totalVolume: 0,
            connectedPlatforms: new string[](0),
            lastUpdate: block.timestamp,
            mintTimestamp: block.timestamp
        });

        // Add to owner's token list
        _ownerTokens[to].push(tokenId);

        emit ReputationMinted(to, tokenId, block.timestamp);
        return tokenId;
    }

    /**
     * @notice Burns a reputation NFT
     * @dev Can only be called by TruthBountyCore or token owner
     * @param tokenId ID of the token to burn
     */
    function burn(uint256 tokenId) external override {
        address owner = ownerOf(tokenId);

        // Check authorization
        if (msg.sender != coreContract && msg.sender != owner) {
            revert Unauthorized();
        }

        // If this NFT is linked to verification, unlink it
        if (nftToVerifiedOwner[tokenId] != address(0)) {
            _unlinkNFT(nftToVerifiedOwner[tokenId], tokenId);
        }

        // Remove from owner's token list
        _removeTokenFromOwner(owner, tokenId);

        // Clear metadata
        delete _metadata[tokenId];

        _burn(tokenId);

        emit ReputationBurned(owner, tokenId, block.timestamp);
    }

    // ============================================
    // Verification System (v2 Feature)
    // ============================================

    /**
     * @notice Verify identity and link to an NFT for leaderboard eligibility
     * @dev Uses nullifier hash to prevent duplicate verifications
     * @param tokenId NFT to link to verified identity
     * @param nullifierHash Unique identifier from proof-of-personhood (prevents sybil)
     * @param proof Verification proof (signature from oracle)
     */
    function verifyAndLinkNFT(uint256 tokenId, bytes32 nullifierHash, bytes calldata proof) external {
        // Check NFT ownership
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");

        // Check nullifier hasn't been used
        if (usedNullifiers[nullifierHash]) {
            revert NullifierAlreadyUsed(nullifierHash);
        }

        // Check user doesn't already have a linked NFT
        if (verifiedNFT[msg.sender] != 0) {
            revert UserHasLinkedNFT(msg.sender);
        }

        // Check NFT isn't already linked
        if (nftToVerifiedOwner[tokenId] != address(0)) {
            revert NFTAlreadyLinked(tokenId);
        }

        // Verify proof (oracle signature)
        if (!_verifyProof(msg.sender, tokenId, nullifierHash, proof)) {
            revert InvalidVerificationProof();
        }

        // Mark nullifier as used
        usedNullifiers[nullifierHash] = true;

        // Mark user as verified
        isVerified[msg.sender] = true;

        // Link NFT to verified user
        verifiedNFT[msg.sender] = tokenId;
        nftToVerifiedOwner[tokenId] = msg.sender;

        emit UserVerified(msg.sender, tokenId, nullifierHash);
        emit NFTLinked(msg.sender, tokenId);
    }

    /**
     * @notice Unlink current NFT (for wallet migration or selling NFT)
     * @dev Allows user to verify a different NFT or different wallet
     */
    function unlinkNFT() external {
        uint256 tokenId = verifiedNFT[msg.sender];
        require(tokenId != 0, "No linked NFT");

        _unlinkNFT(msg.sender, tokenId);
    }

    /**
     * @notice Internal function to unlink NFT from verification
     */
    function _unlinkNFT(address user, uint256 tokenId) internal {
        delete verifiedNFT[user];
        delete nftToVerifiedOwner[tokenId];

        emit NFTUnlinked(user, tokenId);
    }

    /**
     * @notice Check if user is eligible for leaderboard (verified + owns linked NFT)
     * @param user Address to check
     * @return eligible True if user is verified and owns their linked NFT
     */
    function isLeaderboardEligible(address user) external view returns (bool eligible) {
        if (!isVerified[user]) return false;

        uint256 tokenId = verifiedNFT[user];
        if (tokenId == 0) return false;

        // Check user still owns the NFT
        return ownerOf(tokenId) == user;
    }

    /**
     * @notice Gets verified NFT for a user
     * @param user Address to query
     * @return tokenId Linked NFT (0 if none)
     */
    function getVerifiedNFT(address user) external view returns (uint256 tokenId) {
        return verifiedNFT[user];
    }

    // ============================================
    // Metadata Management
    // ============================================

    /**
     * @notice Updates the metadata for a token
     * @dev Can only be called by TruthBountyCore contract
     * @dev Includes recency bonus in truthScore
     */
    function updateMetadata(
        uint256 tokenId,
        uint256 truthScore,
        uint256 totalPredictions,
        uint256 correctPredictions,
        uint256 totalVolume,
        string[] memory connectedPlatforms
    ) external override onlyCore {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }

        NFTMetadata storage metadata = _metadata[tokenId];

        uint256 oldScore = metadata.truthScore;
        ReputationTier oldTier = metadata.tier;

        // Calculate new tier (based on base score, not including recency bonus)
        ReputationTier newTier = _calculateTier(truthScore);

        // Calculate win rate
        uint256 winRate = totalPredictions > 0 ? (correctPredictions * 10000) / totalPredictions : 0;

        // Update metadata
        metadata.truthScore = truthScore; // Includes recency bonus
        metadata.tier = newTier;
        metadata.totalPredictions = totalPredictions;
        metadata.correctPredictions = correctPredictions;
        metadata.winRate = winRate;
        metadata.totalVolume = totalVolume;
        metadata.connectedPlatforms = connectedPlatforms;
        metadata.lastUpdate = block.timestamp;

        emit MetadataUpdated(tokenId, oldScore, truthScore, oldTier, newTier);

        // Emit tier upgrade event if tier increased
        if (uint256(newTier) > uint256(oldTier)) {
            emit TierUpgraded(tokenId, ownerOf(tokenId), newTier, truthScore);
        }
    }

    function getMetadata(uint256 tokenId) external view override returns (NFTMetadata memory metadata) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }
        return _metadata[tokenId];
    }

    function getTier(uint256 tokenId) external view override returns (ReputationTier tier) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }
        return _metadata[tokenId].tier;
    }

    function getTruthScore(uint256 tokenId) external view override returns (uint256 truthScore) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }
        return _metadata[tokenId].truthScore;
    }

    // ============================================
    // Token Queries
    // ============================================

    /**
     * @notice Gets all token IDs owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory tokenIds) {
        return _ownerTokens[owner];
    }

    /**
     * @notice Gets the first token ID owned by an address (for backward compatibility)
     * @dev Returns 0 if address doesn't own any tokens
     */
    function tokenOfOwner(address owner) external view override returns (uint256 tokenId) {
        uint256[] memory tokens = _ownerTokens[owner];
        return tokens.length > 0 ? tokens[0] : 0;
    }

    function hasToken(address owner) external view override returns (bool) {
        return _ownerTokens[owner].length > 0;
    }

    // ============================================
    // Token URI (Dynamic Metadata)
    // ============================================

    function tokenURI(uint256 tokenId) public view override(ERC721, IReputationNFT) returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }

        NFTMetadata memory metadata = _metadata[tokenId];

        // Generate SVG
        string memory svg = _generateSVG(metadata, tokenId);

        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "TruthBounty Reputation #',
                        tokenId.toString(),
                        '", "description": "Transferable reputation NFT with verification system. Verify identity to unlock leaderboard access.", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '", "attributes": [',
                        '{"trait_type": "TruthScore", "value": ',
                        metadata.truthScore.toString(),
                        "},",
                        '{"trait_type": "Tier", "value": "',
                        _getTierName(metadata.tier),
                        '"},',
                        '{"trait_type": "Win Rate", "value": ',
                        (metadata.winRate / 100).toString(),
                        "},",
                        '{"trait_type": "Total Predictions", "value": ',
                        metadata.totalPredictions.toString(),
                        "},",
                        '{"trait_type": "Verified", "value": ',
                        (nftToVerifiedOwner[tokenId] != address(0) ? "true" : "false"),
                        "}]}"
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // ============================================
    // Transfer Hooks (Update Ownership Tracking)
    // ============================================

    /**
     * @dev Override to track ownership changes
     * @dev NFTs are FULLY TRANSFERABLE (unlike v1)
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Handle ownership tracking
        if (from != address(0) && to != address(0)) {
            // Transfer: remove from old owner, add to new owner
            _removeTokenFromOwner(from, tokenId);
            _ownerTokens[to].push(tokenId);

            // If NFT is verified, unlink it (verification doesn't transfer with NFT)
            if (nftToVerifiedOwner[tokenId] != address(0)) {
                _unlinkNFT(nftToVerifiedOwner[tokenId], tokenId);
            }
        } else if (to != address(0)) {
            // Mint: already handled in mint()
        } else {
            // Burn: already handled in burn()
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Helper to remove token from owner's list
     */
    function _removeTokenFromOwner(address owner, uint256 tokenId) internal {
        uint256[] storage tokens = _ownerTokens[owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    // ============================================
    // Access Control
    // ============================================

    function setCore(address coreContract_) external override onlyOwner {
        address oldCore = coreContract;
        coreContract = coreContract_;
        emit CoreUpdated(oldCore, coreContract_);
    }

    function getCore() external view override returns (address) {
        return coreContract;
    }

    /**
     * @notice Sets the verification oracle address
     * @dev Oracle will verify proof-of-personhood proofs
     */
    function setVerificationOracle(address oracle) external onlyOwner {
        address oldOracle = verificationOracle;
        verificationOracle = oracle;
        emit VerificationOracleUpdated(oldOracle, oracle);
    }

    function getVerificationOracle() external view returns (address) {
        return verificationOracle;
    }

    // ============================================
    // Internal Verification Logic
    // ============================================

    /**
     * @dev Verifies proof from oracle (simplified version)
     * @dev In production, this would verify WorldCoin/Gitcoin Passport proofs
     */
    function _verifyProof(address user, uint256 tokenId, bytes32 nullifierHash, bytes calldata proof)
        internal
        view
        returns (bool)
    {
        // For MVP: Oracle signs hash of (user, tokenId, nullifierHash)
        bytes32 messageHash = keccak256(abi.encodePacked(user, tokenId, nullifierHash));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Extract signature components
        require(proof.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(proof.offset)
            s := calldataload(add(proof.offset, 32))
            v := byte(0, calldataload(add(proof.offset, 64)))
        }

        address signer = ecrecover(ethSignedHash, v, r, s);
        return signer == verificationOracle;
    }

    // ============================================
    // Internal Helper Functions
    // ============================================

    /**
     * @dev Calculates tier based on TruthScore (0-1300 scale)
     * Thresholds: Diamond(900+), Platinum(650+), Gold(400+), Silver(200+), Bronze(0+)
     */
    function _calculateTier(uint256 score) internal pure returns (ReputationTier) {
        if (score >= 900) return ReputationTier.DIAMOND;
        if (score >= 650) return ReputationTier.PLATINUM;
        if (score >= 400) return ReputationTier.GOLD;
        if (score >= 200) return ReputationTier.SILVER;
        return ReputationTier.BRONZE;
    }

    function _getTierName(ReputationTier tier) internal pure returns (string memory) {
        if (tier == ReputationTier.DIAMOND) return "DIAMOND";
        if (tier == ReputationTier.PLATINUM) return "PLATINUM";
        if (tier == ReputationTier.GOLD) return "GOLD";
        if (tier == ReputationTier.SILVER) return "SILVER";
        return "BRONZE";
    }

    function _getTierColor(ReputationTier tier) internal pure returns (string memory) {
        if (tier == ReputationTier.DIAMOND) return "#B9F2FF";
        if (tier == ReputationTier.PLATINUM) return "#E5E4E2";
        if (tier == ReputationTier.GOLD) return "#FFD700";
        if (tier == ReputationTier.SILVER) return "#C0C0C0";
        return "#CD7F32"; // Bronze
    }

    function _generateSVG(NFTMetadata memory metadata, uint256 tokenId) internal view returns (string memory) {
        string memory tierColor = _getTierColor(metadata.tier);
        string memory tierName = _getTierName(metadata.tier);
        bool verified = nftToVerifiedOwner[tokenId] != address(0);

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                "<defs>",
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />',
                "</linearGradient>",
                "</defs>",
                '<rect width="400" height="400" fill="url(#bg)"/>',
                // Title
                '<text x="200" y="40" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle">TRUTHBOUNTY v2</text>',
                // Verification Badge
                verified
                    ? unicode'<circle cx="360" cy="40" r="15" fill="#00FF00"/><text x="360" y="45" font-family="Arial" font-size="16" fill="white" text-anchor="middle">✓</text>'
                    : "",
                // Tier Badge
                '<rect x="125" y="60" width="150" height="50" rx="10" fill="',
                tierColor,
                '" opacity="0.3"/>',
                '<text x="200" y="92" font-family="Arial" font-size="20" font-weight="bold" fill="',
                tierColor,
                '" text-anchor="middle">',
                tierName,
                "</text>",
                // TruthScore
                '<text x="200" y="180" font-family="Arial" font-size="18" fill="#888" text-anchor="middle">TruthScore</text>',
                '<text x="200" y="220" font-family="Arial" font-size="48" font-weight="bold" fill="',
                tierColor,
                '" text-anchor="middle">',
                metadata.truthScore.toString(),
                "</text>",
                // Win Rate
                '<text x="100" y="280" font-family="Arial" font-size="16" fill="#888">Win Rate:</text>',
                '<text x="300" y="280" font-family="Arial" font-size="16" font-weight="bold" fill="white" text-anchor="end">',
                (metadata.winRate / 100).toString(),
                ".",
                _twoDigits(metadata.winRate % 100),
                "%</text>",
                // Total Predictions
                '<text x="100" y="320" font-family="Arial" font-size="16" fill="#888">Predictions:</text>',
                '<text x="300" y="320" font-family="Arial" font-size="16" font-weight="bold" fill="white" text-anchor="end">',
                metadata.totalPredictions.toString(),
                "</text>",
                // Footer
                '<text x="200" y="370" font-family="Arial" font-size="12" fill="#666" text-anchor="middle">',
                verified ? "Verified & Transferable" : "Transferable - Verify for Leaderboard",
                "</text>",
                "</svg>"
            )
        );
    }

    function _twoDigits(uint256 num) internal pure returns (string memory) {
        if (num < 10) {
            return string(abi.encodePacked("0", num.toString()));
        }
        return num.toString();
    }
}

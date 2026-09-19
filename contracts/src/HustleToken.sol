// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HustleToken ($HUSTLE)
 * @notice The native utility, curation, and attention staking token of the ProofOfHustle protocol on Monad.
 * @dev Supports minting by authorized protocol contracts (e.g. GigEscrow for hustle-to-earn rewards)
 *      and transparent burning by the ProtocolBurnPool.
 */
contract HustleToken is ERC20, ERC20Burnable, Ownable {
    /// @notice Maximum supply: 100,000,000 $HUSTLE
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;

    /// @notice Authorized minter addresses (e.g., GigEscrow)
    mapping(address => bool) public isMinter;

    event MinterStatusUpdated(address indexed account, bool isMinter);
    event RewardMinted(address indexed recipient, uint256 amount);

    error ExceedsMaxSupply();
    error NotAuthorizedMinter();
    error ZeroAddress();

    modifier onlyMinter() {
        if (!isMinter[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter();
        }
        _;
    }

    constructor(address initialOwner) ERC20("ProofOfHustle Token", "HUSTLE") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();

        // Initial distribution: 20% for liquidity, hackathon seeding, and initial curator pool
        uint256 initialMint = 20_000_000 * 1e18;
        _mint(initialOwner, initialMint);
    }

    /**
     * @notice Set or revoke minter status for a protocol contract
     * @param minter The address to update
     * @param status True to authorize, false to revoke
     */
    function setMinter(address minter, bool status) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        isMinter[minter] = status;
        emit MinterStatusUpdated(minter, status);
    }

    /**
     * @notice Mint rewards to workers or creators upon gig completion (Hustle-to-Earn)
     * @param to Recipient address
     * @param amount Amount of $HUSTLE to mint
     */
    function mintReward(address to, uint256 amount) external onlyMinter {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
        emit RewardMinted(to, amount);
    }
}

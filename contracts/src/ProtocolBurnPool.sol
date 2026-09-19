// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HustleToken.sol";

/**
 * @title ProtocolBurnPool
 * @notice Receives 40% of all escrow protocol fees and burns $HUSTLE to 0x0...dEaD.
 * @dev Deflationary flywheel powering ProofOfHustle's attention and token economy.
 */
contract ProtocolBurnPool is Ownable {
    using SafeERC20 for IERC20;

    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    HustleToken public hustleToken;
    uint256 public totalHustleBurned;
    uint256 public totalFeesReceived;

    event FeeReceived(address indexed token, uint256 amount, address indexed from);
    event TokensBurned(uint256 amount, uint256 totalBurnedToDate, uint256 timestamp);

    error ZeroAddress();
    error ZeroAmount();

    constructor(address initialOwner, address _hustleToken) Ownable(initialOwner) {
        if (initialOwner == address(0) || _hustleToken == address(0)) revert ZeroAddress();
        hustleToken = HustleToken(_hustleToken);
    }

    /// @notice Allow contract to receive native MON fees
    receive() external payable {
        if (msg.value > 0) {
            totalFeesReceived += msg.value;
            emit FeeReceived(address(0), msg.value, msg.sender);
        }
    }

    /**
     * @notice Notify pool of incoming ERC20 protocol fee deposit
     * @param token Address of the fee token deposited
     * @param amount Amount deposited
     */
    function notifyFeeDeposit(address token, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        totalFeesReceived += amount;
        emit FeeReceived(token, amount, msg.sender);

        // If deposited in $HUSTLE, burn it immediately
        if (token == address(hustleToken)) {
            _executeBurn(amount);
        }
    }

    /**
     * @notice Permissionless trigger to burn any accumulated $HUSTLE held by this contract
     */
    function burnHeldHustle() external {
        uint256 balance = hustleToken.balanceOf(address(this));
        if (balance == 0) revert ZeroAmount();
        _executeBurn(balance);
    }

    function _executeBurn(uint256 amount) internal {
        totalHustleBurned += amount;
        // Transfer to DEAD address and call burn if available
        hustleToken.burn(amount);
        emit TokensBurned(amount, totalHustleBurned, block.timestamp);
    }
}

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
    address public escrowContract;
    uint256 public totalHustleBurned;
    uint256 public totalFeesReceived;

    event FeeReceived(address indexed token, uint256 amount, address indexed from);
    event TokensBurned(uint256 amount, uint256 totalBurnedToDate, uint256 timestamp);
    event EscrowContractUpdated(address indexed newEscrowContract);
    event FeeTokensWithdrawn(address indexed token, address indexed to, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error NotAuthorized();
    error TransferFailed();

    constructor(address initialOwner, address _hustleToken) Ownable(initialOwner) {
        if (initialOwner == address(0) || _hustleToken == address(0)) revert ZeroAddress();
        hustleToken = HustleToken(_hustleToken);
    }

    /**
     * @notice Set authorized GigEscrow contract address
     * @param _escrowContract Address of the escrow protocol
     */
    function setEscrowContract(address _escrowContract) external onlyOwner {
        if (_escrowContract == address(0)) revert ZeroAddress();
        escrowContract = _escrowContract;
        emit EscrowContractUpdated(_escrowContract);
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
     * @dev Restricted to authorized escrowContract or owner to prevent metric spoofing
     * @param token Address of the fee token deposited
     * @param amount Amount deposited
     */
    function notifyFeeDeposit(address token, uint256 amount) external {
        if (msg.sender != escrowContract && msg.sender != owner()) revert NotAuthorized();
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

    /**
     * @notice Withdraw accumulated non-$HUSTLE protocol fee tokens (e.g. USDT, MON)
     *         for treasury buyback-and-burn operations on Monad DEXs
     * @param token Address of the token (address(0) for native MON)
     * @param to Recipient treasury/buyback executor address
     * @param amount Amount to withdraw
     */
    function withdrawFeeTokens(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        if (token == address(0)) {
            if (amount > address(this).balance) revert ZeroAmount();
            (bool ok, ) = to.call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }

        emit FeeTokensWithdrawn(token, to, amount);
    }

    function _executeBurn(uint256 amount) internal {
        totalHustleBurned += amount;
        // Transfer to DEAD address and call burn if available
        hustleToken.burn(amount);
        emit TokensBurned(amount, totalHustleBurned, block.timestamp);
    }
}

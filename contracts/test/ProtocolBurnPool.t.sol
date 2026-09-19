// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/ProtocolBurnPool.sol";
import "../src/HustleToken.sol";

contract ProtocolBurnPoolTest is Test {
    ProtocolBurnPool public burnPool;
    HustleToken public hustleToken;

    address public owner = address(0x1);
    address public user = address(0x2);

    function setUp() public {
        vm.startPrank(owner);
        hustleToken = new HustleToken(owner);
        burnPool = new ProtocolBurnPool(owner, address(hustleToken));
        vm.stopPrank();
    }

    function testNotifyFeeDepositBurnsHustle() public {
        vm.startPrank(owner);
        hustleToken.transfer(address(burnPool), 10_000 * 1e18);
        burnPool.notifyFeeDeposit(address(hustleToken), 10_000 * 1e18);
        vm.stopPrank();

        assertEq(burnPool.totalHustleBurned(), 10_000 * 1e18);
        assertEq(burnPool.totalFeesReceived(), 10_000 * 1e18);
    }

    function testBurnHeldHustle() public {
        vm.prank(owner);
        hustleToken.transfer(address(burnPool), 5_000 * 1e18);

        burnPool.burnHeldHustle();
        assertEq(burnPool.totalHustleBurned(), 5_000 * 1e18);
    }

    function testReceiveNativeMON() public {
        vm.deal(user, 5 ether);
        vm.prank(user);
        (bool ok, ) = address(burnPool).call{value: 2 ether}("");
        assertTrue(ok);
        assertEq(burnPool.totalFeesReceived(), 2 ether);
    }
}

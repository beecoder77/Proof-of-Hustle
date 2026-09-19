// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/HustleToken.sol";

contract HustleTokenTest is Test {
    HustleToken public token;
    address public owner = address(0x1);
    address public minter = address(0x2);
    address public user = address(0x3);

    function setUp() public {
        vm.prank(owner);
        token = new HustleToken(owner);
    }

    function testInitialSupply() public view {
        assertEq(token.totalSupply(), 20_000_000 * 1e18);
        assertEq(token.balanceOf(owner), 20_000_000 * 1e18);
    }

    function testSetMinter() public {
        vm.prank(owner);
        token.setMinter(minter, true);
        assertTrue(token.isMinter(minter));

        vm.prank(minter);
        token.mintReward(user, 1000 * 1e18);
        assertEq(token.balanceOf(user), 1000 * 1e18);
    }

    function testNonMinterCannotMint() public {
        vm.prank(user);
        vm.expectRevert(HustleToken.NotAuthorizedMinter.selector);
        token.mintReward(user, 1000 * 1e18);
    }

    function testBurn() public {
        vm.prank(owner);
        token.burn(5_000_000 * 1e18);
        assertEq(token.totalSupply(), 15_000_000 * 1e18);
    }
}

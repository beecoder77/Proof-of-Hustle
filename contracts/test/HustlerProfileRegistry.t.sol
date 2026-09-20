// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/HustlerProfileRegistry.sol";

contract HustlerProfileRegistryTest is Test {
    HustlerProfileRegistry public registry;
    address public owner = address(0xA11CE);
    address public alice = address(0xB0B);
    address public bob = address(0xCAFE);

    function setUp() public {
        registry = new HustlerProfileRegistry(owner);
    }

    function testRegisterHandleSuccess() public {
        vm.prank(alice);
        registry.registerHandle("nad_master", "Solidity Craftsman");

        HustlerProfileRegistry.Profile memory p = registry.getProfile(alice);
        assertEq(p.handle, "@nad_master");
        assertEq(p.bio, "Solidity Craftsman");
        assertGt(p.registeredAt, 0);
        assertEq(p.updatedAt, p.registeredAt);

        // Reverse lookup
        assertEq(registry.resolveHandle("nad_master"), alice);
        assertEq(registry.resolveHandle("@NAD_MASTER"), alice);
        assertFalse(registry.isHandleAvailable("nad_master"));
    }

    function testCaseInsensitiveHandleNormalization() public {
        vm.prank(alice);
        registry.registerHandle("@Alice_Builder", "Fullstack dev");

        // Bob tries to register lowercase or uppercase of same handle
        vm.prank(bob);
        vm.expectRevert(HustlerProfileRegistry.HandleAlreadyTaken.selector);
        registry.registerHandle("alice_builder", "Imposter");

        vm.prank(bob);
        vm.expectRevert(HustlerProfileRegistry.HandleAlreadyTaken.selector);
        registry.registerHandle("@ALICE_BUILDER", "Imposter");
    }

    function testHandleUpdateReleasesOldHandle() public {
        vm.prank(alice);
        registry.registerHandle("alice_v1", "Bio 1");
        assertEq(registry.resolveHandle("alice_v1"), alice);

        // Alice updates to alice_v2
        vm.prank(alice);
        registry.registerHandle("alice_v2", "Bio 2");
        assertEq(registry.resolveHandle("alice_v2"), alice);

        // Old handle is now available for Bob
        assertTrue(registry.isHandleAvailable("alice_v1"));
        vm.prank(bob);
        registry.registerHandle("alice_v1", "Bob claims old handle");
        assertEq(registry.resolveHandle("alice_v1"), bob);
    }

    function testRejectInvalidCharacters() public {
        vm.prank(alice);
        vm.expectRevert(HustlerProfileRegistry.InvalidHandleCharacters.selector);
        registry.registerHandle("nad master", "Invalid space");

        vm.prank(alice);
        vm.expectRevert(HustlerProfileRegistry.InvalidHandleCharacters.selector);
        registry.registerHandle("nad!master", "Invalid exclamation mark");
    }

    function testRejectHandleTooShortOrLong() public {
        vm.prank(alice);
        vm.expectRevert(HustlerProfileRegistry.HandleTooShort.selector);
        registry.registerHandle("ab", "Too short");

        vm.prank(alice);
        vm.expectRevert(HustlerProfileRegistry.HandleTooLong.selector);
        registry.registerHandle("this_handle_is_way_too_long_for_registration", "Too long");
    }

    function testRegisterHandleForByOwner() public {
        vm.prank(owner);
        registry.registerHandleFor(alice, "sponsored_alice", "Owner registered for alice");

        HustlerProfileRegistry.Profile memory p = registry.getProfile(alice);
        assertEq(p.handle, "@sponsored_alice");
        assertEq(p.bio, "Owner registered for alice");
        assertEq(registry.resolveHandle("sponsored_alice"), alice);

        // Non-owner cannot call registerHandleFor
        vm.prank(bob);
        vm.expectRevert();
        registry.registerHandleFor(bob, "bob_hacker", "Illegal call");
    }
}

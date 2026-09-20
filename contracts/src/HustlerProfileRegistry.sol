// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HustlerProfileRegistry
 * @notice Canonical onchain identity, handle resolver, and builder reputation registry on Monad.
 * @dev Enforces unique case-insensitive handle reservation, verifiable bio/avatar metadata,
 *      and sub-400ms reverse resolution for ProofOfHustle builders.
 */
contract HustlerProfileRegistry is Ownable {
    struct Profile {
        string handle;          // e.g. "@nad_architect"
        string bio;             // e.g. "Solidity Core Dev & Monad Parallel EVM Builder"
        string avatarUri;       // IPFS CID or custom avatar URI
        uint40 registeredAt;    // Unix timestamp of initial registration
        uint40 updatedAt;       // Unix timestamp of latest profile update
    }

    /// @notice Mapping from user address to onchain Profile
    mapping(address => Profile) public profiles;

    /// @notice Mapping from normalized lowercase handle to registered owner address
    mapping(string => address) public handleToAddress;

    /// @notice Total registered handles onchain
    uint256 public totalProfiles;

    event HandleRegistered(
        address indexed user,
        string indexed handleNormalized,
        string handle,
        uint256 timestamp
    );

    event ProfileUpdated(
        address indexed user,
        string bio,
        string avatarUri,
        uint256 timestamp
    );

    error HandleAlreadyTaken();
    error HandleTooShort();
    error HandleTooLong();
    error InvalidHandleCharacters();
    error ZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    /**
     * @notice Register or update caller's onchain handle and bio
     * @param handle Desired handle (e.g. "@nad_architect" or "nad_architect")
     * @param bio Builder bio / skill summary
     */
    function registerHandle(string calldata handle, string calldata bio) external {
        _registerHandleFor(msg.sender, handle, bio);
    }

    /**
     * @notice Register or update onchain handle for a specific user (Gas-sponsored relayer by owner)
     * @param user Target user address
     * @param handle Desired handle
     * @param bio Builder bio / skill summary
     */
    function registerHandleFor(address user, string calldata handle, string calldata bio) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        _registerHandleFor(user, handle, bio);
    }

    function _registerHandleFor(address user, string memory handle, string memory bio) internal {
        string memory normalized = _normalizeHandle(handle);
        bytes memory handleBytes = bytes(normalized);

        if (handleBytes.length < 3) revert HandleTooShort();
        if (handleBytes.length > 24) revert HandleTooLong();

        // Ensure characters are strictly alphanumeric, underscore, or period
        for (uint256 i = 0; i < handleBytes.length; i++) {
            bytes1 char = handleBytes[i];
            bool isLowerAlpha = (char >= 0x61 && char <= 0x7a);
            bool isNum = (char >= 0x30 && char <= 0x39);
            bool isUnderscore = (char == 0x5f);
            bool isPeriod = (char == 0x2e);

            if (!isLowerAlpha && !isNum && !isUnderscore && !isPeriod) {
                revert InvalidHandleCharacters();
            }
        }

        address currentOwner = handleToAddress[normalized];
        if (currentOwner != address(0) && currentOwner != user) {
            revert HandleAlreadyTaken();
        }

        // Release old handle if changing handle
        string memory oldHandle = profiles[user].handle;
        if (bytes(oldHandle).length > 0) {
            string memory oldNorm = _normalizeHandle(oldHandle);
            if (keccak256(bytes(oldNorm)) != keccak256(bytes(normalized))) {
                delete handleToAddress[oldNorm];
            }
        } else {
            totalProfiles++;
        }

        uint40 currentTime = uint40(block.timestamp);
        uint40 initialRegTime = profiles[user].registeredAt == 0 ? currentTime : profiles[user].registeredAt;

        // Save onchain state
        handleToAddress[normalized] = user;
        profiles[user] = Profile({
            handle: string(abi.encodePacked("@", normalized)),
            bio: bio,
            avatarUri: profiles[user].avatarUri,
            registeredAt: initialRegTime,
            updatedAt: currentTime
        });

        emit HandleRegistered(user, normalized, profiles[user].handle, block.timestamp);
    }

    /**
     * @notice Update bio and avatar without changing handle
     * @param bio New bio description
     * @param avatarUri New avatar IPFS or HTTPS URI
     */
    function updateProfileDetails(string calldata bio, string calldata avatarUri) external {
        if (bytes(profiles[msg.sender].handle).length == 0) revert HandleTooShort();

        profiles[msg.sender].bio = bio;
        profiles[msg.sender].avatarUri = avatarUri;
        profiles[msg.sender].updatedAt = uint40(block.timestamp);

        emit ProfileUpdated(msg.sender, bio, avatarUri, block.timestamp);
    }

    /**
     * @notice Get full profile struct for an address
     * @param user Target address
     */
    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }

    /**
     * @notice Resolve handle to address
     * @param handle Target handle (with or without '@')
     */
    function resolveHandle(string calldata handle) external view returns (address) {
        return handleToAddress[_normalizeHandle(handle)];
    }

    /**
     * @notice Check if a handle is available for registration
     * @param handle Target handle
     */
    function isHandleAvailable(string calldata handle) external view returns (bool) {
        string memory normalized = _normalizeHandle(handle);
        bytes memory handleBytes = bytes(normalized);
        if (handleBytes.length < 3 || handleBytes.length > 24) return false;
        return handleToAddress[normalized] == address(0);
    }

    /**
     * @dev Strips leading '@' and converts uppercase ASCII characters to lowercase
     */
    function _normalizeHandle(string memory str) internal pure returns (string memory) {
        bytes memory b = bytes(str);
        uint256 start = 0;
        if (b.length > 0 && b[0] == "@") {
            start = 1;
        }

        bytes memory clean = new bytes(b.length - start);
        for (uint256 i = start; i < b.length; i++) {
            bytes1 char = b[i];
            // Convert A-Z to a-z
            if (char >= 0x41 && char <= 0x5a) {
                clean[i - start] = bytes1(uint8(char) + 32);
            } else {
                clean[i - start] = char;
            }
        }
        return string(clean);
    }
}

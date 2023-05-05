// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {FxERC20ChildTunnel} from "./interfaces/FxERC20ChildTunnel.sol";

/**
 *   __                                               .__
 *  |  | ___\|/_    ____   ____ _\|/_    _______\|/_  |  |   ____
 *  |  |/ /\__  \  /    \ /    \\__  \  /  ___/\__  \ |  | _/ __ \
 *  |    <  / __ \|   |  \   |  \/ __ \_\___ \  / __ \|  |_\  ___/
 *  |__|_ \(____  /___|  /___|  (____  /____  >(____  /____/\___  >
 *       \/     \/     \/     \/     \/     \/      \/          \/
 *
 *  @title KNN Sale for KNN Token on any Layer2's
 *  @author KANNA Team
 *  @custom:github  https://github.com/kanna-coin
 *  @custom:site https://kannacoin.io
 *  @custom:discord https://discord.kannacoin.io
 */
contract KannaClaimer is Ownable, AccessControl {
    IERC20 public immutable knnToken;

    bytes32 public constant CLAIM_MANAGER_ROLE = keccak256("CLAIM_MANAGER_ROLE");

    bytes32 private constant _CLAIM_TYPEHASH_L2 =
        keccak256("Claim(address recipient,uint256 amountInKNN,uint256 ref,uint256 timestamp,uint256 nonce,uint256 chainId)");

    mapping(uint256 => bool) private claims;

    event Claim(address indexed holder, uint256 indexed ref, uint256 amountInKNN);

    constructor(address _knnToken) {
        require(address(_knnToken) != address(0), "Invalid token address");

        knnToken = IERC20(_knnToken);
    }

    /**
     * @dev Grants `CLAIM_MANAGER_ROLE` to a `claimManager` account.
     *
     * If `claimManager` account had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function addClaimManager(address claimManager) external onlyOwner {
        _grantRole(CLAIM_MANAGER_ROLE, claimManager);
    }

    /**
     * @dev Removes `CLAIM_MANAGER_ROLE` from a `claimManager` account.
     *
     * If `claimManager` had been granted `CLAIM_MANAGER_ROLE`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function removeClaimManager(address claimManager) external onlyOwner {
        _revokeRole(CLAIM_MANAGER_ROLE, claimManager);
    }

    /**
     * @dev Retrieves available supply
     */
    function availableSupply() public view returns (uint256) {
        return knnToken.balanceOf(address(this));
    }

    /**
     * @dev Return non-sold tokens and ends sale
     *
     */
    function end(address leftoverRecipient) external onlyOwner {
        uint256 leftover = availableSupply();
        if (leftover > 0) knnToken.transfer(leftoverRecipient, leftover);
    }

    /**
     * @dev release claimed locked tokens to recipient
     */
    function claimLocked(
        address recipient,
        uint256 amountInKNN,
        uint256 ref,
        uint256 timestamp,
        bytes memory signature,
        uint256 nonce
    ) external {
        require(amountInKNN > 0, "Invalid amount");
        require(availableSupply() >= amountInKNN, "Insufficient locked amount");
        require(timestamp >= block.timestamp, "Signature expired");
        require(address(recipient) != address(0), "Invalid address");
        require(claims[ref] == false, "Already claimed");

        bytes32 signedMessage = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encode(_CLAIM_TYPEHASH_L2, recipient, amountInKNN, ref, timestamp, nonce, block.chainid))
        );

        address signer = ECDSA.recover(signedMessage, signature);

        _checkRole(CLAIM_MANAGER_ROLE, signer);

        knnToken.transfer(recipient, amountInKNN);

        claims[ref] = true;

        emit Claim(recipient, ref, amountInKNN);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IDynamicBadgeChecker} from "./interfaces/IDynamicBadgeChecker.sol";
import {KannaBadges} from "./KannaBadges.sol";

/**
 *  __                                  ___.               .___
 * |  | ___\|/_    ____   ____ _\|/_    \_ |__ _\|/_     __| _/ ____   ____   ______
 * |  |/ /\__  \  /    \ /    \\__  \    | __ \\__  \   / __ | / ___\_/ __ \ /  ___/
 * |    <  / __ \|   |  \   |  \/ __ \_  | \_\ \/ __ \_/ /_/ |/ /_/  >  ___/ \___ \
 * |__|_ \(____  /___|  /___|  (____  /  |___  (____  /\____ |\___  / \___  >____  >
 *      \/     \/     \/     \/     \/       \/     \/      \/_____/      \/     \/
 *
 *  @title KNN Badges L2 (ERC1155)
 *  @author KANNA Team
 *  @custom:github  https://github.com/kanna-coin
 *  @custom:site https://kannacoin.io
 *  @custom:discord https://discord.kannacoin.io
 */
contract KannaBadgesL2 is KannaBadges {
    bytes32 private constant _MINT_TYPEHASH_L2 =
        keccak256("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 dueDate, uint256 nonce, uint256 chainId)");


    constructor(string memory uri_) KannaBadges(uri_) {}

    /**
     * @dev See {KannaBadges-mint}
     */
    function mint(
        address to,
        uint16 id,
        uint256 amount,
        bytes memory signature,
        uint16 incremental,
        uint256 dueDate,
        uint256 nonce
    ) external override tokenExists(id) {
        require(incremental == _mintIncrementalNonces[id][to] + 1, "Invalid Nonce");
        require(block.timestamp <= dueDate, "Invalid date");

        bytes32 signedMessage = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encode(_MINT_TYPEHASH_L2, to, id, amount, incremental, dueDate, nonce, block.chainid))
        );

        address signer = ECDSA.recover(signedMessage, signature);

        _checkRole(MINTER_ROLE, signer);

        _mint(to, id, amount, "");
    }
}

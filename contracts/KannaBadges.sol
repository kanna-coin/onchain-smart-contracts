// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 *  __                                  ___.               .___
 * |  | ___\|/_    ____   ____ _\|/_    \_ |__ _\|/_     __| _/ ____   ____   ______
 * |  |/ /\__  \  /    \ /    \\__  \    | __ \\__  \   / __ | / ___\_/ __ \ /  ___/
 * |    <  / __ \|   |  \   |  \/ __ \_  | \_\ \/ __ \_/ /_/ |/ /_/  >  ___/ \___ \
 * |__|_ \(____  /___|  /___|  (____  /  |___  (____  /\____ |\___  / \___  >____  >
 *      \/     \/     \/     \/     \/       \/     \/      \/_____/      \/     \/
 *
 *  @title KNN Badges (ERC1155)
 *  @author KANNA Team
 *  @custom:github  https://github.com/kanna-coin
 *  @custom:site https://kannacoin.io
 *  @custom:discord https://discord.kannacoin.io
 */
contract KannaBadges is ERC1155, Ownable, AccessControl {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 private constant _MINT_TYPEHASH = keccak256("Mint(address to, uint256 id, uint256 nonce)");

    struct Token {
        uint256 id;
        bool transferable;
        bool accumulative;
    }

    struct TokenBalance {
        uint256 balance;
        Token token;
    }

    uint256[] public tokenIds;
    mapping(uint256 => Token) public tokens;

    event TokenRegistered(uint256 indexed id, bool transferable, bool accumulative);

    constructor (string memory uri_) ERC1155(uri_) {
    }

    modifier tokenExists(uint256 id) {
        require(_exists(id), "Invalid Token");
        _;
    }

    function setURI(string memory uri_) public onlyOwner {
        _setURI(uri_);
    }

    function balanceOf(address account) public view virtual returns (TokenBalance[] memory) {
        require(account != address(0), "ERC1155: address zero is not a valid owner");

        uint length;

        for (uint i=0; i<tokenIds.length; i++) {
            uint256 id = tokenIds[i];

            if (balanceOf(account, id) > 0) {
                length++;
            }
        }

        TokenBalance[] memory balances = new TokenBalance[](length);

        if (length == 0) {
            return balances;
        }

        for (uint i=0; i<tokenIds.length; i++) {
            uint256 id = tokenIds[i];

            if (balanceOf(account, id) > 0) {
                balances[i] = TokenBalance(balanceOf(account, id), tokens[id]);
            }
        }

        return balances;
    }

    /* function balanceOf(address account) public view virtual returns (TokenBalance[] memory) {
        require(account != address(0), "ERC1155: address zero is not a valid owner");

        TokenBalance[] memory balances = new TokenBalance[](tokenIds.length);

        for (uint i=0; i<tokenIds.length; i++) {
            uint256 id = tokenIds[i];

            balances[i] = TokenBalance(balanceOf(account, id), tokens[id]);
        }

        return balances;
    } */

    function register(
        uint id,
        bool transferable,
        bool accumulative
    ) public onlyOwner {
        require(!_exists(id), "Token already exists");

        tokens[id] = Token(id, transferable, accumulative);
        tokenIds.push(id);

        emit TokenRegistered(id, transferable, accumulative);
    }

    function batchMint(
        uint256 id,
        address[] memory addresses
    ) public onlyRole(MINTER_ROLE) tokenExists(id) {
        for (uint i=0; i<addresses.length; i++) {
            _mint(addresses[i], id, 1, "");
        }
    }

    function mint(
        address to,
        uint256 id
    ) public onlyRole(MINTER_ROLE) tokenExists(id) {
        _mint(to, id, 1, "");
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) public onlyRole(MINTER_ROLE) tokenExists(id) {
        _mint(to, id, amount, "");
    }

    function mint(
        address to,
        uint256 id,
        bytes memory signature,
        uint256 nonce
    ) external tokenExists(id) {
        bytes32 signedMessage = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encode(_MINT_TYPEHASH, to, id, nonce))
        );

        address signer = ECDSA.recover(signedMessage, signature);

        _checkRole(MINTER_ROLE, signer);

        _mint(to, id, 1, "");
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory signature,
        uint256 nonce
    ) external tokenExists(id) {
        bytes32 signedMessage = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encode(_MINT_TYPEHASH, to, id, nonce))
        );

        address signer = ECDSA.recover(signedMessage, signature);

        _checkRole(MINTER_ROLE, signer);

        _mint(to, id, amount, "");
    }

    function _beforeTokenTransfer(
        address,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory
    ) internal virtual override {
        for (uint i=0; i<ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            Token memory token = tokens[id];

            require(from == address(0) || token.transferable, string(abi.encodePacked("Token ", id.toString(), " is not transferable")));
            require(token.accumulative || (balanceOf(to, id) == 0 && amount == 1), string(abi.encodePacked("Token ", id.toString(), " is not accumulative")));
        }
    }

    function _exists(
        uint256 _id
    ) internal view returns (bool) {
        return tokens[_id].id > 0;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return
            ERC1155.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId) ||
            super.supportsInterface(interfaceId);
    }
}

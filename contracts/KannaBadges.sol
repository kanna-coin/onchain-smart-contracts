// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IDynamicBadgeChecker} from './interfaces/IDynamicBadgeChecker.sol';
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

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 private constant _MINT_TYPEHASH = keccak256("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 nonce)");

    struct Token {
        uint16 id;
        bool transferable;
        bool accumulative;
    }

    struct TokenBalance {
        uint256 balance;
        Token token;
    }

    mapping(uint16 => Token) public tokensMap;
    uint16 private _lastTokenId;
    mapping(uint16 => address) private _dynamicCheckers;
    mapping(uint16 => uint256) private _totalSupply;
    mapping(uint16 => mapping(address => uint16)) private _mintIncrementalNonces;

    event TokenRegistered(uint16 indexed id, bool transferable, bool accumulative);

    event Mint(address indexed to, uint16 indexed id, uint256 amount, uint16 nonce);

    constructor (string memory uri_) ERC1155(uri_) {
    }

    /**
     * @dev Modifier to check if token ID is registered
     */
    modifier tokenExists(uint16 id) {
        require(exists(id), "Invalid Token");
        _;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public pure virtual returns (string memory) {
        return 'Kanna Badges';
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public pure virtual returns (string memory) {
        return 'KNNB';
    }

    /**
     * @dev Returns all registered tokens.
     */
    function tokens() public view virtual returns(Token[] memory) {
        Token[] memory memoryTokens = new Token[](_lastTokenId);

        for (uint16 i=0; i<_lastTokenId; i++) {
            uint16 id = i + 1;

            memoryTokens[i] = tokensMap[id];
        }

        return memoryTokens;
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substitution mechanism
     */
    function setURI(string memory uri_) public onlyOwner {
        _setURI(uri_);

        for (uint16 i=0; i<_lastTokenId; i++) {
            uint16 id = i + 1;

            emit URI(uri_, id);
        }
    }

    /**
     * @dev Indicates whether any token exist with a given id, or not.
     */
    function exists(uint256 id) public view virtual returns (bool) {
        return id <= _lastTokenId;
    }

    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view virtual returns (uint256) {
        return _totalSupply[uint16(id)];
    }

    /** @dev Return all `TokenBalance` owned by `account`
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account) public view virtual returns (TokenBalance[] memory) {
        require(account != address(0), "ERC1155: address zero is not a valid owner");

        uint16 length;

        for (uint16 i=0; i<_lastTokenId; i++) {
            uint16 id = i + 1;

            if (balanceOf(account, id) > 0) {
                length++;
            }
        }

        TokenBalance[] memory balances = new TokenBalance[](length);

        if (length == 0) {
            return balances;
        }

        for (uint16 i=0; i<_lastTokenId; i++) {
            uint16 id = i + 1;

            if (balanceOf(account, id) > 0) {
                balances[i] = TokenBalance(balanceOf(account, id), tokensMap[id]);
            }
        }

        return balances;
    }

    /**
     * @dev See {IERC1155-balanceOf}
     *
     * Check if token has a dynamic checker.
     */
    function balanceOf(address account, uint256 id) public view virtual override(ERC1155) returns (uint256) {
        uint16 _id = uint16(id);

        if (_dynamicCheckers[_id] != address(0)) {
            return IDynamicBadgeChecker(_dynamicCheckers[_id]).balanceOf(account, _id);
        }

        return super.balanceOf(account, id);
    }

    /** @dev Register a new Token
     *
     * Emits a {TokenRegistered} event with `id`, `transferable` and `accumulative`.
     *
     * Requirements:
     *
     * - the token `id` must not be registered.
     * - the caller must have MANAGER_ROLE.
     */
    function register(
        bool transferable,
        bool accumulative
    ) public onlyRole(MANAGER_ROLE) {
        _lastTokenId++;

        tokensMap[_lastTokenId] = Token(_lastTokenId, transferable, accumulative);

        emit TokenRegistered(_lastTokenId, transferable, accumulative);
    }

    /** @dev Register a dynamic Token with a dynamic checker
     *
     * Emits a {TokenRegistered} event with `id`, `transferable` and `accumulative`.
     *
     * Requirements:
     *
     * - the token `id` must not be registered.
     * - the caller must have MANAGER_ROLE.
     */
    function register(
        address checkerAddress
    ) public onlyRole(MANAGER_ROLE) {
        IDynamicBadgeChecker dynamicChecker = IDynamicBadgeChecker(checkerAddress);

        require(
            dynamicChecker.supportsInterface(type(IDynamicBadgeChecker).interfaceId),
            "`checkerAddress` needs to implement `IDynamicBadgeChecker` interface"
        );

        register(false, dynamicChecker.isAccumulative());

        _dynamicCheckers[_lastTokenId] = checkerAddress;
    }

    /** @dev Creates 1 tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {TransferSingle} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - the caller must have a minter role.
     * - the token `id` must be registered.
     */
    function mint(
        address to,
        uint16 id
    ) public onlyRole(MINTER_ROLE) tokenExists(id) {
        _mint(to, id, 1, "");
    }

    /** @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {TransferSingle} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - the caller must have a minter role.
     * - the token `id` must be registered.
     */
    function mint(
        address to,
        uint16 id,
        uint256 amount
    ) public onlyRole(MINTER_ROLE) tokenExists(id) {
        _mint(to, id, amount, "");
    }

    /** @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {TransferSingle} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - the token `id` must be registered.
     * - the signature signer must have a minter role.
     */
    function mint(
        address to,
        uint16 id,
        uint256 amount,
        bytes memory signature,
        uint16 incremental,
        uint256 nonce
    ) external tokenExists(id) {
        require(incremental == _mintIncrementalNonces[id][to] + 1, "Invalid Nonce");

        bytes32 signedMessage = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encode(_MINT_TYPEHASH, to, id, amount, incremental, nonce))
        );

        address signer = ECDSA.recover(signedMessage, signature);

        _checkRole(MINTER_ROLE, signer);

        _mint(to, id, amount, "");
    }

    /** @dev Creates 1 tokens of token type `id` for each `addresses` and
     * assigns them.
     *
     * Emits a {TransferSingle} event with `from` set to the zero address
     * for each `addresses`.
     *
     * Requirements:
     *
     * - the caller must have a minter role.
     * - the token `id` must be registered.
     */
    function batchMint(
        uint16 id,
        address[] memory addresses
    ) public onlyRole(MINTER_ROLE) tokenExists(id) {
        for (uint256 i=0; i<addresses.length; i++) {
            _mint(addresses[i], id, 1, "");
        }
    }

    /**
     * @dev Grants `MANAGER_ROLE` to a `manager` account.
     *
     * If `manager` account had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function addManager(address newManager) external onlyOwner {
        _grantRole(MANAGER_ROLE, newManager);
    }

    /**
     * @dev Removes `MANAGER_ROLE` from a `manager` account.
     *
     * If `manager` had been granted `MANAGER_ROLE`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function removeManager(address manager) external onlyOwner {
        _revokeRole(MANAGER_ROLE, manager);
    }

    /**
     * @dev Grants `MINTER_ROLE` to a `minter` account.
     *
     * If `minter` account had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function addMinter(address newMinter) external onlyOwner {
        _grantRole(MINTER_ROLE, newMinter);
    }

    /**
     * @dev Removes `MINTER_ROLE` from a `minter` account.
     *
     * If `minter` had been granted `MINTER_ROLE`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function removeMinter(address minter) external onlyOwner {
        _revokeRole(MINTER_ROLE, minter);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return
            ERC1155.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC1155-_beforeTokenTransfer}
     *
     * Check if the transferred tokens are elegible to transfer.
     *
     * Calling conditions (for each `id` and `amount` pair):
     *
     * - When token `transferable` is set to `false` transfer will be blocked,
     * except at minting.
     * - When token `accumulative` is set to `false` transfer will be blocked
     * if amount is greater than `1`, or if the reaceiver already has this
     * token ID.
     */
    function _beforeTokenTransfer(
        address,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory
    ) internal virtual override {
        for (uint i=0; i<ids.length; i++) {
            uint16 id = uint16(ids[i]);
            uint256 amount = amounts[i];
            Token memory token = tokensMap[id];

            require(from == address(0) || token.transferable, "Token is not transferable");
            require(token.accumulative || (balanceOf(to, id) == 0 && amount == 1), "Token is not accumulative");
            require(from != address(0) || _dynamicCheckers[id] == address(0), "Token is not mintable");

            if (from == address(0)) {
                _totalSupply[id] += amount;
            }
        }
    }

    /**
     * @dev See {IERC1155-_beforeTokenTransfer}
     */
    function _afterTokenTransfer(
        address,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory
    ) internal virtual override {
        if (from == address(0)) {
            for (uint i=0; i<ids.length; i++) {
                uint16 id = uint16(ids[i]);
                uint256 amount = amounts[i];

                _mintIncrementalNonces[id][to]++;

                emit Mint(to, id, amount, _mintIncrementalNonces[id][to]);
            }
        }
    }
}

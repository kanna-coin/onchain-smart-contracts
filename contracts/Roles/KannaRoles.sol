// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IKannaRoleProvier} from "./IKannaRoleProvier.sol";

import "hardhat/console.sol";

/**
 *  __
 * |  | ___\|/_    ____   ____ _\|/_
 * |  |/ /\__  \  /    \ /    \\__  \
 * |    <  / __ \|   |  \   |  \/ __ \_
 * |__|_ \(____  /___|  /___|  (____  /
 *      \/     \/     \/     \/     \/
 *
 *  @title KNN Roles
 *  @author KANNA Team
 *  @custom:github  https://github.com/kanna-coin
 *  @custom:site https://kannacoin.io
 *  @custom:discord https://discord.kannacoin.io
 */
contract KannaRoles is Ownable, AccessControl {

    event RoleProviderChanged(bytes32 indexed role, address previousProvider, address newProvider);

    mapping(bytes32 => address) private _roleProviders;

    /**
     * @dev Register `role` provider.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * Emits {RoleProviderChanged} event.
     */
    function registerProvider(string memory role, address providerAddress) external onlyOwner {
        _registerProvider(keccak256(abi.encode(role)), providerAddress);
    }

    /**
     * @dev Register `role` provider.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * Emits {RoleProviderChanged} event.
     */
    function registerProvider(string[] memory role, address providerAddress) external onlyOwner {
        _registerProvider(keccak256(abi.encode(role)), providerAddress);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(string memory role, address account) external onlyOwner {
        _grantRole(keccak256(abi.encode(role)), account);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(string[] memory role, address account) external onlyOwner {
        _grantRole(keccak256(abi.encode(role)), account);
    }

    /**
     * @dev Grants `role` to `accounts`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(string memory role, address[] memory accounts) external onlyOwner {
        _grantRole(keccak256(abi.encode(role)), accounts);
    }

    /**
     * @dev Grants `role` to `accounts`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(string[] memory role, address[] memory accounts) external onlyOwner {
        _grantRole(keccak256(abi.encode(role)), accounts);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(string memory role, address account) external onlyOwner {
        _revokeRole(keccak256(abi.encode(role)), account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(string[] memory role, address account) external onlyOwner {
        _revokeRole(keccak256(abi.encode(role)), account);
    }

    /**
     * @dev Revokes `role` from `accounts`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(string memory role, address[] memory accounts) external onlyOwner {
        _revokeRole(keccak256(abi.encode(role)), accounts);
    }

    /**
     * @dev Revokes `role` from `accounts`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must be owner.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(string[] memory role, address[] memory accounts) external onlyOwner {
        _revokeRole(keccak256(abi.encode(role)), accounts);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(string memory role, address account) public view virtual returns (bool) {
        return hasRole(keccak256(abi.encode(role)), account);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(string[] memory role, address account) public view virtual returns (bool) {
        return hasRole(keccak256(abi.encode(role)), account);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual override returns (bool) {
        if (_roleProviders[role] != address(0)) {
            return IKannaRoleProvier(_roleProviders[role]).hasRole(role, account);
        }

        return super.hasRole(role, account);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function setRoleAdmin(string memory role, string memory adminRole) external onlyOwner {
        _setRoleAdmin(keccak256(abi.encode(role)), keccak256(abi.encode(adminRole)));
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function setRoleAdmin(string[] memory role, string memory adminRole) external onlyOwner {
        _setRoleAdmin(keccak256(abi.encode(role)), keccak256(abi.encode(adminRole)));
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function setRoleAdmin(string memory role, string[] memory adminRole) external onlyOwner {
        _setRoleAdmin(keccak256(abi.encode(role)), keccak256(abi.encode(adminRole)));
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function setRoleAdmin(string[] memory role, string[] memory adminRole) external onlyOwner {
        _setRoleAdmin(keccak256(abi.encode(role)), keccak256(abi.encode(adminRole)));
    }

    function _grantRole(bytes32 role, address[] memory accounts) internal virtual {
        for (uint i = 0; i < accounts.length; i++) {
            _grantRole(role, accounts[i]);
        }
    }

    function _revokeRole(bytes32 role, address[] memory accounts) internal virtual {
        for (uint i = 0; i < accounts.length; i++) {
            _revokeRole(role, accounts[i]);
        }
    }

    function _registerProvider(bytes32 role, address providerAddress) internal virtual {
        require(providerAddress != address(0), "Invalid address");
        require(
            IKannaRoleProvier(providerAddress).supportsInterface(type(IKannaRoleProvier).interfaceId),
            "`providerAddress` needs to implement `IKannaRoleProvier` interface"
        );

        address previousProvider = _roleProviders[role];

        _roleProviders[role] = providerAddress;

        emit RoleProviderChanged(role, previousProvider, providerAddress);
    }
}
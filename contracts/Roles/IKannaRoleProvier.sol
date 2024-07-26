// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface IKannaRoleProvier is IERC165 {
    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IDynamicBadgeChecker} from './interfaces/IDynamicBadgeChecker.sol';

abstract contract DynamicBadgeChecker is IDynamicBadgeChecker {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IDynamicBadgeChecker).interfaceId;
    }
}
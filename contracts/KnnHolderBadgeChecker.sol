// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {DynamicBadgeChecker} from './DynamicBadgeChecker.sol';
import {KannaToken} from './KannaToken.sol';

contract KnnHolderBadgeChecker is DynamicBadgeChecker {

    KannaToken private immutable knnToken;

    constructor(
        address _knnToken
    ) {
        require(address(_knnToken) != address(0), "Invalid token address");

        knnToken = KannaToken(_knnToken);
    }

    /**
     * @dev See {IDynamicBadgeChecker-isAccumulative}.
     */
    function isAccumulative() external pure returns (bool){
        return false;
    }

    /**
     * @dev See {IDynamicBadgeChecker-balanceOf}.
     *
     * Check if `account` is a KNN holder
     */
    function balanceOf(address account, uint16) external view returns (uint256) {
        return knnToken.balanceOf(account) > 0 ? 1 : 0;
    }
}
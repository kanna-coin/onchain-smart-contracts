// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface IDynamicBadgeChecker is IERC165 {
    /**
     * @dev Returns if the token is `accumulative`.
     */
    function isAccumulative() external view returns (bool);

    /**
     * @dev Returns the amount of tokens of token type `id` owned by `account`.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint16 id) external view returns (uint256);
}
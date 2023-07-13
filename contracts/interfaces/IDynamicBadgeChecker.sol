// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface IDynamicBadgeChecker is IERC165 {
    /**
     * @dev Returns if the token is `accumulative`.
     */
    function isAccumulative() external view returns (bool);

    /**
     * @dev Returns the `creator` address.
     */
    function creator() external view returns (address);

    /**
     * @dev Returns the `royaltyPercent` value.
     *
     * BASIS POINTS:
     * Royalties are calculated using a basis point of 10^5 (100_000)
     *
     * Example: 100_000 = 100%.
     * Example: 10_000 = 10%.
     * Example: 1_000 = 1%.
     * Example: 100 = 0.1%.
     * Example: 10 = 0.01%.
     * Example: 1 = 0.001%.
     */
    function royaltyPercent() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens of token type `id` owned by `account`.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint16 id) external view returns (uint256);
}

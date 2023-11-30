// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface IKannaAuditScoreProvider is IERC165 {
    function getScore(address wallet) external view returns (uint256);
}

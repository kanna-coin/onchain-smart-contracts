
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AggregatorV3Mock
 * @dev Mock contract for Chainlink AggregatorV3Interface
 */

 contract AggregatorV3Mock is AggregatorV3Interface, Ownable {
    uint256 private _price;
    uint8 private immutable _decimals = 8;

    constructor(uint256 price) {
        _price = price;
    }

    function decimals() external pure override returns (uint8) {
        return _decimals;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80,
            int256 answer,
            uint256,
            uint256,
            uint80
        )
    {
        answer = int256(_price);

        return (0, answer, 0, 0, 0);
    }

    function setPrice(uint256 price) external onlyOwner() {
        _price = price;
    }

    function description() external view override returns (string memory) {}
    function version() external view override returns (uint256) {}
    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        ) {}
}

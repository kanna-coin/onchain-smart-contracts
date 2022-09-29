// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";

/** @title KNN PreSale
    @author KANNA
    @notice SmartContract for direct ETH pre-sale purchases
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
*/
contract KannaPreSale is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    using Address for address;
    IKannaToken private immutable knnToken;
    address private KannaTokenAddress;
    uint256 private tokensSold;

    uint256 private tokenQuotation;

    event Purchase(
        address holder,
        uint256 amount,
        uint256 unitPrice,
        uint256 indexed date
    );

    event ChangeOfQuotation(
        address signer,
        uint256 from,
        uint256 to,
        uint256 indexed date
    );

    constructor(address kannaTokenAddress) {
        knnToken = IKannaToken(kannaTokenAddress);
    }

    /**
     * @dev Retrieves amount of tokens sold.
     */
    function sold() external view returns (uint256) {
        return tokensSold;
    }

    /**
     * @dev Retrieves current token price in ETH
     */
    function price() external view returns (uint256) {
        require(tokenQuotation > 0, "Quotation unavailable");
        return tokenQuotation;
    }

    /**
     * @dev Update tokenQuotation to a new value in ETH
     *
     * Emits a {ChangeOfQuotation} event.
     *
     * @param targetQuotation unit price in ETH
     *
     */
    function updateQuotation(uint256 targetQuotation) external onlyOwner {
        require(targetQuotation > 0, "Invalid quotation");
        emit ChangeOfQuotation(
            msg.sender,
            tokenQuotation,
            targetQuotation,
            block.timestamp
        );

        tokenQuotation = targetQuotation;
    }

    /**
     * @dev Allows users to buy tokens for ETH
     * See {tokenQuotation} for unitPrice.
     *
     * Emits a {Purchase} event.
     *
     * @param amountOfTokens amount of tokens to buy
     *
     * Requirements:
     *
     * - must transfer the correct amount of ether according to
     *   given token amount.
     */
    function buyTokens(uint256 amountOfTokens) external payable nonReentrant {
        require(tokenQuotation > 0, "Quotation unavailable");
        require(
            msg.value == amountOfTokens.mul(tokenQuotation),
            "Incorrect amount in eth"
        );
        require(
            knnToken.balanceOf(address(this)) >= amountOfTokens,
            "Insufficient supply!"
        );
        require(
            knnToken.transfer(msg.sender, amountOfTokens),
            "Transaction reverted!"
        );

        tokensSold += amountOfTokens;

        emit Purchase(
            msg.sender,
            amountOfTokens,
            tokenQuotation,
            block.timestamp
        );
    }
}

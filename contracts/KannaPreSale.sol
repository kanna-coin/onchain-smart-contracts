// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IKannaToken} from "./interfaces/IKannaToken.sol";

/** @title KNN PreSale
    @author KANNA
    @notice SmartContract for direct ETH pre-sale purchases
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
*/
contract KannaPreSale is Ownable {
    IKannaToken public immutable knnToken;
    uint256 public tokensSold;
    uint256 public tokenQuotation;
    bool public available;

    event Purchase(address indexed holder, uint256 amount, uint256 unitPrice);
    event QuotationUpdate(address indexed sender, uint256 from, uint256 to);
    event Withdraw(address indexed recipient, uint256 amt);

    constructor(address _knnToken) {
        knnToken = IKannaToken(_knnToken);
    }

    /**
     * @dev Retrieves ETH from sold tokens to DAO initiatives
     */
    function withdraw(address payable recipient) external onlyOwner {
        uint256 amount = address(this).balance;
        recipient.transfer(amount);

        emit Withdraw(recipient, amount);
    }

    /**
     * @dev Retrieves ETH from sold tokens to DAO initiatives
     */
    function updateAvailablity(bool _available) external onlyOwner {
        available = _available;
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
     * Emits a {QuotationUpdate} event.
     *
     * @param targetQuotation unit price in ETH
     *
     */
    function updateQuotation(uint256 targetQuotation) external onlyOwner {
        require(targetQuotation > 0, "Invalid quotation");
        emit QuotationUpdate(msg.sender, tokenQuotation, targetQuotation);

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
    function buyTokens(uint256 amountOfTokens) external payable {
        require(available, "PreSale unavailable");
        require(tokenQuotation > 0, "Quotation unavailable");
        require(
            msg.value == amountOfTokens * tokenQuotation,
            "Incorrect amount in ETH"
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

        emit Purchase(msg.sender, amountOfTokens, tokenQuotation);
    }
}

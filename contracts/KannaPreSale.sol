// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev mainnet: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 @ https://data.chain.link/ethereum/mainnet/crypto-usd/eth-usd
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/** @title KNN PreSale
    @author KANNA
    @notice SmartContract for direct ETH pre-sale purchases
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
*/
contract KannaPreSale is Ownable {
    IERC20 public immutable knnToken;
    AggregatorV3Interface public priceAggregator;
    uint256 public constant USD_AGGREGATOR_DECIMALS = 1e8;
    uint256 public constant KNN_DECIMALS = 1e18;
    uint256 public knnPriceInUSD;
    bool public available;

    event Purchase(
        address indexed holder,
        uint256 amountInWEI,
        uint256 knnPriceInUSD,
        uint256 ethPriceInUSD,
        uint256 amountInKNN
    );

    event QuotationUpdate(address indexed sender, uint256 from, uint256 to);
    event Withdraw(address indexed recipient, uint256 amount);

    constructor(address _knnToken) {
        knnToken = IERC20(_knnToken);
        priceAggregator = AggregatorV3Interface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
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
     * @dev Update Pre-Sale availability
     *
     * @param _available (true: available | false: unavailable)
     */
    function updateAvailablity(bool _available) external onlyOwner {
        available = _available;
    }

    /**
     * @dev Retrieves current token price in ETH
     */
    function price() external view returns (uint256) {
        require(knnPriceInUSD > 0, "Quotation unavailable");
        return knnPriceInUSD;
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
        emit QuotationUpdate(msg.sender, knnPriceInUSD, targetQuotation);

        knnPriceInUSD = targetQuotation;
    }

    /**
     * @dev Converts a given amount {amountInWEI} to KNN
     */
    function convertToKNN(uint256 amountInWEI) public view returns (uint256, uint256) {
        require(knnPriceInUSD > 0, "KNN price not set");

        (, int256 answer, , , ) = priceAggregator.latestRoundData();

        uint256 ethPriceInUSD = uint256(answer);
        require(ethPriceInUSD > 0, "Invalid round answer");

        return ((amountInWEI * ethPriceInUSD) / knnPriceInUSD, ethPriceInUSD);
    }

    /**
     * @dev Allows users to buy tokens for ETH
     * See {tokenQuotation} for unitPrice.
     *
     * Emits a {Purchase} event.
     */
    function buyTokens() external payable {
        require(available, "Pre sale NOT started yet");
        require(msg.value > USD_AGGREGATOR_DECIMALS, "Invalid amount");

        (uint256 finalAmount, uint256 ethPriceInUSD) = convertToKNN(msg.value);

        require(knnToken.balanceOf(address(this)) >= finalAmount, "Insufficient supply!");
        require(knnToken.transfer(msg.sender, finalAmount), "Transaction reverted!");
        emit Purchase(msg.sender, msg.value, knnPriceInUSD, ethPriceInUSD, finalAmount);
    }

    fallback() external payable {
        revert("Fallback: Should call {buyTokens} function in order to swap ETH for KNN");
    }

    receive() external payable {
        revert("Cannot Receive: Should call {buyTokens} function in order to swap ETH for KNN");
    }
}

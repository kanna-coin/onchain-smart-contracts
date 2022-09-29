// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";
import {ITreasurer} from "./interfaces/ITreasurer.sol";

/** @title KNN Treasurer
    @author KANNA
    @notice KANNA Treasury SmartContract
    @dev controls release flow of KNN Tokens towards impact/DAO initiatives
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
    */
contract KannaTreasurer is ITreasurer, Ownable {
    IKannaToken private immutable knnToken;
    address private KannaTokenAddress;

    event Release(
        address signer,
        address to,
        uint256 amount,
        uint256 indexed date
    );

    constructor(address kannaTokenAddress) {
        knnToken = IKannaToken(kannaTokenAddress);
    }

    /**
     * @dev Emits a {Release} event.
     *
     * Addressed to be used by DAO initiatives
     *
     * @param contractAddress contract to transfer tokens from treasury
     *
     * Requirements:
     *
     * - contractAddress must be a smart contract
     */
    function release(address contractAddress, uint256 amount)
        external
        onlyOwner
    {
        knnToken.transfer(contractAddress, amount);

        emit Release(msg.sender, contractAddress, amount, block.timestamp);
    }
}

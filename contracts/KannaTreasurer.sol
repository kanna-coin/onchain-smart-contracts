// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** @title KNN Treasurer
    @author KANNA
    @dev deprecation warning: work in progress to KannaTreasuryV2
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
    @custom:discord https://discord.gg/V5KDU8DKCh
    */
contract KannaTreasurer is Ownable {
    IERC20 private immutable knnToken;

    event Release(address signer, address to, uint256 amount, uint256 indexed date);

    constructor(address _knnToken) {
        knnToken = IERC20(_knnToken);
    }

    /**
     * @dev Emits a {Release} event.
     *
     * Addressed to be used by DAO initiatives
     *
     * @param to contract to transfer tokens from treasury
     *
     */
    function release(address to, uint256 amount) external onlyOwner {
        knnToken.transfer(to, amount);

        emit Release(msg.sender, to, amount, block.timestamp);
    }
}

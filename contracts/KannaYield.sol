// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

struct Subscription {
    uint256 amount;
    uint256 startDate;
    uint256 endDate;
    uint256 vmt;
}

import {ITreasurer} from "./interfaces/ITreasurer.sol";

contract KannaYield {
    ITreasurer private treasurer;
    mapping(address => Subscription[]) private subscriptions;
    uint256 private maxSubscriptionAmount = 123000 * 10**18; // TODO: max subscriptions = ?
    uint256 private minSubscriptionAmount = 123 * 10**18; // TODO: max subscriptions = ?

    constructor(address knnTreasuryContractAddress, uint256 initialLoadAmount) {
        treasurer = ITreasurer(knnTreasuryContractAddress);

        treasurer.prepareYield(initialLoadAmount);
    }

    function calculateYield(uint256 startDate, uint256 amount)
        public
        view
        returns (uint256)
    {
        console.log("[calculate_yield]", startDate, amount);

        // TODO: implementar cálculo do yield
        return amount + 123;
    }

    function getSubscriptionEndDate(uint256 startDate)
        public
        pure
        returns (uint256)
    {
        return startDate + 90 days;
    }

    function subscribe(uint256 amount) external {
        require(
            amount >= minSubscriptionAmount,
            "Insufficient subscription amount"
        );
        require(
            amount <= maxSubscriptionAmount,
            "Subscription amount above limit"
        );
        // TODO: colocar os REQUIRES!

        uint256 avgToken = 123; // TODO: como obter o VmT:  Volume médio de tokens no dia durante o travamento ? get balance do erc20?

        console.log(amount);
        subscriptions[msg.sender].push(
            Subscription(amount, block.timestamp, 0, avgToken)
        );

        treasurer.transferSubscription(address(msg.sender), amount);
    }

    function claimYield() external {
        address holderAddress = address(msg.sender);

        for (uint i = 0; i < subscriptions[holderAddress].length; i++) {
            if (
                subscriptions[holderAddress][i].endDate == 0 &&
                getSubscriptionEndDate(
                    subscriptions[holderAddress][i].startDate
                ) >
                block.timestamp
            ) {
                subscriptions[holderAddress][i].endDate = block.timestamp;

                // TODO: validar a data do claim

                treasurer.transferYield(
                    address(msg.sender),
                    calculateYield(
                        subscriptions[holderAddress][i].startDate,
                        subscriptions[holderAddress][i].amount
                    )
                );

                return; // TODO: podemos já parar aqui, ou tirar o return e transferir todos os yields que possam ser resgatados! (interessante se formos automatizar!)
            }
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";
import {ITreasurer} from "./interfaces/ITreasurer.sol";

contract KannaTreasurer is ITreasurer, AccessControl, Ownable {
    IKannaToken private tokenContract;
    address private erc20kannaTokenAddress;

    bytes32 public constant MILESTONES_MINTER_ROLE =
        keccak256("MILESTONES_MINTER_ROLE");

    bytes32 public constant SHARE_OPTIONS_ROLE =
        keccak256("SHARE_OPTIONS_ROLE");

    bytes32 public constant YIELD_PAYER_ROLE = keccak256("YIELD_PAYER_ROLE");

    constructor(address kannaTokenAddress, address yieldPayerAddress) {
        erc20kannaTokenAddress = kannaTokenAddress;
        tokenContract = IKannaToken(kannaTokenAddress);
        _grantRole(YIELD_PAYER_ROLE, yieldPayerAddress);
    }

    function prepareYield(uint256 amount) external onlyRole(YIELD_PAYER_ROLE) {
        tokenContract.transferFrom(
            erc20kannaTokenAddress,
            address(msg.sender),
            amount
        );
    }

    function transferYield(address to, uint256 amount)
        external
        onlyRole(YIELD_PAYER_ROLE)
    {
        tokenContract.transferFrom(address(msg.sender), to, amount);
    }

    function transferSubscription(address from, uint256 amount)
        external
        onlyRole(YIELD_PAYER_ROLE)
    {
        tokenContract.transferFrom(from, address(msg.sender), amount);
    }

    function mintMilestone(uint256 amount)
        external
        onlyRole(MILESTONES_MINTER_ROLE)
    {
        tokenContract.mint(amount);
    }

    function addMilestoneContract(address milestoneContractAddress)
        external
        onlyOwner
    {
        _grantRole(MILESTONES_MINTER_ROLE, milestoneContractAddress);
    }
}

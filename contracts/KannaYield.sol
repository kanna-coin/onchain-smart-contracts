// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IKannaToken} from "./interfaces/IKannaToken.sol";

/** @title KNN Yield
    @author KANNA
    @notice KANNA Staking Pool SmartContract
    @dev distributes a reward within a given duration to its holders.
    rates are weighted according to its {subscription} amount over the total {poolSize}.
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
    */
contract KannaYield is Ownable {
    event RewardAdded(address indexed user, uint256 reward);
    event Interest(address indexed user, uint256 subscriptionAmount, uint256 fee);
    event Collect(address indexed user, address indexed returnAccount, uint256 fee);
    event Subscription(address indexed user, uint256 subscriptionAmount, uint256 fee, uint256 finalAmount);
    event Withdraw(address indexed user, uint256 amount);
    event Reward(address indexed user, uint256 reward);
    event Fee(address indexed user, uint256 amount, uint256 fee, uint256 finalAmount);

    IKannaToken public immutable knnToken;
    address public immutable feeRecipient;

    uint256 public constant feeDecimalAdjust = 100_00;
    uint256 public constant reducedFee = 10;

    uint256 public knnYieldPool;
    uint256 public knnYieldTotalFee;
    uint256 public poolStartDate;
    uint256 public endDate;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256[5] public tier = [1 days, 7 days, 30 days, 60 days, 90 days];

    mapping(address => uint256) public holderRewardPerTokenPaid;
    mapping(address => uint256) public earned;
    mapping(address => uint256) public rawBalances;
    mapping(address => uint256) public started;
    mapping(uint256 => uint256) public fees;

    uint256 public subscriptionFee = 2_0;

    constructor(address _knnToken, address _feeRecipient) {
        knnToken = IKannaToken(_knnToken);
        feeRecipient = _feeRecipient;
        fees[tier[0]] = 3000;
        fees[tier[1]] = 500;
        fees[tier[2]] = 250;
        fees[tier[3]] = 150;
        fees[tier[4]] = 100;
    }

    function feeOf(uint256 subscriptionDuration) private view returns (uint256) {
        if (block.timestamp >= endDate) return reducedFee;

        for (uint256 i = 0; i < tier.length; i++) {
            if (subscriptionDuration < tier[i]) {
                return fees[tier[i]];
            }
        }

        return reducedFee;
    }

    function collectFees() external onlyOwner returns (uint256) {
        uint256 paid = knnYieldTotalFee;
        knnYieldTotalFee = 0;

        knnToken.transfer(feeRecipient, paid);

        emit Collect(msg.sender, feeRecipient, paid);

        return paid;
    }

    function poolSize() external view returns (uint256) {
        return knnYieldPool;
    }

    function balanceOf(address holder) external view returns (uint256) {
        return rawBalances[holder];
    }

    function lastPaymentEvent() public view returns (uint256) {
        return block.timestamp < endDate ? block.timestamp : endDate;
    }

    function rewardPerToken() public view returns (uint256) {
        if (knnYieldPool == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored + (((lastPaymentEvent() - lastUpdateTime) * rewardRate * 1e18) / knnYieldPool);
    }

    function calculateReward(address holder) public view returns (uint256) {
        return ((rawBalances[holder] * (rewardPerToken() - holderRewardPerTokenPaid[holder])) / 1e18) + earned[holder];
    }

    function subscribe(uint256 subscriptionAmount) external updateReward(msg.sender) {
        require(endDate > block.timestamp, "No reward available");
        require(subscriptionAmount > 0, "Cannot subscribe 0 KNN");

        knnToken.transferFrom(msg.sender, address(this), subscriptionAmount);

        uint256 finalAmount = subscriptionAmount - ((subscriptionAmount * subscriptionFee) / feeDecimalAdjust);

        knnYieldTotalFee += subscriptionAmount - finalAmount;
        knnYieldPool += finalAmount;

        uint256 subscriptionDate = started[msg.sender];

        if (subscriptionDate == 0 || subscriptionDate < poolStartDate) {
            started[msg.sender] = poolStartDate;
        }

        rawBalances[msg.sender] += finalAmount;

        emit Subscription(msg.sender, subscriptionAmount, subscriptionFee, finalAmount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Invalid amount");
        require(rawBalances[msg.sender] >= amount, "Insufficient balance");

        knnYieldPool -= amount;
        rawBalances[msg.sender] -= amount;

        transferFee(msg.sender, rawBalances[msg.sender]);

        started[msg.sender] = block.timestamp;

        emit Withdraw(msg.sender, amount);
    }

    function claim() public updateReward(msg.sender) {
        uint256 reward = earned[msg.sender];
        if (reward > 0) {
            earned[msg.sender] = 0;

            transferFee(msg.sender, reward);

            emit Reward(msg.sender, reward);
        }
    }

    function exit() external updateReward(msg.sender) {
        uint256 balance = rawBalances[msg.sender];

        if (balance > 0) {
            knnYieldPool -= balance;
        }

        rawBalances[msg.sender] = 0;

        uint256 reward = earned[msg.sender];

        if (reward > 0) {
            earned[msg.sender] = 0;
            balance += reward;
        }

        if (balance == 0) {
            return;
        }

        transferFee(msg.sender, balance);

        emit Reward(msg.sender, reward);
    }

    /// @dev experimental feature for lazy compound
    function reApply() external updateReward(msg.sender) {
        uint256 claimed = earned[msg.sender];
        uint256 balance = rawBalances[msg.sender];
        earned[msg.sender] = 0;

        knnYieldPool += claimed;
        rawBalances[msg.sender] = balance + claimed;

        emit Interest(msg.sender, claimed, balance);
    }

    function transferFee(address to, uint256 amount) private returns (uint256) {
        require(started[msg.sender] > 0, "Not in pool");
        uint256 duration = block.timestamp - started[msg.sender];

        uint256 userFee = feeOf(duration);

        uint256 finalAmount = amount - ((amount * userFee) / feeDecimalAdjust);

        knnYieldTotalFee += amount - finalAmount;

        knnToken.transfer(to, finalAmount);
        emit Fee(to, amount, userFee, finalAmount);

        return userFee;
    }

    function addReward(uint256 reward, uint256 rewardsDuration) external onlyOwner updateReward(address(0)) {
        require(block.timestamp + rewardsDuration >= endDate, "Cannot reduce current yield contract duration");
        if (block.timestamp >= endDate) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = endDate - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        uint256 balance = knnToken.balanceOf(address(this));
        require(rewardRate <= balance / rewardsDuration, "Insufficient balance");

        poolStartDate = block.timestamp;
        lastUpdateTime = block.timestamp;
        endDate = block.timestamp + rewardsDuration;

        emit RewardAdded(msg.sender, reward);
    }

    modifier updateReward(address holder) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastPaymentEvent();
        if (holder != address(0)) {
            uint256 init = started[msg.sender];

            if (init < poolStartDate && rawBalances[msg.sender] > 0) {
                started[msg.sender] = poolStartDate;
            }

            earned[holder] = calculateReward(holder);
            holderRewardPerTokenPaid[holder] = rewardPerTokenStored;
        }
        _;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";

/** @title KNN Yield
    @author KANNA
    @notice KANNA Staking Pool SmartContract
    @dev distributes a reward within a given duration to its holders.
    rates are weighted according to its {subscription} amount over the total {poolSize}.
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
    */
contract KannaYield is Ownable, ReentrancyGuard {
    using SafeERC20 for IKannaToken;
    using SafeMath for uint256;
    using Address for address;

    event RewardAdded(address user, uint256 reward, uint256 indexed date);
    event Subscription(
        address user,
        uint256 subscriptionAmount,
        uint256 fee,
        uint256 finalAmount,
        uint256 indexed date
    );
    event Withdraw(address user, uint256 amount, uint256 indexed date);
    event Reward(address user, uint256 reward, uint256 indexed date);
    event Fee(
        address user,
        uint256 amount,
        uint256 fee,
        uint256 finalAmount,
        uint256 indexed date
    );

    IKannaToken private immutable knnToken;
    address private immutable knnDeployer;

    uint64 private constant feeDecimalAdjust = 1000 * 100;
    uint64 private constant reducedFee = 100;

    uint256 private knnYieldPool;
    uint256 private poolStartDate = 0;
    uint256 private endDate = 0;
    uint256 private rewardRate = 0;
    uint256 private lastUpdateTime;
    uint256 private rewardPerTokenStored;

    uint256[] private tier = [1 days, 7 days, 30 days, 60 days, 90 days];

    mapping(address => uint256) private holderRewardPerTokenPaid;
    mapping(address => uint256) private earned;
    mapping(address => uint256) private rawBalances;
    mapping(address => uint256) private started;
    mapping(uint256 => uint64) private fees;

    uint256 private subscriptionFee = 200;

    constructor(address knnTokenAddress, address knnDeployerAddress) {
        knnToken = IKannaToken(knnTokenAddress);
        knnDeployer = knnDeployerAddress;
        tiering();
    }

    function tiering() private {
        fees[tier[0]] = 30000;
        fees[tier[1]] = 5000;
        fees[tier[2]] = 2500;
        fees[tier[3]] = 1500;
        fees[tier[4]] = reducedFee;
    }

    function feeOf(uint256 subscriptionDuration)
        private
        view
        returns (uint256)
    {
        if (block.timestamp >= endDate) return reducedFee;

        for (uint i = 0; i < tier.length; i++) {
            if (subscriptionDuration < tier[i]) {
                console.log(
                    "# Subscription Duration: ",
                    subscriptionDuration,
                    i
                );
                if (i == 0) return fees[tier[0]];

                return fees[tier[i - 1]];
            }
        }

        return reducedFee;
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

        return
            rewardPerTokenStored.add(
                lastPaymentEvent()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(knnYieldPool)
            );
    }

    function calculateReward(address holder) public view returns (uint256) {
        return
            rawBalances[holder]
                .mul(rewardPerToken().sub(holderRewardPerTokenPaid[holder]))
                .div(1e18)
                .add(earned[holder]);
    }

    function subscribe(uint256 subscriptionAmount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(endDate > block.timestamp, "No reward available");
        require(subscriptionAmount > 0, "Cannot subscribe 0 KNN");

        knnToken.safeTransferFrom(
            msg.sender,
            address(this),
            subscriptionAmount
        );

        uint256 finalAmount = subscriptionAmount.sub(
            subscriptionAmount.mul(subscriptionFee).div(feeDecimalAdjust)
        );

        // TODO: criar mapping para fazer o resgate dos fees por um owner

        knnYieldPool = knnYieldPool.add(finalAmount);
        uint256 subscriptionDate = started[msg.sender];

        if (subscriptionDate == 0 || subscriptionDate < poolStartDate) {
            started[msg.sender] = poolStartDate;
        }

        rawBalances[msg.sender] = rawBalances[msg.sender].add(finalAmount);

        emit Subscription(
            msg.sender,
            subscriptionAmount,
            subscriptionFee,
            finalAmount,
            block.timestamp
        );
    }

    function withdraw(uint256 amount)
        public
        nonReentrant
        updateReward(msg.sender)
    {
        require(amount > 0, "Invalid amount");
        require(rawBalances[msg.sender] >= amount, "Insufficient balance");

        knnYieldPool = knnYieldPool.sub(amount);
        rawBalances[msg.sender] = rawBalances[msg.sender].sub(amount);

        transferFee(msg.sender, rawBalances[msg.sender]);

        started[msg.sender] = block.timestamp;

        emit Withdraw(msg.sender, amount, block.timestamp);
    }

    function claim() public nonReentrant updateReward(msg.sender) {
        uint256 reward = earned[msg.sender];
        if (reward > 0) {
            earned[msg.sender] = 0;

            transferFee(msg.sender, reward);

            emit Reward(msg.sender, reward, block.timestamp);
        }
    }

    function exit() external nonReentrant updateReward(msg.sender) {
        uint256 balance = rawBalances[msg.sender];

        if (balance > 0) {
            knnYieldPool = knnYieldPool.sub(balance);
        }

        rawBalances[msg.sender] = 0;

        uint256 reward = earned[msg.sender];

        if (reward > 0) {
            earned[msg.sender] = 0;
            balance = balance.add(reward);
        }

        if (balance == 0) {
            return;
        }

        transferFee(msg.sender, balance);

        emit Reward(msg.sender, reward, block.timestamp);
    }

    function transferFee(address to, uint256 amount) private returns (uint) {
        require(started[msg.sender] > 0, "Not in pool");
        uint256 duration = block.timestamp.sub(started[msg.sender]);

        uint256 userFee = feeOf(duration);

        console.log(block.timestamp, started[msg.sender], duration, userFee);

        uint256 finalAmount = amount.sub(
            amount.mul(userFee).div(feeDecimalAdjust)
        );

        knnToken.safeTransfer(to, finalAmount);
        emit Fee(to, amount, userFee, finalAmount, block.timestamp);
        console.log("emit Fee: ", amount, userFee, finalAmount);

        return userFee;
    }

    function addReward(uint256 reward, uint rewardsDuration)
        external
        onlyOwner
        updateReward(address(0))
    {
        require(
            block.timestamp.add(rewardsDuration) >= endDate,
            "Cannot reduce current yield contract duration"
        );
        if (block.timestamp >= endDate) {
            rewardRate = reward.div(rewardsDuration);
        } else {
            uint256 remaining = endDate.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        uint256 balance = knnToken.balanceOf(address(this));
        require(
            rewardRate <= balance.div(rewardsDuration),
            "Insufficient balance"
        );

        poolStartDate = block.timestamp;
        lastUpdateTime = block.timestamp;
        endDate = block.timestamp.add(rewardsDuration);

        emit RewardAdded(msg.sender, reward, block.timestamp);
    }

    modifier updateReward(address holder) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastPaymentEvent();
        if (holder != address(0)) {
            uint256 init = started[msg.sender];

            if (init < poolStartDate && rawBalances[msg.sender] > 0)
                started[msg.sender] = poolStartDate;

            earned[holder] = calculateReward(holder);
            holderRewardPerTokenPaid[holder] = rewardPerTokenStored;
        }
        _;
    }
}

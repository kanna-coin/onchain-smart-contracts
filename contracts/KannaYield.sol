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

    event RewardAdded(address indexed user, uint256 reward, uint timestamp);
    event Subscription(address indexed user, uint256 amount, uint timestamp);
    event Withdraw(address indexed user, uint256 amount, uint timestamp);
    event Reward(address indexed user, uint256 reward, uint timestamp);
    event RewardRefreshed(address indexed user, uint timestamp);

    IKannaToken public immutable knnToken;

    uint256 public endDate = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public holderRewardPerTokenPaid;
    mapping(address => uint256) public rewardsToPay;

    uint256 private knnYieldPool;
    mapping(address => uint256) private rawBalances;

    constructor(address knnTokenAddress) {
        knnToken = IKannaToken(knnTokenAddress);
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

    function applyLastInterest(address holder) private {
        uint256 currentPayment = rewardsToPay[holder];
        rewardsToPay[holder] = rewardsToPay[holder].sub(currentPayment);
        rawBalances[holder] = rawBalances[holder].add(currentPayment);
        knnYieldPool = knnYieldPool.add(currentPayment);
    }

    function applyHoldersInterests(address[] calldata holders)
        external
        onlyOwner
    {
        for (uint i = 0; i < holders.length; i++) {
            rewardPerTokenStored = rewardPerToken();
            lastUpdateTime = lastPaymentEvent();
            rewardsToPay[holders[i]] = calculateReward(holders[i]);

            applyLastInterest(holders[i]);

            holderRewardPerTokenPaid[holders[i]] = rewardPerTokenStored;
        }
    }

    function calculateReward(address holder) public view returns (uint256) {
        return
            rawBalances[holder]
                .mul(rewardPerToken().sub(holderRewardPerTokenPaid[holder]))
                .div(1e18)
                .add(rewardsToPay[holder]);
    }

    function subscribe(uint256 subscriptionAmount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(
            subscriptionAmount > 0,
            "Cannot subscribe 0 KNN. Provide a valid subscription amount"
        );

        knnToken.safeTransferFrom(
            msg.sender,
            address(this),
            subscriptionAmount
        );

        knnYieldPool = knnYieldPool.add(subscriptionAmount);

        rawBalances[msg.sender] = rawBalances[msg.sender].add(
            subscriptionAmount
        );

        emit Subscription(msg.sender, subscriptionAmount, block.timestamp);
    }

    function withdraw(uint256 amount)
        public
        nonReentrant
        updateReward(msg.sender)
    {
        require(amount > 0, "Cannot withdraw 0 KNN. Provide a valid amount");
        require(
            rawBalances[msg.sender] >= amount,
            "Insufficient KNN. Provide a smaller amount"
        );

        knnYieldPool = knnYieldPool.sub(amount);
        rawBalances[msg.sender] = rawBalances[msg.sender].sub(amount);

        knnToken.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount, block.timestamp);
    }

    function claim() public nonReentrant updateReward(msg.sender) {
        uint256 currentPayment = rewardsToPay[msg.sender];
        if (currentPayment > 0) {
            rewardsToPay[msg.sender] = rewardsToPay[msg.sender].sub(
                currentPayment
            );

            knnToken.safeTransfer(msg.sender, currentPayment);

            emit Reward(msg.sender, currentPayment, block.timestamp);
        }
    }

    function exit() external {
        withdraw(rawBalances[msg.sender]);
        claim();
    }

    function addReward(uint256 reward, uint rewardsDuration)
        external
        onlyOwner
        updateReward(address(0))
    {
        require(
            block.timestamp.add(rewardsDuration) >= endDate,
            "Cannot reduce current yield contract duration. Provide a longer duration or wait for contract termination"
        );
        if (block.timestamp >= endDate) {
            rewardRate = reward.div(rewardsDuration);
        } else {
            uint256 remaining = endDate.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        uint balance = knnToken.balanceOf(address(this));
        require(
            rewardRate <= balance.div(rewardsDuration),
            "Insufficient KNN to pay rewards. Transfer KNN first prior to initiate yield distribution"
        );

        lastUpdateTime = block.timestamp;
        endDate = block.timestamp.add(rewardsDuration);

        emit RewardAdded(msg.sender, reward, block.timestamp);
    }

    modifier updateReward(address holder) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastPaymentEvent();
        if (holder != address(0)) {
            rewardsToPay[holder] = calculateReward(holder);
            holderRewardPerTokenPaid[holder] = rewardPerTokenStored;
        }
        _;
    }
}

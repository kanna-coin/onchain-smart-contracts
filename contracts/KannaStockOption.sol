// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./KannaToken.sol";

/**
 *   __
 *  |  | ___\|/_     ____    ____  _\|/_
 *  |  |/ /\__  \   /    \  /    \ \__  \
 *  |    <  / __ \_|   |  \|   |  \ / __ \_
 *  |__|_ \(____  /|___|  /|___|  /(____  /
 *       \/     \/      \/      \/      \/
 *            __                    __                       __   .__
 *    _______/  |_   ____    ____  |  | __   ____  ______  _/  |_ |__|  ____    ____
 *   /  ___/\   __\ /  _ \ _/ ___\ |  |/ /  /  _ \ \____ \ \   __\|  | /  _ \  /    \
 *   \___ \  |  |  (  <_> )\  \___ |    <  (  <_> )|  |_> > |  |  |  |(  <_> )|   |  \
 *  /____  > |__|   \____/  \___  >|__|_ \  \____/ |   __/  |__|  |__| \____/ |___|  /
 *       \/                     \/      \/         |__|                            \/
 *
 *  @title KNN Stock Option (Cliff & Vesting)
 *  @author KANNA Team
 *  @custom:github  https://github.com/kanna-coin
 *  @custom:site https://kannacoin.io
 *  @custom:discord https://discord.kannacoin.io
 */
contract KannaStockOption {
    address public owner;
    uint256 public cliff;
    uint256 public lock;
    uint256 public duration;
    uint256 public start;
    address public holder;
    KannaToken public token;
    bool public completed;
    bool public canceled;

    event Completed(
        address indexed owner,
        address indexed holder,
        uint256 amount,
        uint256 contractDuration,
        uint256 lockDuration,
        uint256 totalDurationElapsed
    );
    event Canceled(
        address indexed owner,
        address indexed holder,
        uint256 amount,
        uint256 contractDuration,
        uint256 cliffDuration,
        uint256 cliffDurationElapsed,
        uint256 remainingCliffDuration
    );

    constructor(address _owner, address _holder, uint256 _cliff, uint256 _lock, KannaToken _token) {
        owner = _owner;
        holder = _holder;
        cliff = _cliff;
        lock = _lock;
        duration = cliff + lock;
        start = block.timestamp;
        token = _token;
    }

    function amountVested() public view notCanceled returns (uint256) {
        uint256 amount = token.balanceOf(address(this));

        if (block.timestamp >= start + duration) {
            return amount;
        }

        return (amount * (block.timestamp - start)) / duration;
    }

    function daysLeftToWithdraw() public view notCanceled returns (uint256) {
        if (block.timestamp >= start + duration) {
            return 0;
        }

        return (start + duration - block.timestamp) / 1 days;
    }

    function daysLeftToCancel() public view notCanceled returns (uint256) {
        if (block.timestamp >= start + cliff) {
            return 0;
        }

        return (start + cliff - block.timestamp) / 1 days;
    }

    function withdraw() external notCanceled {
        require(!completed, "Already withdrawn");
        require(msg.sender == holder, "Only holder can call this function");
        require(block.timestamp >= start + cliff, "Cannot withdraw while in cliff");
        require(block.timestamp >= start + duration, "Cannot withdraw before lock duration");

        uint256 amount = token.balanceOf(address(this));
        token.transfer(holder, amount);
        completed = true;

        emit Completed(owner, holder, amount, duration, lock, block.timestamp - start + duration);
    }

    function cancel() external notCanceled {
        require(msg.sender == owner, "Only owner can call this function");
        require(block.timestamp < start + cliff, "Cannot cancel after cliff");

        uint256 amount = token.balanceOf(address(this));
        token.transfer(owner, amount);
        canceled = true;

        emit Canceled(owner, holder, amount, duration, cliff, block.timestamp - start, start + cliff - block.timestamp);
    }

    modifier notCanceled() {
        require(!canceled, "Contract already canceled");
        _;
    }
}

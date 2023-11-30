// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IKannaAuditScoreProvider} from "./interfaces/IKannaAuditScoreProvider.sol";

/**
 *
 *  __                                                        .___.__   __
 * |  | ___\|/_     ____    ____  _\|/_    _\|/_    __ __   __| _/|__|_/  |_
 * |  |/ /\__  \   /    \  /    \ \__  \   \__  \  |  |  \ / __ | |  |\   __\
 * |    <  / __ \_|   |  \|   |  \ / __ \_  / __ \_|  |  // /_/ | |  | |  |
 * |__|_ \(____  /|___|  /|___|  /(____  / (____  /|____/ \____ | |__| |__|
 *      \/     \/      \/      \/      \/       \/             \/
 *            __            __                                     .__
 *    _______/  |_ _\|/_   |  | __  ____   ______    ____    ____  |  |
 *   /  ___/\   __\\__  \  |  |/ /_/ __ \  \____ \  /  _ \  /  _ \ |  |
 *   \___ \  |  |   / __ \_|    < \  ___/  |  |_> >(  <_> )(  <_> )|  |__
 *  /____  > |__|  (____  /|__|_ \ \___  > |   __/  \____/  \____/ |____/
 *       \/             \/      \/     \/  |__|
 *
 *  @title KNN Audit Stake Pool
 *  @author KANNA Team
 *  @custom:github  https://github.com/kanna-coin
 *  @custom:site https://kannacoin.io
 *  @custom:discord https://discord.kannacoin.io
 */
contract KannaAuditStakePool is Ownable {

    enum Status {
        Pending,
        Active,
        Finalized
    }

    struct Stake {
        address wallet;
        uint256 amount;
        uint256 timestamp;
    }

    struct FeeDiscount {
        uint8 score;
        uint8 discount;
    }

    struct Settings {
        uint256 totalPrize;
        uint256 maxInStakePool;
        uint8 maxPrizePercentage;
        uint256 minToStake;
        uint256 maxToStake;
        uint256 fee;
        uint16 minDaysInStake;
        FeeDiscount[] feeDiscounts;
    }

    address private _token;
    address private _scoreProvider;
    uint256 private _totalPrize;
    uint256 private _maxInStakePool;
    uint256 public totalStaked;
    uint256 private _fee;
    uint256 private _minToStake;
    uint256 private _maxToStake;
    uint256 private _percentageReached;
    FeeDiscount[] private _feeDiscounts;
    uint16 private _minDaysInStake;
    uint8 private _maxPrizePercentage;
    Status public status = Status.Pending;

    uint16 public lastStakeId;
    mapping(address => uint16) private _stakesIndexMap;
    mapping(uint16 => Stake) private _stakes;
    mapping(uint16 => bool) private _withdrawns;

    event Initialized(address tokenAddress, uint256 totalPrize, uint256 maxInStakePool, uint8 maxPrizePercentage, uint256 minToStake, uint256 maxToStake, uint256 fee, uint16 minDaysInStake);
    event ScoreProviderSet(address scoreProvider, uint256 timestamp);
    event Finalized(uint256 percentageReached, uint256 timestamp);
    event NewStake(uint16 indexed stakeId, address indexed wallet, uint256 amount, uint256 timestamp);
    event Withdraw(uint16 indexed stakeId, address indexed wallet, uint256 amount, uint256 fee, uint256 timestamp);
    event LeftoverTransferred(address indexed recipient, uint256 amount, uint256 timestamp);

    modifier isActive() {
        require(status == Status.Active, "Contract is not active");
        _;
    }

    modifier isFinalized() {
        require(status == Status.Finalized, "Contract is not finalized");
        _;
    }

    modifier isStaker(address wallet) {
        require(_stakesIndexMap[wallet] != 0, "Wallet is not staked");
        _;
    }

    function initialize(
        address tokenAddress,
        uint256 totalPrize,
        uint256 maxInStakePool,
        uint8 maxPrizePercentage,
        uint256 fee,
        uint256 minToStake,
        uint256 maxToStake,
        uint16 minDaysInStake,
        uint8[] memory feeDiscounts
    ) external onlyOwner {
        require(status == Status.Pending, "Contract is already initialized");
        require(tokenAddress != address(0), "Invalid token address");
        require(totalPrize > 0, "Total Prize must be greater than 0");
        require(minToStake > 0, "Minimum to stake must be greater than 0");
        require(maxToStake > minToStake, "Maximum to stake must be greater than minStake");
        require(maxPrizePercentage > 0, "Maximum prize percentage must be greater than 0");
        require(maxInStakePool >= totalPrize * 100 / maxPrizePercentage, "Maximum in stake pool must be greater than total prize plus total prize percentage");
        require(minDaysInStake > 0, "Min days in stake must be greater than 0");
        require(fee < minToStake * maxPrizePercentage / 100, "Fee must be less than minimun prize");
        require(feeDiscounts.length % 2 == 0, "Fee discounts must be even");

        _token = tokenAddress;

        _safeTransferFrom(_msgSender(), address(this), totalPrize);

        _totalPrize = totalPrize;
        _maxInStakePool = maxInStakePool;
        _maxPrizePercentage = maxPrizePercentage;
        _fee = fee;
        _minToStake = minToStake;
        _maxToStake = maxToStake;
        _minDaysInStake = minDaysInStake;

        for (uint8 i = 0; i < feeDiscounts.length; i += 2) {
            uint8 score = feeDiscounts[i];
            uint8 discount = feeDiscounts[i + 1];

            require(score > 0 && score <= 100, "Score must be between 0 and 100");
            require(discount > 0 && discount <= 100, "Fee discounts must be between 0 and 100");
            require(i == 0 || (score > feeDiscounts[i - 2] && discount > feeDiscounts[i - 1]), "Fee discounts must be in ascending order");

            _feeDiscounts.push(FeeDiscount(score, discount));
        }

        status = Status.Active;

        emit Initialized(tokenAddress, totalPrize, maxInStakePool, maxPrizePercentage, minToStake, maxToStake, fee, minDaysInStake);
    }

    function setScoreProvider(address scoreProvider) external onlyOwner isActive {
        require(
            IKannaAuditScoreProvider(scoreProvider).supportsInterface(type(IKannaAuditScoreProvider).interfaceId),
            "`scoreProvider` needs to implement `IKannaAuditScoreProvider` interface"
        );

        _scoreProvider = scoreProvider;

        emit ScoreProviderSet(scoreProvider, block.timestamp);
    }

    function finalize() external onlyOwner isActive {
        require(_scoreProvider != address(0), "Score provider not set");

        _percentageReached = _calcPercentageReached();

        status = Status.Finalized;

        emit Finalized(_percentageReached, block.timestamp);
    }

    function tokensLeftover() external view isFinalized returns (uint256) {
        return _totalTokensLeftover();
    }

    function transferTokensLeftover(address recipient) external onlyOwner isFinalized {
        require(recipient != address(0), "Invalid recipient address");

        uint256 totalLeftOver = _totalTokensLeftover();

        require(totalLeftOver > 0, "No tokens leftover to transfer");

        _safeTransfer(recipient, totalLeftOver);

        emit LeftoverTransferred(recipient, totalLeftOver, block.timestamp);
    }

    function settings() external view returns (Settings memory) {
        return Settings(
            _totalPrize,
            _maxInStakePool,
            _maxPrizePercentage,
            _minToStake,
            _maxToStake,
            _fee,
            _minDaysInStake,
            _feeDiscounts
        );
    }

    function isStaked(address wallet) external view returns (bool) {
        return _stakesIndexMap[wallet] != 0;
    }

    function stakeOf(address wallet) external view isStaker(wallet) returns (Stake memory) {
        return _stakes[_stakesIndexMap[wallet]];
    }

    function feeOf(address wallet) external view isStaker(wallet) returns (uint256) {
        return _feeOf(_stakesIndexMap[wallet]);
    }

    function scoreOf(address wallet) external view isStaker(wallet) returns (uint256) {
        return _scoreOf(_stakesIndexMap[wallet]);
    }

    function prizeOf(address wallet) external view isStaker(wallet) returns (uint256) {
        uint16 stakeId = _stakesIndexMap[wallet];

        return _prizeOf(stakeId, _calcPercentageReached());
    }

    function percentageReached() external view returns (uint256) {
        return _calcPercentageReached();
    }

    function availableToWithdraw(address wallet) external view isStaker(wallet) returns (uint256) {
        uint16 stakeId = _stakesIndexMap[wallet];

        if (
            status != Status.Finalized ||
            _withdrawns[stakeId] ||
            block.timestamp < _stakes[stakeId].timestamp + _minDaysInStake * 1 days
        ) {
            return 0;
        }

        uint256 prize = _prizeOf(stakeId, _calcPercentageReached());
        uint256 fee = _feeOf(stakeId);

        return _stakes[stakeId].amount + prize - fee;
    }

    function stake(uint256 amount) external {
        require(status == Status.Active, "Contract is not active");
        require(_stakesIndexMap[_msgSender()] == 0, "Address already staked");
        require(amount >= _minToStake && amount <= _maxToStake, "Invalid amount to stake");
        require(totalStaked + amount <= _maxInStakePool, "The steak pool reached it's maximum capacity");

        _safeTransferFrom(_msgSender(), address(this), amount);

        uint16 stakeId = ++lastStakeId;
        _stakesIndexMap[_msgSender()] = stakeId;
        _stakes[stakeId] = Stake(_msgSender(), amount, block.timestamp);

        totalStaked += amount;

        emit NewStake(stakeId, _msgSender(), amount, block.timestamp);
    }

    function withdraw() external isStaker(_msgSender()) isFinalized {
        uint16 stakeId = _stakesIndexMap[_msgSender()];

        require(_withdrawns[stakeId] == false, "Prize already withdrawn");
        require(block.timestamp >= _stakes[stakeId].timestamp + _minDaysInStake * 1 days, "Minimum days in stake not reached");

        uint256 prize = _prizeOf(stakeId, _percentageReached);
        uint256 fee = _feeOf(stakeId);
        uint256 amount = _stakes[stakeId].amount + prize - fee;

        _safeTransfer(_msgSender(), amount);

        _withdrawns[stakeId] = true;

        emit Withdraw(stakeId, _msgSender(), amount, fee, block.timestamp);
    }

    function _calcPercentageReached() internal view returns (uint256) {
        if (status == Status.Finalized) {
            return _percentageReached;
        }

        uint256 percentageReachedAcc = 0;

        for (uint16 i = 1; i <= lastStakeId; i++) {
            uint256 amount = _stakes[i].amount;
            uint256 score = _scoreOf(i);

            uint256 stakePercentage = amount * 10**20 / totalStaked;
            uint256 stakerPercentageReached = stakePercentage * score / 10**20;

            percentageReachedAcc += stakerPercentageReached;
        }

        return percentageReachedAcc;
    }

    function _scoreOf(uint16 stakeId) internal view returns (uint256) {
        if (_scoreProvider == address(0)) {
            return 0;
        }

        uint256 score = IKannaAuditScoreProvider(_scoreProvider).getScore(_stakes[stakeId].wallet);

        require(score <= 100 * 10**18, "Score must be between 0 and 100");

        return score;
    }

    function _feeOf(uint16 stakeId) internal view returns (uint256) {
        uint8 discountPercentage = 0;

        for (uint256 i = 0; i < _feeDiscounts.length; i++) {
            if (_scoreOf(stakeId) < uint256(_feeDiscounts[i].score) * 10**18) {
                break;
            }

            discountPercentage = _feeDiscounts[i].discount;
        }

        return _fee * (100 - discountPercentage) / 100;
    }

    function _prizeOf(uint16 stakeId, uint256 percentageReachedAcc) internal view returns (uint256) {
        if (percentageReachedAcc == 0) return 0;

        uint256 amount = _stakes[stakeId].amount;
        uint256 score = _scoreOf(stakeId);
        uint256 stakePercentage = amount * 10**20 / totalStaked;
        uint256 stakerPercentageReached = stakePercentage * score / 10**20;
        uint256 stakerFinalPercentage = stakerPercentageReached * 10**20 / percentageReachedAcc;
        uint256 prize = _totalPrize * stakerFinalPercentage / 10**20;

        uint256 maxPrize = amount * uint256(_maxPrizePercentage) / 100;

        if (prize > maxPrize) {
            prize = maxPrize;
        }

        return prize;
    }

    function _totalTokensLeftover() internal view returns (uint256) {
        uint256 totalLeftover = IERC20(_token).balanceOf(address(this));
        uint256 percentageReachedAcc = _calcPercentageReached();

        for (uint16 i = 1; i <= lastStakeId; i++) {
            if (_withdrawns[i]) {
                continue;
            }

            uint256 prize = _prizeOf(i, percentageReachedAcc);
            uint256 fee = _feeOf(i);

            totalLeftover -= _stakes[i].amount + prize - fee;
        }

        return totalLeftover;
    }

    function _safeTransfer(address to, uint256 amount) internal {
        (bool success, bytes memory data) = _token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));

        require(success && (data.length == 0 || abi.decode(data, (bool))), 'Error to transfer tokens');
    }

    function _safeTransferFrom(address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = _token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount));

        require(success && (data.length == 0 || abi.decode(data, (bool))), 'Error to transfer tokens');
    }
}

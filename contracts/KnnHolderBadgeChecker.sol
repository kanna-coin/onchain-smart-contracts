// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {DynamicBadgeChecker} from "./DynamicBadgeChecker.sol";
import {KannaToken} from "./KannaToken.sol";

/**
 *
 *  __                                     .__             .__       .___
 * |  | _______     ____    ____  _____    |  |__    ____  |  |    __| _/  ____  _______
 * |  |/ /\__  \   /    \  /    \ \__  \   |  |  \  /  _ \ |  |   / __ | _/ __ \ \_  __ \
 * |    <  / __ \_|   |  \|   |  \ / __ \_ |   Y  \(  <_> )|  |__/ /_/ | \  ___/  |  | \/
 * |__|_ \(____  /|___|  /|___|  /(____  / |___|  / \____/ |____/\____ |  \___  > |__|
 *      \/     \/      \/      \/      \/       \/                    \/      \/
 * ___.                .___                          .__                      __
 * \_ |__  _____     __| _/   ____    ____     ____  |  |__    ____    ____  |  | __  ____  _______
 *  | __ \ \__  \   / __ |   / ___\ _/ __ \  _/ ___\ |  |  \ _/ __ \ _/ ___\ |  |/ /_/ __ \ \_  __ \
 *  | \_\ \ / __ \_/ /_/ |  / /_/  >\  ___/  \  \___ |   Y  \\  ___/ \  \___ |    < \  ___/  |  | \/
 *  |___  /(____  /\____ |  \___  /  \___  >  \___  >|___|  / \___  > \___  >|__|_ \ \___  > |__|
 *      \/      \/      \/ /_____/       \/       \/      \/      \/      \/      \/     \/
 *
 *  @title KNN Holder Badge Checker
 *  @author KANNA Team
 *  @custom:github  https://github.com/kanna-coin
 *  @custom:site https://kannacoin.io
 *  @custom:discord https://discord.kannacoin.io
 */
contract KnnHolderBadgeChecker is DynamicBadgeChecker {
    KannaToken private immutable knnToken;
    address private immutable creatorAddress;

    constructor(address _knnToken, address _creatorAddress) {
        require(address(_knnToken) != address(0), "Invalid token address");

        creatorAddress = _creatorAddress;
        knnToken = KannaToken(_knnToken);
    }

    /**
     * @dev See {IDynamicBadgeChecker-isAccumulative}.
     */
    function isAccumulative() external pure returns (bool) {
        return false;
    }

    /**
     * @dev See {IDynamicBadgeChecker-creator}
     */
    function creator() external view returns (address) {
        return creatorAddress;
    }

    /**
     * @dev See {IDynamicBadgeChecker-royaltyPercent}
     */
    function royaltyPercent() external pure returns (uint256) {
        return 0;
    }

    /**
     * @dev See {IDynamicBadgeChecker-balanceOf}.
     *
     * Check if `account` is a KNN holder
     */
    function balanceOf(address account, uint16) external view returns (uint256) {
        return knnToken.balanceOf(account) > 0 ? 1 : 0;
    }
}

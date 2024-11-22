import * as Constants from '../constants.js';
import killCountMsgConstructor from './killCountMsgConstructor/killCountMsgConstructor.js';

/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param bossName
 * @param killCount
 * @param playerName
 * @returns
 */
function checkKc(msgMap, bossName, killCount, playerName, gameMessage, KC_URL) {
  const bossInterval = Constants.bossMap.get(bossName?.toUpperCase());

  // if KC is notable
  if (
    (Constants.bossMap.has(bossName?.toUpperCase()) &&
      killCount % bossInterval === 0) ||
    killCount % 100 === 0 ||
    (killCount === 1 && Constants.specialKills.includes(bossName.toUpperCase()))
  ) {
    msgMap.set(
      { ID: 'KILL_COUNT', URL: KC_URL },
      killCountMsgConstructor(playerName, gameMessage, bossName)
    );
  }
}

export default checkKc;

import * as Constants from '../constants.js';
import grumblerCheck from './grumblerCheck.js';
import killCountMsgConstructor from './killCountMsgConstructor/killCountMsgConstructor.js';

/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} KC_URL
 */
function checkKc(msgMap, playerName, extra, KC_URL) {
  const bossName = grumblerCheck(extra?.boss);
  const { count: killCount, gameMessage } = extra || {};
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

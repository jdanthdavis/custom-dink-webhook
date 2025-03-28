import * as Constants from '../constants.js';
import grumblerCheck from './grumblerCheck.js';
import killCountMsgConstructor from './killCountMsgConstructor/killCountMsgConstructor.js';

/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 */
function checkKc(msgMap, playerName, extra, URL) {
  const { boss, count: killCount, gameMessage } = extra || {};
  const validatedBossName = grumblerCheck(boss);
  const bossInterval = Constants.bossMap.get(validatedBossName?.toUpperCase());

  // if KC is notable
  if (Constants.bossMap.has(bossName?.toUpperCase())) {
    if (
      killCount % bossInterval === 0 ||
      killCount % 100 === 0 ||
      (killCount === 1 &&
        Constants.specialKills.includes(bossName.toUpperCase()))
    ) {
      msgMap.set(
        { ID: 'KILL_COUNT', URL: URL },
        killCountMsgConstructor(playerName, gameMessage, validatedBossName)
      );
    }
  }
}

export default checkKc;

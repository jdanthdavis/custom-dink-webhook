import * as Constants from '../constants.js';
import { GrumblerCheck, KillCountMsgConstructor } from './helperFunctions';
/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 */
function KillCountHandler(msgMap, playerName, extra, URL) {
  const { boss, count: killCount, gameMessage } = extra || {};
  const validatedBossName = GrumblerCheck(boss);
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
        KillCountMsgConstructor(playerName, gameMessage, validatedBossName)
      );
    }
  }
}

export default KillCountHandler;

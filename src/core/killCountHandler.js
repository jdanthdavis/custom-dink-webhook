import { customBossNames, killCountMsgConstructor } from './helperFunctions';
import { bossMap, specialKills, KILL_COUNT, BRUTUS } from '../constants';

/**
 * Notifies on a kill-count milestone (every 100, a boss-specific interval, or a special first kill).
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns {Map<{ ID: string, URL: string }, string>}
 */
function killCountHandler(msgMap, playerName, extra, URL) {
  const { boss, count: killCount, gameMessage } = extra || {};
  const validatedBossName = customBossNames(boss);
  const bossInterval = bossMap.get(validatedBossName?.toUpperCase()) ?? 0;

  // if KC is notable
  if (
    killCount % bossInterval === 0 ||
    killCount % 100 === 0 ||
    (killCount === 1 && specialKills.includes(validatedBossName?.toUpperCase()))
  ) {
    msgMap.set(
      { ID: KILL_COUNT, URL },
      killCountMsgConstructor(
        playerName,
        gameMessage,
        validatedBossName,
        killCount
      )
    );
  }

  return msgMap;
}

export default killCountHandler;

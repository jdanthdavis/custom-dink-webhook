import { grumblerCheck, killCountMsgConstructor } from './helperFunctions';
import * as Constants from '../constants';

/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function killCountHandler(msgMap, playerName, extra, URL) {
  const { boss, count: killCount, gameMessage } = extra || {};
  const validatedBossName = grumblerCheck(boss);
  const bossInterval = Constants.bossMap.get(validatedBossName?.toUpperCase());

  // if KC is notable
  if (
    killCount % bossInterval === 0 ||
    killCount % 100 === 0 ||
    (killCount === 1 &&
      Constants.specialKills.includes(validatedBossName.toUpperCase()))
  ) {
    msgMap.set(
      { ID: 'KILL_COUNT', URL: URL },
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

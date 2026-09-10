import { customBossNames, formatPbTime } from './helperFunctions';
import { PERSONAL_BEST } from '../constants';

/**
 * Builds the "new personal best" announcement message.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {string} playerName
 * @param {{ boss: string, time: string }} extra
 * @param {string} URL
 * @returns {Map<{ ID: string, URL: string }, string>}
 */
function personalBestHandler(msgMap, playerName, extra, URL) {
  const { boss, time } = extra || {};
  const bossName = customBossNames(boss);
  const formattedTime = formatPbTime(time);

  const message = formattedTime
    ? `**${playerName}** has defeated **${bossName}** with a new personal best of **${formattedTime}!**`
    : `**${playerName}** has defeated **${bossName}** with a new personal best**!**`;

  msgMap.set({ ID: PERSONAL_BEST, URL }, message);

  return msgMap;
}

export default personalBestHandler;

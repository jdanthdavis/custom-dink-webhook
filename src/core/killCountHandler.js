import * as Constants from '../constants';

/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param {*} extra - Additional information
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function killCountHandler(extra) {
  const { boss, count: killCount } = extra || {};
  const bossInterval = Constants.bossMap.get(boss?.toUpperCase());

  if (
    killCount % bossInterval === 0 ||
    killCount % 100 === 0 ||
    (killCount === 1 && Constants.specialKills.includes(boss.toUpperCase()))
  ) {
    return true;
  }

  return false;
}

export default killCountHandler;

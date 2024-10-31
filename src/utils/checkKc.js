import * as Constants from '../constants.js';

/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param bossName
 * @param killCount
 * @param playerName
 * @returns
 */
export default function checkKc(bossName, killCount, playerName) {
  const bossInterval = Constants.bossMap.get(bossName?.toUpperCase());

  // if KC is noteable
  if (
    Constants.bossMap.has(bossName?.toUpperCase()) &&
    killCount % bossInterval === 0
  )
    return true;

  // base bossInterval of 100
  if (killCount % 100 === 0) return true;

  // special occasion
  if (
    Constants.theBoys.includes(playerName?.toUpperCase()) &&
    killCount === 1 &&
    Constants.specialKills.includes(bossName.toUpperCase())
  ) {
    return true;
  }
  return false;
}

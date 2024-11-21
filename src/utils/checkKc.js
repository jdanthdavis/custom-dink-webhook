import * as Constants from '../constants.js';

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
  const formattedKC = gameMessage?.split(': ')[1]?.replace('.', '!');

  // if KC is noteable
  if (
    (Constants.bossMap.has(bossName?.toUpperCase()) &&
      killCount % bossInterval === 0) ||
    killCount % 100 === 0 ||
    (Constants.theBoys.includes(playerName?.toUpperCase()) &&
      killCount === 1 &&
      Constants.specialKills.includes(bossName.toUpperCase()))
  ) {
    msgMap.set(
      { ID: 'KILL_COUNT', URL: KC_URL },
      `**${playerName}** has defeated **${grumblerCheck(
        bossName
      )}** with a completion count of **${formattedKC}**`
    );
  }

  // base bossInterval of 100
  // if (killCount % 100 === 0) return true;

  // special occasion
  //   if (
  //     Constants.theBoys.includes(playerName?.toUpperCase()) &&
  //     killCount === 1 &&
  //     Constants.specialKills.includes(bossName.toUpperCase())
  //   ) {
  //     return true;
  //   }
  //   return false;
}

export default checkKc;

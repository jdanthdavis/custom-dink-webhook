import { grumblerCheck } from './helperFunctions';

/**
 * Formats the in-game ISO-8601 duration.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function PersonalBestHandler(msgMap, playerName, extra, PB_URL) {
  const bossName = grumblerCheck(extra?.boss);
  // Remove the leading PT
  let cleanedTime = extra?.time.replace('PT', '');

  if (cleanedTime.includes('M') && !cleanedTime.includes('S')) {
    // PB that has no seconds
    cleanedTime = cleanedTime.replace('M', ':00');
  } else if (!cleanedTime.includes('M') && cleanedTime.includes('S')) {
    // PB that is only seconds
    cleanedTime = `${cleanedTime.replace('S', '')}s`;
  } else {
    // PB that has both minutes and seconds
    cleanedTime = cleanedTime.replace('M', ':').replace('S', '');

    if (
      cleanedTime.split(':')[1].length === 1 ||
      cleanedTime.split(':').pop().split('.')[0].length === 1
    ) {
      // PB that also has milliseconds
      cleanedTime = cleanedTime.replace(':', ':0');
    }
  }

  msgMap.set(
    { ID: 'PB', URL: PB_URL },
    `**${playerName}** has defeated **${bossName}** with a new personal best of **${cleanedTime}**!`
  );

  return msgMap;
}

export default PersonalBestHandler;

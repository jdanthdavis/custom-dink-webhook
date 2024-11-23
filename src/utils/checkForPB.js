/**
 * Time comes in ISO-8601 duration so we need to reformat the time
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} bossName
 * @param {*} PB_URL
 */
function checkForPB(msgMap, playerName, bossName, PB_URL) {
  // Remove the leading PT
  let cleanedTime = time.replace('PT', '');

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
    `**${playerName}** has defeated **${bossName}** with a new personal best of **${time}**!`
  );
}

export default checkForPB;

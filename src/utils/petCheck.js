import grumblerCheck from './grumblerCheck.js';

/**
 * Gathers the pet information
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 */
function petCheck(msgMap, playerName, extra, URL) {
  const { milestone, duplicate: isDuplicate } = extra;
  const petName = grumblerCheck(extra?.petName);

  if (!petName || !milestone) {
    // Need this fallback in case the game broadcast doesn't include the pet name or milestone
    msgMap.set(
      { ID: 'PET', URL: URL },
      `**${playerName}** has a funny feeling like they would have been followed!\n-# Unable to fetch pet name and milestone!`
    );
  } else {
    if (isDuplicate) {
      msgMap.set(
        { ID: 'PET', URL: URL },
        `**${playerName}** has a funny feeling like they would have been followed by **${petName}**! | **${milestone}**`
      );
    } else {
      msgMap.set(
        { ID: 'PET', URL: URL },
        `**${playerName}** has a funny feeling like they're being followed by **${petName}**! | **${milestone}**`
      );
    }
  }
}

export default petCheck;

import grumblerCheck from './grumblerCheck.js';

/**
 * Gathers the pet information
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 */
export default function petCheck(msgMap, playerName, extra, URL) {
  const { petName, milestone, duplicate: isDuplicate } = extra;

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
        `**${playerName}** has a funny feeling like they would have been followed by **${grumblerCheck(
          petName
        )}**! | **${milestone}**`
      );
    } else {
      msgMap.set(
        { ID: 'PET', URL: URL },
        `**${playerName}** has a funny feeling like they're being followed by **${grumblerCheck(
          petName
        )}**! | **${milestone}**`
      );
    }
  }
}

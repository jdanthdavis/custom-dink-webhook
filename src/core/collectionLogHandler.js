import { grumblerCheck, formatAsPercentage } from './helperFunctions';
import { RANK_MAP, COLLECTION } from '../constants';

/**
 * Gathers the collection log item and builds the accounts total collection log entries
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function collectionLogHandler(msgMap, playerName, extra, URL) {
  const {
    totalEntries,
    completedEntries,
    itemName,
    currentRank,
    justCompletedRank,
  } = extra;
  const validatedItemName = grumblerCheck(itemName);
  const percentageCompleted = formatAsPercentage(
    completedEntries,
    totalEntries
  );
  const formatedRanks = (rank) =>
    rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase();
  const formattedJustCompletedRank =
    justCompletedRank && formatedRanks(justCompletedRank);
  const formattedCurrentRank = currentRank && formatedRanks(currentRank);

  if (!totalEntries || !completedEntries) {
    // If the user hasn't cycled their collection log we will use this fallback to prevent errors
    msgMap.set(
      { ID: COLLECTION, URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}**\n-# Unable to fetch total and completed entries. Open your collection log tab to fix this.
        `
    );
  } else if (justCompletedRank) {
    // The player has ranked up
    const msg =
      currentRank === 'GILDED'
        ? `**${playerName}** has reached the highest possible rank of **${formattedCurrentRank}**, by adding **${validatedItemName}** to their collection log | **${completedEntries}/${totalEntries} (${percentageCompleted}%)** ${RANK_MAP[currentRank]}`
        : `**${playerName}** has completed the **${formattedJustCompletedRank}** rank, by adding **${validatedItemName}** to their collection log | **${completedEntries}/${totalEntries} (${percentageCompleted}%)** ${RANK_MAP[currentRank]}`;
    msgMap.set({ ID: COLLECTION, URL }, msg);
  } else {
    if (currentRank === 'NONE') {
      msgMap.set(
        { ID: COLLECTION, URL },
        `**${playerName}** has added a new item to their collection log: **${validatedItemName}** | **${completedEntries}/${totalEntries} (${percentageCompleted}%)** ${
          currentRank !== 'NONE' ? RANK_MAP[currentRank] : ''
        }`
      );
    } else {
      msgMap.set(
        { ID: COLLECTION, URL },
        `**${playerName}** has added a new item to their collection log: **${validatedItemName}** | **${completedEntries}/${totalEntries} (${percentageCompleted}%)** ${RANK_MAP[currentRank]}`
      );
    }
  }

  return msgMap;
}
export default collectionLogHandler;

import { grumblerCheck, formatAsPercentage } from './helperFunctions';
import { RANK_MAP, COLLECTION } from '../constants';

/**
 * @typedef {Object} CollectionLogExtra
 * @property {number} totalEntries - Total number of collection log entries for the account.
 * @property {number} completedEntries - Number of entries the account has completed.
 * @property {string} itemName - Name of the item that triggered this update.
 * @property {string} [currentRank] - The account's current collection log rank (e.g. 'BRONZE', or 'NONE' if unranked).
 * @property {string} [justCompletedRank] - The rank just completed by this update, 'NONE' if none was completed, or omitted entirely.
 */

/**
 * Gathers the collection log item and builds the accounts total collection log entries
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {CollectionLogExtra} extra - Additional information
 * @param {string} URL - The associated URL
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
    totalEntries,
  );
  /** @param {string} rank */
  const formatedRanks = (rank) =>
    rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase();
  const formattedJustCompletedRank =
    justCompletedRank && formatedRanks(justCompletedRank);
  const formattedCurrentRank = currentRank && formatedRanks(currentRank);

  if (!totalEntries || !completedEntries) {
    // If the user hasn't cycled their collection log we will use this fallback to prevent errors
    msgMap.set(
      { ID: COLLECTION, URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}**\n-# Unable to fetch total and completed entries. Open your collection log tab to fix this.`,
    );
    return msgMap;
  }

  const logPercentage = `${completedEntries}/${totalEntries} (${percentageCompleted}%)`;
  const rankIcon =
    !currentRank || currentRank === 'NONE' ? '' : RANK_MAP[currentRank];

  if (justCompletedRank && justCompletedRank !== 'NONE') {
    const msg =
      currentRank === 'GILDED'
        ? `**${playerName}** has reached the highest possible rank of **${formattedCurrentRank}**, by adding **${validatedItemName}** to their collection log | **${logPercentage}** ${rankIcon}`
        : `**${playerName}** has completed the **${formattedJustCompletedRank}** rank, by adding **${validatedItemName}** to their collection log | **${logPercentage}** ${rankIcon}`;
    msgMap.set({ ID: COLLECTION, URL }, msg);
  } else if (justCompletedRank === 'NONE') {
    msgMap.set(
      { ID: COLLECTION, URL },
      `**${playerName}** has achieved the **${formattedCurrentRank}** rank, by adding **${validatedItemName}** to their collection log | **${logPercentage}** ${rankIcon}`,
    );
  } else {
    msgMap.set(
      { ID: COLLECTION, URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}** | **${logPercentage}** ${rankIcon}`,
    );
  }

  return msgMap;
}
export default collectionLogHandler;

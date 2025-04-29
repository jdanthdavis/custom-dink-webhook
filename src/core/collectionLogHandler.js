import { grumblerCheck, formatAsPercentage } from './helperFunctions';
import { COLLECTION } from '../constants';

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
  const rankMap = {
    BRONZE: '<:bronze_rank:1353119905750192209>',
    IRON: '<:iron_rank:1353119911643320390>',
    STEEL: '<:steel_rank:1353119914403172363>',
    BLACK: '<:black_rank:1353119904550883409>',
    MITHRIL: '<:mithril_rank:1352512785191538708>',
    ADAMANT: '<:adamant_rank:1353119902403137658>',
    RUNE: '<:rune_rank:1353119913115521228>',
    DRAGON: '<:dragon_rank:1353119907864121425>',
    GILDED: '<:gilded_rank:1353119909844095016>',
  };

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
        ? `**${playerName}** has reached the highest possible rank of **${formattedCurrentRank}**, by adding **${validatedItemName}** to their collection log **| ${completedEntries}/${totalEntries} (${percentageCompleted}%)** ${rankMap[currentRank]}`
        : `**${playerName}** has completed the **${formattedJustCompletedRank}** rank, by adding **${validatedItemName}** to their collection log **| ${completedEntries}/${totalEntries} (${percentageCompleted}%)** ${rankMap[currentRank]}`;
    msgMap.set({ ID: COLLECTION, URL }, msg);
  } else {
    msgMap.set(
      { ID: COLLECTION, URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}** | **${completedEntries}/${totalEntries} (${percentageCompleted}%)** ${rankMap[currentRank]}`
    );
  }

  return msgMap;
}
export default collectionLogHandler;

import { grumblerCheck, formatAsPercentage } from './helperFunctions';

/**
 * Gathers the collection log item and builds the accounts total collection log entries
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function collectionLogHandler(msgMap, playerName, extra, URL) {
  const { totalEntries, completedEntries, itemName, currentRank } = extra;
  const validatedItemName = grumblerCheck(itemName);
  const percentageCompleted =
    totalEntries > 0
      ? formatAsPercentage((completedEntries / totalEntries) * 100)
      : '0%';

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
      { ID: 'NO_CLOG_DATA', URL: URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}**\n-# Unable to fetch total and completed entries. Cycle through all tabs in your collection log to fix this!
        `
    );
  } else {
    msgMap.set(
      { ID: 'COLLECTION_LOG', URL: URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}** | **${completedEntries}/${totalEntries} (${percentageCompleted}%)** | ${rankMap[currentRank]}`
    );
  }

  return msgMap;
}

export default collectionLogHandler;

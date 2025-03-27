import grumblerCheck from "./grumblerCheck.js";
import formatAsPercentage from "./formatAsPercentage.js";

/**
 * Gathers the collection log item and builds the accounts total collection log entries
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
function collectionLogCheck(msgMap, playerName, extra, URL) {
  const { totalEntries, completedEntries, currentRank } = extra || {};
  const itemName = grumblerCheck(extra?.itemName);
  const percentageCompleted = formatAsPercentage(
    (completedEntries / totalEntries) * 100
  );
  const rankMap = {
    BRONZE: "<:bronze_rank:1353119905750192209>",
    IRON: "<:iron_rank:1353119911643320390>",
    STEEL: "<:steel_rank:1353119914403172363>",
    BLACK: "<:black_rank:1353119904550883409>",
    MITHRIL: "<:mithril_rank:1352512785191538708>",
    ADAMANT: "<:adamant_rank:1353119902403137658>",
    RUNE: "<:rune_rank:1353119913115521228>",
    DRAGON: "<:dragon_rank:1353119907864121425>",
    GILDED: "<:gilded_rank:1353119909844095016>",
  };

  if (!totalEntries || !completedEntries) {
    // If the user hasn't cycled their collection log we will use this fallback to prevent errors
    msgMap.set(
      { ID: "COLLECTION_LOG", URL: URL },
      `**${playerName}** has added a new item to their collection log: **${itemName}**\n-# Unable to fetch total and completed entries. Cycle through all tabs in your collection log to fix this!
        `
    );
  } else {
    msgMap.set(
      { ID: "COLLECTION_LOG", URL: URL },
      `**${playerName}** has added a new item to their collection log: **${itemName}** | **${completedEntries}/${totalEntries} (${percentageCompleted}%)** | ${rankMap[currentRank]}`
    );
  }
  return msgMap;
}

export default collectionLogCheck;

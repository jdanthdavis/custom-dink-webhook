import grumblerCheck from './grumblerCheck.js';
import formatAsPercentage from './formatAsPercentage.js';

/**
 * Gathers the collection log item and builds the accounts total collection log entries
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
function collectionLogCheck(msgMap, playerName, extra, URL) {
  const { totalEntries, completedEntries } = extra || {};
  const itemName = grumblerCheck(extra?.itemName);
  const percentageCompleted = formatAsPercentage(
    (completedEntries / totalEntries) * 100
  );

  if (!totalEntries || !completedEntries) {
    // If the user hasn't cycled their collection log we will use this fallback to prevent errors
    msgMap.set(
      { ID: 'COLLECTION_LOG', URL: URL },
      `**${playerName}** has added a new item to their collection log: **${itemName}**\n-# Unable to fetch total and completed entries. Cycle through all tabs in your collection log to fix this!
        `
    );
  } else {
    msgMap.set(
      { ID: 'COLLECTION_LOG', URL: URL },
      `**${playerName}** has added a new item to their collection log: **${itemName}** | **${completedEntries}/${totalEntries} (${percentageCompleted}%)**`
    );
  }
  return msgMap;
}

export default collectionLogCheck;

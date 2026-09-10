import { customBossNames, formatAsPercentage } from './helperFunctions';
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
 * Formats a rank string (e.g. "RUNE") into Title Case (e.g. "Rune").
 * @param {string} rank
 * @returns {string}
 */
export function formatRank(rank) {
  return rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase();
}

/**
 * Upserts a player's collection log snapshot for the weekly recap. A
 * snapshot-replace domain (like tcg_progress), not a counter -
 * completedEntries/totalEntries/currentRank are the account's current
 * values on every event, not deltas. Missing values are preserved via
 * COALESCE rather than overwritten with null.
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @param {string} playername
 * @param {number} [totalEntries]
 * @param {number} [completedEntries]
 * @param {string} [currentRank]
 */
async function recordCollectionLog(
  WEEKLY_RECAP_DB,
  playername,
  totalEntries,
  completedEntries,
  currentRank
) {
  try {
    await WEEKLY_RECAP_DB.prepare(
      `INSERT INTO collection_log (playername, completed_entries, total_entries, current_rank)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(playername) DO UPDATE SET
         completed_entries = COALESCE(?2, completed_entries),
         total_entries = COALESCE(?3, total_entries),
         current_rank = COALESCE(?4, current_rank)`
    )
      .bind(
        playername,
        completedEntries ?? null,
        totalEntries ?? null,
        currentRank ?? null
      )
      .run();
  } catch (error) {
    console.log(
      'recordCollectionLog ',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Gathers the collection log item, records the account's current snapshot
 * for the weekly recap, and builds the account's total collection log
 * entries message.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {CollectionLogExtra} extra - Additional information
 * @param {*} WEEKLY_RECAP_DB - D1 database binding shared by weekly-recap-tracked domains
 * @param {string} URL - The associated URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>} The updated message map
 */
async function collectionLogHandler(msgMap, playerName, extra, WEEKLY_RECAP_DB, URL) {
  const {
    totalEntries,
    completedEntries,
    itemName,
    currentRank,
    justCompletedRank,
  } = extra;
  const validatedItemName = customBossNames(itemName);
  const percentageCompleted = formatAsPercentage(
    completedEntries,
    totalEntries
  );
  const formattedJustCompletedRank =
    justCompletedRank && formatRank(justCompletedRank);
  const formattedCurrentRank = currentRank && formatRank(currentRank);

  // Dink sends 0/0 to mean "log not yet cycled," same as the fallback check
  // below - treat that as missing here too, so it doesn't COALESCE a real
  // zero over previously-known-good values.
  await recordCollectionLog(
    WEEKLY_RECAP_DB,
    playerName,
    totalEntries || null,
    completedEntries || null,
    currentRank
  );

  if (!totalEntries || !completedEntries) {
    // If the user hasn't cycled their collection log we will use this fallback to prevent errors
    msgMap.set(
      { ID: COLLECTION, URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}**\n-# Unable to fetch total and completed entries. Open your collection log tab to fix this.`
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
      `**${playerName}** has achieved the **${formattedCurrentRank}** rank, by adding **${validatedItemName}** to their collection log | **${logPercentage}** ${rankIcon}`
    );
  } else {
    msgMap.set(
      { ID: COLLECTION, URL },
      `**${playerName}** has added a new item to their collection log: **${validatedItemName}** | **${logPercentage}** ${rankIcon}`
    );
  }

  return msgMap;
}
export default collectionLogHandler;

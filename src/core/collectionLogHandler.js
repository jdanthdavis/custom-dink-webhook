import { customBossNames, formatAsPercentage } from './helperFunctions';
import { RANK_MAP, COLLECTION } from '../constants';

/**
 * @typedef {Object} CollectionLogExtra
 * @property {number} totalEntries
 * @property {number} completedEntries
 * @property {string} itemName
 * @property {string} [currentRank]
 * @property {string} [justCompletedRank]
 */

/**
 * Formats a rank string to Title Case, e.g. "RUNE" -> "Rune".
 * @param {string} rank
 * @returns {string}
 */
export function formatRank(rank) {
  return rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase();
}

/**
 * Upserts a player's collection log snapshot for the weekly recap
 * (snapshot, not a delta; COALESCE-guarded).
 * @param {*} WEEKLY_RECAP_DB
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
 * Records the collection log snapshot and builds the notification message.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {string} playerName
 * @param {CollectionLogExtra} extra
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>}
 */
async function collectionLogHandler(
  msgMap,
  playerName,
  extra,
  WEEKLY_RECAP_DB,
  URL
) {
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

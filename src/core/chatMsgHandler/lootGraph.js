import { CHAT_MESSAGE_TYPES } from '../../constants';
import { formatValue, formatLeaderboardTable } from '../helperFunctions';

/**
 * Fetches every tracked player's loot totals, sorted by total value descending.
 * Reused by both the `!Fetchloot` leaderboard and the weekly recap.
 * @param {*} LOOT_DB - D1 database binding for loot value tracking
 * @returns {Promise<Array<{ playername: string, total_value?: number, last_item_name?: string, last_item_value?: number, last_source?: string, last_drop_date?: string }>|null>}
 */
export async function getAllLoot(LOOT_DB) {
  try {
    const { results } = await LOOT_DB.prepare(
      'SELECT playername, total_value, last_item_name, last_item_value, last_source, last_drop_date FROM loot_totals'
    ).all();
    return results?.sort(
      (a, b) => (Number(b.total_value) || 0) - (Number(a.total_value) || 0)
    );
  } catch (error) {
    console.log('getAllLoot error:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Fetches and formats the full loot leaderboard as a titled table, or null if
 * no player has any tracked loot. Reused by both `!Fetchloot` and the weekly
 * recap, so both surfaces always agree.
 * @param {*} LOOT_DB - D1 database binding for loot value tracking
 * @returns {Promise<string|null>}
 */
export async function getLootLeaderboard(LOOT_DB) {
  const rows = await getAllLoot(LOOT_DB);
  if (!rows || rows.length === 0) return null;

  const headers = ['Name', 'Total Value', 'Last Item', 'Source'];
  const tableRows = rows.map((row) => [
    row.playername,
    formatValue(Number(row.total_value) || 0, true),
    row.last_item_name ?? '-',
    row.last_source ?? '-',
  ]);
  return formatLeaderboardTable('Loot Board', headers, tableRows);
}

/**
 * Handles the "!Fetchloot" chat command, reporting either a single player's
 * lifetime loot value or a leaderboard of all tracked players.
 * @param {string} message - The raw chat message text
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} URL - The associated URL
 * @param {*} LOOT_DB - D1 database binding for loot value tracking
 */
export async function lootGraph(message, msgMap, URL, LOOT_DB) {
  const commandPrefix = '!Fetchloot';

  // Extract everything after "!Fetchloot" (case insensitive)
  let singlePlayerName = null;

  if (message.toLowerCase().startsWith(commandPrefix.toLowerCase())) {
    singlePlayerName = message.slice(commandPrefix.length).trim();
  }

  if (singlePlayerName === '') {
    singlePlayerName = null;
  }

  /** @param {string} playername */
  async function getPlayerLoot(playername) {
    try {
      return await LOOT_DB.prepare(
        'SELECT playername, total_value, last_item_name, last_item_value, last_source, last_drop_date FROM loot_totals WHERE playername = ?'
      )
        .bind(playername)
        .first();
    } catch (error) {
      console.log('getPlayerLoot error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  if (singlePlayerName) {
    const row = await getPlayerLoot(singlePlayerName);
    if (!row) {
      console.log('Player not found or no data');
      return;
    }

    const totalValue = formatValue(Number(row.total_value) || 0, true);
    const lastItemName = row.last_item_name ?? '-';
    const lastItemValue = row.last_item_value != null
      ? formatValue(Number(row.last_item_value), true)
      : '-';
    const lastSource = row.last_source ?? '-';
    const lastDropDate = row.last_drop_date ?? '-';

    const formatted = `**${row.playername}** -> Total Loot Value: **${totalValue}** -> Most Recent: **${lastItemName}** (**${lastItemValue}**) from **${lastSource}** on **${lastDropDate}**`;
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_LOOT, URL }, formatted);
  } else {
    const formatted = await getLootLeaderboard(LOOT_DB);
    if (!formatted) {
      console.log('No players data found.');
      return;
    }

    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_LOOT, URL }, formatted);
  }
}

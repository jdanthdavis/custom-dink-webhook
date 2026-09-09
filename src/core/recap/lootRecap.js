import { formatValue, formatLeaderboardTable } from '../helperFunctions';

/**
 * Fetches every tracked player's loot totals, sorted by total value descending.
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
    console.log(
      'getAllLoot error:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Fetches and formats the full loot leaderboard as a titled table, or null if
 * no player has any tracked loot. Recap-only by design - there's no chat
 * command exposing this on demand. Unlike pets/TCG, this reports current
 * standings (a lifetime total), not a change since the last recap.
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

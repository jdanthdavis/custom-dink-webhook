import { CHAT_MESSAGE_TYPES } from '../../constants';
import { formatValue } from '../helperFunctions';

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

  async function getAllLoot() {
    try {
      const { results } = await LOOT_DB.prepare(
        'SELECT playername, total_value, last_item_name, last_item_value, last_source, last_drop_date FROM loot_totals'
      ).all();
      return results;
    } catch (error) {
      console.log('getAllLoot error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /** @param {Array<{ playername: string, total_value?: number, last_item_name?: string, last_source?: string, last_drop_date?: string }>} rows */
  function formatPlayersList(rows) {
    // Sort by total_value descending
    const sorted = [...rows].sort(
      (a, b) => (Number(b.total_value) || 0) - (Number(a.total_value) || 0)
    );

    const headers = ['Name', 'Total Value', 'Last Item', 'Source'];

    const tableRows = sorted.map((row) => [
      row.playername,
      formatValue(Number(row.total_value) || 0, true),
      row.last_item_name ?? '-',
      row.last_source ?? '-',
    ]);

    // Auto-size each column to fit its header and the longest value below it
    const widths = headers.map((header, col) =>
      Math.max(header.length, ...tableRows.map((row) => row[col].length))
    );

    /** @param {string[]} cells */
    const padRow = (cells) =>
      cells.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd();

    const headerLine = padRow(headers);
    const separatorLine = widths.map((w) => '-'.repeat(w)).join('  ').trimEnd();
    const rowLines = tableRows.map((row) => padRow(row));

    const table = [headerLine, separatorLine, ...rowLines].join('\n');

    return `**Loot Board**\n\`\`\`\n${table}\n\`\`\``;
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
    const rows = await getAllLoot();
    if (!rows || rows.length === 0) {
      console.log('No players data found.');
      return;
    }

    const formatted = formatPlayersList(rows);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.FETCH_LOOT, URL }, formatted);
  }
}

import {
  customBossNames,
  formatValue,
  formatLists,
  formatDate,
} from './helperFunctions';
import { LOOT } from '../constants';

const LOOT_THRESHOLD = 1_000_000;

/**
 * Upserts a player's lifetime loot total and weekly-top drop (see lootRecap.js
 * for the weekly reset).
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} playername
 * @param {Array<{ name: string, quantity: number, priceEach: number, totalValue: number }>} qualifyingItems
 * @param {string} source
 */
async function recordLoot(
  WEEKLY_RECAP_DB,
  playername,
  qualifyingItems,
  source
) {
  const totalQualifyingValue = qualifyingItems.reduce(
    (sum, item) => sum + item.totalValue,
    0
  );
  const biggestItem = qualifyingItems.reduce((max, item) =>
    item.totalValue > max.totalValue ? item : max
  );

  try {
    await WEEKLY_RECAP_DB.prepare(
      `INSERT INTO loot_totals (playername, total_value, last_item_name, last_item_value, last_source, last_drop_date, weekly_top_item_name, weekly_top_item_value)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?3, ?4)
       ON CONFLICT(playername) DO UPDATE SET
         total_value = total_value + ?2,
         last_item_name = ?3,
         last_item_value = ?4,
         last_source = ?5,
         last_drop_date = ?6,
         weekly_top_item_name = CASE
           WHEN weekly_top_item_value IS NULL OR ?4 > weekly_top_item_value THEN ?3
           ELSE weekly_top_item_name
         END,
         weekly_top_item_value = CASE
           WHEN weekly_top_item_value IS NULL OR ?4 > weekly_top_item_value THEN ?4
           ELSE weekly_top_item_value
         END`
    )
      .bind(
        playername,
        totalQualifyingValue,
        biggestItem.name,
        biggestItem.totalValue,
        source,
        formatDate()
      )
      .run();
  } catch (error) {
    console.log('recordLoot ', error instanceof Error ? error.message : error);
  }
}

/**
 * Formats qualifying loot drops into a message and records them for the recap.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {Array<{ id?: number, quantity: number, priceEach: number, name: string, criteria?: string[], rarity?: string|null }>} items
 * @param {string} playerName
 * @param {string} source
 * @param {*} WEEKLY_RECAP_DB
 * @param {string} URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>|undefined>}
 */
async function lootHandler(
  msgMap,
  items,
  playerName,
  source,
  WEEKLY_RECAP_DB,
  URL
) {
  const validatedSource = customBossNames(source);

  const qualifyingItems = items
    .map((item) => ({ ...item, totalValue: item.priceEach * item.quantity }))
    .filter((item) => item.totalValue > LOOT_THRESHOLD);

  if (!qualifyingItems.length) return;

  const boldedItems = qualifyingItems.map(
    (item) =>
      `**${item.quantity}x ${item.name} ${formatValue(item.totalValue)}**`
  );

  const msg = `**${playerName}** has received ${formatLists(
    boldedItems
  )} from **${validatedSource}!**`;

  msgMap.set({ ID: LOOT, URL }, msg);

  await recordLoot(
    WEEKLY_RECAP_DB,
    playerName,
    qualifyingItems,
    validatedSource
  );

  return msgMap;
}

export default lootHandler;

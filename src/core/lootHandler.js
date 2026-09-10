import {
  customBossNames,
  formatValue,
  formatLists,
  formatDate,
} from './helperFunctions';
import { LOOT } from '../constants';

const LOOT_THRESHOLD = 1_000_000;

/**
 * Upserts a player's lifetime loot value total, recording the highest-value
 * qualifying item from this batch as their most recent notable drop, and
 * updating their weekly-top drop if this batch's biggest item beats it (or
 * nothing's been recorded yet this week - weekly_top_item_* is reset to NULL
 * by the recap after each run, see lootRecap.js).
 * @param {*} LOOT_DB - D1 database binding for loot value tracking
 * @param {string} playername
 * @param {Array<{ name: string, quantity: number, priceEach: number, totalValue: number }>} qualifyingItems
 * @param {string} source
 */
async function recordLoot(LOOT_DB, playername, qualifyingItems, source) {
  const totalQualifyingValue = qualifyingItems.reduce(
    (sum, item) => sum + item.totalValue,
    0
  );
  const biggestItem = qualifyingItems.reduce((max, item) =>
    item.totalValue > max.totalValue ? item : max
  );

  try {
    await LOOT_DB.prepare(
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
 * Formats loot drops into a message, updates the provided message map, and
 * records the qualifying value against the player's lifetime loot total.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update with the formatted loot message.
 * @param {Array<{ id?: number, quantity: number, priceEach: number, name: string, criteria?: string[], rarity?: string|null }>} items - The items obtained (e.g., [{"id": 1234,"quantity": 1,"priceEach": 100000000,"name": "Whip","criteria": ["VALUE"],"rarity": null}])
 * @param {string} playerName - The player's name who received the loot.
 * @param {string} source - The source from which the loot was obtained (e.g., "Man").
 * @param {*} LOOT_DB - D1 database binding for loot value tracking
 * @param {string} URL - The associated URL for the loot event.
 * @returns {Promise<Map<{ ID: string, URL: string }, string>|undefined>} The updated message map with the formatted loot message, or undefined if no item cleared the value threshold.
 */
async function lootHandler(msgMap, items, playerName, source, LOOT_DB, URL) {
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

  await recordLoot(LOOT_DB, playerName, qualifyingItems, validatedSource);

  return msgMap;
}

export default lootHandler;

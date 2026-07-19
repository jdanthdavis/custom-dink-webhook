import { grumblerCheck, formatValue, formatLists } from './helperFunctions';
import { LOOT } from '../constants';

const LOOT_THRESHOLD = 1_000_000;

/**
 * Formats loot drops into a message and updates the provided message map.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update with the formatted loot message.
 * @param {Array<{ id?: number, quantity: number, priceEach: number, name: string, criteria?: string[], rarity?: string|null }>} items - The items obtained (e.g., [{"id": 1234,"quantity": 1,"priceEach": 100000000,"name": "Whip","criteria": ["VALUE"],"rarity": null}])
 * @param {string} playerName - The player's name who received the loot.
 * @param {string} source - The source from which the loot was obtained (e.g., "Man").
 * @param {string} URL - The associated URL for the loot event.
 * @returns {Map<{ ID: string, URL: string }, string>|undefined} The updated message map with the formatted loot message, or undefined if no item cleared the value threshold.
 */
function lootHandler(msgMap, items, playerName, source, URL) {
  const validatedSource = grumblerCheck(source);

  /** @type {string[]} */
  const emptyFilteredItems = [];
  const filteredItems = items.reduce((acc, item) => {
    const totalValue = item.priceEach * item.quantity;
    if (totalValue > LOOT_THRESHOLD) {
      acc.push(`${item.quantity}x ${item.name} ${formatValue(totalValue)}`);
    }
    return acc;
  }, emptyFilteredItems);

  const boldedItems = filteredItems.map((item) => `**${item}**`);

  const msg = `**${playerName}** has received ${formatLists(
    boldedItems
  )} from **${validatedSource}!**`;

  if (!filteredItems.length) return;

  msgMap.set({ ID: LOOT, URL }, msg);

  return msgMap;
}

export default lootHandler;

import { grumblerCheck } from './helperFunctions';
import { formatValue } from './helperFunctions';
import { LOOT } from '../constants';

/**
 * Formats loot drops into a message and updates the provided message map.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update with the formatted loot message.
 * @param {string} items - An array of the items.
 * @param {string} playerName - The player's name who received the loot.
 * @param {string} source - The source from which the loot was obtained (e.g., "Man").
 * @param {string} URL - The associated URL for the loot event.
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map with the formatted loot message.
 */
function lootHandler(msgMap, items, playerName, source, URL) {
  const validatedSource = grumblerCheck(source);
  const outputString = `**${playerName}** has received**${items.map(
    (item) => ` ${item.quantity}x ${item.name} ${formatValue(item.priceEach)}`
  )}** from **${validatedSource}!**`;

  msgMap.set({ ID: LOOT, URL }, outputString);

  return msgMap;
}

export default lootHandler;

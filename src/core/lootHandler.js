import { grumblerCheck } from './helperFunctions';
import { formatValue } from './helperFunctions';
import { LOOT } from '../constants';

const LOOT_THRESHOLD = 1_000_000;

/**
 * Formats loot drops into a message and updates the provided message map.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update with the formatted loot message.
 * @param {string} items - An array of the items obtained (e.g., [{"id": 1234,"quantity": 1,"priceEach": 100000000,"name": "Whip","criteria": ["VALUE"],"rarity": null}])
 * @param {string} playerName - The player's name who received the loot.
 * @param {string} source - The source from which the loot was obtained (e.g., "Man").
 * @param {string} URL - The associated URL for the loot event.
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map with the formatted loot message.
 */
function lootHandler(msgMap, items, playerName, source, URL) {
  const validatedSource = grumblerCheck(source);

  const filteredItems = items.reduce((acc, item) => {
    const totalValue = item.priceEach * item.quantity;
    if (totalValue > LOOT_THRESHOLD) {
      acc.push(`${item.quantity}x ${item.name} ${formatValue(totalValue)}`);
    }
    return acc;
  }, []);

  if (!msg.length) return;

  const msg = `**${playerName}** has received** ${filteredItems.join(
    ','
  )}** from **${validatedSource}!**`;

  msgMap.set({ ID: LOOT, URL }, msg);

  return msgMap;
}

export default lootHandler;

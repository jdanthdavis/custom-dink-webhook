import { grumblerCheck, formatPrice } from './helperFunctions';
/**
 * Formats drops
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function lootHandler(msgMap, content, playerName, source, URL) {
  // Extract item and price using regex
  const lootItemMatch = content.match(/(\d+)x ([\w\s\(\)]+) \(([\d\.\w]+)\)/);

  if (!lootItemMatch) {
    return 'Error: Invalid loot format'; // Handle case if the format doesn't match
  }

  const quantity = lootItemMatch[1]; // "1"
  const item = lootItemMatch[2]; // "Bones"
  const price = lootItemMatch[3]; // "70"

  // Format the output as required
  const outputString = `**${playerName}** has received **${quantity}x ${item} (${price})** from **${source}**`;

  console.log('OUT: ', outputString);
  console.log('URL: ', URL);

  msgMap.set({ ID: 'LOOT', URL }, outputString);
  return msgMap;
}

export default lootHandler;

import { grumblerCheck } from './helperFunctions';

/**
 * Formats loot drops into a message and updates the provided message map.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update with the formatted loot message.
 * @param {string} content - The content string containing loot information (e.g., "1 x Bones (70)").
 * @param {string} playerName - The player's name who received the loot.
 * @param {string} source - The source from which the loot was obtained (e.g., "Man").
 * @param {string} URL - The associated URL for the loot event.
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map with the formatted loot message.
 */
function lootHandler(msgMap, content, playerName, source, URL) {
  const lootItemMatch = content.match(
    /(\d+)\s*x\s*([[\w\s\(\)]+)\s*\(([\d\.\w]+)\)/
  );

  if (!lootItemMatch) {
    console.log('Error: Invalid loot format - ', content);
  }

  const quantity = lootItemMatch[1];
  const item = lootItemMatch[2];
  const price = lootItemMatch[3];

  const outputString = `**${playerName}** has received **${quantity}x ${item}(${price})** from **${grumblerCheck(
    source
  )}!**`;

  msgMap.set({ ID: 'LOOT', URL }, outputString);

  return msgMap;
}

export default lootHandler;

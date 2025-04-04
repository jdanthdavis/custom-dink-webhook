import * as Constants from './Constants';

/**
 * Picks a custom messages when a player catches a big fish.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} message - The in-game message
 * @param {string} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
export function BigFishHandler(msgMap, playerName, message, URL) {
  const fishMatch = message.match(Constants.CHAT_MESSAGE_TYPES.BIG_FISH);
  if (!fishMatch) return;

  const fish = fishMatch[1];
  const randomIndex = Math.floor(Math.random() * Constants.bigFishArr.length);
  const msg = Constants.bigFishArr[randomIndex]
    .replace(/\[FISH\]/g, `**${fish}**`)
    .replace(/\[PLAYER\]/g, `**${playerName}**`);

  msgMap.set({ ID: Constants.CHAT_MESSAGE_TYPES.BIG_FISH, URL }, msg);

  return msgMap;
}

import { CHAT_MESSAGE_TYPES, CHAT_REGEX, bigFishArr } from '../../constants';

/**
 * Handles "You catch an enormous ...!" chat messages with a randomized notification.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 */
export function bigFishHandler(message, playerName, msgMap, URL) {
  const fishMatch = message.match(CHAT_REGEX.BIG_FISH);
  if (!fishMatch) return;

  const fish = fishMatch[1];
  const randomIndex = Math.floor(Math.random() * bigFishArr.length);
  const msg = bigFishArr[randomIndex]
    .replace(/\[FISH\]/g, `**${fish}**`)
    .replace(/\[PLAYER\]/g, `**${playerName}**`);

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.BIG_FISH, URL }, msg);
}

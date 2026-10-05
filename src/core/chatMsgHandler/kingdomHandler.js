import { CHAT_REGEX, CHAT_MESSAGE_TYPES } from '../../constants';

/**
 * Handles the Kingdom of Miscellania approval/coffer chat message. This is a
 * private game message ("Your Kingdom...") so it's always about the local
 * player.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 */
export function kingdomHandler(message, playerName, msgMap, URL) {
  const match = message.match(CHAT_REGEX.KINGDOM_TEXT);

  if (!match) {
    return;
  }

  const [, approval, coffer] = match;
  const msg = `**${playerName}**'s Kingdom of Miscellania is at **${approval}%** approval with **${coffer}** coins in the coffer.`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.KINGDOM, URL }, msg);
}

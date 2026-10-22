import { CHAT_REGEX, CHAT_MESSAGE_TYPES } from '../../constants';

/**
 * Handles Fractured Archive "Total completion time" chat messages. Only a
 * message ending in "(new personal best)" is a new personal best.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 */
export function fracturedArchivePbHandler(message, playerName, msgMap, URL) {
  const match = message?.match(CHAT_REGEX.FRACTURED_ARCHIVE_PB);

  if (!match) {
    return;
  }

  const time = match[1];
  const msg = `**${playerName}** has achieved a new **Fractured Archive** personal best of **${time}!**`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.FRACTURED_ARCHIVE_PB, URL }, msg);
}

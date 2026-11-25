import { CHAT_REGEX, CHAT_MESSAGE_TYPES } from '../../constants';

/**
 * Handles Prison of Ræun "Lap duration" personal best chat messages.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 */
export function prisonOfRaeunHandler(message, playerName, msgMap, URL) {
  const match = message.match(CHAT_REGEX.PRISON_OF_RAEUN_TIME_TEXT);

  if (!match) {
    return;
  }

  const time = match[1];
  const msg = `**${playerName}** has achieved a new **Prison of Ræun** personal best of **${time}!**`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.PRISON_OF_RAEUN_PB, URL }, msg);
}

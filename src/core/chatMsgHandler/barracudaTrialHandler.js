import { CHAT_REGEX, CHAT_MESSAGE_TYPES } from '../../constants';

/**
 * Handles Barracuda Trial "personal best" chat messages. Only formats the
 * broadcast when the achiever named in it is the reporting player.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 */
export function barracudaTrialHandler(message, playerName, msgMap, URL) {
  const match = message.match(CHAT_REGEX.BARRACUDA_TRIAL_TIME_TEXT);

  if (!match || match[1] !== playerName) {
    return;
  }

  const [, , trial, level, time] = match;
  const msg = `**${playerName}** has achieved a new **${trial} ${level}** personal best of **${time}!**`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.BARRACUDA_TRIAL_PB, URL }, msg);
}

import { CHAT_REGEX, CHAT_MESSAGE_TYPES } from '../../constants';

/**
 * Handles Barracuda Trial "personal best" chat messages. Whether this
 * broadcast is actually from a tracked player is already gated upstream in
 * chatHandler (via getChatBroadcastAchiever), so this just formats it.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 */
export function barracudaTrialHandler(message, playerName, msgMap, URL) {
  const match = message.match(CHAT_REGEX.BARRACUDA_TRIAL_TIME_TEXT);

  if (!match) {
    return;
  }

  const [, , trial, level, time] = match;
  const msg = `**${playerName}** has achieved a new **${trial} ${level}** personal best of **${time}!**`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.BARRACUDA_TRIAL_PB, URL }, msg);
}

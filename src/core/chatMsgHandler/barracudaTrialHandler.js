import { CHAT_REGEX, CHAT_MESSAGE_TYPES, theBoys } from '../../constants';

/**
 * Handles Barracuda Trial "personal best" chat messages. These broadcast in clan
 * chat, so any tracked player online can relay a clanmate's PB - the message's own
 * leading name (the actual achiever) is checked against theBoys and used to drop
 * anything not from a tracked player, regardless of whose client relayed it.
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

  const [, achiever, trial, level, time] = match;

  if (!theBoys.includes(achiever.toUpperCase())) {
    return;
  }

  const msg = `**${playerName}** has achieved a new **${trial} ${level}** personal best of **${time}!**`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.BARRACUDA_TRIAL_PB, URL }, msg);
}

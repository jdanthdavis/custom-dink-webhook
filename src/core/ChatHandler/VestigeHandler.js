import * as Constants from './constants';

/**
 * Handles when a player gets an untradable vestige drop.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {string} playerName
 * @param {string} message
 * @param {string} URL
 * @returns
 */
export function VestigeHandler(msgMap, playerName, message, URL) {
  const match = message?.match(Constants.CHAT_REGEX.VESTIGE_TEXT);

  if (!match) return;

  const vestigeType = match[1];
  const bossName = Constants.VESTIGE_MAP[vestigeType];
  const msg = `**${playerName}** has received **x1 ${vestigeType} vestige (5M)** from **${bossName}!**`;

  msgMap.set({ ID: Constants.CHAT_MESSAGE_TYPES.VESTIGE_DROP, URL }, msg);
}

import * as Constants from '../../constants';

export function vestigeHandler(message, playerName, msgMap, URL) {
  const match = message?.match(Constants.CHAT_REGEX.VESTIGE_TEXT);

  if (!match) return;

  const vestigeType = match[1];
  const bossName = Constants.VESTIGE_MAP[vestigeType];
  const msg = `**${playerName}** has received **x1 ${vestigeType} vestige (5M)** from **${bossName}!**`;

  msgMap.set({ ID: Constants.CHAT_MESSAGE_TYPES.VESTIGE_DROP, URL }, msg);
}

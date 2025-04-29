import { CHAT_REGEX, CHAT_MESSAGE_TYPES, VESTIGE_MAP } from '../../constants';

export function vestigeHandler(message, playerName, msgMap, URL) {
  const match = message?.match(CHAT_REGEX.VESTIGE_TEXT);

  if (!match) return;

  const vestigeType = match[1];
  const bossName = VESTIGE_MAP[vestigeType];
  const msg = `**${playerName}** has received **x1 ${vestigeType} vestige (5M)** from **${bossName}!**`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.VESTIGE_DROP, URL }, msg);
}

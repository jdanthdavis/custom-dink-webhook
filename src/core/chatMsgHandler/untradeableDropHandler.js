import { CHAT_MESSAGE_TYPES, CHAT_REGEX, ITEM_BOSS_MAP } from '../../constants';

/**
 * Handles untradeable-drop chat messages (vestiges, ToB kits, and other
 * untradeable items), mapping the item to its source boss.
 * @param {string} message - The raw chat message text
 * @param {string} playerName - The player's name
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} URL - The associated URL
 */
export function untradeableDropHandler(message, playerName, msgMap, URL) {
  const vestigeMatch = message?.match(CHAT_REGEX.VESTIGE_TEXT);
  const untradeableMatch = message?.match(CHAT_REGEX.UNTRADEABLE_TEXT);
  const tobKitMatch = message?.match(CHAT_REGEX.TOB_KITS);
  const maggotEggMatch = message?.match(CHAT_REGEX.MAGGOT_EGG);

  if (!vestigeMatch && !untradeableMatch && !tobKitMatch && !maggotEggMatch)
    return;

  /** @param {string} message */
  const getBossName = (message) => {
    for (const item of /** @type {(keyof typeof ITEM_BOSS_MAP)[]} */ (
      Object.keys(ITEM_BOSS_MAP)
    )) {
      if (message.includes(item)) {
        return ITEM_BOSS_MAP[item];
      }
    }
    console.log(`Error: Missing boss for message: ${message}`);
    return null;
  };
  const bossName = getBossName(message);

  /** @param {string} playerName @param {string} [item] @param {'vestige'} [type] */
  const buildMessage = (playerName, item, type) =>
    type === 'vestige'
      ? `**${playerName}** has received **x1 ${item} vestige (5M)** from **${bossName}!**`
      : `**${playerName}** has received **x1 ${item}** from **${bossName}!**`;

  // Order matters: UNTRADEABLE_TEXT is a catch-all that also matches the more
  // specific patterns above it, so it must be checked last.
  /** @type {{ match: RegExpMatchArray | null | undefined, id: string, kind?: 'vestige' }[]} */
  const matchers = [
    { match: vestigeMatch, id: CHAT_MESSAGE_TYPES.VESTIGE_DROP, kind: 'vestige' },
    { match: tobKitMatch, id: CHAT_MESSAGE_TYPES.TOB_KIT },
    { match: maggotEggMatch, id: CHAT_MESSAGE_TYPES.MAGGOT_EGG },
    { match: untradeableMatch, id: CHAT_MESSAGE_TYPES.UNTRADEABLE_DROP },
  ];

  for (const { match, id, kind } of matchers) {
    if (match) {
      const msg = buildMessage(playerName, match[1], kind);
      return msgMap.set({ ID: id, URL }, msg);
    }
  }
}

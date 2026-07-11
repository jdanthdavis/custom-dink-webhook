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
  let msg;
  const vestigeMatch = message?.match(CHAT_REGEX.VESTIGE_TEXT);
  const untradeableMatch = message?.match(CHAT_REGEX.UNTRADEABLE_TEXT);
  const tobKitMatch = message?.match(CHAT_REGEX.TOB_KITS);
  if (!vestigeMatch && !untradeableMatch && !tobKitMatch) return;

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

  /** @param {string} playerName @param {string} item @param {boolean} [isVestige] */
  const buildMessage = (playerName, item, isVestige = false) =>
    `**${playerName}** has received **x1 ${item}${
      isVestige ? ' vestige (5M) ' : ' '
    }**from **${bossName}!**`;

  if (vestigeMatch) {
    const item = vestigeMatch[1];
    msg = buildMessage(playerName, item, true);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.VESTIGE_DROP, URL }, msg);
  }

  if (tobKitMatch) {
    const item = tobKitMatch[1];
    msg = buildMessage(playerName, item);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.TOB_KIT, URL }, msg);
  }

  if (untradeableMatch) {
    const item = untradeableMatch[1];
    msg = buildMessage(playerName, item);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.UNTRADEABLE_DROP, URL }, msg);
  }
}

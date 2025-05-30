import { CHAT_MESSAGE_TYPES, CHAT_REGEX, ITEM_BOSS_MAP } from '../../constants';

export function untradeableDropHandler(message, playerName, msgMap, URL) {
  //some code for cloudflare to find
  let msg;
  const vestigeMatch = message?.match(CHAT_REGEX.VESTIGE_TEXT);
  const untradeableMatch = message?.match(CHAT_REGEX.UNTRADEABLE_TEXT);
  const tobKitMatch = message?.match(CHAT_REGEX.TOB_KITS);
  if (!vestigeMatch && !untradeableMatch && !tobKitMatch) return;

  const getBossName = (message) => {
    for (const item in ITEM_BOSS_MAP) {
      if (message.includes(item)) {
        return ITEM_BOSS_MAP[item];
      }
    }
    console.log(`Error: Missing boss for message: ${message}`);
    return null;
  };
  const bossName = getBossName(message);

  const buildMessage = (playerName, item, isVestige = false) =>
    `**${playerName}** has received **x1 ${item}${
      isVestige ? ' vestige (5M)' : ''
    }** from **${bossName}!**`;

  if (vestigeMatch) {
    const item = vestigeMatch[1];
    msg = buildMessage(playerName, item, true);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.VESTIGE_DROP, URL }, msg);
  }

  if (tobKitMatch) {
    const item = tobKitMatch[1];
    msg = buildMessage(playerName, item);
    console.log(msg);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.TOB_KITS, URL }, msg);
  }

  if (untradeableMatch) {
    const item = untradeableMatch[1];
    msg = buildMessage(playerName, item);
    return msgMap.set({ ID: CHAT_MESSAGE_TYPES.UNTRADEABLE_DROP, URL }, msg);
  }
}

import {
  CHAT_REGEX,
  CHAT_MESSAGE_TYPES,
  THEATRE_OF_BLOOD_HM,
} from '../../constants';

export function tobKitHandler(message, playerName, msgMap, URL) {
  const kitMatch = message.match(CHAT_REGEX.TOB_KITS);
  if (!kitMatch) return;

  const item = kitMatch[1];
  const msg = `**${playerName}** has received **${item}** from **${THEATRE_OF_BLOOD_HM}!**`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.TOB_KIT, URL }, msg);
}

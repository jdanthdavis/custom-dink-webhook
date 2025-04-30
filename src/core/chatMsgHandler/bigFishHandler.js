import { CHAT_MESSAGE_TYPES, bigFishArr } from '../../constants';

export function bigFishHandler(message, playerName, msgMap, URL) {
  const fishMatch = message.match(CHAT_MESSAGE_TYPES.BIG_FISH);
  if (!fishMatch) return;

  const fish = fishMatch[1];
  const randomIndex = Math.floor(Math.random() * bigFishArr.length);
  const msg = bigFishArr[randomIndex]
    .replace(/\[FISH\]/g, `**${fish}**`)
    .replace(/\[PLAYER\]/g, `**${playerName}**`);

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.BIG_FISH, URL }, msg);
}

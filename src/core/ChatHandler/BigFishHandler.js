import * as Constants from './constants';

export function BigFishHandler(message, playerName, msgMap, URL) {
  const fishMatch = message.match(Constants.CHAT_MESSAGE_TYPES.BIG_FISH);
  if (!fishMatch) return;

  const fish = fishMatch[1];
  const randomIndex = Math.floor(Math.random() * Constants.bigFishArr.length);
  const msg = Constants.bigFishArr[randomIndex]
    .replace(/\[FISH\]/g, `**${fish}**`)
    .replace(/\[PLAYER\]/g, `**${playerName}**`);

  msgMap.set({ ID: Constants.CHAT_MESSAGE_TYPES.BIG_FISH, URL }, msg);
}

import { killCountMsgConstructor } from '../helperFunctions';
import killCountHandler from '../killCountHandler';

export function delveHandler(message, playerName, msgMap, PB_URL, KC_URL) {
  const delvePersonalBest = message?.match(
    /^(Delve level(?:(?:\:|\s)[^:]+)):\s*(\d{1,2}:\d{2}\.\d{2})/
  );

  if (!delvePersonalBest) {
    const personalBest = message?.split(/\s*:\s*/);
    const extra = {
      boss: 'Doom of Mokhaiotl',
      count: Number(personalBest[1]),
      gameMessage: message,
    };
    killCountHandler(msgMap, playerName, extra, KC_URL);
  }

  if (delvePersonalBest) {
    const floor = delvePersonalBest[1].trim();
    const time = delvePersonalBest[2];
    const msg = `**${playerName}** has defeated **Doom of Mokhaiotl (${floor})** with a new personal best of **${time}!**`;
    msgMap.set({ ID: 'DELVE_PB', PB_URL }, msg);
  }
}

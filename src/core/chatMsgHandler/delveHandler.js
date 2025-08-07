import killCountHandler from '../killCountHandler';

export function delveHandler(message, playerName, msgMap, KC_URL) {
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

  return msgMap;
}

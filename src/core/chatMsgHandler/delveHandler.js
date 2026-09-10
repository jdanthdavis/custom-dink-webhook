import killCountHandler from '../killCountHandler';

/**
 * Reports a Doom of Mokhaiotl kill count from "Deep delves" chat messages.
 * PB messages are ignored here (handled by personalBestHandler).
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} KC_URL
 * @returns {Map<{ ID: string, URL: string }, string>}
 */
export function delveHandler(message, playerName, msgMap, KC_URL) {
  const delvePersonalBest = message?.match(
    /^(Delve level(?:(?:\:|\s)[^:]+)):\s*(\d{1,2}:\d{2}\.\d{2})/
  );

  if (!delvePersonalBest) {
    const personalBest = message?.split(/\s*:\s*/);
    const count = Number(personalBest?.[1]);

    if (!Number.isFinite(count)) {
      console.log(`delveHandler: could not parse kill count from: ${message}`);
      return msgMap;
    }

    const extra = {
      boss: 'Doom of Mokhaiotl',
      count,
      gameMessage: message,
    };
    killCountHandler(msgMap, playerName, extra, KC_URL);
  }

  return msgMap;
}

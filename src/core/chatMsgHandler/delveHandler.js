import killCountHandler from '../killCountHandler';

/**
 * Handles "Deep delves" chat messages by reporting a Doom of Mokhaiotl kill
 * count. Delve-level personal-best messages are ignored here (handled by
 * personalBestHandler instead).
 * @param {string} message - The raw chat message text
 * @param {string} playerName - The player's name
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} KC_URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
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

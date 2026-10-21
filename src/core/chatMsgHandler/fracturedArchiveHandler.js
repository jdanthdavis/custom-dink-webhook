import killCountHandler from '../killCountHandler';
import { CHAT_REGEX } from '../../constants';

/**
 * Reports a Fractured Archive completion count from
 * "Your completed Fractured Archive count is:X" chat messages.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} KC_URL
 * @returns {Map<{ ID: string, URL: string }, string>}
 */
export function fracturedArchiveHandler(message, playerName, msgMap, KC_URL) {
  const match = message?.match(CHAT_REGEX.FRACTURED_ARCHIVE_KC);
  const count = Number(match?.[1]?.replace(/,/g, ''));

  if (!match || !Number.isFinite(count)) {
    console.log(
      `fracturedArchiveHandler: could not parse kill count from: ${message}`
    );
    return msgMap;
  }

  const extra = {
    boss: 'Fractured Archive',
    count,
    gameMessage: message,
  };
  killCountHandler(msgMap, playerName, extra, KC_URL);

  return msgMap;
}

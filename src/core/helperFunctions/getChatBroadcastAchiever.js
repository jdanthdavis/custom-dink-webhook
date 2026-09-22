import { CHAT_BROADCAST_ACHIEVER_PATTERNS } from '../../constants';

/**
 * Extracts the leading player name from a chat line that broadcasts a third
 * party's name (clan/public chat), or null if this message type never
 * embeds one (private game messages, always about the local player).
 * @param {string} message
 * @returns {string | null}
 */
function getChatBroadcastAchiever(message) {
  for (const pattern of CHAT_BROADCAST_ACHIEVER_PATTERNS) {
    const match = message?.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

export default getChatBroadcastAchiever;

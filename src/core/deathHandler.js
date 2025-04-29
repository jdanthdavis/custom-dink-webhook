import { formatPrice } from './helperFunctions';
import { DEATH_EMOJIS, DEATH } from '../constants';

/**
 * Handles a player's death event and updates the message map with a formatted message.
 *
 * If the death was caused by PvP, includes the killer's name and value lost.
 * Otherwise, logs a simple death message.
 *
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The map to update with the death message.
 * @param {string} playerName - The name of the player who died.
 * @param {{ isPvp?: boolean, valueLost?: number, killerName?: string }} extra - Additional death information.
 * @param {string} URL - The associated URL for the death event.
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map.
 */
function deathHandler(msgMap, playerName, extra, URL) {
  const { isPvp, valueLost, killerName } = extra;
  const formattedValueLost = formatPrice(valueLost);
  const randomIndex = Math.floor(Math.random() * DEATH_EMOJIS.length);
  const msg = isPvp
    ? `**${playerName}** has just been killed by **${killerName}** for **${formattedValueLost}** coins ${DEATH_EMOJIS[randomIndex]}`
    : `**${playerName}** has died ${DEATH_EMOJIS[randomIndex]}`;

  msgMap.set({ ID: DEATH, URL }, msg);

  return msgMap;
}

export default deathHandler;

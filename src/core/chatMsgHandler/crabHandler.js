import killCountHandler from '../killCountHandler';
import { GEMSTONE_CRAB } from '../../constants';

/**
 * Increments and reports the Gemstone Crab kill count for a player, then
 * delegates to killCountHandler to format the milestone notification.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} URL - The associated URL
 * @param {string} MONGO_MIDDLEWARE - The pet-tracking middleware base URL
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>} The updated message map
 */
export async function crabHandler(msgMap, playerName, URL, MONGO_MIDDLEWARE) {
  /** @param {string} playername */
  async function getTotalCrabKc(playername) {
    const url = `${MONGO_MIDDLEWARE}/get-crab?playername=${encodeURIComponent(
      playername
    )}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`/get-crab response status: ${res.status}`);
      }
      const json = await res.json();
      return json.player?.count != null ? Number(json.player.count) : null;
    } catch (error) {
      console.log(
        'getTotalCrabKc ',
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  /** @param {string} playername */
  async function incrementCrabKc(playername) {
    const url = `${MONGO_MIDDLEWARE}/increment-crab`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playername,
        }),
      });

      if (!res.ok)
        throw new Error(`Failed to increment crab count: ${res.status}`);
      const json = await res.json();
      console.log(
        `Crab count and recent pet successfully updated for ${json.playername}`
      );
    } catch (error) {
      console.log(
        'incrementCrabKc ',
        error instanceof Error ? error.message : error
      );
    }
  }

  return (async () => {
    await incrementCrabKc(playerName);
    const totalCrabCount = await getTotalCrabKc(playerName);
    const extra = {
      boss: GEMSTONE_CRAB,
      count: totalCrabCount,
      gameMessage: `Your Gemstone Crab kill count is: ${totalCrabCount}`,
    };
    killCountHandler(msgMap, playerName, extra, URL);
    return msgMap;
  })();
}

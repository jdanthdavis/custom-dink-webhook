import killCountHandler from '../killCountHandler';
import { GEMSTONE_CRAB } from '../../constants';

/**
 * Increments and reports the Gemstone Crab kill count for a player, then
 * delegates to killCountHandler to format the milestone notification.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} URL - The associated URL
 * @param {*} CRAB_DB - D1 database binding for Gemstone Crab kill count tracking
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>} The updated message map
 */
export async function crabHandler(msgMap, playerName, URL, CRAB_DB) {
  /** @param {string} playername */
  async function getTotalCrabKc(playername) {
    try {
      const row = await CRAB_DB.prepare(
        'SELECT count FROM crab_kc WHERE playername = ?'
      )
        .bind(playername)
        .first();
      return row?.count != null ? Number(row.count) : null;
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
    try {
      await CRAB_DB.prepare(
        `INSERT INTO crab_kc (playername, count) VALUES (?, 1)
         ON CONFLICT(playername) DO UPDATE SET count = count + 1`
      )
        .bind(playername)
        .run();
      console.log(
        `Crab count and recent pet successfully updated for ${playername}`
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

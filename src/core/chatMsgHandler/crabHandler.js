import killCountHandler from '../killCountHandler';
import { GEMSTONE_CRAB } from '../../constants';
import { getSingleColumn } from '../helperFunctions';

/**
 * Increments a player's Gemstone Crab kill count, then formats the milestone via killCountHandler.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} playerName
 * @param {string} URL
 * @param {*} CRAB_DB
 * @returns {Promise<Map<{ ID: string, URL: string }, string>>}
 */
export async function crabHandler(msgMap, playerName, URL, CRAB_DB) {
  /** @param {string} playername */
  async function getTotalCrabKc(playername) {
    return getSingleColumn(
      CRAB_DB,
      'crab_kc',
      'count',
      playername,
      'getTotalCrabKc'
    );
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

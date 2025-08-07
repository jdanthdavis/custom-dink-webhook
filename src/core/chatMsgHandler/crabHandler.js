import killCountHandler from '../killCountHandler';
import { GEMSTONE_CRAB } from '../../constants';

export async function crabHandler(msgMap, playerName, URL, MONGO_MIDDLEWARE) {
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
      console.log('getTotalCrabKc ', error.message);
      return null;
    }
  }

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
      console.log('incrementCrabKc ', error.message);
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

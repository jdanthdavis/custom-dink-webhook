import { EXTERNAL_PLUGIN } from "../constants";

function externalPluginHandler(msgMap, playerName, content, extra, URL) {
  const { cardName, rarityTier, newForCollection, foil} = extra;

  const msg = `**${playerName}** has received ${cardName}!**\n other data: ${rarityTier}, ${newForCollection}, ${foil}`;
  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, msg);

  return msgMap;
}

export default externalPluginHandler;

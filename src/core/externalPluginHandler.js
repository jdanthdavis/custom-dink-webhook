import { EXTERNAL_PLUGIN } from "../constants";

function externalPluginHandler(msgMap, playerName, content, metaData, URL) {
  const msg = `**${playerName}** has received ${metaData.cardName}!**`;
  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, msg);

  return msgMap;
}

export default externalPluginHandler;

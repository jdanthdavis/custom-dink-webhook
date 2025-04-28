/**
 * Check if the current killCount is divisible by 100.
 * If it's not but it is in specialKills then allow the notification.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {*} playerName - The player's name
 * @param {*} extra - Additional information
 * @param {*} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
function deathHandler(msgMap, playerName, extra, URL) {
  const { isPvp, valueLost, killerName } = extra;
  const emojiArray = [
    '<:giggle:1024050755017130016>',
    '<:bozo:1364661207960780800>',
    '<a:itswill_bozo:1365315318318366770>',
  ];
  const randomIndex = Math.floor(Math.random() * emojiArray.length);
  const msg = isPvp
    ? `${playerName} has just been killed by ${killerName} for ${valueLost} coins ${emojiArray[randomIndex]}`
    : `${playerName} has died ${emojiArray[randomIndex]}`;

  msgMap.set({ ID: 'DEATH', URL }, msg);

  return msgMap;
}

export default deathHandler;

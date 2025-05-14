/**
 * Temp handle Yama KC
 */
function tempYama(message, playerName, msgMap, URL) {
  const match = message.match(/Yama success count is: (\d+)/);
  if (!match || parseInt(match[1], 10) % 25 !== 0) return;
  let msg;

  if (match) {
    const kc = parseInt(match[1], 10);
    msg = `${playerName} has defeated Yama with a success count of **${kc}!**`;
  }

  return msgMap.set({ ID: 'TEMP_YAMA', URL }, msg);
}

export default tempYama;

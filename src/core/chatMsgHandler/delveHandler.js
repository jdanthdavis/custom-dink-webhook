export function delveHandler(message, playerName, msgMap, URL) {
  const match = message?.match(/^(.*?duration):\s*(\d{1,2}:\d{2}\.\d{2})/);
  const floor = match[1];
  const time = match[2];

  if (!match) return;

  const msg = `**${playerName}** has achieved a new **Doom of Mokhaiotl ${floor} personal best of **${time}!**`;

  if (msg) {
    msgMap.set({ ID: 'DELVE_PB', URL }, msg);
  }
}

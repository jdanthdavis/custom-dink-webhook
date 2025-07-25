export function delveHandler(message, playerName, msgMap, URL) {
  const match = message?.match(
    /^(Delve level(?:(?:\:|\s)[^:]+)):\s*(\d{1,2}:\d{2}\.\d{2})/
  );

  if (!match) return;

  const floor = match[1].trim();
  const time = match[2];

  const msg = `**${playerName}** has defeated **Doom of Mokhaiotl (${floor})** with a new personal best of **${time}!**`;

  msgMap.set({ ID: 'DELVE_PB', URL }, msg);
}

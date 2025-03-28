/**
 *
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} typeOfChat
 * @param {*} URL
 * @returns
 */
function ChatHandler(msgMap, playerName, extra, typeOfChat, URL) {
  const message = extra?.message;

  if (typeOfChat === 'BIG_FISH') {
    const fishMatch = message.match(/You catch an enormous (.+)!/);
    if (!fishMatch) return;

    const fish = fishMatch[1];
    const randomIndex = Math.floor(Math.random() * Constants.bigFishArr.length);
    const msg = Constants.bigFishArr[randomIndex]
      .replace(/\[FISH\]/g, `**${fish}**`)
      .replace(/\[PLAYER\]/g, `**${playerName}**`);

    msgMap.set({ ID: 'BIG_FISH', URL }, msg);
  } else if (typeOfChat === 'VESTIGE_DROP') {
    const vestigeMap = {
      Ultor: 'Vardorvis',
      Bellator: 'The Whisperer',
      Magus: 'Duke Sucellus',
      Venator: 'The Leviathan',
    };
    const VESTIGE_REGEX =
      /Untradeable drop: (Ultor|Bellator|Magus|Venator) vestige/;
    const match = message?.match(VESTIGE_REGEX);

    if (!match) return;

    const vestigeType = match[1];
    const bossName = vestigeMap[vestigeType];
    const msg = `**${playerName}** has received **x1 ${vestigeType} vestige (5M)** from **${bossName}!**`;

    msgMap.set({ ID: 'VESTIGE_DROP', URL }, msg);
  }
}

export default ChatHandler;

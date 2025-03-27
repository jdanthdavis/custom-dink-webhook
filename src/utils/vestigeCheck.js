/**
 * Since vestiges can't trigger loot notifications we check the clan chat.
 * @param {*} msgMap
 * @param {*} playerName
 * @param {*} extra
 * @param {*} URL
 * @returns
 */
function vestigeCheck(msgMap, playerName, extra, URL) {
  const { message } = extra || {};
  const vestigeMap = {
    Ultor: "Vardorvis",
    Bellator: "The Whisperer",
    Magus: "Duke Sucellus",
    Venator: "The Leviathan",
  };
  const VESTIGE_REGEX =
    /(.*?) received a drop: (Ultor|Bellator|Magus|Venator) vestige \(\d{1,3}(?:,\d{3})*\s*coins\)\./;
  const match = message?.match(VESTIGE_REGEX);

  if (!match) return;

  const vestigeType = match[2];
  const bossName = vestigeMap[vestigeType];
  const msg = `**${playerName}** has received **x1 ${vestigeType} vestige (5M)** from **${bossName}!**`;
  msgMap.set({ ID: "VESTIGE_DROP", URL }, msg);
  return msgMap;
}

export default vestigeCheck;

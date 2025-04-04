import * as Constants from './constants';

/**
 * Handles when a player gets a new PB in Hallowed Sepulchre.
 * @param {Map<{ ID: string, URL: string}, string>} msgMap
 * @param {string} playerName
 * @param {string} message
 * @param {string} URL
 * @returns
 */
export function SepulchreHandler(msgMap, playerName, message, URL) {
  const overallMatch = message.match(Constants.CHAT_REGEX.OVERALL_TIME_TEXT);
  const floorMatch = message.match(Constants.CHAT_REGEX.FLOOR_TIME_TEXT);

  let msg;
  if (overallMatch) {
    const time = overallMatch[1];
    // msg = `🔥 **${playerName}** set a new overall personal best: **${time}**!`;
    msg = `**${playerName}** has achieved a new **Hallowed Sepulchre (Overall)** personal best of: **${time}!**`;
  } else if (floorMatch) {
    const floorNumber = floorMatch[1];
    const time = floorMatch[2];
    msg = `**${playerName}** has achieved a new **Hallowed Sepulchre (Floor ${floorNumber})** personal best of: **${time}!**`;
  }

  if (msg) {
    msgMap.set(
      { ID: Constants.CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST, URL },
      msg
    );
  }
}

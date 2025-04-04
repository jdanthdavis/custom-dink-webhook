import * as Constants from './Constants';

/**
 * Handles when a player gets a new PB in Hallowed
 * @param {Map<{ ID: string, URL: string}, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} message - The in-game message
 * @param {string} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>} The updated message map
 */
export function SepulchreHandler(msgMap, playerName, message, URL) {
  const overallMatch = message.match(Constants.CHAT_REGEX.OVERALL_TIME_TEXT);
  const floorMatch = message.match(Constants.CHAT_REGEX.FLOOR_TIME_TEXT);

  let msg;
  if (overallMatch) {
    const time = overallMatch[1];
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

  return msgMap;
}

import * as Constants from '../../constants';

export function sepulchreHandler(message, playerName, msgMap, URL) {
  const overallMatch = message.match(Constants.CHAT_REGEX.OVERALL_TIME_TEXT);
  const floorMatch = message.match(Constants.CHAT_REGEX.FLOOR_TIME_TEXT);

  let msg;
  if (overallMatch) {
    const time = overallMatch[1];
    // msg = `🔥 **${playerName}** set a new overall personal best: **${time}**!`;
    msg = `**${playerName}** has achieved a new **Hallowed Sepulchre (Overall)** personal best of **${time}!**`;
  } else if (floorMatch) {
    const floorNumber = floorMatch[1];
    const time = floorMatch[2];
    msg = `**${playerName}** has achieved a new **Hallowed Sepulchre (Floor ${floorNumber})** personal best of **${time}!**`;
  }

  if (msg) {
    msgMap.set(
      { ID: Constants.CHAT_MESSAGE_TYPES.NEW_PERSONAL_BEST, URL },
      msg
    );
  }
}

import * as Constants from '../../constants';

export function sepulchreHandler(message, playerName, embeds) {
  const overallMatch = message.match(Constants.CHAT_REGEX.OVERALL_TIME_TEXT);
  const floorMatch = message.match(Constants.CHAT_REGEX.FLOOR_TIME_TEXT);
  const embed = embeds[0];
  embed.title = 'Personal Best';

  if (!overallMatch && !floorMatch) return;

  if (overallMatch) {
    const time = overallMatch[1];
    embed.description = `${playerName} has achieved a new [Hallowed Sepulchre](https://oldschool.runescape.wiki/w/Hallowed_Sepulchre) (Overall) personal best of ${time}`;
  } else if (floorMatch) {
    const floorNumber = floorMatch[1];
    const time = floorMatch[2];
    embed.description = `${playerName} has achieved a new [Hallowed Sepulchre](https://oldschool.runescape.wiki/w/Hallowed_Sepulchre) (Floor ${floorNumber}) personal best of ${time}`;
  }
  embed.thumbnail = {
    url: 'https://static.runelite.net/cache/item/icon/24711.png',
  };
}

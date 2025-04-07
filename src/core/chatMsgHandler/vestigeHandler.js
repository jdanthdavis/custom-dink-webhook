import * as Constants from '../../constants';

export function vestigeHandler(message, killCount, playerName, embeds, URL) {
  const match = message?.match(Constants.CHAT_REGEX.VESTIGE_TEXT);
  const embed = embeds[0];
  embed.title = 'Loot Drop';

  if (!match) return;

  const vestigeType = match[1];
  const currentVestige = Constants.VESTIGE_MAP[vestigeType];
  const bossName = currentVestige.boss;
  const bossLink = currentVestige.bossLink;
  const itemLink = currentVestige.itemLink;
  const vestigeThumbnail = currentVestige.thumbnail;
  console.log(bossName, bossLink, vestigeThumbnail);
  embed.description = `${playerName} has looted:\n\n 1 x [${vestigeType} vestige](${itemLink}) (5M)\nFrom: [${bossName}](${bossLink})`;
  embed.fields = [
    //TODO: Grab KC from message
    // {
    //   name: 'Kill Count',
    //   value: `\`\`\`${killCount}\`\`\``,
    //   inline: true,
    // },
    {
      name: 'Total Value',
      value: '```5M```',
      inline: true,
    },
  ];
  embed.thumbnail = { url: vestigeThumbnail };
}

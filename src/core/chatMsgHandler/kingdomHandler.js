import {
  CHAT_REGEX,
  CHAT_MESSAGE_TYPES,
  KINGDOM_APPROVAL_THRESHOLD,
} from '../../constants';

/**
 * Looks up a player's Discord user ID from the PLAYER_DISCORD_IDS secret - a
 * JSON object of RSN -> ID kept out of the repo. Keys match case-insensitively.
 * @param {string | undefined} discordIdsJson
 * @param {string} playerName
 * @returns {string | undefined}
 */
function getDiscordId(discordIdsJson, playerName) {
  if (!discordIdsJson) {
    return undefined;
  }

  try {
    const ids = JSON.parse(discordIdsJson);
    const key = Object.keys(ids).find(
      (name) => name.toUpperCase() === playerName.toUpperCase()
    );
    return key ? ids[key] : undefined;
  } catch (error) {
    console.log('kingdomHandler: could not parse PLAYER_DISCORD_IDS - ', error);
    return undefined;
  }
}

/**
 * Pings a player on Discord to remind them their Kingdom of Miscellania
 * approval is low. Only fires at or below KINGDOM_APPROVAL_THRESHOLD, and only
 * for players with an ID in the PLAYER_DISCORD_IDS secret. This is a private game message ("Your
 * Kingdom...") so it's always about the local player.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 * @param {string} [discordIdsJson] - the PLAYER_DISCORD_IDS secret
 */
export function kingdomHandler(
  message,
  playerName,
  msgMap,
  URL,
  discordIdsJson
) {
  const match = message.match(CHAT_REGEX.KINGDOM_TEXT);

  if (!match) {
    return;
  }

  const [, approval, coffer] = match;

  if (Number(approval) > KINGDOM_APPROVAL_THRESHOLD) {
    return;
  }

  const discordId = getDiscordId(discordIdsJson, playerName);

  // The reminder only makes sense as a ping, so skip players we can't ping.
  if (!discordId) {
    return;
  }

  const msg =
    `**<@${discordId}>** your **Kingdom of Miscellania** approval rating is too low!\n` +
    `-# Approval Rating: ${approval}% | Coffer: ${coffer} gp`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.KINGDOM, URL }, msg);
}

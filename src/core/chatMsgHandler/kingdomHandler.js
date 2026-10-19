import {
  CHAT_REGEX,
  CHAT_MESSAGE_TYPES,
  KINGDOM_APPROVAL_THRESHOLD,
  KINGDOM_COFFER_THRESHOLD,
  KINGDOM_REMINDER_COOLDOWN_SECONDS,
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
 * The game repeats the approval line on every login and world hop, so a ping
 * is limited to once per KINGDOM_REMINDER_COOLDOWN_SECONDS per player. Returns
 * true if one was already sent in that window; otherwise starts the cooldown.
 * Fails open (pings) if KV is unavailable - a duplicate beats a missed reminder.
 * @param {*} [cooldownKV]
 * @param {string} playerName
 * @returns {Promise<boolean>}
 */
async function isOnCooldown(cooldownKV, playerName) {
  if (!cooldownKV) {
    return false;
  }

  const key = `kingdom:${playerName.toUpperCase()}`;
  try {
    if (await cooldownKV.get(key)) {
      return true;
    }
    await cooldownKV.put(key, '1', {
      expirationTtl: KINGDOM_REMINDER_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.log(
      'kingdomHandler: cooldown KV failed - ',
      error instanceof Error ? error.message : error
    );
  }
  return false;
}

const COFFER_MULTIPLIERS = { K: 1e3, M: 1e6, B: 1e9 };

/**
 * Converts the in-game coffer text ("750K", "1.00M", "7,500,000") to coins.
 * @param {string} coffer
 * @returns {number} NaN if the text isn't a recognisable amount, which compares
 * false against any threshold (so an unparseable coffer never pings).
 */
function parseCoffer(coffer) {
  const match = coffer.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)([KMB])?$/);
  if (!match) {
    return NaN;
  }
  const [, digits, suffix] = match;
  return Math.round(Number(digits) * (COFFER_MULTIPLIERS[suffix] ?? 1));
}

/**
 * Pings a player on Discord to remind them their Kingdom of Miscellania
 * approval and/or coffer is low. Fires when approval is at or below
 * KINGDOM_APPROVAL_THRESHOLD or the coffer is below KINGDOM_COFFER_THRESHOLD,
 * and the message names whichever triggered it (or both). Only for players with
 * an ID in the PLAYER_DISCORD_IDS secret. This is a private game message ("Your
 * Kingdom...") so it's always about the local player.
 * @param {string} message
 * @param {string} playerName
 * @param {Map<{ ID: string, URL: string }, string>} msgMap
 * @param {string} URL
 * @param {string} [discordIdsJson] - the PLAYER_DISCORD_IDS secret
 * @param {*} [cooldownKV] - KV namespace used to rate-limit pings per player
 */
export async function kingdomHandler(
  message,
  playerName,
  msgMap,
  URL,
  discordIdsJson,
  cooldownKV
) {
  const match = message.match(CHAT_REGEX.KINGDOM_TEXT);

  if (!match) {
    return;
  }

  const [, approval, coffer] = match;

  const lowApproval = Number(approval) <= KINGDOM_APPROVAL_THRESHOLD;
  const lowCoffer = parseCoffer(coffer) < KINGDOM_COFFER_THRESHOLD;

  if (!lowApproval && !lowCoffer) {
    return;
  }

  const discordId = getDiscordId(discordIdsJson, playerName);

  // The reminder only makes sense as a ping, so skip players we can't ping.
  if (!discordId) {
    return;
  }

  if (await isOnCooldown(cooldownKV, playerName)) {
    return;
  }

  let problem = 'approval rating';
  if (lowApproval && lowCoffer) {
    problem = 'approval rating and coffer';
  } else if (lowCoffer) {
    problem = 'coffer';
  }

  const msg =
    `**<@${discordId}>** your **Kingdom of Miscellania** ${problem} is too low!\n` +
    `-# Approval Rating: ${approval}% | Coffer: ${coffer} gp`;

  msgMap.set({ ID: CHAT_MESSAGE_TYPES.KINGDOM, URL }, msg);
}

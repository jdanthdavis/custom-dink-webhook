import { EXTERNAL_PLUGIN } from "../constants";

const ACCEPTED_RARITIES = ["Mythic", "Godly", "Legendary"];
const FOIL_MILESTONE_INTERVAL = 50;
const CARD_MILESTONE_INTERVAL = 250;

/**
 * Extracts the total number of cards the game has from the content string and
 * pairs it with the "Total cards" count.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} A formatted string in the format "owned/total (percentage%)", or null if data is missing
 */
function extractCardProgress(content) {
  const gameTotalMatch = content?.match(
    /Unique cards: [\d ]+ \/ ([\d ]+) \([\d.]+%\)/,
  );
  if (!gameTotalMatch) return null;

  const totalCardsMatch = content?.match(/Total cards: ([\d ]+)/);
  if (!totalCardsMatch) return null;

  const gameTotal = Number(gameTotalMatch[1].replace(/ /g, ""));
  const totalCards = Number(totalCardsMatch[1].replace(/ /g, ""));

  const formattedOwned = totalCards.toLocaleString("en-US");
  const formattedTotal = gameTotal.toLocaleString("en-US");
  const percentage = ((totalCards / gameTotal) * 100).toFixed(1);

  return `${formattedOwned}/${formattedTotal} (${percentage}%)`;
}

/**
 * Extracts the "Opened packs" count from the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} The opened packs count formatted with thousands separators, or null if not found
 */
function extractOpenedPacks(content) {
  const match = content?.match(/Opened packs: ([\d ]+)/);
  return match
    ? Number(match[1].replace(/ /g, "")).toLocaleString("en-US")
    : null;
}

/**
 * Extracts the unique-foil-card progress (owned/total and percentage) from
 * the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} A formatted string in the format "owned/total (percentage%)", or null if data is missing
 */
function extractFoilCardProgress(content) {
  const match = content?.match(
    /Unique foil cards: ([\d ]+) \/ ([\d ]+) \(([\d.]+)%\)/,
  );
  if (!match) return null;

  const owned = Number(match[1].replace(/ /g, "")).toLocaleString("en-US");
  const total = Number(match[2].replace(/ /g, "")).toLocaleString("en-US");

  return `${owned}/${total} (${match[3]}%)`;
}

/**
 * Extracts the raw (unformatted) unique-foil-cards-owned count from the raw
 * content string, used to check for interval milestones.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null} The number of unique foil cards owned, or null if not found
 */
function extractFoilOwnedCount(content) {
  const match = content?.match(/Unique foil cards: ([\d ]+) \/ [\d ]+ \(/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the raw (unformatted) unique-cards-owned count from the raw
 * content string, used to check for interval milestones.
 * @param {string} content - The raw content from the TCG message
 * @returns {number|null} The number of unique cards owned, or null if not found
 */
function extractUniqueCardOwnedCount(content) {
  const match = content?.match(/Total cards: ([\d ]+)/);
  return match ? Number(match[1].replace(/ /g, "")) : null;
}

/**
 * Extracts the collection score and its percentage from the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {string|null} A formatted string in the format "score (percentage%)", or null if not found
 */
function extractCollectionScore(content) {
  const match = content?.match(/Collection score: ([\d ]+) \(([\d.]+)%\)/);
  if (!match) return null;

  const score = Number(match[1].replace(/ /g, "")).toLocaleString("en-US");
  return `${score} (${match[2]}%)`;
}

/**
 * Strips a trailing " (X%)" suffix from a formatted stat string, e.g.
 * "215/5,173 (4.2%)" -> "215/5,173". Leaves a string without that suffix
 * (like the "—" fallback) unchanged, and passes through null/undefined as-is.
 * @param {string|null|undefined} stat
 * @returns {string|null|undefined}
 */
function stripPercentage(stat) {
  return stat?.replace(/ \([\d.]+%\)$/, "") ?? stat;
}

/**
 * Checks whether an owned count lands exactly on a milestone interval, e.g.
 * isMilestone(100, 50) -> true.
 * @param {number|null} count - The owned count, or null if unknown
 * @param {number} interval - The milestone interval (e.g. every 50)
 * @returns {boolean}
 */
function isMilestone(count, interval) {
  return count !== null && count % interval === 0;
}

/**
 * Builds the pull-line message for a qualifying card pull. Uses a distinct
 * milestone message when the foil or unique-card owned count lands exactly
 * on its interval (FOIL_MILESTONE_INTERVAL / CARD_MILESTONE_INTERVAL),
 * otherwise falls back to the standard pull message.
 * @param {object} params
 * @param {string} params.playerName - The player's name
 * @param {string} params.rarityTier - The card's rarity tier
 * @param {string} params.cardLabel - The card name, optionally linked
 * @param {string|null} params.openedPacks - The formatted opened-packs count
 * @param {boolean} params.foil - Whether the pulled card is a foil
 * @param {number|null} params.foilOwnedCount - Raw unique-foil-cards-owned count
 * @param {number|null} params.uniqueCardOwnedCount - Raw unique-cards-owned count
 * @returns {string} The formatted pull-line message
 */
function buildPullLine({
  playerName,
  rarityTier,
  cardLabel,
  openedPacks,
  foil,
  foilOwnedCount,
  uniqueCardOwnedCount,
}) {
  const cardDescriptor = `a **${rarityTier} ${cardLabel}**`;
  const foilTag = " :sparkles: *foil* :sparkles:";
  const packSuffix = `on pack **${openedPacks}!**`;

  if (foil && isMilestone(foilOwnedCount, FOIL_MILESTONE_INTERVAL)) {
    return `**${playerName}** has pulled their **${foilOwnedCount}th** foil by pulling ${cardDescriptor}${foilTag} ${packSuffix}`;
  }

  if (!foil && isMilestone(uniqueCardOwnedCount, CARD_MILESTONE_INTERVAL)) {
    return `**${playerName}** has pulled their **${uniqueCardOwnedCount}th** card by pulling ${cardDescriptor} ${packSuffix}`;
  }

  return foil
    ? `**${playerName}** has pulled ${cardDescriptor}${foilTag} ${packSuffix}`
    : `**${playerName}** has pulled ${cardDescriptor} ${packSuffix}`;
}

/**
 * Creates a TCG pull notification message when a qualifying card is found.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} content - The raw content string containing card collection progress
 * @param {{ metadata: { cardName: string, rarityTier: string, newForCollection: boolean, foil: boolean, inspectUrl?: string } }} extra - Additional information about the card pull
 * @param {string} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>|undefined} The updated message map, or undefined if the pull doesn't qualify for a notification
 */
function tcgHandler(msgMap, playerName, content, extra, URL) {
  const { cardName, rarityTier, newForCollection, foil, inspectUrl } =
    extra.metadata;

  if (!newForCollection) return;
  if (!foil && !ACCEPTED_RARITIES.includes(rarityTier)) return;

  const cardProgress = extractCardProgress(content);
  const openedPacks = extractOpenedPacks(content);
  const collectionScore = extractCollectionScore(content) ?? "—";
  const foilProgress = extractFoilCardProgress(content) ?? "—";
  const foilOwnedCount = extractFoilOwnedCount(content);
  const uniqueCardOwnedCount = extractUniqueCardOwnedCount(content);
  const cardLabel = inspectUrl ? `[${cardName}](<${inspectUrl}>)` : cardName;

  const pullLine = buildPullLine({
    playerName,
    rarityTier,
    cardLabel,
    openedPacks,
    foil,
    foilOwnedCount,
    uniqueCardOwnedCount,
  });
  const statsLine = `-# Collection score: ${stripPercentage(collectionScore)} | Unique cards: ${stripPercentage(cardProgress)} | Unique Foils: ${stripPercentage(foilProgress)}`;
  const msg = `${pullLine}\n${statsLine}`;

  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, msg);

  return msgMap;
}

export default tcgHandler;

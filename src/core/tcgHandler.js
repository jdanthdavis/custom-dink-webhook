import { EXTERNAL_PLUGIN } from "../constants";

/** Embed colors keyed by rarity tier, with a fallback for anything else (e.g. a new tier not yet listed here). */
const RARITY_COLORS = {
  Godly: 0xf1c40f,
  Mythic: 0x9b59b6,
  Legendary: 0xe74c3c,
  Epic: 0x9b59b6,
  Rare: 0x3498db,
  Uncommon: 0x2ecc71,
  Common: 0xffffff,
};
const DEFAULT_RARITY_COLOR = 0x5865f2;

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
 * Creates a TCG pull notification embed when a qualifying card is found. This
 * is the only handler that sends an embed instead of plain message content -
 * the embed's own `url` field makes the title clickable without dropping a
 * raw link into the message text, which is what causes Discord to unfurl a
 * second, redundant embed.
 * @param {Map<{ ID: string, URL: string }, string|object>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} content - The raw content string containing card collection progress
 * @param {{ metadata: { cardName: string, rarityTier: string, newForCollection: boolean, foil: boolean, inspectUrl?: string, imageUrl?: string, sourcePlugin?: string } }} extra - Additional information about the card pull
 * @param {string} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string|object>|undefined} The updated message map, or undefined if the pull doesn't qualify for a notification
 */
function tcgHandler(msgMap, playerName, content, extra, URL) {
  const {
    cardName,
    rarityTier,
    newForCollection,
    foil,
    inspectUrl,
    imageUrl,
    sourcePlugin,
  } = extra.metadata;
  const acceptedRarity = ["Mythic", "Godly", "Legendary"];

  if (!newForCollection) return;

  const isAcceptedNonFoil = !foil && acceptedRarity.includes(rarityTier);

  if (!foil && !isAcceptedNonFoil) return;
  const cardProgress = extractCardProgress(content);
  const openedPacks = extractOpenedPacks(content);
  const foilSuffix = foil ? " :sparkles: *foil* :sparkles:" : "";
  const embed = {
    title: cardName,
    url: inspectUrl,
    color: RARITY_COLORS[rarityTier] ?? DEFAULT_RARITY_COLOR,
    thumbnail: imageUrl ? { url: imageUrl } : undefined,
    description: `**${playerName}** has pulled a **${rarityTier}** card${foilSuffix}\non pack **${openedPacks} | ${cardProgress}**`,
    footer: sourcePlugin ? { text: sourcePlugin } : undefined,
  };

  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, embed);

  return msgMap;
}

export default tcgHandler;

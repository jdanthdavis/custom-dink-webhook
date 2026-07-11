import { EXTERNAL_PLUGIN } from "../constants";

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
  const match = content?.match(/Opened packs: (\d+)/);
  return match ? Number(match[1]).toLocaleString("en-US") : null;
}

/**
 * Creates a TCG pull notification message when a qualifying card is found.
 * @param {Map<{ ID: string, URL: string }, string>} msgMap - The message map to update
 * @param {string} playerName - The player's name
 * @param {string} content - The raw content string containing card collection progress
 * @param {{ metadata: { cardName: string, rarityTier: string, newForCollection: boolean, foil: boolean } }} extra - Additional information about the card pull
 * @param {string} URL - The associated URL
 * @returns {Map<{ ID: string, URL: string }, string>|undefined} The updated message map, or undefined if the pull doesn't qualify for a notification
 */
function tcgHandler(msgMap, playerName, content, extra, URL) {
  const { cardName, rarityTier, newForCollection, foil } = extra.metadata;
  const acceptedRarity = ["Mythic", "Godly", "Legendary"];

  if (!newForCollection) return;

  const isAcceptedNonFoil = !foil && acceptedRarity.includes(rarityTier);

  if (!foil && !isAcceptedNonFoil) return;
  const cardProgress = extractCardProgress(content);
  const openedPacks = extractOpenedPacks(content);
  const msg = foil
    ? `**${playerName}** has pulled a **${rarityTier} ${cardName}** :sparkles: *foil* :sparkles: on pack **${openedPacks} | ${cardProgress}**`
    : `**${playerName}** has pulled a **${rarityTier} ${cardName}** on pack **${openedPacks} | ${cardProgress}**`;

  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, msg);

  return msgMap;
}

export default tcgHandler;

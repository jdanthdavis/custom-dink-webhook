import { EXTERNAL_PLUGIN } from "../constants";

/**
 * Extracts the total number of cards the game has (e.g. "6 376" from
 * "Unique cards: 372 / 6 376 (5.8%)") and pairs it with the "Total cards"
 * count (e.g. "386"), returning e.g. "386/6,376 (6.1%)".
 * @param {string} content
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
 * @param {string} content
 */
function extractOpenedPacks(content) {
  const match = content?.match(/Opened packs: (\d+)/);
  return match ? Number(match[1]).toLocaleString("en-US") : null;
}

function tcgHandler(msgMap, playerName, content, extra, URL) {
  const { cardName, rarityTier, newForCollection, foil } = extra.metadata;
  const acceptedRarity = ["Mythic", "Godly", "Legendary"];

  if (!newForCollection) return;

  const isAcceptedNonFoil = !foil && acceptedRarity.includes(rarityTier);

  if (!foil && !isAcceptedNonFoil) return;
  const cardProgress = extractCardProgress(content);
  const openedPacks = extractOpenedPacks(content);
  const msg = foil
    ? `**${playerName}** has pulled a **${rarityTier} ${cardName}** foil :sparkles: on pack **${openedPacks} | ${cardProgress}**`
    : `**${playerName}** has pulled a **${rarityTier} ${cardName}** on pack **${openedPacks} | ${cardProgress}**`;

  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, msg);

  return msgMap;
}

export default tcgHandler;

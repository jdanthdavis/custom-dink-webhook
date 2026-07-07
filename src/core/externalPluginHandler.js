import { EXTERNAL_PLUGIN } from "../constants";

/**
 * Extracts the "Unique cards" (or "Unique foil cards") progress from the
 * raw content string and reformats it, e.g. "812 / 6 376 (12.7%)" becomes
 * "812/6,376 (12.7%)".
 * @param {string} content
 * @param {boolean} foil
 */
function extractCardProgress(content, foil) {
  const label = foil ? "Unique foil cards" : "Unique cards";
  const regex = new RegExp(`${label}: ([\\d ]+) / ([\\d ]+) \\(([\\d.]+%)\\)`);
  const match = content?.match(regex);
  if (!match) return null;

  const [, owned, total, percentage] = match;
  const formattedOwned = Number(owned.replace(/ /g, "")).toLocaleString(
    "en-US",
  );
  const formattedTotal = Number(total.replace(/ /g, "")).toLocaleString(
    "en-US",
  );

  return `${formattedOwned}/${formattedTotal} (${percentage})`;
}

/**
 * Extracts the "Opened packs" count from the raw content string.
 * @param {string} content
 */
function extractOpenedPacks(content) {
  const match = content?.match(/Opened packs: (\d+)/);
  return match ? Number(match[1]).toLocaleString("en-US") : null;
}

function externalPluginHandler(msgMap, playerName, content, extra, URL) {
  const { cardName, rarityTier, newForCollection, foil } = extra.metadata;
  const acceptedRarity = ["Epic", "Mythic", "Godly", "Legendary"];

  if (!newForCollection || !acceptedRarity.includes(rarityTier)) return;

  const cardProgress = extractCardProgress(content, foil);
  const openedPacks = extractOpenedPacks(content);

  const msg = foil
    ? `**${playerName}** has pulled a **${cardName}** foil :sparkles: on pack **${openedPacks} | ${cardProgress}**`
    : `**${playerName}** has pulled a **${cardName}** on pack **${openedPacks} | ${cardProgress}**`;

  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, msg);

  return msgMap;
}

export default externalPluginHandler;

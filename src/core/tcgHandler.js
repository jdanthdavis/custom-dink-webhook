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

const PROGRESS_BAR_LENGTH = 10;
const PROGRESS_BAR_FILLED = "▓";
const PROGRESS_BAR_EMPTY = "░";

/**
 * Renders a text progress bar for a 0-100 percentage.
 * @param {number} percentage - A value between 0 and 100
 * @returns {string} A bar like "▓▓▓░░░░░░░"
 */
function buildProgressBar(percentage) {
  const filled = Math.max(
    0,
    Math.min(
      PROGRESS_BAR_LENGTH,
      Math.round((percentage / 100) * PROGRESS_BAR_LENGTH),
    ),
  );
  return (
    PROGRESS_BAR_FILLED.repeat(filled) +
    PROGRESS_BAR_EMPTY.repeat(PROGRESS_BAR_LENGTH - filled)
  );
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
 * Extracts the unique-card collection stats (owned, universe total, percentage)
 * from the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {{ owned: number, total: number, percentage: number }|null}
 */
function extractUniqueCardStats(content) {
  const match = content?.match(
    /Unique cards: ([\d ]+) \/ ([\d ]+) \(([\d.]+)%\)/,
  );
  if (!match) return null;

  return {
    owned: Number(match[1].replace(/ /g, "")),
    total: Number(match[2].replace(/ /g, "")),
    percentage: Number(match[3]),
  };
}

/**
 * Extracts the unique-foil-card collection stats (owned, universe total,
 * percentage) from the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {{ owned: number, total: number, percentage: number }|null}
 */
function extractFoilCardStats(content) {
  const match = content?.match(
    /Unique foil cards: ([\d ]+) \/ ([\d ]+) \(([\d.]+)%\)/,
  );
  if (!match) return null;

  return {
    owned: Number(match[1].replace(/ /g, "")),
    total: Number(match[2].replace(/ /g, "")),
    percentage: Number(match[3]),
  };
}

/**
 * Extracts the collection score and its percentage from the raw content string.
 * @param {string} content - The raw content from the TCG message
 * @returns {{ score: number, percentage: number }|null}
 */
function extractCollectionScoreStats(content) {
  const match = content?.match(/Collection score: ([\d ]+) \(([\d.]+)%\)/);
  if (!match) return null;

  return {
    score: Number(match[1].replace(/ /g, "")),
    percentage: Number(match[2]),
  };
}

/**
 * Detects a one-off milestone worth calling out for this specific pull.
 * Only checks conditions derivable from this single payload (no persisted
 * prior state), so it's limited to round-number moments rather than "just
 * crossed 50%" style detection.
 * @param {{ uniqueStats: { owned: number }|null, foilStats: { owned: number }|null, foil: boolean }} args
 * @returns {string|null}
 */
function detectMilestone({ uniqueStats, foilStats, foil }) {
  if (foil && foilStats?.owned === 1) {
    return "First foil card ever pulled!";
  }
  if (uniqueStats?.owned && uniqueStats.owned % 100 === 0) {
    return `${uniqueStats.owned.toLocaleString("en-US")}th unique card collected!`;
  }
  return null;
}

/**
 * Creates a TCG pull notification embed when a qualifying card is found. This
 * is the only handler that sends an embed instead of plain message content -
 * the card name is linked to `inspectUrl` via a markdown link inside the
 * embed description, which (unlike a link in plain message content) doesn't
 * trigger Discord's auto-unfurl into a second, redundant embed.
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

  const openedPacks = extractOpenedPacks(content);
  const uniqueStats = extractUniqueCardStats(content);
  const foilStats = extractFoilCardStats(content);
  const scoreStats = extractCollectionScoreStats(content);
  const milestone = detectMilestone({ uniqueStats, foilStats, foil });

  const foilSuffix = foil ? " :sparkles: *foil* :sparkles:" : "";
  const cardLabel = inspectUrl ? `[${cardName}](${inspectUrl})` : cardName;

  const fields = [
    {
      name: "🎴 This Pull",
      value: `**${rarityTier}**${foil ? " ✨ Foil" : ""}`,
      inline: true,
    },
    {
      name: "📦 Opened Packs",
      value: openedPacks ?? "—",
      inline: true,
    },
  ];

  if (uniqueStats) {
    fields.push({
      name: "🃏 Unique Cards",
      value: `${buildProgressBar(uniqueStats.percentage)} ${uniqueStats.owned.toLocaleString("en-US")}/${uniqueStats.total.toLocaleString("en-US")} (${uniqueStats.percentage}%)`,
      inline: true,
    });
  }

  // Foil progress is only relevant to show off on a foil pull.
  if (foil && foilStats) {
    fields.push({
      name: "✨ Unique Foils",
      value: `${foilStats.owned.toLocaleString("en-US")}/${foilStats.total.toLocaleString("en-US")} (${foilStats.percentage}%)`,
      inline: true,
    });
  }

  // Collection score is reserved for the rarest pulls so it doesn't clutter every notification.
  if ((foil || rarityTier === "Mythic") && scoreStats) {
    fields.push({
      name: "💰 Collection Score",
      value: `${scoreStats.score.toLocaleString("en-US")} (${scoreStats.percentage}%)`,
      inline: true,
    });
  }

  if (milestone) {
    fields.push({ name: "🎉 Milestone", value: milestone, inline: false });
  }

  const embed = {
    color: RARITY_COLORS[rarityTier] ?? DEFAULT_RARITY_COLOR,
    thumbnail: imageUrl ? { url: imageUrl } : undefined,
    description: `**${playerName}** has pulled a **${rarityTier} ${cardLabel}**${foilSuffix}`,
    fields,
    footer: sourcePlugin ? { text: sourcePlugin } : undefined,
    timestamp: new Date().toISOString(),
  };

  msgMap.set({ ID: EXTERNAL_PLUGIN, URL }, embed);

  return msgMap;
}

export default tcgHandler;

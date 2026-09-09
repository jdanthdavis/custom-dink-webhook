/**
 * Formats an auto-sized-column table wrapped in a titled code block, used by
 * every D1-backed leaderboard (!Fetchpets, !Fetchloot, and the weekly recap).
 * @param {string} title - The table's heading, e.g. "Pet Board"
 * @param {string[]} headers - Column headers
 * @param {string[][]} rows - Row cell values, one array per row, same column order as headers
 * @returns {string}
 */
function formatLeaderboardTable(title, headers, rows) {
  // Auto-size each column to fit its header and the longest value below it
  const widths = headers.map((header, col) =>
    Math.max(header.length, ...rows.map((row) => row[col].length))
  );

  /** @param {string[]} cells */
  const padRow = (cells) =>
    cells.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd();

  const headerLine = padRow(headers);
  const separatorLine = widths.map((w) => '-'.repeat(w)).join('  ').trimEnd();
  const rowLines = rows.map((row) => padRow(row));

  const table = [headerLine, separatorLine, ...rowLines].join('\n');

  return `**${title}**\n\`\`\`\n${table}\n\`\`\``;
}

export default formatLeaderboardTable;

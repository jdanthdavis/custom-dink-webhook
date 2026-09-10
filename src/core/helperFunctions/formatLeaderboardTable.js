/**
 * Formats an auto-sized-column table wrapped in a titled code block.
 * @param {string} title
 * @param {string[]} headers
 * @param {string[][]} rows
 * @returns {string}
 */
function formatLeaderboardTable(title, headers, rows) {
  // Auto-size each column to fit its header and the longest value below it
  const widths = headers.map((header, col) =>
    Math.max(header.length, ...rows.map((row) => row[col].length))
  );

  /** @param {string[]} cells */
  const padRow = (cells) =>
    cells
      .map((cell, col) => cell.padEnd(widths[col]))
      .join('  ')
      .trimEnd();

  const headerLine = padRow(headers);
  const separatorLine = widths
    .map((w) => '-'.repeat(w))
    .join('  ')
    .trimEnd();
  const rowLines = rows.map((row) => padRow(row));

  const table = [headerLine, separatorLine, ...rowLines].join('\n');

  return `**${title}**\n\`\`\`\n${table}\n\`\`\``;
}

export default formatLeaderboardTable;

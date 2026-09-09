import { describe, expect, it } from 'vitest';
import formatLeaderboardTable from '../core/helperFunctions/formatLeaderboardTable';

describe('formatLeaderboardTable', () => {
  it('wraps the table in a titled code block', () => {
    const result = formatLeaderboardTable(
      'Pet Board',
      ['Name', '# of Pets'],
      [['Swap', '5']]
    );
    expect(result).toContain('**Pet Board**');
    expect(result).toContain('```');
  });

  it('auto-sizes columns to fit the longest value or header', () => {
    const result = formatLeaderboardTable(
      'Pet Board',
      ['Name', '# of Pets'],
      [
        ['Swap', '5'],
        ['Gout Haver', '23'],
      ]
    );
    const lines = result.split('\n');
    // Header, separator, and both data rows should all align to the same width
    const headerLine = lines.find((l) => l.startsWith('Name'));
    const separatorLine = lines.find((l) => l.startsWith('----'));
    expect(headerLine.length).toBe(separatorLine.length);
  });

  it('preserves row order (callers are responsible for sorting)', () => {
    const result = formatLeaderboardTable(
      'Loot Board',
      ['Name', 'Total Value'],
      [
        ['Gout Haver', '8M'],
        ['Swap', '2M'],
      ]
    );
    const goutIndex = result.indexOf('Gout Haver');
    const swapIndex = result.indexOf('Swap');
    expect(goutIndex).toBeLessThan(swapIndex);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { buildLootWeeklyChangeSection } from '../core/recap/lootRecap';

/** @param {{ first?: any, all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(resolves.first),
    all: vi.fn().mockResolvedValue(resolves.all),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe('buildLootWeeklyChangeSection', () => {
  it('shows only value gained since the baseline, alongside the weekly top drop, sorted descending', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_value: 2_000_000,
                total_value_baseline: 0,
                weekly_top_item_name: 'Rocky',
                weekly_top_item_value: 2_000_000,
              },
              {
                playername: 'Gout',
                total_value: 858_000_000,
                total_value_baseline: 850_000_000,
                weekly_top_item_name: 'Whip',
                weekly_top_item_value: 8_000_000,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLootWeeklyChangeSection(LOOT_DB);

    expect(result).toContain('Loot Board');
    expect(result).toContain('Total Value Gained');
    expect(result).toContain('Most Valuable Drop');
    expect(result).not.toContain('Source');
    const swapLine = result.split('\n').find((l) => l.includes('Swap'));
    expect(swapLine.trim().split(/\s{2,}/)).toEqual([
      'Swap',
      '2M',
      'Rocky (2M)',
    ]);
    // Gout gained more this week (8M) than Swap (2M), despite having a much
    // larger lifetime total - sorted by the delta, not the running total.
    expect(result.indexOf('Gout')).toBeLessThan(result.indexOf('Swap'));
  });

  it('omits a player with no value gained since the last recap', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                total_value: 10_000_000,
                total_value_baseline: 10_000_000,
                weekly_top_item_name: null,
                weekly_top_item_value: null,
              },
              {
                playername: 'Active',
                total_value: 12_000_000,
                total_value_baseline: 10_000_000,
                weekly_top_item_name: 'Whip',
                weekly_top_item_value: 2_000_000,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLootWeeklyChangeSection(LOOT_DB);

    expect(result).toContain('Active');
    expect(result).not.toContain('Idle');
  });

  it('shows "-" for the weekly top drop when nothing was recorded', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_value: 2_000_000,
                total_value_baseline: 0,
                weekly_top_item_name: null,
                weekly_top_item_value: null,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLootWeeklyChangeSection(LOOT_DB);

    const line = result.split('\n').find((l) => l.includes('Swap'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['Swap', '2M', '-']);
  });

  it('resets weekly_top_item_* to NULL after building the section', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_value: 2_000_000,
                total_value_baseline: 0,
                weekly_top_item_name: 'Rocky',
                weekly_top_item_value: 2_000_000,
              },
            ],
          },
        })
      ),
    };

    await buildLootWeeklyChangeSection(LOOT_DB);

    const resetCall = LOOT_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('weekly_top_item_name = NULL')
    );
    expect(resetCall).toBeDefined();

    const baselineResetCall = LOOT_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE loot_totals SET total_value_baseline')
    );
    expect(baselineResetCall).toBeDefined();
  });

  it('returns null when the table is empty', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    expect(await buildLootWeeklyChangeSection(LOOT_DB)).toBeNull();
  });

  it('returns null when the query fails', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    expect(await buildLootWeeklyChangeSection(LOOT_DB)).toBeNull();
  });
});

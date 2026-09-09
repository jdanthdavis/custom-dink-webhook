import { describe, expect, it, vi } from 'vitest';
import { getLootLeaderboard } from '../core/recap/lootRecap';

/** @param {{ all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue(resolves.all),
  };
}

describe('getLootLeaderboard', () => {
  it('formats a leaderboard sorted by total value descending', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_value: 2_000_000,
                last_item_name: 'Rocky',
                last_source: 'Man',
                last_drop_date: '01/01/2026',
              },
              {
                playername: 'Gout',
                total_value: 8_000_000,
                last_item_name: 'Whip',
                last_source: 'Man',
                last_drop_date: '01/02/2026',
              },
            ],
          },
        })
      ),
    };

    const result = await getLootLeaderboard(LOOT_DB);

    expect(result).toContain('Loot Board');
    const goutIndex = result.indexOf('Gout');
    const swapIndex = result.indexOf('Swap');
    expect(goutIndex).toBeGreaterThanOrEqual(0);
    expect(goutIndex).toBeLessThan(swapIndex);
  });

  it('returns null when the table is empty', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    expect(await getLootLeaderboard(LOOT_DB)).toBeNull();
  });

  it('returns null when the query fails', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    expect(await getLootLeaderboard(LOOT_DB)).toBeNull();
  });
});

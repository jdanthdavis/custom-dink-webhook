import { describe, expect, it, vi } from 'vitest';
import { buildDeathsWeeklyChangeSection } from '../core/recap/deathsRecap';

/** @param {{ all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue(resolves.all),
  };
}

describe('buildDeathsWeeklyChangeSection', () => {
  it('shows only deaths/gp lost since the baseline, not the lifetime total', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Gout Haver',
                death_count: 12,
                total_value_lost: 20_000_000,
                death_count_baseline: 10,
                total_value_lost_baseline: 15_000_000,
              },
            ],
          },
        })
      ),
    };

    const result = await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Deaths (This Week)');
    const line = result.split('\n').find((l) => l.includes('Gout Haver'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['Gout Haver', '2', '5M']);
  });

  it('shows the full count for a brand-new player with no baseline yet', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Frosty Dad',
                death_count: 1,
                total_value_lost: 500_000,
                death_count_baseline: null,
                total_value_lost_baseline: null,
              },
            ],
          },
        })
      ),
    };

    const result = await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const line = result.split('\n').find((l) => l.includes('Frosty Dad'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['Frosty Dad', '1', '500K']);
  });

  it('omits a player with no deaths since the last recap', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                death_count: 5,
                total_value_lost: 1_000_000,
                death_count_baseline: 5,
                total_value_lost_baseline: 1_000_000,
              },
              {
                playername: 'Active',
                death_count: 6,
                total_value_lost: 1_000_000,
                death_count_baseline: 5,
                total_value_lost_baseline: 1_000_000,
              },
            ],
          },
        })
      ),
    };

    const result = await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Active');
    expect(result).not.toContain('Idle');
  });

  it('sorts by deaths gained descending', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'SmallGain',
                death_count: 1,
                total_value_lost: 0,
                death_count_baseline: 0,
                total_value_lost_baseline: 0,
              },
              {
                playername: 'BigGain',
                death_count: 10,
                total_value_lost: 0,
                death_count_baseline: 0,
                total_value_lost_baseline: 0,
              },
            ],
          },
        })
      ),
    };

    const result = await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result.indexOf('BigGain')).toBeLessThan(result.indexOf('SmallGain'));
  });

  it('resets baselines to current values after building the section', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Gout Haver',
                death_count: 12,
                total_value_lost: 20_000_000,
                death_count_baseline: 10,
                total_value_lost_baseline: 15_000_000,
              },
            ],
          },
        })
      ),
    };

    await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE deaths')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain('death_count_baseline = death_count');
  });

  it('resets baselines even when nothing is reported (all zero-change)', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                death_count: 5,
                total_value_lost: 1_000_000,
                death_count_baseline: 5,
                total_value_lost_baseline: 1_000_000,
              },
            ],
          },
        })
      ),
    };

    const result = await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toBeNull();
    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE deaths')
    );
    expect(updateCall).toBeDefined();
  });

  it('returns null when the table is empty', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    expect(await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB)).toBeNull();
  });

  it('returns null when the query fails', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    expect(await buildDeathsWeeklyChangeSection(WEEKLY_RECAP_DB)).toBeNull();
  });
});

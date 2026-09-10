import { describe, expect, it, vi } from 'vitest';
import { buildLevelsWeeklyChangeSection } from '../core/recap/levelsRecap';

/** @param {{ all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    all: vi.fn().mockResolvedValue(resolves.all),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe('buildLevelsWeeklyChangeSection', () => {
  it('sums levels gained across multiple skills for one player', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                skill_name: 'Attack',
                level: 60,
                level_baseline: 55,
              },
              {
                playername: 'Swap',
                skill_name: 'Strength',
                level: 40,
                level_baseline: 35,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Levels Board');
    const line = result.split('\n').find((l) => l.includes('Swap'));
    // 5 gained in Attack + 5 gained in Strength = 10 total
    expect(line.trim().split(/\s{2,}/)).toEqual(['Swap', '10', 'Attack']);
  });

  it('picks the skill with the largest single delta as "skill most leveled"', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                skill_name: 'Attack',
                level: 56,
                level_baseline: 55,
              },
              {
                playername: 'Swap',
                skill_name: 'Woodcutting',
                level: 70,
                level_baseline: 50,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const line = result.split('\n').find((l) => l.includes('Swap'));
    // 1 gained in Attack + 20 gained in Woodcutting = 21 total, Woodcutting is the top skill
    expect(line.trim().split(/\s{2,}/)).toEqual(['Swap', '21', 'Woodcutting']);
  });

  it('shows the full level for a skill with no prior baseline yet', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Frosty Dad',
                skill_name: 'Fishing',
                level: 50,
                level_baseline: null,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const line = result.split('\n').find((l) => l.includes('Frosty Dad'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['Frosty Dad', '50', 'Fishing']);
  });

  it('omits a player with no levels gained since the last recap', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                skill_name: 'Attack',
                level: 60,
                level_baseline: 60,
              },
              {
                playername: 'Active',
                skill_name: 'Attack',
                level: 60,
                level_baseline: 55,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Active');
    expect(result).not.toContain('Idle');
  });

  it('sorts by total levels gained descending', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'SmallGain',
                skill_name: 'Attack',
                level: 51,
                level_baseline: 50,
              },
              {
                playername: 'BigGain',
                skill_name: 'Attack',
                level: 60,
                level_baseline: 50,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result.indexOf('BigGain')).toBeLessThan(result.indexOf('SmallGain'));
  });

  it('resets every changed skill row baseline to its current level', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                skill_name: 'Attack',
                level: 60,
                level_baseline: 55,
              },
            ],
          },
        })
      ),
    };

    await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE skill_levels')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain('level_baseline = level');
  });

  it('resets baselines even when nothing is reported (all zero-change)', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                skill_name: 'Attack',
                level: 60,
                level_baseline: 60,
              },
            ],
          },
        })
      ),
    };

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toBeNull();
    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE skill_levels')
    );
    expect(updateCall).toBeDefined();
  });

  it('returns null when the table is empty', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    expect(await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB)).toBeNull();
  });

  it('returns null when the query fails', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    expect(await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB)).toBeNull();
  });
});

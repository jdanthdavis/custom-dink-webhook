import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { buildLevelsWeeklyChangeSection } from '../core/recap/levelsRecap';

/** @param {{ all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    all: vi.fn().mockResolvedValue(resolves.all),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

/** @param {any[]} results */
function makeDb(results) {
  return {
    prepare: vi.fn().mockReturnValue(makeStatement({ all: { results } })),
  };
}

describe('buildLevelsWeeklyChangeSection', () => {
  // The Hiscores poll runs at the start of every call - stub fetch so no
  // real network call happens and it gracefully no-ops by default.
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets Levels Gained from Overall's own delta, not summed skills", async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'LSx Swap',
        skill_name: 'Overall',
        level: 1010,
        level_baseline: 1000,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 55,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Strength',
        level: 40,
        level_baseline: 35,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Levels Board');
    const line = result.split('\n').find((l) => l.includes('LSx Swap'));
    // Overall's own delta (10) is the total, not Attack's 5 + Strength's 5;
    // Attack wins "top skill" on tied deltas since it's processed first.
    expect(line.trim().split(/\s{2,}/)).toEqual([
      'LSx Swap',
      '10',
      'Attack',
      '0',
      '-',
    ]);
  });

  it('picks the skill with the largest single delta as "skill most levelled"', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'LSx Swap',
        skill_name: 'Overall',
        level: 1021,
        level_baseline: 1000,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Attack',
        level: 56,
        level_baseline: 55,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Woodcutting',
        level: 70,
        level_baseline: 50,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const line = result.split('\n').find((l) => l.includes('LSx Swap'));
    expect(line.trim().split(/\s{2,}/)).toEqual([
      'LSx Swap',
      '21',
      'Woodcutting',
      '0',
      '-',
    ]);
  });

  it('shows the full level for a player with no prior baseline yet', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'Frosty Dad',
        skill_name: 'Overall',
        level: 50,
        level_baseline: null,
      },
      {
        playername: 'Frosty Dad',
        skill_name: 'Fishing',
        level: 50,
        level_baseline: null,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const line = result.split('\n').find((l) => l.includes('Frosty Dad'));
    expect(line.trim().split(/\s{2,}/)).toEqual([
      'Frosty Dad',
      '50',
      'Fishing',
      '0',
      '-',
    ]);
  });

  it('omits a player with no levels or XP gained since the last recap', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'Idle',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 60,
      },
      {
        playername: 'Active',
        skill_name: 'Overall',
        level: 65,
        level_baseline: 60,
      },
      {
        playername: 'Active',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 55,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Active');
    expect(result).not.toContain('Idle');
  });

  it('sorts by total levels gained descending when XP is tied (both zero)', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'SmallGain',
        skill_name: 'Overall',
        level: 501,
        level_baseline: 500,
      },
      {
        playername: 'SmallGain',
        skill_name: 'Attack',
        level: 51,
        level_baseline: 50,
      },
      {
        playername: 'BigGain',
        skill_name: 'Overall',
        level: 510,
        level_baseline: 500,
      },
      {
        playername: 'BigGain',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 50,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result.indexOf('BigGain')).toBeLessThan(result.indexOf('SmallGain'));
  });

  it('resets every changed skill row baseline (both level and xp columns)', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'LSx Swap',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 55,
      },
    ]);

    await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE skill_xp')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain('level_baseline = level');
    expect(updateCall[0]).toContain('xp_baseline = xp');
  });

  it('resets baselines even when nothing is reported (all zero-change)', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'Idle',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 60,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toBeNull();
    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE skill_xp')
    );
    expect(updateCall).toBeDefined();
  });

  it('returns null when the table is empty', async () => {
    const WEEKLY_RECAP_DB = makeDb([]);
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

  it('combines levels and XP data for the same player, both from Overall', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'LSx Swap',
        skill_name: 'Overall',
        level: 1005,
        level_baseline: 1000,
        xp: 5_000_000,
        xp_baseline: 4_600_000,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 55,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Woodcutting',
        xp: 500000,
        xp_baseline: 100000,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    const line = result.split('\n').find((l) => l.includes('LSx Swap'));
    // Total XP Gained comes from Overall's own delta (400K), not the sum of
    // individual skills; Woodcutting is still the top single-skill delta.
    expect(line.trim().split(/\s{2,}/)).toEqual([
      'LSx Swap',
      '5',
      'Attack',
      '400K',
      'Woodcutting (400K)',
    ]);
  });

  it('includes a player with XP gained but no level-ups (a maxed skill)', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'MaxedOut',
        skill_name: 'Overall',
        xp: 93_000_000,
        xp_baseline: 90_000_000,
      },
      {
        playername: 'MaxedOut',
        skill_name: 'Attack',
        xp: 15_000_000,
        xp_baseline: 13_034_431,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('MaxedOut');
    const line = result.split('\n').find((l) => l.includes('MaxedOut'));
    expect(line.trim().split(/\s{2,}/)).toEqual([
      'MaxedOut',
      '0',
      '-',
      '3M',
      'Attack (1.97M)',
    ]);
  });

  it("does not let Overall's own delta double-count toward the top skill", async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'LSx Swap',
        skill_name: 'Overall',
        // Overall's delta is bigger than any individual skill's - it must
        // never win "top skill", since it isn't a real skill.
        xp: 10_000_000,
        xp_baseline: 5_000_000,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Attack',
        xp: 2_000_000,
        xp_baseline: 1_000_000,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Attack (1M)');
    expect(result).not.toContain('Overall');
  });

  it('sorts by XP gained descending, even when levels gained favors someone else', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'GOUT HAVER',
        skill_name: 'Overall',
        level: 1060,
        level_baseline: 1000,
      },
      {
        playername: 'GOUT HAVER',
        skill_name: 'Woodcutting',
        level: 60,
        level_baseline: 40,
      },
      {
        playername: 'PIGEON CAM',
        skill_name: 'Overall',
        xp: 6_000_000,
        xp_baseline: 1_000_000,
      },
      {
        playername: 'PIGEON CAM',
        skill_name: 'Attack',
        xp: 5_000_000,
        xp_baseline: 1_000_000,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result.indexOf('Pigeon Cam')).toBeLessThan(
      result.indexOf('Gout Haver')
    );
  });

  it('resolves the real display-case name from PLAYER_DISPLAY_NAMES', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'FROSTY DAD',
        skill_name: 'Overall',
        xp: 5_000_000,
        xp_baseline: 4_000_000,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Frosty Dad');
    expect(result).not.toContain('FROSTY DAD');
  });

  it('falls back to the raw stored playername when not in PLAYER_DISPLAY_NAMES', async () => {
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'SOME RANDOM PLAYER',
        skill_name: 'Overall',
        xp: 5_000_000,
        xp_baseline: 4_000_000,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('SOME RANDOM PLAYER');
  });

  it('does not let a Hiscores failure block the rest of the section', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    );
    const WEEKLY_RECAP_DB = makeDb([
      {
        playername: 'LSx Swap',
        skill_name: 'Overall',
        level: 1005,
        level_baseline: 1000,
      },
      {
        playername: 'LSx Swap',
        skill_name: 'Attack',
        level: 60,
        level_baseline: 55,
      },
    ]);

    const result = await buildLevelsWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('LSx Swap');
  });
});

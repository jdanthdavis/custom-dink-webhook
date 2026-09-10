import { describe, expect, it, vi } from 'vitest';
import levelUpHandler from '../core/levelUpHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

/** @returns {*} */
function makeWeeklyRecapDb() {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
    }),
  };
}

describe('levelUpHandler', () => {
  it('sends an XP milestone message when xpData is present', async () => {
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        xpData: { Attack: 1000000 },
        milestoneAchieved: ['Attack'],
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has reached **1M XP** in **Attack!**'
    );
  });

  it('announces the highest possible total level of 2376', async () => {
    const allSkills = Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [`Skill${i}`, 99])
    );
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      { allSkills, levelledSkills: { Skill0: 99 } },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      'has reached the highest possible total level of **2376**'
    );
  });

  it('announces a total-level milestone (divisible by 25) while skilling', async () => {
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 50 },
        levelledSkills: { Attack: 50 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has reached a new total level of **50**, by reaching **50** in **Attack!**'
    );
  });

  it('announces reaching level 99 in a single skill (non-milestone total, not a first 99)', async () => {
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 99, Strength: 99 },
        levelledSkills: { Attack: 99 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has levelled **Attack** to **99!**'
    );
  });

  it("announces a player's first ever 99", async () => {
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 99, Strength: 50 },
        levelledSkills: { Attack: 99 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '-# @everyone\n<a:danseParty:1281063903933104160> **Swap** has achieved their first **99** in **Attack!** <a:danseParty:1281063903933104160>'
    );
  });

  it('prioritizes the first-99 message over a total-level milestone', async () => {
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        // totalLevel = 99 + 26 = 125, divisible by 25, but this is still the player's first 99
        allSkills: { Attack: 99, Strength: 26 },
        levelledSkills: { Attack: 99 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('has achieved their first **99**');
  });

  it('does not treat a second 99 as a first 99', async () => {
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 99, Strength: 99 },
        levelledSkills: { Attack: 99 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).not.toContain('first **99**');
  });

  it('uses a default message for a non-milestone level-up', async () => {
    const msgMap = new Map();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 67 },
        levelledSkills: { Attack: 67 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has levelled **Attack** to **67!**'
    );
  });

  it('returns the msgMap unchanged when there are no levelled skills', async () => {
    const msgMap = new Map();
    const result = await levelUpHandler(
      msgMap,
      'Swap',
      { allSkills: {}, levelledSkills: {} },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(result).toBe(msgMap);
    expect(msgMap.size).toBe(0);
  });

  it('tracks a level below the notification threshold in D1 but sends no message', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();
    const result = await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Woodcutting: 45 },
        levelledSkills: { Woodcutting: 45 },
      },
      WEEKLY_RECAP_DB,
      'url'
    );
    expect(result).toBe(msgMap);
    expect(msgMap.size).toBe(0);
    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(1);
    expect(WEEKLY_RECAP_DB.prepare.mock.calls[0][0]).toContain(
      'INSERT INTO skill_levels'
    );
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    expect(statement.bind).toHaveBeenCalledWith('Swap', 'Woodcutting', 45);
  });

  it('notifies only for the qualifying skill in a mixed sub/above-threshold event', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Woodcutting: 45, Attack: 55 },
        levelledSkills: { Woodcutting: 45, Attack: 55 },
      },
      WEEKLY_RECAP_DB,
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('Attack');
    expect(msg).not.toContain('Woodcutting');
    // Both skills are still tracked in D1 regardless of the notification filter.
    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(2);
  });

  it('records every levelled skill in D1, one upsert per skill', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 55, Strength: 60 },
        levelledSkills: { Attack: 55, Strength: 60 },
      },
      WEEKLY_RECAP_DB,
      'url'
    );

    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(2);
    // prepare() returns the same mocked statement on every call, so its
    // shared bind mock accumulates both calls in order.
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    expect(statement.bind.mock.calls).toEqual([
      ['Swap', 'Attack', 55],
      ['Swap', 'Strength', 60],
    ]);
  });

  it('does not touch D1 for an XP milestone event (no levelledSkills)', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        xpData: { Attack: 1000000 },
        milestoneAchieved: ['Attack'],
      },
      WEEKLY_RECAP_DB,
      'url'
    );
    expect(WEEKLY_RECAP_DB.prepare).not.toHaveBeenCalled();
  });

  it('does not crash when D1 write fails, message still sends', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    await levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 67 },
        levelledSkills: { Attack: 67 },
      },
      WEEKLY_RECAP_DB,
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has levelled **Attack** to **67!**'
    );
  });
});

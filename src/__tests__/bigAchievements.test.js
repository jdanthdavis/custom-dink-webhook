import { describe, expect, it, vi } from 'vitest';
import {
  BIG_ACHIEVEMENTS,
  recordBigAchievements,
} from '../core/bigAchievements';
import { buildBigAchievementsWeeklyChangeSection } from '../core/recap/bigAchievementsRecap';

function makeDb(all) {
  const statement = {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue({ results: all }),
  };
  return { prepare: vi.fn().mockReturnValue(statement), statement };
}

describe('recordBigAchievements', () => {
  it('records the fire cape on a first Jad kill', async () => {
    const db = makeDb();
    await recordBigAchievements(
      db,
      'KILL_COUNT',
      'Swap',
      { boss: 'TzTok-Jad', count: 1 },
      undefined
    );
    expect(db.statement.bind).toHaveBeenCalledWith('Swap', 'first_fire_cape');
    expect(db.prepare.mock.calls[0][0]).toContain('INSERT OR IGNORE');
  });

  it('ignores later Jad kills and unrelated events', async () => {
    const db = makeDb();
    await recordBigAchievements(
      db,
      'KILL_COUNT',
      'Swap',
      { boss: 'TzTok-Jad', count: 2 },
      undefined
    );
    await recordBigAchievements(
      db,
      'LOOT',
      'Swap',
      { boss: 'TzTok-Jad', count: 1 },
      undefined
    );
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('records a 99 in the skill that was levelled', async () => {
    const db = makeDb();
    await recordBigAchievements(
      db,
      'LEVEL',
      'Swap',
      { levelledSkills: { Fishing: 99 }, allSkills: { Fishing: 99 } },
      undefined
    );
    expect(db.prepare).toHaveBeenCalledTimes(1);
    expect(db.statement.bind).toHaveBeenCalledWith('Swap', 'level_99_fishing');
  });

  it('records every skill that hit 99 in one event, and ignores other levels', async () => {
    const db = makeDb();
    await recordBigAchievements(
      db,
      'LEVEL',
      'Swap',
      { levelledSkills: { Attack: 99, Strength: 99, Magic: 98 } },
      undefined
    );
    expect(db.statement.bind).toHaveBeenCalledWith('Swap', 'level_99_attack');
    expect(db.statement.bind).toHaveBeenCalledWith('Swap', 'level_99_strength');
    expect(db.prepare).toHaveBeenCalledTimes(2);
  });

  it('records a pet-total milestone only when the total is exactly a multiple of 5', async () => {
    const db = makeDb();
    await recordBigAchievements(db, 'PET_TOTAL', 'Swap', { totalPets: 5 });
    expect(db.statement.bind).toHaveBeenCalledWith('Swap', 'total_pets_5');
    expect(db.prepare).toHaveBeenCalledTimes(1);

    const other = makeDb();
    await recordBigAchievements(other, 'PET_TOTAL', 'Swap', { totalPets: 6 });
    await recordBigAchievements(other, 'PET', 'Swap', { totalPets: 5 });
    expect(other.prepare).not.toHaveBeenCalled();
  });

  it('has unique ids', () => {
    const ids = BIG_ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildBigAchievementsWeeklyChangeSection', () => {
  it('lists unreported achievements in a table and marks them reported', async () => {
    const db = makeDb([
      { playername: 'LSX SWAP', achievement_id: 'level_99_fishing' },
      { playername: 'Test Buddy', achievement_id: 'first_fire_cape' },
    ]);
    const result = await buildBigAchievementsWeeklyChangeSection(db);
    expect(result).toContain('**Big Achievements**');
    const rows = result
      .split('\n')
      .filter((l) => l.includes('Fire Cape') || l.includes('99 Fishing'))
      .map((l) => l.trim().split(/\s{2,}/));
    // definition order: fire cape before skill 99s; display name resolved
    expect(rows).toEqual([
      ['Test Buddy', 'First Fire Cape'],
      ['LSx Swap', '99 Fishing'],
    ]);
    expect(db.prepare.mock.calls[1][0]).toContain('UPDATE big_achievements');
  });

  it("groups a player's achievements together, most achievements first", async () => {
    const db = makeDb([
      { playername: 'LSX SWAP', achievement_id: 'first_fire_cape' },
      { playername: 'Test Buddy', achievement_id: 'first_infernal_cape' },
      { playername: 'LSX SWAP', achievement_id: 'level_99_fishing' },
    ]);
    const result = await buildBigAchievementsWeeklyChangeSection(db);
    const rows = result
      .split('\n')
      .filter((l) => /Cape|99/.test(l))
      .map((l) => l.trim().split(/\s{2,}/));
    expect(rows).toEqual([
      ['LSx Swap', 'First Fire Cape'],
      ['LSx Swap', '99 Fishing'],
      ['Test Buddy', 'First Infernal Cape'],
    ]);
  });

  it('returns null when nothing is new', async () => {
    expect(
      await buildBigAchievementsWeeklyChangeSection(makeDb([]))
    ).toBeNull();
  });
});

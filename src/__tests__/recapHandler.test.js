import { describe, expect, it, vi } from 'vitest';
import buildWeeklyRecap from '../recapHandler';

/** @param {{ first?: any, all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(resolves.first),
    all: vi.fn().mockResolvedValue(resolves.all),
  };
}

describe('buildWeeklyRecap', () => {
  it('combines every non-empty section into one message', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: { results: [{ playername: 'Swap', total_pets: 5 }] },
        })
      ),
    };
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: { results: [{ playername: 'Swap', total_value: 2_000_000 }] },
        })
      ),
    };

    const recap = await buildWeeklyRecap({ PETS_DB, LOOT_DB });

    expect(recap).toContain('# Weekly Recap');
    expect(recap).toContain('Pet Board');
    expect(recap).toContain('Loot Board');
  });

  it('omits a section with no data', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: { results: [{ playername: 'Swap', total_pets: 5 }] },
        })
      ),
    };
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };

    const recap = await buildWeeklyRecap({ PETS_DB, LOOT_DB });

    expect(recap).toContain('Pet Board');
    expect(recap).not.toContain('Loot Board');
  });

  it('returns null when every section is empty', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };

    const recap = await buildWeeklyRecap({ PETS_DB, LOOT_DB });

    expect(recap).toBeNull();
  });
});

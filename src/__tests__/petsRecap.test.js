import { describe, expect, it, vi } from 'vitest';
import { buildPetsWeeklyChangeSection } from '../core/recap/petsRecap';

/** @param {{ first?: any, all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(resolves.first),
    all: vi.fn().mockResolvedValue(resolves.all),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe('buildPetsWeeklyChangeSection', () => {
  it('shows only pets gained since the baseline, not the lifetime total', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'LSx Swap',
                total_pets: 33,
                most_recent_pet_name: 'Herbi',
                total_pets_baseline: 31, // backfilled lifetime total as of shipping
              },
            ],
          },
        })
      ),
    };

    const result = await buildPetsWeeklyChangeSection(PETS_DB);

    expect(result).toContain('Pet Board');
    const line = result.split('\n').find((l) => l.includes('LSx Swap'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['LSx Swap', '2', 'Herbi']);
  });

  it('shows the full total for a brand-new player with no baseline yet', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Frosty Dad',
                total_pets: 1,
                most_recent_pet_name: 'Beef',
                total_pets_baseline: null,
              },
            ],
          },
        })
      ),
    };

    const result = await buildPetsWeeklyChangeSection(PETS_DB);

    const line = result.split('\n').find((l) => l.includes('Frosty Dad'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['Frosty Dad', '1', 'Beef']);
  });

  it('omits a player with no pets gained since the last recap', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                total_pets: 10,
                most_recent_pet_name: 'X',
                total_pets_baseline: 10,
              },
              {
                playername: 'Active',
                total_pets: 12,
                most_recent_pet_name: 'Y',
                total_pets_baseline: 10,
              },
            ],
          },
        })
      ),
    };

    const result = await buildPetsWeeklyChangeSection(PETS_DB);

    expect(result).toContain('Active');
    expect(result).not.toContain('Idle');
  });

  it('sorts by pets gained descending', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'SmallGain',
                total_pets: 11,
                most_recent_pet_name: 'A',
                total_pets_baseline: 10,
              },
              {
                playername: 'BigGain',
                total_pets: 15,
                most_recent_pet_name: 'B',
                total_pets_baseline: 5,
              },
            ],
          },
        })
      ),
    };

    const result = await buildPetsWeeklyChangeSection(PETS_DB);

    expect(result.indexOf('BigGain')).toBeLessThan(result.indexOf('SmallGain'));
  });

  it('resets baselines to current totals after building the section', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_pets: 33,
                most_recent_pet_name: 'Herbi',
                total_pets_baseline: 31,
              },
            ],
          },
        })
      ),
    };

    await buildPetsWeeklyChangeSection(PETS_DB);

    const updateCall = PETS_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE pets')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain('total_pets_baseline = total_pets');
  });

  it('resets baselines even when nothing is reported (all zero-change)', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                total_pets: 10,
                most_recent_pet_name: 'X',
                total_pets_baseline: 10,
              },
            ],
          },
        })
      ),
    };

    const result = await buildPetsWeeklyChangeSection(PETS_DB);

    expect(result).toBeNull();
    const updateCall = PETS_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE pets')
    );
    expect(updateCall).toBeDefined();
  });

  it('returns null when the table is empty', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    expect(await buildPetsWeeklyChangeSection(PETS_DB)).toBeNull();
  });

  it('returns null when the query fails', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    expect(await buildPetsWeeklyChangeSection(PETS_DB)).toBeNull();
  });
});

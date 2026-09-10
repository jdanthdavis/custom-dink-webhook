import { describe, expect, it, vi } from 'vitest';
import buildWeeklyRecap from '../recapHandler';

/** @param {{ first?: any, all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(resolves.first),
    all: vi.fn().mockResolvedValue(resolves.all),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe('buildWeeklyRecap', () => {
  it('combines every non-empty section into one message', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              { playername: 'Swap', total_pets: 5, total_pets_baseline: 0 },
            ],
          },
        })
      ),
    };
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: { results: [{ playername: 'Swap', total_value: 2_000_000 }] },
        })
      ),
    };

    const recap = await buildWeeklyRecap(
      { PETS_DB, WEEKLY_RECAP_DB },
      new Date('2026-09-08T14:00:00Z')
    );

    expect(recap).toContain('# Weekly Recap: 9/1 - 9/8');
    expect(recap).toContain('Pet Board');
    expect(recap).toContain('Loot Board');
  });

  it('formats the heading as a M/D - M/D range across a month boundary', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              { playername: 'Swap', total_pets: 5, total_pets_baseline: 0 },
            ],
          },
        })
      ),
    };

    const recap = await buildWeeklyRecap(
      { PETS_DB },
      new Date('2026-09-07T14:00:00Z')
    );

    expect(recap).toContain('# Weekly Recap: 8/31 - 9/7');
  });

  it('omits a section with no data', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              { playername: 'Swap', total_pets: 5, total_pets_baseline: 0 },
            ],
          },
        })
      ),
    };
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };

    const recap = await buildWeeklyRecap({ PETS_DB, WEEKLY_RECAP_DB });

    expect(recap).toContain('Pet Board');
    expect(recap).not.toContain('Loot Board');
  });

  it('returns null when every section is empty', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };

    const recap = await buildWeeklyRecap({ PETS_DB, WEEKLY_RECAP_DB });

    expect(recap).toBeNull();
  });

  it('includes the TCG section alongside pets and loot', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              { playername: 'Swap', total_pets: 5, total_pets_baseline: 0 },
            ],
          },
        })
      ),
    };
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                collection_score: 100,
                unique_cards_owned: 10,
                foil_cards_owned: 1,
                collection_score_baseline: null,
                unique_cards_owned_baseline: null,
                foil_cards_owned_baseline: null,
              },
            ],
          },
        })
      ),
    };

    const recap = await buildWeeklyRecap({ PETS_DB, WEEKLY_RECAP_DB });

    expect(recap).toContain('Pet Board');
    expect(recap).not.toContain('Loot Board');
    expect(recap).toContain('TCG Board');
  });

  it('degrades gracefully when a section binding is missing entirely', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              { playername: 'Swap', total_pets: 5, total_pets_baseline: 0 },
            ],
          },
        })
      ),
    };

    // No WEEKLY_RECAP_DB in env at all
    const recap = await buildWeeklyRecap({ PETS_DB });

    expect(recap).toContain('Pet Board');
    expect(recap).not.toContain('Loot Board');
    expect(recap).not.toContain('TCG Board');
  });
});

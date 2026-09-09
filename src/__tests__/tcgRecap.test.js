import { describe, expect, it, vi } from 'vitest';
import { buildTcgWeeklyChangeSection } from '../core/recap/tcgRecap';

/** @param {{ all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue(resolves.all),
  };
}

describe('buildTcgWeeklyChangeSection', () => {
  it("shows a player's full total as their change when they have no prior baseline", async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                collection_score: 45,
                unique_cards_owned: 12,
                foil_cards_owned: 2,
                collection_score_baseline: null,
                unique_cards_owned_baseline: null,
                foil_cards_owned_baseline: null,
              },
            ],
          },
        })
      ),
    };

    const result = await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('TCG Board (This Week)');
    expect(result).toContain('45');
    expect(result).toContain('12');
    expect(result).toContain('2');
  });

  it('formats large deltas with thousands separators', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Pigeon Cam',
                collection_score: 3_948_949,
                unique_cards_owned: 135,
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

    const result = await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('3,948,949');
    expect(result).not.toContain('3948949');
  });

  it('shows only the change when a baseline exists (100 foils -> 150 shows 50)', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                collection_score: 1000,
                unique_cards_owned: 200,
                foil_cards_owned: 150,
                collection_score_baseline: 900,
                unique_cards_owned_baseline: 200,
                foil_cards_owned_baseline: 100,
              },
            ],
          },
        })
      ),
    };

    const result = await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB);

    const lines = result.split('\n');
    const swapLine = lines.find((l) => l.includes('Swap'));
    expect(swapLine).toContain('100'); // score gained: 1000 - 900
    expect(swapLine).toContain('50'); // foils gained: 150 - 100
    // cards gained: 200 - 200 = 0
    expect(swapLine.trim().split(/\s{2,}/)).toEqual(['Swap', '100', '0', '50']);
  });

  it('omits a player with no change since the last recap', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                collection_score: 500,
                unique_cards_owned: 50,
                foil_cards_owned: 5,
                collection_score_baseline: 500,
                unique_cards_owned_baseline: 50,
                foil_cards_owned_baseline: 5,
              },
              {
                playername: 'Active',
                collection_score: 600,
                unique_cards_owned: 50,
                foil_cards_owned: 5,
                collection_score_baseline: 500,
                unique_cards_owned_baseline: 50,
                foil_cards_owned_baseline: 5,
              },
            ],
          },
        })
      ),
    };

    const result = await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Active');
    expect(result).not.toContain('Idle');
  });

  it('sorts by score gained descending', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'SmallGain',
                collection_score: 110,
                unique_cards_owned: 1,
                foil_cards_owned: 0,
                collection_score_baseline: 100,
                unique_cards_owned_baseline: 0,
                foil_cards_owned_baseline: 0,
              },
              {
                playername: 'BigGain',
                collection_score: 1000,
                unique_cards_owned: 1,
                foil_cards_owned: 0,
                collection_score_baseline: 0,
                unique_cards_owned_baseline: 0,
                foil_cards_owned_baseline: 0,
              },
            ],
          },
        })
      ),
    };

    const result = await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result.indexOf('BigGain')).toBeLessThan(result.indexOf('SmallGain'));
  });

  it('resets baselines to current values after building the section', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                collection_score: 150,
                unique_cards_owned: 10,
                foil_cards_owned: 1,
                collection_score_baseline: 100,
                unique_cards_owned_baseline: 10,
                foil_cards_owned_baseline: 0,
              },
            ],
          },
        })
      ),
    };

    await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB);

    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE tcg_progress')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain('collection_score_baseline = collection_score');
  });

  it('resets baselines even when nothing is reported (all zero-change)', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                collection_score: 500,
                unique_cards_owned: 50,
                foil_cards_owned: 5,
                collection_score_baseline: 500,
                unique_cards_owned_baseline: 50,
                foil_cards_owned_baseline: 5,
              },
            ],
          },
        })
      ),
    };

    const result = await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toBeNull();
    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE tcg_progress')
    );
    expect(updateCall).toBeDefined();
  });

  it('returns null when the table is empty', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    expect(await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB)).toBeNull();
  });

  it('returns null when the query fails', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    expect(await buildTcgWeeklyChangeSection(WEEKLY_RECAP_DB)).toBeNull();
  });
});

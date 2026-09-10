import { describe, expect, it, vi } from 'vitest';
import { buildCollectionLogWeeklyChangeSection } from '../core/recap/collectionLogRecap';

/** @param {{ first?: any, all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(resolves.first),
    all: vi.fn().mockResolvedValue(resolves.all),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe('buildCollectionLogWeeklyChangeSection', () => {
  it('shows only entries completed since the baseline, not the lifetime total', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'LSx Swap',
                completed_entries: 150,
                completed_entries_baseline: 100,
              },
            ],
          },
        })
      ),
    };

    const result = await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Collection Logs Board');
    expect(result).not.toContain('Rank');
    const line = result.split('\n').find((l) => l.includes('LSx Swap'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['LSx Swap', '50']);
  });

  it('shows the full total for a brand-new player with no baseline yet', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Frosty Dad',
                completed_entries: 5,
                completed_entries_baseline: null,
              },
            ],
          },
        })
      ),
    };

    const result = await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB);

    const line = result.split('\n').find((l) => l.includes('Frosty Dad'));
    expect(line.trim().split(/\s{2,}/)).toEqual(['Frosty Dad', '5']);
  });

  it('omits a player with no entries completed since the last recap', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                completed_entries: 10,
                completed_entries_baseline: 10,
              },
              {
                playername: 'Active',
                completed_entries: 12,
                completed_entries_baseline: 10,
              },
            ],
          },
        })
      ),
    };

    const result = await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toContain('Active');
    expect(result).not.toContain('Idle');
  });

  it('sorts by entries completed descending', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'SmallGain',
                completed_entries: 11,
                completed_entries_baseline: 10,
              },
              {
                playername: 'BigGain',
                completed_entries: 15,
                completed_entries_baseline: 5,
              },
            ],
          },
        })
      ),
    };

    const result = await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result.indexOf('BigGain')).toBeLessThan(result.indexOf('SmallGain'));
  });

  it('resets baselines to current totals after building the section', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                completed_entries: 150,
                completed_entries_baseline: 100,
              },
            ],
          },
        })
      ),
    };

    await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB);

    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE collection_log')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain(
      'completed_entries_baseline = completed_entries'
    );
  });

  it('resets baselines even when nothing is reported (all zero-change)', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                completed_entries: 10,
                completed_entries_baseline: 10,
              },
            ],
          },
        })
      ),
    };

    const result = await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB);

    expect(result).toBeNull();
    const updateCall = WEEKLY_RECAP_DB.prepare.mock.calls.find(([sql]) =>
      sql.includes('UPDATE collection_log')
    );
    expect(updateCall).toBeDefined();
  });

  it('returns null when the table is empty', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };
    expect(
      await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB)
    ).toBeNull();
  });

  it('returns null when the query fails', async () => {
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    expect(
      await buildCollectionLogWeeklyChangeSection(WEEKLY_RECAP_DB)
    ).toBeNull();
  });
});

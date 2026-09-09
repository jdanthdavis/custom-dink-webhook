import { describe, expect, it, vi } from 'vitest';
import { computeAndResetDeltas } from '../core/recap/deltaTracking';

/** @param {{ all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    all: vi.fn().mockResolvedValue(resolves.all),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

const singleMetricOptions = {
  table: 'pets',
  extraColumns: ['most_recent_pet_name'],
  metrics: [
    { current: 'total_pets', baseline: 'total_pets_baseline', key: 'pets' },
  ],
};

describe('computeAndResetDeltas', () => {
  it('computes a delta against an existing baseline', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_pets: 33,
                total_pets_baseline: 31,
                most_recent_pet_name: 'Herbi',
              },
            ],
          },
        })
      ),
    };

    const changes = await computeAndResetDeltas(DB, singleMetricOptions);

    expect(changes).toEqual([
      { playername: 'Swap', most_recent_pet_name: 'Herbi', petsDelta: 2 },
    ]);
  });

  it('treats a missing baseline as 0', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'New',
                total_pets: 1,
                total_pets_baseline: null,
                most_recent_pet_name: 'Beef',
              },
            ],
          },
        })
      ),
    };

    const changes = await computeAndResetDeltas(DB, singleMetricOptions);

    expect(changes[0].petsDelta).toBe(1);
  });

  it('drops rows with no change on any metric', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Idle',
                total_pets: 10,
                total_pets_baseline: 10,
                most_recent_pet_name: 'X',
              },
            ],
          },
        })
      ),
    };

    const changes = await computeAndResetDeltas(DB, singleMetricOptions);

    expect(changes).toEqual([]);
  });

  it('supports multiple metrics, each producing its own <key>Delta', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                collection_score: 1000,
                collection_score_baseline: 900,
                unique_cards_owned: 200,
                unique_cards_owned_baseline: 200,
              },
            ],
          },
        })
      ),
    };

    const changes = await computeAndResetDeltas(DB, {
      table: 'tcg_progress',
      metrics: [
        {
          current: 'collection_score',
          baseline: 'collection_score_baseline',
          key: 'score',
        },
        {
          current: 'unique_cards_owned',
          baseline: 'unique_cards_owned_baseline',
          key: 'cards',
        },
      ],
    });

    // Nonzero on `score` keeps the row even though `cards` didn't change.
    expect(changes).toEqual([
      { playername: 'Swap', scoreDelta: 100, cardsDelta: 0 },
    ]);
  });

  it('resets baselines with a WHERE clause that skips unchanged rows', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_pets: 33,
                total_pets_baseline: 31,
                most_recent_pet_name: 'Herbi',
              },
            ],
          },
        })
      ),
    };

    await computeAndResetDeltas(DB, singleMetricOptions);

    const updateCall = DB.prepare.mock.calls.find(([sql]) =>
      sql.startsWith('UPDATE')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain('total_pets_baseline = total_pets');
    expect(updateCall[0]).toContain(
      'WHERE total_pets_baseline IS NOT total_pets'
    );
  });

  it('returns null and skips the reset when the table is empty', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ all: { results: [] } })),
    };

    const changes = await computeAndResetDeltas(DB, singleMetricOptions);

    expect(changes).toBeNull();
    expect(DB.prepare).toHaveBeenCalledTimes(1); // only the SELECT, no UPDATE attempted
  });

  it('returns null when the query fails', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };

    expect(await computeAndResetDeltas(DB, singleMetricOptions)).toBeNull();
  });

  it('does not throw when the reset UPDATE fails', async () => {
    const DB = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [
            {
              playername: 'Swap',
              total_pets: 33,
              total_pets_baseline: 31,
              most_recent_pet_name: 'Herbi',
            },
          ],
        }),
        run: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };

    const changes = await computeAndResetDeltas(DB, singleMetricOptions);

    expect(changes).toHaveLength(1);
  });
});

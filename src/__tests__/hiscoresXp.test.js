import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchPlayerHiscoresXp,
  fetchAndRecordAllHiscoresXp,
} from '../core/recap/hiscoresXp';

/** @returns {*} */
function makeWeeklyRecapDb() {
  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
    }),
  };
}

/** @param {any} body @param {boolean} [ok] */
function mockFetchOnce(body, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) })
  );
}

describe('fetchPlayerHiscoresXp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes the Overall row but excludes unranked (xp: -1) skills', async () => {
    mockFetchOnce({
      skills: [
        { id: 0, name: 'Overall', rank: 1, level: 100, xp: 50000 },
        { id: 1, name: 'Attack', rank: 1, level: 60, xp: 300000 },
        { id: 2, name: 'Hitpoints', rank: -1, level: 1, xp: -1 },
      ],
    });

    const skills = await fetchPlayerHiscoresXp('Swap');

    expect(skills).toEqual([
      { skillName: 'Overall', level: 100, xp: 50000 },
      { skillName: 'Attack', level: 60, xp: 300000 },
    ]);
  });

  it('URL-encodes the player name', async () => {
    mockFetchOnce({ skills: [] });

    await fetchPlayerHiscoresXp('Frosty Dad');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('player=Frosty%20Dad')
    );
  });

  it('returns null on a non-OK response', async () => {
    mockFetchOnce({}, false);
    expect(await fetchPlayerHiscoresXp('Unknown')).toBeNull();
  });

  it('returns null and does not throw on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await fetchPlayerHiscoresXp('Swap')).toBeNull();
  });
});

describe('fetchAndRecordAllHiscoresXp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('upserts each fetched skill into skill_xp', async () => {
    mockFetchOnce({
      skills: [
        { id: 0, name: 'Overall', rank: 1, level: 100, xp: 400000 },
        { id: 1, name: 'Attack', rank: 1, level: 60, xp: 300000 },
        { id: 9, name: 'Woodcutting', rank: 1, level: 50, xp: 100000 },
      ],
    });
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();

    await fetchAndRecordAllHiscoresXp(WEEKLY_RECAP_DB, ['Swap']);

    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(3);
    expect(WEEKLY_RECAP_DB.prepare.mock.calls[0][0]).toContain(
      'INSERT INTO skill_xp'
    );
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    expect(statement.bind.mock.calls).toEqual([
      ['Swap', 'Overall', 100, 400000],
      ['Swap', 'Attack', 60, 300000],
      ['Swap', 'Woodcutting', 50, 100000],
    ]);
  });

  it('continues past one player failing without affecting the others', async () => {
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return Promise.reject(new Error('offline'));
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              skills: [{ id: 1, name: 'Attack', rank: 1, level: 60, xp: 5000 }],
            }),
        });
      })
    );
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();

    await fetchAndRecordAllHiscoresXp(WEEKLY_RECAP_DB, ['Broken', 'Working']);

    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(1);
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    expect(statement.bind).toHaveBeenCalledWith('Working', 'Attack', 60, 5000);
  });

  it('does not touch D1 when nothing is returned for a player', async () => {
    mockFetchOnce({}, false);
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();

    await fetchAndRecordAllHiscoresXp(WEEKLY_RECAP_DB, ['Swap']);

    expect(WEEKLY_RECAP_DB.prepare).not.toHaveBeenCalled();
  });

  it('does not crash when D1 write fails', async () => {
    mockFetchOnce({
      skills: [{ id: 1, name: 'Attack', rank: 1, level: 60, xp: 5000 }],
    });
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };

    await expect(
      fetchAndRecordAllHiscoresXp(WEEKLY_RECAP_DB, ['Swap'])
    ).resolves.not.toThrow();
  });
});

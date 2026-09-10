import { describe, expect, it, vi } from 'vitest';
import collectionLogHandler from '../core/collectionLogHandler';

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

describe('collectionLogHandler', () => {
  it('uses a fallback message when total/completed entries are missing', async () => {
    const msgMap = new Map();
    await collectionLogHandler(
      msgMap,
      'Swap',
      { itemName: 'Twisted bow', totalEntries: 0, completedEntries: 0 },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      'Unable to fetch total and completed entries'
    );
  });

  it('announces a rank completion', async () => {
    const msgMap = new Map();
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
        justCompletedRank: 'BRONZE',
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('has completed the **Bronze** rank');
  });

  it('announces reaching the highest possible rank', async () => {
    const msgMap = new Map();
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 100,
        currentRank: 'GILDED',
        justCompletedRank: 'GILDED',
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      'has reached the highest possible rank of **Gilded**'
    );
  });

  it('announces achieving the current rank when justCompletedRank is "NONE"', async () => {
    const msgMap = new Map();
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
        justCompletedRank: 'NONE',
      },
      makeWeeklyRecapDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('has achieved the **Iron** rank');
    expect(msg).toContain('50/100');
  });

  it('omits the rank icon (not "undefined") when currentRank and justCompletedRank are both "NONE"', async () => {
    const msgMap = new Map();
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 1,
        currentRank: 'NONE',
        justCompletedRank: 'NONE',
      },
      makeWeeklyRecapDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).not.toContain('undefined');
  });

  it('treats a missing justCompletedRank as a normal update, not a rank completion', async () => {
    const msgMap = new Map();
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
      },
      makeWeeklyRecapDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain(
      'has added a new item to their collection log: **Twisted bow**'
    );
    expect(msg).not.toContain('has completed the');
  });

  it('formats a normal update with no rank icon when currentRank is NONE', async () => {
    const msgMap = new Map();
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 1,
        currentRank: 'NONE',
        justCompletedRank: 'NONE',
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('1/100');
  });

  it('records the collection log snapshot in D1', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
      },
      WEEKLY_RECAP_DB,
      'url'
    );

    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(1);
    expect(WEEKLY_RECAP_DB.prepare.mock.calls[0][0]).toContain(
      'INSERT INTO collection_log'
    );
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    expect(statement.bind).toHaveBeenCalledWith('Swap', 50, 100, 'IRON');
  });

  it('records the D1 snapshot even on the fallback/missing-data path', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();
    await collectionLogHandler(
      msgMap,
      'Swap',
      { itemName: 'Twisted bow', totalEntries: 0, completedEntries: 0 },
      WEEKLY_RECAP_DB,
      'url'
    );

    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(1);
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    // Dink's 0/0 "log not yet cycled" sentinel must be treated as missing,
    // not written as a real zero that would COALESCE over good prior data.
    expect(statement.bind).toHaveBeenCalledWith('Swap', null, null, null);
  });

  it('does not crash when D1 write fails, message still sends', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    await collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
      },
      WEEKLY_RECAP_DB,
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      'has added a new item to their collection log: **Twisted bow**'
    );
  });
});

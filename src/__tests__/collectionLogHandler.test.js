import { describe, expect, it } from 'vitest';
import collectionLogHandler from '../core/collectionLogHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('collectionLogHandler', () => {
  it('uses a fallback message when total/completed entries are missing', () => {
    const msgMap = new Map();
    collectionLogHandler(
      msgMap,
      'Swap',
      { itemName: 'Twisted bow', totalEntries: 0, completedEntries: 0 },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('Unable to fetch total and completed entries');
  });

  it('announces a rank completion', () => {
    const msgMap = new Map();
    collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
        justCompletedRank: 'BRONZE',
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('has completed the **Bronze** rank');
  });

  it('announces reaching the highest possible rank', () => {
    const msgMap = new Map();
    collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 100,
        currentRank: 'GILDED',
        justCompletedRank: 'GILDED',
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('has reached the highest possible rank of **Gilded**');
  });

  it('announces achieving the current rank when justCompletedRank is "NONE"', () => {
    const msgMap = new Map();
    collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
        justCompletedRank: 'NONE',
      },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('has achieved the **Iron** rank');
    expect(msg).toContain('50/100');
  });

  it('omits the rank icon (not "undefined") when currentRank and justCompletedRank are both "NONE"', () => {
    const msgMap = new Map();
    collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 1,
        currentRank: 'NONE',
        justCompletedRank: 'NONE',
      },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).not.toContain('undefined');
  });

  it('treats a missing justCompletedRank as a normal update, not a rank completion', () => {
    const msgMap = new Map();
    collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 50,
        currentRank: 'IRON',
      },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('has added a new item to their collection log: **Twisted bow**');
    expect(msg).not.toContain('has completed the');
  });

  it('formats a normal update with no rank icon when currentRank is NONE', () => {
    const msgMap = new Map();
    collectionLogHandler(
      msgMap,
      'Swap',
      {
        itemName: 'Twisted bow',
        totalEntries: 100,
        completedEntries: 1,
        currentRank: 'NONE',
        justCompletedRank: 'NONE',
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('1/100');
  });
});

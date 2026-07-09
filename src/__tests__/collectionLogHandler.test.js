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

  it('formats a normal collection log update with the current rank icon', () => {
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
    expect(msg).toContain('50/100');
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
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('1/100');
  });
});

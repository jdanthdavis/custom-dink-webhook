import { describe, expect, it } from 'vitest';
import killCountHandler from '../core/killCountHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('killCountHandler', () => {
  it('notifies on a kill count divisible by 100', () => {
    const msgMap = new Map();
    killCountHandler(
      msgMap,
      'Swap',
      { boss: 'Zulrah', count: 200, gameMessage: 'Your Zulrah kill count is: 200' },
      'url'
    );
    expect(msgMap.size).toBe(1);
    expect(firstMessage(msgMap)).toContain('200!');
  });

  it('does not notify on a non-notable kill count for a boss with no custom interval', () => {
    const msgMap = new Map();
    killCountHandler(
      msgMap,
      'Swap',
      { boss: 'Zulrah', count: 47, gameMessage: 'Your Zulrah kill count is: 47' },
      'url'
    );
    expect(msgMap.size).toBe(0);
  });

  it('notifies on a boss-specific interval from bossMap', () => {
    const msgMap = new Map();
    killCountHandler(
      msgMap,
      'Swap',
      {
        boss: 'TzKal-Zuk',
        count: 5,
        gameMessage: 'Your TzKal-Zuk kill count is: 5',
      },
      'url'
    );
    expect(msgMap.size).toBe(1);
  });

  it('notifies on the first kill of a special boss', () => {
    const msgMap = new Map();
    killCountHandler(
      msgMap,
      'Swap',
      {
        boss: 'Sol Heredit',
        count: 1,
        gameMessage: 'Your Sol Heredit kill count is: 1',
      },
      'url'
    );
    expect(msgMap.size).toBe(1);
  });

  it('notifies on the first Brutus kill for any player (BRUTUS is in specialKills)', () => {
    const msgMap = new Map();
    killCountHandler(
      msgMap,
      'AnyPlayer',
      { boss: 'BRUTUS', count: 1, gameMessage: 'Your Brutus kill count is: 1' },
      'url'
    );
    expect(msgMap.size).toBe(1);
  });
});

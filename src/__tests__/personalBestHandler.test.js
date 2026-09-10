import { describe, expect, it } from 'vitest';
import personalBestHandler from '../core/personalBestHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('personalBestHandler', () => {
  it('builds the announcement with the formatted time', () => {
    const msgMap = new Map();
    personalBestHandler(
      msgMap,
      'Swap',
      { boss: 'Zulrah', time: 'PT1M5.2S' },
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has defeated **Zulrah** with a new personal best of **1:05.2!**'
    );
  });

  it('applies customBossNames to the boss name', () => {
    const msgMap = new Map();
    personalBestHandler(
      msgMap,
      'Swap',
      { boss: 'Phantom Muspah', time: 'PT1M' },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('defeated **The Grumbler**');
  });

  it('omits the time clause when extra.time is missing or unparseable', () => {
    const msgMap = new Map();
    expect(() =>
      personalBestHandler(msgMap, 'Swap', { boss: 'Zulrah' }, 'url')
    ).not.toThrow();
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has defeated **Zulrah** with a new personal best**!**'
    );
  });
});

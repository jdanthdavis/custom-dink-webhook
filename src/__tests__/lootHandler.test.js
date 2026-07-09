import { describe, expect, it } from 'vitest';
import lootHandler from '../core/lootHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('lootHandler', () => {
  it('only includes items above the 1,000,000 value threshold', () => {
    const msgMap = new Map();
    lootHandler(
      msgMap,
      [
        { name: 'Whip', quantity: 1, priceEach: 1_500_000 },
        { name: 'Bones', quantity: 1, priceEach: 100 },
      ],
      'Swap',
      'Man',
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('1x Whip');
    expect(msg).not.toContain('Bones');
  });

  it('applies grumblerCheck to the loot source', () => {
    const msgMap = new Map();
    lootHandler(
      msgMap,
      [{ name: 'Whip', quantity: 1, priceEach: 1_500_000 }],
      'Swap',
      'Phantom Muspah',
      'url'
    );
    expect(firstMessage(msgMap)).toContain('from **The Grumbler!**');
  });

  it('does not set a message when no items clear the threshold', () => {
    const msgMap = new Map();
    const result = lootHandler(
      msgMap,
      [{ name: 'Bones', quantity: 1, priceEach: 100 }],
      'Swap',
      'Man',
      'url'
    );
    expect(result).toBeUndefined();
    expect(msgMap.size).toBe(0);
  });
});

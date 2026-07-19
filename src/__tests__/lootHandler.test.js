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

  it('formats a single qualifying item with no conjunction', () => {
    const msgMap = new Map();
    lootHandler(
      msgMap,
      [{ name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 }],
      'Swap',
      'Blood moon',
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M)** from'
    );
  });

  it('joins two qualifying items with "and"', () => {
    const msgMap = new Map();
    lootHandler(
      msgMap,
      [
        { name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 },
        { name: 'Eclipse moon tassets', quantity: 1, priceEach: 2_824_150 },
      ],
      'Swap',
      'Blood moon',
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M) and 1x Eclipse moon tassets (2.82M)** from'
    );
  });

  it('joins three qualifying items with an Oxford comma and "and"', () => {
    const msgMap = new Map();
    lootHandler(
      msgMap,
      [
        { name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 },
        { name: 'Eclipse moon tassets', quantity: 1, priceEach: 2_824_150 },
        { name: 'Blue moon spear', quantity: 1, priceEach: 1_200_000 },
      ],
      'Swap',
      'Blood moon',
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M), 1x Eclipse moon tassets (2.82M), and 1x Blue moon spear (1.20M)** from'
    );
  });

  it('joins four or more qualifying items with commas and a trailing "and"', () => {
    const msgMap = new Map();
    lootHandler(
      msgMap,
      [
        { name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 },
        { name: 'Eclipse moon tassets', quantity: 1, priceEach: 2_824_150 },
        { name: 'Blue moon spear', quantity: 1, priceEach: 1_200_000 },
        { name: 'Dual macuahuitl', quantity: 1, priceEach: 50_000_000 },
      ],
      'Swap',
      'Blood moon',
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M), 1x Eclipse moon tassets (2.82M), 1x Blue moon spear (1.20M), and 1x Dual macuahuitl (50M)** from'
    );
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

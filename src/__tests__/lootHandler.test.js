import { describe, expect, it, vi } from 'vitest';
import lootHandler from '../core/lootHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

function makeStatement() {
  return {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
}

/** @returns {*} */
function makeLootDb() {
  return { prepare: vi.fn().mockReturnValue(makeStatement()) };
}

describe('lootHandler', () => {
  it('only includes items above the 1,000,000 value threshold', async () => {
    const msgMap = new Map();
    await lootHandler(
      msgMap,
      [
        { name: 'Whip', quantity: 1, priceEach: 1_500_000 },
        { name: 'Bones', quantity: 1, priceEach: 100 },
      ],
      'Swap',
      'Man',
      makeLootDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('1x Whip');
    expect(msg).not.toContain('Bones');
  });

  it('applies customBossNames to the loot source', async () => {
    const msgMap = new Map();
    await lootHandler(
      msgMap,
      [{ name: 'Whip', quantity: 1, priceEach: 1_500_000 }],
      'Swap',
      'Phantom Muspah',
      makeLootDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('from **The Grumbler!**');
  });

  it('formats a single qualifying item with no conjunction', async () => {
    const msgMap = new Map();
    await lootHandler(
      msgMap,
      [{ name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 }],
      'Swap',
      'Blood moon',
      makeLootDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M)** from'
    );
  });

  it('joins two qualifying items with "and"', async () => {
    const msgMap = new Map();
    await lootHandler(
      msgMap,
      [
        { name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 },
        { name: 'Eclipse moon tassets', quantity: 1, priceEach: 2_824_150 },
      ],
      'Swap',
      'Blood moon',
      makeLootDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M)** and **1x Eclipse moon tassets (2.82M)** from'
    );
  });

  it('joins three qualifying items with an Oxford comma and "and"', async () => {
    const msgMap = new Map();
    await lootHandler(
      msgMap,
      [
        { name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 },
        { name: 'Eclipse moon tassets', quantity: 1, priceEach: 2_824_150 },
        { name: 'Blue moon spear', quantity: 1, priceEach: 1_200_000 },
      ],
      'Swap',
      'Blood moon',
      makeLootDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M)**, **1x Eclipse moon tassets (2.82M)**, and **1x Blue moon spear (1.20M)** from'
    );
  });

  it('joins four or more qualifying items with commas and a trailing "and"', async () => {
    const msgMap = new Map();
    await lootHandler(
      msgMap,
      [
        { name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 },
        { name: 'Eclipse moon tassets', quantity: 1, priceEach: 2_824_150 },
        { name: 'Blue moon spear', quantity: 1, priceEach: 1_200_000 },
        { name: 'Dual macuahuitl', quantity: 1, priceEach: 50_000_000 },
      ],
      'Swap',
      'Blood moon',
      makeLootDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has received **1x Blood moon chestplate (3.95M)**, **1x Eclipse moon tassets (2.82M)**, **1x Blue moon spear (1.20M)**, and **1x Dual macuahuitl (50M)** from'
    );
  });

  it('does not set a message or touch D1 when no items clear the threshold', async () => {
    const msgMap = new Map();
    const LOOT_DB = makeLootDb();
    const result = await lootHandler(
      msgMap,
      [{ name: 'Bones', quantity: 1, priceEach: 100 }],
      'Swap',
      'Man',
      LOOT_DB,
      'url'
    );
    expect(result).toBeUndefined();
    expect(msgMap.size).toBe(0);
    expect(LOOT_DB.prepare).not.toHaveBeenCalled();
  });

  it('records the summed qualifying value and the highest-value item in D1', async () => {
    const msgMap = new Map();
    const LOOT_DB = makeLootDb();
    await lootHandler(
      msgMap,
      [
        { name: 'Blood moon chestplate', quantity: 1, priceEach: 3_952_036 },
        { name: 'Eclipse moon tassets', quantity: 1, priceEach: 2_824_150 },
        { name: 'Bones', quantity: 1, priceEach: 100 },
      ],
      'Swap',
      'Blood moon',
      LOOT_DB,
      'url'
    );

    expect(LOOT_DB.prepare).toHaveBeenCalledTimes(1);
    expect(LOOT_DB.prepare.mock.calls[0][0]).toContain(
      'INSERT INTO loot_totals'
    );
    const statement = LOOT_DB.prepare.mock.results[0].value;
    expect(statement.bind).toHaveBeenCalledWith(
      'Swap',
      3_952_036 + 2_824_150,
      'Blood moon chestplate',
      3_952_036,
      'Blood moon',
      expect.any(String)
    );
  });
});

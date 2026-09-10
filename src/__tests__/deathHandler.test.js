import { describe, expect, it, vi } from 'vitest';
import deathHandler from '../core/deathHandler';

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

describe('deathHandler', () => {
  it('formats a PvP death with the killer name and value lost', async () => {
    const msgMap = new Map();
    await deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: true,
        valueLost: 5_000_000,
        killerName: 'PkScape',
        keptItems: [],
        lostItems: [],
        location: { regionId: 1234 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has just been killed by **PkScape** for **(5M)** coins'
    );
  });

  it('formats a PvM death without killer/value info', async () => {
    const msgMap = new Map();
    await deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: false,
        keptItems: [],
        lostItems: [],
        location: { regionId: 1234 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('**Swap** has died');
  });

  it('lists lost/kept food items sorted by quantity', async () => {
    const msgMap = new Map();
    await deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: false,
        keptItems: [{ name: 'Shark', quantity: 2 }],
        lostItems: [
          { name: 'Shark', quantity: 3 },
          { name: 'Manta ray', quantity: 1 },
        ],
        location: { regionId: 1234 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('5x Shark');
    expect(msg).toContain('1x Manta ray');
  });

  it('does not throw when location, keptItems, or lostItems are missing', async () => {
    const msgMap = new Map();
    await expect(
      deathHandler(msgMap, 'Swap', { isPvp: false }, makeWeeklyRecapDb(), 'url')
    ).resolves.not.toThrow();
    expect(firstMessage(msgMap)).toContain('**Swap** has died');
  });

  it('uses the grumbled message in the Grumbler region', async () => {
    const msgMap = new Map();
    await deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: false,
        keptItems: [],
        lostItems: [],
        location: { regionId: 11330 },
      },
      makeWeeklyRecapDb(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('**Swap** has been grumbled');
  });

  it('records the death count and value lost in D1', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeWeeklyRecapDb();
    await deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: true,
        valueLost: 5_000_000,
        killerName: 'PkScape',
        keptItems: [],
        lostItems: [],
        location: { regionId: 1234 },
      },
      WEEKLY_RECAP_DB,
      'url'
    );

    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(1);
    expect(WEEKLY_RECAP_DB.prepare.mock.calls[0][0]).toContain(
      'INSERT INTO deaths'
    );
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    expect(statement.bind).toHaveBeenCalledWith('Swap', 5_000_000);
  });

  it('does not crash when D1 write fails, message still sends', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    await deathHandler(
      msgMap,
      'Swap',
      { isPvp: false, keptItems: [], lostItems: [], location: { regionId: 1234 } },
      WEEKLY_RECAP_DB,
      'url'
    );
    expect(firstMessage(msgMap)).toContain('**Swap** has died');
  });
});

import { describe, expect, it } from 'vitest';
import deathHandler from './deathHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('deathHandler', () => {
  it('formats a PvP death with the killer name and value lost', () => {
    const msgMap = new Map();
    deathHandler(
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
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has just been killed by **PkScape** for **(5M)** coins'
    );
  });

  it('formats a PvM death without killer/value info', () => {
    const msgMap = new Map();
    deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: false,
        keptItems: [],
        lostItems: [],
        location: { regionId: 1234 },
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('**Swap** has died');
  });

  it('lists lost/kept food items sorted by quantity', () => {
    const msgMap = new Map();
    deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: false,
        keptItems: [{ name: 'Shark', quantity: 2 }],
        lostItems: [{ name: 'Shark', quantity: 3 }, { name: 'Manta ray', quantity: 1 }],
        location: { regionId: 1234 },
      },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('5x Shark');
    expect(msg).toContain('1x Manta ray');
  });

  it('does not throw when location, keptItems, or lostItems are missing', () => {
    const msgMap = new Map();
    expect(() =>
      deathHandler(msgMap, 'Swap', { isPvp: false }, 'url')
    ).not.toThrow();
    expect(firstMessage(msgMap)).toContain('**Swap** has died');
  });

  it('uses the grumbled message in the Grumbler region', () => {
    const msgMap = new Map();
    deathHandler(
      msgMap,
      'Swap',
      {
        isPvp: false,
        keptItems: [],
        lostItems: [],
        location: { regionId: 11330 },
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('**Swap** has been grumbled');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { crabHandler } from '../core/chatMsgHandler/crabHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

/** @param {{ first?: any, run?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(resolves.first),
    run: vi.fn().mockResolvedValue(resolves.run ?? { success: true }),
  };
}

describe('crabHandler', () => {
  it('increments and reports the gemstone crab kill count', async () => {
    const CRAB_DB = {
      prepare: vi
        .fn()
        // INSERT INTO crab_kc ... ON CONFLICT DO UPDATE
        .mockReturnValueOnce(makeStatement())
        // SELECT count FROM crab_kc ...
        .mockReturnValueOnce(makeStatement({ first: { count: 10 } })),
    };

    const msgMap = new Map();
    await crabHandler(msgMap, 'Swap', 'url', CRAB_DB);

    expect(CRAB_DB.prepare.mock.calls[0][0]).toContain('INSERT INTO crab_kc');
    expect(CRAB_DB.prepare.mock.calls[1][0]).toContain(
      'SELECT count FROM crab_kc'
    );
    expect(firstMessage(msgMap)).toContain('Gemstone Crab');
  });
});

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

  it('retries once and still records the kill after one transient D1 failure', async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error('D1 error'))
      .mockResolvedValueOnce({ success: true });
    // A failed attempt costs an extra prepare() call (the retry), so branch
    // on the SQL text instead of call order.
    const CRAB_DB = {
      prepare: vi
        .fn()
        .mockImplementation((sql) =>
          sql.includes('INSERT')
            ? { bind: vi.fn().mockReturnThis(), run }
            : makeStatement({ first: { count: 10 } })
        ),
    };

    const msgMap = new Map();
    await crabHandler(msgMap, 'Swap', 'url', CRAB_DB);

    expect(run).toHaveBeenCalledTimes(2);
    expect(firstMessage(msgMap)).toContain('Gemstone Crab');
  });

  it('logs a ready-to-run fix when the crab write fails on both attempts', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const run = vi.fn().mockRejectedValue(new Error('D1 error'));
    const CRAB_DB = {
      prepare: vi
        .fn()
        .mockImplementation((sql) =>
          sql.includes('INSERT')
            ? { bind: vi.fn().mockReturnThis(), run }
            : makeStatement({ first: { count: 10 } })
        ),
    };

    await crabHandler(new Map(), 'Swap', 'url', CRAB_DB);

    expect(run).toHaveBeenCalledTimes(2);
    const [logMessage] = consoleSpy.mock.calls[0];
    expect(logMessage).toContain(
      "INSERT INTO crab_kc (playername, count) VALUES ('Swap', 1) ON CONFLICT(playername) DO UPDATE SET count = count + 1;"
    );
    consoleSpy.mockRestore();
  });
});

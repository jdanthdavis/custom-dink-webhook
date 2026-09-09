import { describe, expect, it, vi } from 'vitest';
import petHandler from '../core/petHandler';

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

describe('petHandler', () => {
  it('increments the pet count on a first-time drop and includes the new total', async () => {
    const PETS_DB = {
      prepare: vi
        .fn()
        // INSERT INTO pets ... ON CONFLICT DO UPDATE
        .mockReturnValueOnce(makeStatement())
        // SELECT total_pets FROM pets ...
        .mockReturnValueOnce(makeStatement({ first: { total_pets: 5 } })),
    };

    const msgMap = new Map();
    await petHandler(
      msgMap,
      'Swap',
      { milestone: '500 kills', duplicate: false, petName: 'Baby mole' },
      PETS_DB,
      'url'
    );

    expect(PETS_DB.prepare).toHaveBeenCalledTimes(2);
    expect(PETS_DB.prepare.mock.calls[0][0]).toContain('INSERT INTO pets');
    expect(PETS_DB.prepare.mock.calls[1][0]).toContain(
      'SELECT total_pets FROM pets'
    );

    const msg = firstMessage(msgMap);
    expect(msg).toContain("they're being followed by **Baby mole**");
    expect(msg).toContain('5/71');
  });

  it('does not increment on a duplicate drop, but still reports the total', async () => {
    const PETS_DB = {
      prepare: vi
        .fn()
        .mockReturnValueOnce(makeStatement({ first: { total_pets: 10 } })),
    };

    const msgMap = new Map();
    await petHandler(
      msgMap,
      'Swap',
      { milestone: '500 kills', duplicate: true, petName: 'Baby mole' },
      PETS_DB,
      'url'
    );

    expect(PETS_DB.prepare).toHaveBeenCalledTimes(1);
    expect(PETS_DB.prepare.mock.calls[0][0]).toContain(
      'SELECT total_pets FROM pets'
    );

    const msg = firstMessage(msgMap);
    expect(msg).toContain('would have been followed by **Baby mole**');
  });

  it('falls back gracefully when the D1 query fails', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('D1 error')),
        run: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };

    const msgMap = new Map();
    await petHandler(
      msgMap,
      'Swap',
      { milestone: '500 kills', duplicate: false, petName: 'Baby mole' },
      PETS_DB,
      'url'
    );

    const msg = firstMessage(msgMap);
    expect(msg).toContain("they're being followed by **Baby mole**");
    expect(msg).not.toContain('undefined');
  });
});

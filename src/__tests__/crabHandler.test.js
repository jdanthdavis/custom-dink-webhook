import { afterEach, describe, expect, it, vi } from 'vitest';
import { crabHandler } from '../core/chatMsgHandler/crabHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('crabHandler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('increments and reports the gemstone crab kill count', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ playername: 'Swap' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ player: { count: 10 } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const msgMap = new Map();
    await crabHandler(msgMap, 'Swap', 'url', 'https://mongo.example');

    expect(fetchMock.mock.calls[0][0]).toContain('/increment-crab');
    expect(fetchMock.mock.calls[1][0]).toContain('/get-crab');
    expect(firstMessage(msgMap)).toContain('Gemstone Crab');
  });
});

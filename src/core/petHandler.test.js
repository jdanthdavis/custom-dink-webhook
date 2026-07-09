import { afterEach, describe, expect, it, vi } from 'vitest';
import petHandler from './petHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('petHandler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('increments the pet count on a first-time drop and includes the new total', async () => {
    const fetchMock = vi
      .fn()
      // POST /increment-pets
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ playername: 'Swap' }),
      })
      // GET /get-pets
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ player: { totalPets: 5 } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const msgMap = new Map();
    await petHandler(
      msgMap,
      'Swap',
      { milestone: '500 kills', duplicate: false, petName: 'Baby mole' },
      'https://mongo.example',
      'url'
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/increment-pets');
    expect(fetchMock.mock.calls[1][0]).toContain('/get-pets');

    const msg = firstMessage(msgMap);
    expect(msg).toContain("they're being followed by **Baby mole**");
    expect(msg).toContain('5/69');
  });

  it('does not increment on a duplicate drop, but still reports the total', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ player: { totalPets: 10 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const msgMap = new Map();
    await petHandler(
      msgMap,
      'Swap',
      { milestone: '500 kills', duplicate: true, petName: 'Baby mole' },
      'https://mongo.example',
      'url'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/get-pets');

    const msg = firstMessage(msgMap);
    expect(msg).toContain('would have been followed by **Baby mole**');
  });

  it('falls back gracefully when the middleware request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const msgMap = new Map();
    await petHandler(
      msgMap,
      'Swap',
      { milestone: '500 kills', duplicate: false, petName: 'Baby mole' },
      'https://mongo.example',
      'url'
    );

    const msg = firstMessage(msgMap);
    expect(msg).toContain("they're being followed by **Baby mole**");
    expect(msg).not.toContain('undefined');
  });
});

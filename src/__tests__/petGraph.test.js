import { afterEach, describe, expect, it, vi } from 'vitest';
import { petGraph } from '../core/chatMsgHandler/petGraph';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('petGraph', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports a single player\'s pets when a name is given', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          properName: 'Swap',
          player: {
            totalPets: 5,
            mostRecentPet: { name: 'Baby mole', dateGot: '01/01/2026' },
          },
        }),
      })
    );

    const msgMap = new Map();
    await petGraph('!Fetchpets Swap', msgMap, 'url', 'https://mongo.example');

    const msg = firstMessage(msgMap);
    expect(msg).toContain('**Swap** -> Total Pets: **5**');
    expect(msg).toContain('Baby mole');
  });

  it('reports a leaderboard sorted by total pets when no name is given', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          players: {
            Swap: { totalPets: 2, mostRecentPet: { name: 'Rocky', dateGot: '01/01/2026' } },
            Gout: { totalPets: 8, mostRecentPet: { name: 'Nid', dateGot: '01/02/2026' } },
          },
        }),
      })
    );

    const msgMap = new Map();
    await petGraph('!Fetchpets', msgMap, 'url', 'https://mongo.example');

    const msg = firstMessage(msgMap);
    const goutIndex = msg.indexOf('Gout');
    const swapIndex = msg.indexOf('Swap');
    expect(goutIndex).toBeGreaterThanOrEqual(0);
    expect(goutIndex).toBeLessThan(swapIndex);
  });
});
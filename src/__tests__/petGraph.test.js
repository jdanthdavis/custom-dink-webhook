import { describe, expect, it, vi } from 'vitest';
import { petGraph } from '../core/chatMsgHandler/petGraph';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

/** @param {{ first?: any, all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(resolves.first),
    all: vi.fn().mockResolvedValue(resolves.all),
  };
}

describe('petGraph', () => {
  it("reports a single player's pets when a name is given", async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          first: {
            playername: 'Swap',
            total_pets: 5,
            most_recent_pet_name: 'Baby mole',
            most_recent_pet_date: '01/01/2026',
          },
        })
      ),
    };

    const msgMap = new Map();
    await petGraph('!Fetchpets Swap', msgMap, 'url', PETS_DB);

    const msg = firstMessage(msgMap);
    expect(msg).toContain('**Swap** -> Total Pets: **5**');
    expect(msg).toContain('Baby mole');
  });

  it('reports a leaderboard sorted by total pets when no name is given', async () => {
    const PETS_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_pets: 2,
                most_recent_pet_name: 'Rocky',
                most_recent_pet_date: '01/01/2026',
              },
              {
                playername: 'Gout',
                total_pets: 8,
                most_recent_pet_name: 'Nid',
                most_recent_pet_date: '01/02/2026',
              },
            ],
          },
        })
      ),
    };

    const msgMap = new Map();
    await petGraph('!Fetchpets', msgMap, 'url', PETS_DB);

    const msg = firstMessage(msgMap);
    const goutIndex = msg.indexOf('Gout');
    const swapIndex = msg.indexOf('Swap');
    expect(goutIndex).toBeGreaterThanOrEqual(0);
    expect(goutIndex).toBeLessThan(swapIndex);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { lootGraph } from '../core/chatMsgHandler/lootGraph';

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

describe('lootGraph', () => {
  it("reports a single player's loot total when a name is given", async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          first: {
            playername: 'Swap',
            total_value: 5_000_000,
            last_item_name: 'Whip',
            last_item_value: 1_500_000,
            last_source: 'Man',
            last_drop_date: '01/01/2026',
          },
        })
      ),
    };

    const msgMap = new Map();
    await lootGraph('!Fetchloot Swap', msgMap, 'url', LOOT_DB);

    const msg = firstMessage(msgMap);
    expect(msg).toContain('**Swap** -> Total Loot Value: **5M**');
    expect(msg).toContain('Whip');
  });

  it('reports a leaderboard sorted by total value when no name is given', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(
        makeStatement({
          all: {
            results: [
              {
                playername: 'Swap',
                total_value: 2_000_000,
                last_item_name: 'Rune scimitar',
                last_source: 'Man',
                last_drop_date: '01/01/2026',
              },
              {
                playername: 'Gout',
                total_value: 8_000_000,
                last_item_name: 'Whip',
                last_source: 'Man',
                last_drop_date: '01/02/2026',
              },
            ],
          },
        })
      ),
    };

    const msgMap = new Map();
    await lootGraph('!Fetchloot', msgMap, 'url', LOOT_DB);

    const msg = firstMessage(msgMap);
    const goutIndex = msg.indexOf('Gout');
    const swapIndex = msg.indexOf('Swap');
    expect(goutIndex).toBeGreaterThanOrEqual(0);
    expect(goutIndex).toBeLessThan(swapIndex);
  });

  it('reports nothing when the player has no loot on record', async () => {
    const LOOT_DB = {
      prepare: vi.fn().mockReturnValue(makeStatement({ first: undefined })),
    };

    const msgMap = new Map();
    await lootGraph('!Fetchloot Nobody', msgMap, 'url', LOOT_DB);

    expect(msgMap.size).toBe(0);
  });
});

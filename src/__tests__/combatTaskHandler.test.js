import { describe, expect, it, vi } from 'vitest';
import combatTaskHandler from '../core/combatTaskHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

/** In-memory stand-in for a Cloudflare KV namespace binding. */
function createFakeKV() {
  const store = new Map();
  return {
    get: vi.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    put: vi.fn(async (key, value) => {
      store.set(key, value);
    }),
  };
}

describe('combatTaskHandler', () => {
  it('announces completing an entire tier', async () => {
    const msgMap = new Map();
    await combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'EASY',
        task: 'Kill 10 goblins',
        tierProgress: 10,
        tierTotalPoints: 10,
        justCompletedTier: 'EASY',
      },
      createFakeKV(),
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has completed the **Easy combat achievements**, by completing combat task: **Kill 10 goblins!**'
    );
  });

  it('formats progress toward Bronze when there is no current tier yet', async () => {
    const msgMap = new Map();
    await combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'EASY',
        task: 'Kill 10 goblins',
        tierProgress: 5,
        tierTotalPoints: 10,
      },
      createFakeKV(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('completed til **Bronze!**');
  });

  it('formats progress within the current tier', async () => {
    const msgMap = new Map();
    await combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'MEDIUM',
        task: 'Kill 10 hobgoblins',
        tierProgress: 5,
        tierTotalPoints: 10,
        currentTier: 'BRONZE',
      },
      createFakeKV(),
      'url'
    );
    expect(firstMessage(msgMap)).toContain('of **Bronze** tier completed!');
  });

  it('reconciles identical tierProgress values from same-tick task completions', async () => {
    // Real captured Dink payloads: killing Skotizo completed two combat
    // tasks in the same tick, so both arrived with tierProgress 117/128.
    const kv = createFakeKV();
    const base = { currentTier: 'EASY', tierTotalPoints: 128, taskPoints: 2 };

    const m1 = new Map();
    await combatTaskHandler(
      m1,
      'Frosty Dad',
      {
        ...base,
        tier: 'MEDIUM',
        task: 'Demonbane Weaponry',
        tierProgress: 113,
      },
      kv,
      'url'
    );
    expect(firstMessage(m1)).toContain('113/128');

    const m2 = new Map();
    await combatTaskHandler(
      m2,
      'Frosty Dad',
      { ...base, tier: 'MEDIUM', task: 'Demonic Weakening', tierProgress: 117 },
      kv,
      'url'
    );
    expect(firstMessage(m2)).toContain('115/128');

    const m3 = new Map();
    await combatTaskHandler(
      m3,
      'Frosty Dad',
      { ...base, tier: 'MEDIUM', task: 'Skotizo Champion', tierProgress: 117 },
      kv,
      'url'
    );
    expect(firstMessage(m3)).toContain('117/128');
  });

  it('resets tracked progress when currentTier changes', async () => {
    const kv = createFakeKV();
    await kv.put(
      'Swap',
      JSON.stringify({ currentTier: 'BRONZE', progress: 50 })
    );

    const msgMap = new Map();
    await combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'IRON',
        task: 'New task',
        tierProgress: 5,
        tierTotalPoints: 60,
        taskPoints: 5,
        currentTier: 'IRON',
      },
      kv,
      'url'
    );
    // Should reseed from the payload (5), not carry over Bronze's 50.
    expect(firstMessage(msgMap)).toContain('5/60');
  });

  it('trusts raw tierProgress when taskPoints is absent', async () => {
    const kv = createFakeKV();
    const msgMap = new Map();
    await combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'EASY',
        task: 'X',
        tierProgress: 8,
        tierTotalPoints: 10,
        currentTier: 'BRONZE',
      },
      kv,
      'url'
    );
    expect(firstMessage(msgMap)).toContain('8/10');
    expect(kv.get).not.toHaveBeenCalled();
  });

  it('still formats a message if KV get/put throw', async () => {
    const kv = {
      get: vi.fn().mockRejectedValue(new Error('boom')),
      put: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const msgMap = new Map();
    await combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'EASY',
        task: 'X',
        tierProgress: 8,
        tierTotalPoints: 10,
        taskPoints: 2,
        currentTier: 'BRONZE',
      },
      kv,
      'url'
    );
    expect(firstMessage(msgMap)).toContain('8/10');
  });
});

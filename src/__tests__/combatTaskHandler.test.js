import { describe, expect, it } from 'vitest';
import combatTaskHandler from '../core/combatTaskHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('combatTaskHandler', () => {
  it('announces completing an entire tier', () => {
    const msgMap = new Map();
    combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'EASY',
        task: 'Kill 10 goblins',
        tierProgress: 10,
        tierTotalPoints: 10,
        justCompletedTier: 'EASY',
      },
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has completed the **Easy combat achievements**, by completing combat task: **Kill 10 goblins!**'
    );
  });

  it('formats progress toward Bronze when there is no current tier yet', () => {
    const msgMap = new Map();
    combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'EASY',
        task: 'Kill 10 goblins',
        tierProgress: 5,
        tierTotalPoints: 10,
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('completed til **Bronze!**');
  });

  it('formats progress within the current tier', () => {
    const msgMap = new Map();
    combatTaskHandler(
      msgMap,
      'Swap',
      {
        tier: 'MEDIUM',
        task: 'Kill 10 hobgoblins',
        tierProgress: 5,
        tierTotalPoints: 10,
        currentTier: 'BRONZE',
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('of **Bronze** tier completed!');
  });
});

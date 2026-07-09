import { describe, expect, it } from 'vitest';
import levelUpHandler from '../core/levelUpHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('levelUpHandler', () => {
  it('sends an XP milestone message when xpData is present', () => {
    const msgMap = new Map();
    levelUpHandler(
      msgMap,
      'Swap',
      {
        xpData: { Attack: 1000000 },
        milestoneAchieved: ['Attack'],
      },
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has reached **1M XP** in **Attack!**'
    );
  });

  it('announces the highest possible total level of 2376', () => {
    const allSkills = Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [`Skill${i}`, 99])
    );
    const msgMap = new Map();
    levelUpHandler(
      msgMap,
      'Swap',
      { allSkills, levelledSkills: { Skill0: 99 } },
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      'has reached the highest possible total level of **2376**'
    );
  });

  it('announces a total-level milestone (divisible by 25) while skilling', () => {
    const msgMap = new Map();
    levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 50 },
        levelledSkills: { Attack: 50 },
      },
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has reached a new total level of **50**, by reaching **50** in **Attack!**'
    );
  });

  it('announces reaching level 99 in a single skill (non-milestone total)', () => {
    const msgMap = new Map();
    levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 99 },
        levelledSkills: { Attack: 99 },
      },
      'url'
    );
    expect(firstMessage(msgMap)).toContain(
      '**Swap** has levelled **Attack** to **99!**'
    );
  });

  it('uses a default message for a non-milestone level-up', () => {
    const msgMap = new Map();
    levelUpHandler(
      msgMap,
      'Swap',
      {
        allSkills: { Attack: 47 },
        levelledSkills: { Attack: 47 },
      },
      'url'
    );
    expect(firstMessage(msgMap)).toBe(
      '**Swap** has levelled **Attack** to **47!**'
    );
  });

  it('returns the msgMap unchanged when there are no levelled skills', () => {
    const msgMap = new Map();
    const result = levelUpHandler(
      msgMap,
      'Swap',
      { allSkills: {}, levelledSkills: {} },
      'url'
    );
    expect(result).toBe(msgMap);
    expect(msgMap.size).toBe(0);
  });
});

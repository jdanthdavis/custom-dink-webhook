import { describe, expect, it } from 'vitest';
import clueScrollHandler from '../core/clueScrollHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('clueScrollHandler', () => {
  it('formats a completed clue with its rewards and total value', () => {
    const msgMap = new Map();
    clueScrollHandler(
      msgMap,
      'Swap',
      {
        clueType: 'Hard',
        numberCompleted: 5,
        items: [
          { name: 'Rune platebody', quantity: 1, priceEach: 1_500_000 },
          { name: 'Coins', quantity: 1000, priceEach: 1 },
        ],
      },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('**5 Hard** clues!');
    expect(msg).toContain('Total Value: **1.50M**');
    expect(msg).toContain('- 1x Rune platebody **(1.50M)**');
    expect(msg).toContain('- 1000x Coins **(1K)**');
  });

  it('pluralizes "clue" only when more than one is completed', () => {
    const msgMap = new Map();
    clueScrollHandler(
      msgMap,
      'Swap',
      { clueType: 'Easy', numberCompleted: 1, items: [] },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('**1 Easy** clue!');
  });

  it('handles a missing items array without throwing', () => {
    const msgMap = new Map();
    expect(() =>
      clueScrollHandler(
        msgMap,
        'Swap',
        { clueType: 'Easy', numberCompleted: 1 },
        'url'
      )
    ).not.toThrow();
    expect(firstMessage(msgMap)).toContain('Total Value: **0**');
  });
});

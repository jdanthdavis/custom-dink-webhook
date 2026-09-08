import { describe, expect, it } from 'vitest';
import tcgHandler from '../core/tcgHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

const content =
  'Unique cards: 320 / 500 (64.0%)\nTotal cards: 320\nOpened packs: 150';

describe('tcgHandler', () => {
  it('ignores duplicate pulls', () => {
    const msgMap = new Map();
    const result = tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: false, foil: false } },
      'url'
    );
    expect(result).toBeUndefined();
    expect(msgMap.size).toBe(0);
  });

  it('ignores a new non-foil pull outside the accepted rarities', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Goblin', rarityTier: 'Common', newForCollection: true, foil: false } },
      'url'
    );
    expect(msgMap.size).toBe(0);
  });

  it('notifies on a new non-foil pull within an accepted rarity', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('**Swap** has pulled a **Legendary Zulrah**');
    expect(msg).toContain('pack **150 | 320/500 (64.0%)**');
    expect(msg).not.toContain('foil');
  });

  it('notifies on any new foil pull regardless of rarity', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Goblin', rarityTier: 'Common', newForCollection: true, foil: true } },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('**Common Goblin** :sparkles: *foil* :sparkles:');
  });

  it('handles space-delimited thousands separators in the content', () => {
    const spacedContent =
      "6out just added Statius's platelegs to their collection!\n\nCollection score: 181 289 545 (54.2%), Unique cards: 3 455 / 6 376 (54.2%), Unique foil cards: 54 / 6 376 (0.8%), Opened packs: 1 048, Total cards: 3 458";
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      '6out',
      spacedContent,
      { metadata: { cardName: "Statius's platelegs", rarityTier: 'Mythic', newForCollection: true, foil: false } },
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('pack **1,048 | 3,458/6,376 (54.2%)**');
  });
});

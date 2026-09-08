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
    // no "Collection score" or "Unique foil cards" in `content`, so those fall back to "—"
    expect(msg).toContain(
      '-# Collection score: — | Unique cards: 320/500 | Unique Foils: —'
    );
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
    // "Unique cards" here intentionally reuses cardProgress, which pairs "Total cards"
    // (3,458, includes duplicates) against the "Unique cards" universe - not the 3,455
    // distinct-owned figure - matching the same value already shown on the pack line above.
    expect(msg).toContain(
      '-# Collection score: 181,289,545 | Unique cards: 3,458/6,376 | Unique Foils: 54/6,376'
    );
  });

  it('adds a subtext stats line with collection score, unique cards, and unique foils', () => {
    const fullContent =
      'Collection score: 153 800 (0.10%), Unique cards: 5 / 5 173 (0.10%), Unique foil cards: 1 / 5 173 (0.02%), Opened packs: 1, Total cards: 5';
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'themildest1',
      fullContent,
      { metadata: { cardName: 'Dragon pickaxe', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      'url'
    );
    const msg = firstMessage(msgMap);
    const lines = msg.split('\n');
    expect(lines[0]).toBe(
      '**themildest1** has pulled a **Legendary Dragon pickaxe** on pack **1 | 5/5,173 (0.1%)**'
    );
    expect(lines[1]).toBe(
      '-# Collection score: 153,800 | Unique cards: 5/5,173 | Unique Foils: 1/5,173'
    );
  });
});

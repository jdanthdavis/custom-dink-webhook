import { describe, expect, it } from 'vitest';
import tcgHandler from '../core/tcgHandler';

/** @param {Map<any, object>} msgMap */
function firstEmbed(msgMap) {
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
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain('**Swap** has pulled a **Legendary Zulrah**');
    expect(embed.description).toContain('pack **150 | 320/500 (64.0%)**');
    expect(embed.description).not.toContain('foil');
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
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain('**Common Goblin** :sparkles: *foil* :sparkles:');
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
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain('pack **1,048 | 3,458/6,376 (54.2%)**');
  });

  it('links the card name to inspectUrl and sets color, thumbnail, and footer from the payload metadata', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Pigeon Cam',
      'Unique cards: 5 / 5173 (0.1%)\nTotal cards: 5\nOpened packs: 1',
      {
        metadata: {
          cardName: 'Rune pouch',
          rarityTier: 'Legendary',
          newForCollection: true,
          foil: false,
          inspectUrl: 'https://osrs-tcg.net/inspect/92b15d70-7090-4a2c-b60d-15bc2f58b485',
          imageUrl: 'https://osrs-tcg.net/images/items/detail/Rune_pouch_detail.webp',
          sourcePlugin: 'OSRS TCG',
        },
      },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain(
      '[Rune pouch](https://osrs-tcg.net/inspect/92b15d70-7090-4a2c-b60d-15bc2f58b485)'
    );
    expect(embed.thumbnail).toEqual({ url: 'https://osrs-tcg.net/images/items/detail/Rune_pouch_detail.webp' });
    expect(embed.footer).toEqual({ text: 'OSRS TCG' });
    expect(embed.color).toBe(0xe74c3c);
  });

  it('falls back to a plain card name and omits thumbnail/footer when their source data is absent', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain('**Legendary Zulrah**');
    expect(embed.description).not.toContain('[Zulrah]');
    expect(embed.thumbnail).toBeUndefined();
    expect(embed.footer).toBeUndefined();
  });
});

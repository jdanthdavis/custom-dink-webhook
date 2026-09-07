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
    expect(embed.description).toBe(
      'Swap has pulled a Legendary Zulrah\n\nPacks opened: **150**\nUnique cards: **320/500 (64.0%)**'
    );
    // non-foil, non-Mythic pulls stay lean: no foil/score lines, no foil marker
    expect(embed.description).not.toContain('Unique foils');
    expect(embed.description).not.toContain('Collection score');
    expect(embed.description).not.toContain('foil');
  });

  it('notifies on any new foil pull regardless of rarity', () => {
    const foilContent =
      'Collection score: 100 (1.0%)\nUnique cards: 320 / 500 (64.0%)\nUnique foil cards: 5 / 500 (1.0%)\nOpened packs: 150';
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      foilContent,
      { metadata: { cardName: 'Goblin', rarityTier: 'Common', newForCollection: true, foil: true } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(embed.description).toBe(
      'Swap has pulled a Common Goblin :sparkles: *foil* :sparkles:\n\n' +
        'Packs opened: **150**\n' +
        'Unique cards: **320/500 (64.0%)**\n' +
        'Unique foils: **5/500 (1.0%)**\n' +
        'Collection score: **100 (1.0%)**'
    );
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
    expect(embed.description).toContain('Packs opened: **1,048**');
    expect(embed.description).toContain('Unique cards: **3,455/6,376 (54.2%)**');
    // Mythic pulls show collection score even without foil
    expect(embed.description).toContain('Collection score: **181,289,545 (54.2%)**');
  });

  it('shows the true percentage to one decimal place instead of a rounded whole number', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      'Unique cards: 320 / 500 (64.0%)\nUnique foil cards: 412 / 5173 (7.965%)\nOpened packs: 150',
      { metadata: { cardName: 'Goblin', rarityTier: 'Common', newForCollection: true, foil: true } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain('Unique foils: **412/5,173 (8.0%)**');
  });

  it('links the card name to inspectUrl and sets thumbnail and color from the payload metadata', () => {
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
        },
      },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain(
      '[Rune pouch](https://osrs-tcg.net/inspect/92b15d70-7090-4a2c-b60d-15bc2f58b485)'
    );
    expect(embed.thumbnail).toEqual({ url: 'https://osrs-tcg.net/images/items/detail/Rune_pouch_detail.webp' });
    expect(embed.color).toBe(0xe74c3c);
  });

  it('falls back to a plain card name and omits the thumbnail when their source data is absent', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(embed.description).toContain('Legendary Zulrah');
    expect(embed.description).not.toContain('[Zulrah]');
    expect(embed.thumbnail).toBeUndefined();
  });
});

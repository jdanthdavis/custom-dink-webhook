import { describe, expect, it } from 'vitest';
import tcgHandler from '../core/tcgHandler';

/** @param {Map<any, object>} msgMap */
function firstEmbed(msgMap) {
  return [...msgMap.values()][0];
}

/** @param {object} embed @param {string} name */
function fieldNamed(embed, name) {
  return embed.fields.find((field) => field.name === name);
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
    expect(embed.description).toBe('**Swap** has pulled a **Legendary Zulrah**');
    expect(fieldNamed(embed, '📦 Opened Packs').value).toBe('150');
    expect(fieldNamed(embed, '🃏 Unique Cards').value).toContain('320/500 (64%)');
    // non-foil, non-Mythic pulls stay lean: no foil/score fields, no sparkle suffix
    expect(fieldNamed(embed, '✨ Unique Foils')).toBeUndefined();
    expect(fieldNamed(embed, '💰 Collection Score')).toBeUndefined();
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
    expect(embed.description).toContain('**Common Goblin** :sparkles: *foil* :sparkles:');
    expect(fieldNamed(embed, '🎴 This Pull').value).toBe('**Common** ✨ Foil');
    // foil pulls always surface foil progress and collection score, regardless of rarity
    expect(fieldNamed(embed, '✨ Unique Foils').value).toBe('5/500 (1%)');
    expect(fieldNamed(embed, '💰 Collection Score').value).toBe('100 (1%)');
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
    expect(fieldNamed(embed, '📦 Opened Packs').value).toBe('1,048');
    expect(fieldNamed(embed, '🃏 Unique Cards').value).toContain('3,455/6,376 (54.2%)');
    // Mythic pulls show collection score even without foil
    expect(fieldNamed(embed, '💰 Collection Score').value).toBe('181,289,545 (54.2%)');
  });

  it('renders a proportional progress bar for the unique card percentage', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      'Unique cards: 250 / 500 (50.0%)\nOpened packs: 10',
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(fieldNamed(embed, '🃏 Unique Cards').value).toContain('▓▓▓▓▓░░░░░');
  });

  it('calls out a round-number unique card milestone', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      'Unique cards: 100 / 500 (20.0%)\nOpened packs: 40',
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(fieldNamed(embed, '🎉 Milestone').value).toBe('100th unique card collected!');
  });

  it('calls out a first foil card milestone', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      'Unique cards: 10 / 500 (2.0%)\nUnique foil cards: 1 / 500 (0.2%)\nOpened packs: 5',
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: true } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(fieldNamed(embed, '🎉 Milestone').value).toBe('First foil card ever pulled!');
  });

  it('omits the milestone field when nothing notable happened', () => {
    const msgMap = new Map();
    tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      'url'
    );
    const embed = firstEmbed(msgMap);
    expect(fieldNamed(embed, '🎉 Milestone')).toBeUndefined();
  });

  it('links the card name to inspectUrl and sets thumbnail, footer, and timestamp from the payload metadata', () => {
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
    expect(() => new Date(embed.timestamp).toISOString()).not.toThrow();
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

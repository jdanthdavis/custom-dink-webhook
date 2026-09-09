import { describe, expect, it, vi } from 'vitest';
import tcgHandler from '../core/tcgHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

/** @param {{ all?: any }} [resolves] */
function makeStatement(resolves = {}) {
  return {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue(resolves.all),
  };
}

/** @returns {*} */
function makeTrackingDb() {
  return { prepare: vi.fn().mockReturnValue(makeStatement()) };
}

const content =
  'Unique cards: 320 / 500 (64.0%)\nTotal cards: 320\nOpened packs: 150';

describe('tcgHandler', () => {
  it('ignores duplicate pulls', async () => {
    const msgMap = new Map();
    const result = await tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: false, foil: false } },
      makeTrackingDb(),
      'url'
    );
    expect(result).toBeUndefined();
    expect(msgMap.size).toBe(0);
  });

  it('ignores a new non-foil pull outside the accepted rarities', async () => {
    const msgMap = new Map();
    await tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Goblin', rarityTier: 'Common', newForCollection: true, foil: false } },
      makeTrackingDb(),
      'url'
    );
    expect(msgMap.size).toBe(0);
  });

  it('notifies on a new non-foil pull within an accepted rarity', async () => {
    const msgMap = new Map();
    await tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      makeTrackingDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('**Swap** has pulled a **Legendary Zulrah**');
    expect(msg).toContain('pack **150!**');
    expect(msg).not.toContain('foil');
    // no "Collection score" or "Unique foil cards" in `content`, so those fall back to "—"
    expect(msg).toContain(
      '-# Collection score: — | Unique cards: 320/500 | Unique Foils: —'
    );
  });

  it('notifies on any new foil pull regardless of rarity', async () => {
    const msgMap = new Map();
    await tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Goblin', rarityTier: 'Common', newForCollection: true, foil: true } },
      makeTrackingDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('**Common Goblin** :sparkles: *foil* :sparkles:');
  });

  it('handles space-delimited thousands separators in the content', async () => {
    const spacedContent =
      "6out just added Statius's platelegs to their collection!\n\nCollection score: 181 289 545 (54.2%), Unique cards: 3 455 / 6 376 (54.2%), Unique foil cards: 54 / 6 376 (0.8%), Opened packs: 1 048, Total cards: 3 458";
    const msgMap = new Map();
    await tcgHandler(
      msgMap,
      '6out',
      spacedContent,
      { metadata: { cardName: "Statius's platelegs", rarityTier: 'Mythic', newForCollection: true, foil: false } },
      makeTrackingDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    expect(msg).toContain('pack **1,048!**');
    // "Unique cards" here intentionally reuses cardProgress, which pairs "Total cards"
    // (3,458, includes duplicates) against the "Unique cards" universe - not the 3,455
    // distinct-owned figure.
    expect(msg).toContain(
      '-# Collection score: 181,289,545 | Unique cards: 3,458/6,376 | Unique Foils: 54/6,376'
    );
  });

  it('adds a subtext stats line with collection score, unique cards, and unique foils', async () => {
    const fullContent =
      'Collection score: 153 800 (0.10%), Unique cards: 5 / 5 173 (0.10%), Unique foil cards: 1 / 5 173 (0.02%), Opened packs: 1, Total cards: 5';
    const msgMap = new Map();
    await tcgHandler(
      msgMap,
      'themildest1',
      fullContent,
      { metadata: { cardName: 'Dragon pickaxe', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      makeTrackingDb(),
      'url'
    );
    const msg = firstMessage(msgMap);
    const lines = msg.split('\n');
    expect(lines[0]).toBe(
      '**themildest1** has pulled a **Legendary Dragon pickaxe** on pack **1!**'
    );
    expect(lines[1]).toBe(
      '-# Collection score: 153,800 | Unique cards: 5/5,173 | Unique Foils: 1/5,173'
    );
  });

  it('records the TCG progress snapshot in D1, dupes included', async () => {
    const fullContent =
      'Collection score: 3 948 949 (2.54%), Unique cards: 131 / 5 167 (2.54%), Unique foil cards: 1 / 5 167 (0.02%), Opened packs: 27, Total cards: 135, Total foil cards: 2';
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = makeTrackingDb();
    await tcgHandler(
      msgMap,
      'Pigeon Cam',
      fullContent,
      { metadata: { cardName: 'Bronze chainbody', rarityTier: 'Common', newForCollection: true, foil: true } },
      WEEKLY_RECAP_DB,
      'url'
    );

    expect(WEEKLY_RECAP_DB.prepare).toHaveBeenCalledTimes(1);
    expect(WEEKLY_RECAP_DB.prepare.mock.calls[0][0]).toContain('INSERT INTO tcg_progress');
    const statement = WEEKLY_RECAP_DB.prepare.mock.results[0].value;
    expect(statement.bind).toHaveBeenCalledWith(
      'Pigeon Cam',
      3_948_949,
      135, // "Total cards" - dupes included, not the true-distinct 131
      5_167,
      2, // "Total foil cards" - dupes included, not the true-distinct 1
      5_167,
      27,
      'Bronze chainbody',
      expect.any(String)
    );
  });

  it('does not crash when D1 write fails, message still sends', async () => {
    const msgMap = new Map();
    const WEEKLY_RECAP_DB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('D1 error')),
      }),
    };
    await tcgHandler(
      msgMap,
      'Swap',
      content,
      { metadata: { cardName: 'Zulrah', rarityTier: 'Legendary', newForCollection: true, foil: false } },
      WEEKLY_RECAP_DB,
      'url'
    );
    expect(firstMessage(msgMap)).toContain('**Swap** has pulled a **Legendary Zulrah**');
  });
});

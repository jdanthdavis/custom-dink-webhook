import { describe, expect, it } from 'vitest';
import { untradeableDropHandler } from '../core/chatMsgHandler/untradeableDropHandler';
import { CHAT_MESSAGE_TYPES } from '../constants';

describe('untradeableDropHandler', () => {
  it('formats a vestige drop with its 5M note and mapped boss', () => {
    const msgMap = new Map();
    untradeableDropHandler(
      'Untradeable drop: Ultor vestige',
      'Swap',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('**Swap** has received **x1 Ultor vestige (5M)');
    expect(msg).toContain('from **Vardorvis!**');
  });

  it('formats a generic untradeable drop with its mapped boss', () => {
    const msgMap = new Map();
    untradeableDropHandler(
      'Untradeable drop: Purifying sigil',
      'Swap',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('**Swap** has received **x1 Purifying sigil');
    expect(msg).toContain('from **Yama!**');
  });

  it('formats a ToB kit drop', () => {
    const msgMap = new Map();
    untradeableDropHandler(
      'Player found something special: Holy ornament kit',
      'Swap',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('x1 Holy ornament kit');
    expect(msg).toContain('from **Theatre of Blood: Hard Mode!**');

    const [key] = [...msgMap.keys()];
    expect(key.ID).toBe(CHAT_MESSAGE_TYPES.TOB_KIT);
  });

  it('formats a maggot egg drop with its mapped boss', () => {
    const msgMap = new Map();
    untradeableDropHandler(
      'Swap received a drop: Maggot egg',
      'Swap',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('**Swap** has received **x1 Maggot egg');
    expect(msg).toContain('from **Maggot King!**');

    const [key] = [...msgMap.keys()];
    expect(key.ID).toBe(CHAT_MESSAGE_TYPES.MAGGOT_EGG);
  });

  it('ignores raid special loot when the name differs from the payload player', () => {
    const msgMap = new Map();
    untradeableDropHandler(
      'LSx Swap received special loot from a raid: Cabbage.',
      'Swap',
      msgMap,
      'url'
    );
    expect(msgMap.size).toBe(0);
  });

  it('formats a raid special loot drop', () => {
    const msgMap = new Map();
    untradeableDropHandler(
      'LSx Swap received special loot from a raid: Cabbage.',
      'LSx Swap',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('**LSx Swap** has received **x1 Cabbage**');
    expect(msg).toContain('from **Fractured Archive!**');

    const [key] = [...msgMap.keys()];
    expect(key.ID).toBe(CHAT_MESSAGE_TYPES.RAID_SPECIAL_LOOT);
  });

  it('does not set a message when nothing matches', () => {
    const msgMap = new Map();
    untradeableDropHandler('unrelated message', 'Swap', msgMap, 'url');
    expect(msgMap.size).toBe(0);
  });
});

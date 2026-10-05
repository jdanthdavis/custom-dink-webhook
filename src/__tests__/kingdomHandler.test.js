import { describe, expect, it } from 'vitest';
import { kingdomHandler } from '../core/chatMsgHandler/kingdomHandler';

describe('kingdomHandler', () => {
  it('formats the approval and coffer', () => {
    const msgMap = new Map();
    kingdomHandler(
      'Your Kingdom of Miscellania approval is 98%, and your coffer has 1.00M coins.',
      'Pigeon Cam',
      msgMap,
      'url'
    );
    expect([...msgMap.keys()][0].URL).toBe('url');
    expect([...msgMap.values()][0]).toBe(
      "**Pigeon Cam**'s Kingdom of Miscellania is at **98%** approval with **1.00M** coins in the coffer."
    );
  });

  it.each(['750K', '7,500,000', '0'])('handles a coffer of %s', (coffer) => {
    const msgMap = new Map();
    kingdomHandler(
      `Your Kingdom of Miscellania approval is 100%, and your coffer has ${coffer} coins.`,
      'Pigeon Cam',
      msgMap,
      'url'
    );
    expect([...msgMap.values()][0]).toContain(`**${coffer}** coins`);
  });

  it('does not set a message when the text does not match', () => {
    const msgMap = new Map();
    kingdomHandler('unrelated message', 'Pigeon Cam', msgMap, 'url');
    expect(msgMap.size).toBe(0);
  });
});

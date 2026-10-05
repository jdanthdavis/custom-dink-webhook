import { describe, expect, it } from 'vitest';
import { kingdomHandler } from '../core/chatMsgHandler/kingdomHandler';

const kingdomMessage = (approval, coffer = '1.00M') =>
  `Your Kingdom of Miscellania approval is ${approval}%, and your coffer has ${coffer} coins.`;
const discordIds = JSON.stringify({ 'pigeon cam': '123456789012345678' });

describe('kingdomHandler', () => {
  it('pings the player when their Discord ID is known', () => {
    const msgMap = new Map();
    kingdomHandler(kingdomMessage(72), 'Pigeon Cam', msgMap, 'url', discordIds);
    expect([...msgMap.keys()][0].URL).toBe('url');
    expect([...msgMap.values()][0]).toBe(
      '**<@123456789012345678>** your **Kingdom of Miscellania** approval rating is too low!\n' +
        '-# Approval Rating: 72% | Coffer: 1.00M gp'
    );
  });

  it('does not post when the player has no Discord ID', () => {
    const msgMap = new Map();
    kingdomHandler(kingdomMessage(72), 'LSx Swap', msgMap, 'url', discordIds);
    expect(msgMap.size).toBe(0);
  });

  it.each([undefined, '{oops'])(
    'does not post when the IDs secret is %s',
    (secret) => {
      const msgMap = new Map();
      kingdomHandler(kingdomMessage(72), 'Pigeon Cam', msgMap, 'url', secret);
      expect(msgMap.size).toBe(0);
    }
  );

  it('fires just below the threshold', () => {
    const msgMap = new Map();
    kingdomHandler(kingdomMessage(98), 'Pigeon Cam', msgMap, 'url', discordIds);
    expect(msgMap.size).toBe(1);
  });

  it.each([99, 100])('does not fire at %i%% approval', (approval) => {
    const msgMap = new Map();
    kingdomHandler(
      kingdomMessage(approval),
      'Pigeon Cam',
      msgMap,
      'url',
      discordIds
    );
    expect(msgMap.size).toBe(0);
  });

  it.each(['750K', '7,500,000', '0'])('handles a coffer of %s', (coffer) => {
    const msgMap = new Map();
    kingdomHandler(
      kingdomMessage(50, coffer),
      'Pigeon Cam',
      msgMap,
      'url',
      discordIds
    );
    expect([...msgMap.values()][0]).toContain(`Coffer: ${coffer} gp`);
  });

  it('does not set a message when the text does not match', () => {
    const msgMap = new Map();
    kingdomHandler(
      'unrelated message',
      'Pigeon Cam',
      msgMap,
      'url',
      discordIds
    );
    expect(msgMap.size).toBe(0);
  });
});

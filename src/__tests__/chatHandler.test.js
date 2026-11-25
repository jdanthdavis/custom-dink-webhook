import { describe, expect, it } from 'vitest';
import chatHandler from '../core/chatMsgHandler/chatHandler';

describe('chatHandler', () => {
  it('drops a drop broadcast from a non-tracked player before dispatching', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Random Clanmate received a drop: Purifying sigil',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {}
    );
    expect(msgMap.size).toBe(0);
  });

  it('drops a Barracuda Trial broadcast from a non-tracked player before dispatching', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Random Clanmate has achieved a new Tempor Tantrum Marlin personal best: 4:18.60',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {}
    );
    expect(msgMap.size).toBe(0);
  });

  it('dispatches a Barracuda Trial broadcast from a tracked player', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Pigeon Cam has achieved a new Tempor Tantrum Marlin personal best: 4:18.60',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {}
    );
    expect(msgMap.size).toBe(1);
    expect([...msgMap.values()][0]).toContain('Tempor Tantrum Marlin');
  });

  it('announces a Prison of Ræun PB when in region 10915', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Lap duration: 1:53.40 (new personal best)',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {},
      undefined,
      undefined,
      undefined,
      'GAMEMESSAGE',
      10915
    );
    expect([...msgMap.values()]).toEqual([
      '**Pigeon Cam** has achieved a new Prison of Ræun personal best of **1:53.40!**',
    ]);
  });

  it('ignores the Lap duration PB outside region 10915', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Lap duration: 1:53.40 (new personal best)',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {},
      undefined,
      undefined,
      undefined,
      'GAMEMESSAGE',
      12345
    );
    expect(msgMap.size).toBe(0);
  });

  it('dispatches a Kingdom of Miscellania message to MISCELLANIA_URL', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Your Kingdom of Miscellania approval is 72%, and your coffer has 1.00M coins.',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {},
      'miscUrl',
      JSON.stringify({ 'Pigeon Cam': '123456789012345678' })
    );
    expect(msgMap.size).toBe(1);
    expect([...msgMap.keys()][0].URL).toBe('miscUrl');
  });

  it('dispatches raid special loot from clan chat', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Pigeon Cam received special loot from a raid: Cabbage.',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {},
      'miscUrl',
      undefined,
      undefined,
      'CLAN_CHAT'
    );
    expect(msgMap.size).toBe(1);
    expect([...msgMap.values()][0]).toContain('Cabbage');
  });

  it('ignores raid special loot that did not come from clan chat', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'Pigeon Cam received special loot from a raid: Cabbage.',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {},
      'miscUrl',
      undefined,
      undefined,
      'PUBLICCHAT'
    );
    expect(msgMap.size).toBe(0);
  });

  it('does not block message types that never embed a name', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'You catch an enormous shark!',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {}
    );
    expect(msgMap.size).toBe(1);
  });
});

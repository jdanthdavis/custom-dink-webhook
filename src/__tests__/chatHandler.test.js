import { describe, expect, it } from 'vitest';
import chatHandler from '../core/chatMsgHandler/chatHandler';

describe('chatHandler', () => {
  it('formats a Fractured Archive personal best when the message ends in (new personal best)', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'The Fractured Archive: Total completion time: 12:34.56 (new personal best)',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {}
    );
    const [[key, msg]] = [...msgMap.entries()];
    expect(key.URL).toBe('pbUrl');
    expect(msg).toBe(
      '**Pigeon Cam** has achieved a new **Fractured Archive** personal best of **12:34.56!**'
    );
  });

  it('does not report a Fractured Archive time that is not a personal best', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'The Fractured Archive: Total completion time: 12:34.56',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {}
    );
    expect(msgMap.size).toBe(0);
  });

  it('does not report a Fractured Archive time when (new personal best) is not at the end', async () => {
    const msgMap = new Map();
    await chatHandler(
      msgMap,
      'Pigeon Cam',
      'The Fractured Archive: Total completion time: 12:34.56 (new personal best) extra',
      'pbUrl',
      'lootUrl',
      'kcUrl',
      {}
    );
    expect(msgMap.size).toBe(0);
  });

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

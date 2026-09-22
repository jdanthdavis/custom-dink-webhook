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

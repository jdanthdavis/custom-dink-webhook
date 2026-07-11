import { describe, expect, it } from 'vitest';
import { bigFishHandler } from '../core/chatMsgHandler/bigFishHandler';

describe('bigFishHandler', () => {
  it('sets a randomized message with the fish and player name substituted in', () => {
    const msgMap = new Map();
    bigFishHandler('You catch an enormous Shark!', 'Swap', msgMap, 'url');
    expect(msgMap.size).toBe(1);
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('**Shark**');
    expect(msg).toContain('**Swap**');
  });

  it('does not set a message when the text does not match', () => {
    const msgMap = new Map();
    bigFishHandler('You catch a normal fish.', 'Swap', msgMap, 'url');
    expect(msgMap.size).toBe(0);
  });
});

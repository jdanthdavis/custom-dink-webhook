import { describe, expect, it } from 'vitest';
import { sepulchreHandler } from '../core/chatMsgHandler/sepulchreHandler';

describe('sepulchreHandler', () => {
  it('formats an overall personal best', () => {
    const msgMap = new Map();
    sepulchreHandler(
      'Overall time: 5:30.20 (new personal best)',
      'Swap',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('**Hallowed Sepulchre (Overall)** personal best of **5:30.20!**');
  });

  it('formats a floor personal best', () => {
    const msgMap = new Map();
    sepulchreHandler(
      'Floor 3 time: 1:10.50 (new personal best)',
      'Swap',
      msgMap,
      'url'
    );
    const msg = [...msgMap.values()][0];
    expect(msg).toContain('**Hallowed Sepulchre (Floor 3)** personal best of **1:10.50!**');
  });

  it('does not set a message when the text does not match', () => {
    const msgMap = new Map();
    sepulchreHandler('unrelated message', 'Swap', msgMap, 'url');
    expect(msgMap.size).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { delveHandler } from './delveHandler';

describe('delveHandler', () => {
  it('reports a Doom of Mokhaiotl kill count from a plain "Deep delves: N" message', () => {
    const msgMap = new Map();
    delveHandler('Deep delves: 25', 'Swap', msgMap, 'url');
    expect(msgMap.size).toBe(1);
  });

  it('ignores a delve-level personal-best message (handled elsewhere)', () => {
    const msgMap = new Map();
    delveHandler('Delve level: 5:30.20', 'Swap', msgMap, 'url');
    expect(msgMap.size).toBe(0);
  });

  it('does not crash and does not notify when the count cannot be parsed', () => {
    const msgMap = new Map();
    expect(() =>
      delveHandler('Deep delves without a count', 'Swap', msgMap, 'url')
    ).not.toThrow();
    expect(msgMap.size).toBe(0);
  });
});

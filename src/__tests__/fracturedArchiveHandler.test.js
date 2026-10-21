import { describe, expect, it } from 'vitest';
import { fracturedArchiveHandler } from '../core/chatMsgHandler/fracturedArchiveHandler';

describe('fracturedArchiveHandler', () => {
  it('reports a milestone count', () => {
    const msgMap = new Map();
    fracturedArchiveHandler(
      'Your completed Fractured Archive count is:100',
      'Swap',
      msgMap,
      'url'
    );
    expect(msgMap.size).toBe(1);
    expect([...msgMap.values()][0]).toContain('Fractured Archive');
  });

  it('parses a count with a space and thousands separator', () => {
    const msgMap = new Map();
    fracturedArchiveHandler(
      'Your completed Fractured Archive count is: 1,100',
      'Swap',
      msgMap,
      'url'
    );
    expect(msgMap.size).toBe(1);
  });

  it('always notifies on the first completion', () => {
    const msgMap = new Map();
    fracturedArchiveHandler(
      'Your completed Fractured Archive count is:1',
      'Swap',
      msgMap,
      'url'
    );
    expect(msgMap.size).toBe(1);
    expect([...msgMap.values()][0]).not.toContain('@everyone');
  });

  it('does not notify for a non-milestone count', () => {
    const msgMap = new Map();
    fracturedArchiveHandler(
      'Your completed Fractured Archive count is:3',
      'Swap',
      msgMap,
      'url'
    );
    expect(msgMap.size).toBe(0);
  });

  it('does not crash when the count cannot be parsed', () => {
    const msgMap = new Map();
    expect(() =>
      fracturedArchiveHandler('Fractured Archive', 'Swap', msgMap, 'url')
    ).not.toThrow();
    expect(msgMap.size).toBe(0);
  });
});

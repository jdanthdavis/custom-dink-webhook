import { describe, expect, it } from 'vitest';
import personalBestHandler from '../core/personalBestHandler';

/** @param {Map<any, string>} msgMap */
function firstMessage(msgMap) {
  return [...msgMap.values()][0];
}

describe('personalBestHandler', () => {
  it('formats a minutes-only duration with :00 seconds', () => {
    const msgMap = new Map();
    personalBestHandler(msgMap, 'Swap', { boss: 'Zulrah', time: 'PT1M' }, 'url');
    expect(firstMessage(msgMap)).toContain('personal best of **1:00!**');
  });

  it('formats a seconds-only duration as "Ns"', () => {
    const msgMap = new Map();
    personalBestHandler(msgMap, 'Swap', { boss: 'Zulrah', time: 'PT30S' }, 'url');
    expect(firstMessage(msgMap)).toContain('personal best of **30s!**');
  });

  it('formats minutes and seconds with milliseconds, no padding needed', () => {
    const msgMap = new Map();
    personalBestHandler(
      msgMap,
      'Swap',
      { boss: 'Zulrah', time: 'PT1M30.5S' },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('personal best of **1:30.5!**');
  });

  it('pads a single-digit seconds value with milliseconds', () => {
    const msgMap = new Map();
    personalBestHandler(
      msgMap,
      'Swap',
      { boss: 'Zulrah', time: 'PT1M5.2S' },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('personal best of **1:05.2!**');
  });

  it('pads a single-digit whole-second value', () => {
    const msgMap = new Map();
    personalBestHandler(msgMap, 'Swap', { boss: 'Zulrah', time: 'PT1M5S' }, 'url');
    expect(firstMessage(msgMap)).toContain('personal best of **1:05!**');
  });

  it('applies grumblerCheck to the boss name', () => {
    const msgMap = new Map();
    personalBestHandler(
      msgMap,
      'Swap',
      { boss: 'Phantom Muspah', time: 'PT1M' },
      'url'
    );
    expect(firstMessage(msgMap)).toContain('defeated **The Grumbler**');
  });
});

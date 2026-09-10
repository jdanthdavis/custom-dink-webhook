import { describe, expect, it } from 'vitest';
import formatPbTime from '../core/helperFunctions/formatPbTime';

describe('formatPbTime', () => {
  it('formats a minutes-only duration with :00 seconds', () => {
    expect(formatPbTime('PT1M')).toBe('1:00');
  });

  it('formats a seconds-only duration as "Ns"', () => {
    expect(formatPbTime('PT30S')).toBe('30s');
  });

  it('formats minutes and seconds with milliseconds, no padding needed', () => {
    expect(formatPbTime('PT1M30.5S')).toBe('1:30.5');
  });

  it('pads a single-digit seconds value with milliseconds', () => {
    expect(formatPbTime('PT1M5.2S')).toBe('1:05.2');
  });

  it('pads a single-digit whole-second value', () => {
    expect(formatPbTime('PT1M5S')).toBe('1:05');
  });

  it('formats hours, zero-padding minutes and seconds', () => {
    expect(formatPbTime('PT1H2M3S')).toBe('1:02:03');
  });

  it('formats hours with a decimal seconds value', () => {
    expect(formatPbTime('PT1H0M5.5S')).toBe('1:00:05.5');
  });

  it('returns null for missing or unparseable input', () => {
    expect(formatPbTime(undefined)).toBeNull();
    expect(formatPbTime('')).toBeNull();
    expect(formatPbTime('not a duration')).toBeNull();
  });
});

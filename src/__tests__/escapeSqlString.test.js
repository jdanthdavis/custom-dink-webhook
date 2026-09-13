import { describe, expect, it } from 'vitest';
import escapeSqlString from '../core/helperFunctions/escapeSqlString';

describe('escapeSqlString', () => {
  it('leaves a plain string unchanged', () => {
    expect(escapeSqlString('Swap')).toBe('Swap');
  });

  it('doubles a single quote', () => {
    expect(escapeSqlString("O'Brien")).toBe("O''Brien");
  });

  it('doubles every single quote in a string with multiple', () => {
    expect(escapeSqlString("it's a 'test'")).toBe("it''s a ''test''");
  });
});

import killCountHandler from './killCountHandler';
import { grumblerCheck, killCountMsgConstructor } from '../helperFunctions';
import * as Constants from '../../constants';

jest.mock('../helperFunctions', () => ({
  grumblerCheck: jest.fn(),
  killCountMsgConstructor: jest.fn(),
}));

let mockSpecialKills = [];

jest.mock('../../constants', () => ({
  bossMap: new Map(),
  get specialKills() {
    return mockSpecialKills;
  },
}));

describe('killCountHandler', () => {
  let msgMap;
  let playerName;
  let boss;
  let gameMessage;
  let URL;
  let extra;

  beforeEach(() => {
    grumblerCheck.mockClear();
    killCountMsgConstructor.mockClear();
    Constants.bossMap.clear();
    mockSpecialKills = [];

    msgMap = new Map();
    playerName = 'LSx Swap';
    boss = '';
    gameMessage = '';
    URL = 'http://example.com';
    extra = {};
  });

  it('adds a message when a kill count is divisible by boss interval', () => {
    boss = 'Tzkal-Zuk';
    gameMessage = 'Your Tzkal-Zuk kill count is: 100.';
    extra = { boss, count: 100, gameMessage };

    grumblerCheck.mockReturnValue(boss);
    Constants.bossMap.set('TZKAL-ZUK', 5);

    const result = killCountHandler(msgMap, playerName, extra, URL);

    expect(killCountMsgConstructor).toHaveBeenCalledWith(
      playerName,
      gameMessage,
      boss,
      100
    );
    expect(result.size).toBeGreaterThan(0);
  });

  it('adds a message when kill count matches a special kill', () => {
    mockSpecialKills.push('SPECIAL_BOSS');

    boss = 'special_boss';
    gameMessage = 'Your special_boss kill count is: 1.';
    extra = { boss, count: 1, gameMessage };

    grumblerCheck.mockReturnValue(boss);

    const result = killCountHandler(msgMap, playerName, extra, URL);

    expect(killCountMsgConstructor).toHaveBeenCalledWith(
      playerName,
      gameMessage,
      boss,
      1
    );
    expect(result.size).toBeGreaterThan(0);
  });

  it('does not add a message when kill count is not divisible and not special', () => {
    boss = 'Tzkal-Zuk';
    gameMessage = 'Your Tzkal-Zuk kill count is: 3.';
    extra = { boss, count: 3, gameMessage };

    grumblerCheck.mockReturnValue(boss);
    Constants.bossMap.set('TZKAL-ZUK', 5);

    const result = killCountHandler(msgMap, playerName, extra, URL);

    expect(killCountMsgConstructor).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it('adds a message when kill count is divisible by special kill condition', () => {
    boss = 'special_boss';
    gameMessage = 'Your special_boss kill count is: 100.';
    extra = { boss, count: 100, gameMessage };

    grumblerCheck.mockReturnValue(boss);

    const result = killCountHandler(msgMap, playerName, extra, URL);

    expect(killCountMsgConstructor).toHaveBeenCalledWith(
      playerName,
      gameMessage,
      boss,
      100
    );
    expect(result.size).toBeGreaterThan(0);
  });

  it('handles an empty game message gracefully', () => {
    boss = 'special_boss';
    gameMessage = '';
    extra = { boss, count: 1, gameMessage };

    grumblerCheck.mockReturnValue(boss);

    const result = killCountHandler(msgMap, playerName, extra, URL);

    expect(killCountMsgConstructor).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it('handles when extra is undefined', () => {
    grumblerCheck.mockReturnValue(null);
    const result = killCountHandler(msgMap, playerName, undefined, URL);

    expect(killCountMsgConstructor).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });
});

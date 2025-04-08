export const COLLECTION = 'COLLECTION';
export const PET = 'PET';
export const KILL_COUNT = 'KILL_COUNT';
export const COMBAT_ACHIEVEMENT = 'COMBAT_ACHIEVEMENT';
export const CLUE = 'CLUE';
export const LOOT = 'LOOT';
export const CHAT = 'CHAT';

export const bossMap = Object.freeze(
  new Map([
    ['TZKAL-ZUK', 5],
    ['SOL HEREDIT', 5],
    ['THEATRE OF BLOOD: HARD MODE', 10],
    ['CHAMBERS OF XERIC: CHALLENGE MODE', 10],
    ["PHOSANI'S NIGHTMARE", 25],
    ['THE NIGHTMARE', 25],
    ['CORPOREAL BEAST', 50],
    ['HERBIBOAR', 150],
    ['TEST', 1],
  ])
);

export const specialKills = Object.freeze([
  'SOL HEREDIT',
  'TZKAL-ZUK',
  'TZTOK-JAD',
]);

export const acceptedPayloads = Object.freeze([
  'KILL_COUNT',
  'CHAT',
  'COLLECTION',
  'PET',
  'COMBAT_ACHIEVEMENT',
  'CLUE',
  'LOOT',
]);

export const CHAT_MESSAGE_TYPES = Object.freeze({
  UNTRADEABLE_DROP: 'UNTRADEABLE_DROP',
  NEW_PERSONAL_BEST: 'NEW_PERSONAL_BEST',
});

export const UNTRADEABLE_MAP = Object.freeze({
  vestiges: {
    ultor: {
      itemName: 'Ultor vestige',
      boss: 'Vardorvis',
      thumbnail: '28285',
      value: '5M',
    },
    bellator: {
      itemName: 'Bellator vestige',
      boss: 'The Whisperer',
      thumbnail: '28279',
      value: '5M',
    },
    magus: {
      itemName: 'Magus vestige',
      boss: 'Duke Sucellus',
      thumbnail: '28281',
      value: '5M',
    },
    venator: {
      itemName: 'Venator vestige',
      boss: 'The Leviathan',
      thumbnail: '28283',
      value: '5M',
    },
  },
  araxyte: {
    araxyte_fang: {
      itemName: 'Araxyte fang',
      boss: 'Araxxor',
      thumbnail: '29799',
      value: '50M',
    },
  },
});

export const CHAT_REGEX = Object.freeze({
  VESTIGE_TEXT: /Untradeable drop: (Ultor|Bellator|Magus|Venator) vestige/,
  OVERALL_TIME_TEXT:
    /Overall time: (\d{1,2}:\d{2}\.\d{2}) \(new personal best\)/,
  FLOOR_TIME_TEXT:
    /Floor ([1-5]) time: (\d{1,2}:\d{2}\.\d{2}) \(new personal best\)/,
  ARAXYTE_FANG: /.+? received a drop: Araxyte fang/,
});

export const RULES = Object.freeze({
  drops: {
    minLootValue: 1000000,
  },
  clueScrolls: {
    minValue: 500000,
  },
  chat: {
    messageTypes: ['GAMEMESSAGE'],
  },
});

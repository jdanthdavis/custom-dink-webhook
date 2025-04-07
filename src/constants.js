export const COLLECTION = 'COLLECTION';
export const PET = 'PET';
export const KILL_COUNT = 'KILL_COUNT';
export const COMBAT_ACHIEVEMENT = 'COMBAT_ACHIEVEMENT';
export const CLUE = 'CLUE';
export const LOOT = 'LOOT';
export const CHAT = 'CHAT';
export const WIKI_SEARCH =
  'https://oldschool.runescape.wiki/w/Special:Search?search=';

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
  VESTIGE_DROP: 'VESTIGE_DROP',
  NEW_PERSONAL_BEST: 'NEW_PERSONAL_BEST',
});

export const VESTIGE_MAP = Object.freeze({
  Ultor: {
    boss: 'Vardorvis',
    bossLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=Vardorvis',
    itemLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=Ultor_vestige',
    thumbnail: 'https://static.runelite.net/cache/item/icon/28285.png',
  },
  Bellator: {
    boss: 'The Whisperer',
    bossLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=The_Whisperer',
    itemLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=Bellator_vestige',
    thumbnail: 'https://static.runelite.net/cache/item/icon/28279.png',
  },
  Magus: {
    boss: 'Duke Sucellus',
    bossLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=Duke_Sucellus',
    itemLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=Magus_vestige',
    thumbnail: 'https://static.runelite.net/cache/item/icon/28281.png',
  },
  Venator: {
    boss: 'The Leviathan',
    bossLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=The_Leviathan',
    itemLink:
      'https://oldschool.runescape.wiki/w/Special:Search?search=Venator_vestige',
    thumbnail: 'https://static.runelite.net/cache/item/icon/28283.png',
  },
});

export const CHAT_REGEX = Object.freeze({
  VESTIGE_TEXT: /Untradeable drop: (Ultor|Bellator|Magus|Venator) vestige/,
  OVERALL_TIME_TEXT:
    /Overall time: (\d{1,2}:\d{2}\.\d{2}) \(new personal best\)/,
  FLOOR_TIME_TEXT:
    /Floor ([1-5]) time: (\d{1,2}:\d{2}\.\d{2}) \(new personal best\)/,
  BIG_FISH: /You catch an enormous (.+)!/,
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

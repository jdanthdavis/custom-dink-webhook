// misc
export const THE_GRUMBLER = 'The Grumbler';
export const PHANTOM_MUSPAH = 'PHANTOM MUSPAH';
export const MUPHIN = 'MUPHIN';
export const COLLECTION = 'COLLECTION';
export const COMBAT_ACHIEVEMENT = 'COMBAT_ACHIEVEMENT';
export const CLUE = 'CLUE';
export const LOOT = 'LOOT';
export const CHAT = 'CHAT';
export const DEATH = 'DEATH';
export const theBoys = [
  'LSX SWAP',
  'MOOREI',
  'GOUT HAVER',
  'GLASSFACE',
  'Z4M',
  'Z4M I',
  'THEMILDEST1',
  'CAN IT WORM',
  'MOOREI',
  'FROSTY DAD',
];
export const acceptedPayloads = [
  'KILL_COUNT',
  'CHAT',
  'COLLECTION',
  'PET',
  'LEVEL',
  'COMBAT_ACHIEVEMENT',
  'CLUE',
  'LOOT',
  'CHAT',
  'DEATH',
];

// pets
export const PET = 'PET';
export const ALL_PETS = 63;

// levels
export const LEVEL = 'LEVEL';
export const MAX_TOTAL_LEVEL = 2277;

// kill count
export const KILL_COUNT = 'KILL_COUNT';
export const specialKills = ['SOL HEREDIT', 'TZKAL-ZUK', 'TZTOK-JAD'];
export const bossMap = new Map([
  ['TZKAL-ZUK', 5],
  ['SOL HEREDIT', 5],
  ['THEATRE OF BLOOD: HARD MODE', 10],
  ['CHAMBERS OF XERIC: CHALLENGE MODE', 10],
  ["PHOSANI'S NIGHTMARE", 25],
  ['THE NIGHTMARE', 25],
  ['CORPOREAL BEAST', 50],
  ['HERBIBOAR', 150],
  ['TEST', 1],
]);

// chat
export const PERSONAL_BEST = 'PERSONAL_BEST';
export const HALLOWED_SEPULCHRE = 'Hallowed Sepulchre';
export const GRAND_HALLOWED_COFFIN = 'Grand Hallowed Coffin';
export const CHAT_MESSAGE_TYPES = {
  BIG_FISH: 'BIG_FISH',
  VESTIGE_DROP: 'VESTIGE_DROP',
  NEW_PERSONAL_BEST: 'NEW_PERSONAL_BEST',
};
export const VESTIGE_MAP = {
  Ultor: 'Vardorvis',
  Bellator: 'The Whisperer',
  Magus: 'Duke Sucellus',
  Venator: 'The Leviathan',
};
export const CHAT_REGEX = {
  VESTIGE_TEXT:
    /(?:Untradeable drop: |.+ received a drop: )(Ultor|Bellator|Magus|Venator) vestige/,
  OVERALL_TIME_TEXT:
    /Overall time: (\d{1,2}:\d{2}\.\d{2}) \(new personal best\)/,
  FLOOR_TIME_TEXT:
    /Floor ([1-5]) time: (\d{1,2}:\d{2}\.\d{2}) \(new personal best\)/,
  BIG_FISH: /You catch an enormous (.+)!/,
};
export const bigFishArr = [
  '[PLAYER] just wrangled a [FISH] bigger’n a damn johnboat—y’all better bring the grill and a tall tale ‘cause this one’s a whopper!',
  "Y’all ain't gonna believe this shit, but [PLAYER] just hauled in a [FISH] so big, I reckon it’s got its own zip code!",
  "[PLAYER] just hauled in a [FISH] so goddamn big, had to rassle it like a gator ‘fore gettin' it in the boat!",
  'This [FISH] was so damn big, [PLAYER] thought they was deep-sea fishin’ in a puddle!',
  'Got me a [FISH] so massive, it damn near yanked [PLAYER] clean out the boat ‘fore they wrassled it in!',
  'I swear on my grandpappy’s tackle box, [PLAYER] just caught a [FISH] so fuckin’ big it’s got its own weather system!',
  'Hooked a [FISH] so huge, [PLAYER] had to call in some poor bastard to help reel it in!',
  "This [FISH] ain't just big—it’s the kinda catch that makes [PLAYER] question what the hell is in this water!",
  'Took one look at this [FISH] and knew [PLAYER] was gonna need a bigger cooler… or maybe a damn U-Haul!',
  'If this [FISH] gets any bigger, [PLAYER] might as well start filin’ for land rights on the son of a bitch!',
  'Reeled in a [FISH] so fat, [PLAYER] thought they hooked a goddamn submarine!',
  '[PLAYER] tells no fish tale—this [FISH] coulda been a goddamn sea monster in another life!',
  'Caught a [FISH] so hefty, even the goddamn scales started sweatin’ when [PLAYER] weighed it!',
  'This [FISH] is so fuckin’ big, I reckon [PLAYER] might’ve hooked somethin’ straight outta Loch Ness!',
  '[PLAYER] hooked into a [FISH] so mean, I thought they was gonna end up on *its* dinner plate instead!',
  "Ain't no minnow—this [FISH] is so big, [PLAYER] is about to feed the whole damn county!",
  'This [FISH] was fightin’ so hard, [PLAYER] thought they’d hooked into the devil’s mean-ass brother!',
  '[PLAYER] had to argue with this [FISH] ‘fore it let ‘em reel it in—dern thing put up a better fight than my uncle’s goddamn divorce lawyer!',
  'If this [FISH] gets any bigger, [PLAYER]’s gonna have to start payin’ taxes on the bastard!',
  '[PLAYER] caught a [FISH] so big, we gotta mount it on the wall, tell stories, and name the son of a bitch!',
];

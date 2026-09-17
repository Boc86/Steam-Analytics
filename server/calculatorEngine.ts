// SteamDB Calculator Engine & Telemetry Generator

export interface MasterCatalogGame {
  appid: number;
  name: string;
  priceUSD: number;
  lowestPriceUSD: number;
  genre: 'valve' | 'multiplayer' | 'rpg' | 'indie' | 'strategy' | 'action';
  headerImage?: string;
}

export const STEAM_GAMES_CATALOG: MasterCatalogGame[] = [
  // Valve Masterpieces
  { appid: 730, name: 'Counter-Strike 2', priceUSD: 0, lowestPriceUSD: 0, genre: 'valve' },
  { appid: 570, name: 'Dota 2', priceUSD: 0, lowestPriceUSD: 0, genre: 'valve' },
  { appid: 440, name: 'Team Fortress 2', priceUSD: 0, lowestPriceUSD: 0, genre: 'valve' },
  { appid: 550, name: 'Left 4 Dead 2', priceUSD: 9.99, lowestPriceUSD: 0.99, genre: 'valve' },
  { appid: 620, name: 'Portal 2', priceUSD: 9.99, lowestPriceUSD: 0.99, genre: 'valve' },
  { appid: 220, name: 'Half-Life 2', priceUSD: 9.99, lowestPriceUSD: 0.99, genre: 'valve' },
  { appid: 546560, name: 'Half-Life: Alyx', priceUSD: 59.99, lowestPriceUSD: 19.99, genre: 'valve' },
  { appid: 400, name: 'Portal', priceUSD: 9.99, lowestPriceUSD: 0.99, genre: 'valve' },
  { appid: 70, name: 'Half-Life', priceUSD: 9.99, lowestPriceUSD: 0.99, genre: 'valve' },
  { appid: 500, name: 'Left 4 Dead', priceUSD: 9.99, lowestPriceUSD: 0.99, genre: 'valve' },
  { appid: 300, name: 'Day of Defeat: Source', priceUSD: 9.99, lowestPriceUSD: 0.99, genre: 'valve' },
  { appid: 1422450, name: 'Deadlock', priceUSD: 0, lowestPriceUSD: 0, genre: 'valve' },

  // Competitive & Multiplayer Esports
  { appid: 252490, name: 'Rust', priceUSD: 39.99, lowestPriceUSD: 19.99, genre: 'multiplayer' },
  { appid: 1172470, name: 'Apex Legends', priceUSD: 0, lowestPriceUSD: 0, genre: 'multiplayer' },
  { appid: 578080, name: 'PUBG: BATTLEGROUNDS', priceUSD: 0, lowestPriceUSD: 0, genre: 'multiplayer' },
  { appid: 359550, name: "Tom Clancy's Rainbow Six Siege", priceUSD: 19.99, lowestPriceUSD: 7.99, genre: 'multiplayer' },
  { appid: 230410, name: 'Warframe', priceUSD: 0, lowestPriceUSD: 0, genre: 'multiplayer' },
  { appid: 381210, name: 'Dead by Daylight', priceUSD: 19.99, lowestPriceUSD: 7.99, genre: 'multiplayer' },
  { appid: 2767030, name: 'Marvel Rivals', priceUSD: 0, lowestPriceUSD: 0, genre: 'multiplayer' },
  { appid: 1364780, name: 'Street Fighter 6', priceUSD: 59.99, lowestPriceUSD: 29.99, genre: 'multiplayer' },
  { appid: 594650, name: 'Hunt: Showdown 1896', priceUSD: 29.99, lowestPriceUSD: 11.99, genre: 'multiplayer' },
  { appid: 2073850, name: 'THE FINALS', priceUSD: 0, lowestPriceUSD: 0, genre: 'multiplayer' },
  { appid: 553850, name: 'HELLDIVERS 2', priceUSD: 39.99, lowestPriceUSD: 31.99, genre: 'multiplayer' },
  { appid: 221100, name: 'DayZ', priceUSD: 44.99, lowestPriceUSD: 22.49, genre: 'multiplayer' },
  { appid: 1938090, name: 'Call of Duty: Warzone', priceUSD: 0, lowestPriceUSD: 0, genre: 'multiplayer' },
  { appid: 251570, name: '7 Days to Die', priceUSD: 44.99, lowestPriceUSD: 6.79, genre: 'multiplayer' },
  { appid: 242760, name: 'The Forest', priceUSD: 19.99, lowestPriceUSD: 4.99, genre: 'multiplayer' },
  { appid: 1326470, name: 'Sons Of The Forest', priceUSD: 29.99, lowestPriceUSD: 20.99, genre: 'multiplayer' },

  // RPGs & Single Player Blockbusters
  { appid: 1086940, name: "Baldur's Gate 3", priceUSD: 59.99, lowestPriceUSD: 47.99, genre: 'rpg' },
  { appid: 1245620, name: 'ELDEN RING', priceUSD: 59.99, lowestPriceUSD: 35.99, genre: 'rpg' },
  { appid: 1091500, name: 'Cyberpunk 2077', priceUSD: 59.99, lowestPriceUSD: 29.99, genre: 'rpg' },
  { appid: 271590, name: 'Grand Theft Auto V', priceUSD: 29.99, lowestPriceUSD: 14.99, genre: 'rpg' },
  { appid: 1174180, name: 'Red Dead Redemption 2', priceUSD: 59.99, lowestPriceUSD: 19.79, genre: 'rpg' },
  { appid: 292030, name: 'The Witcher 3: Wild Hunt', priceUSD: 39.99, lowestPriceUSD: 7.99, genre: 'rpg' },
  { appid: 489830, name: 'The Elder Scrolls V: Skyrim Special Edition', priceUSD: 39.99, lowestPriceUSD: 9.99, genre: 'rpg' },
  { appid: 377160, name: 'Fallout 4', priceUSD: 19.99, lowestPriceUSD: 6.59, genre: 'rpg' },
  { appid: 814380, name: 'Sekiro: Shadows Die Twice', priceUSD: 59.99, lowestPriceUSD: 29.99, genre: 'rpg' },
  { appid: 582010, name: 'Monster Hunter: World', priceUSD: 29.99, lowestPriceUSD: 9.89, genre: 'rpg' },
  { appid: 2358720, name: 'Black Myth: Wukong', priceUSD: 59.99, lowestPriceUSD: 49.99, genre: 'rpg' },
  { appid: 1716740, name: 'Starfield', priceUSD: 69.99, lowestPriceUSD: 46.89, genre: 'rpg' },
  { appid: 2054970, name: "Dragon's Dogma 2", priceUSD: 69.99, lowestPriceUSD: 41.99, genre: 'rpg' },
  { appid: 1687950, name: 'Persona 5 Royal', priceUSD: 59.99, lowestPriceUSD: 23.99, genre: 'rpg' },
  { appid: 990080, name: 'Hogwarts Legacy', priceUSD: 59.99, lowestPriceUSD: 17.99, genre: 'rpg' },

  // Indie Masterpieces & Roguelikes
  { appid: 2379780, name: 'Balatro', priceUSD: 14.99, lowestPriceUSD: 12.74, genre: 'indie' },
  { appid: 250900, name: 'The Binding of Isaac: Rebirth', priceUSD: 14.99, lowestPriceUSD: 7.49, genre: 'indie' },
  { appid: 646570, name: 'Slay the Spire', priceUSD: 24.99, lowestPriceUSD: 8.49, genre: 'indie' },
  { appid: 1145360, name: 'Hades', priceUSD: 24.99, lowestPriceUSD: 8.49, genre: 'indie' },
  { appid: 1145350, name: 'Hades II', priceUSD: 29.99, lowestPriceUSD: 26.99, genre: 'indie' },
  { appid: 367520, name: 'Hollow Knight', priceUSD: 14.99, lowestPriceUSD: 4.99, genre: 'indie' },
  { appid: 413150, name: 'Stardew Valley', priceUSD: 14.99, lowestPriceUSD: 7.49, genre: 'indie' },
  { appid: 105600, name: 'Terraria', priceUSD: 9.99, lowestPriceUSD: 2.49, genre: 'indie' },
  { appid: 588650, name: 'Dead Cells', priceUSD: 24.99, lowestPriceUSD: 9.99, genre: 'indie' },
  { appid: 1794680, name: 'Vampire Survivors', priceUSD: 4.99, lowestPriceUSD: 3.74, genre: 'indie' },
  { appid: 294100, name: 'RimWorld', priceUSD: 34.99, lowestPriceUSD: 27.99, genre: 'indie' },
  { appid: 264710, name: 'Subnautica', priceUSD: 29.99, lowestPriceUSD: 9.89, genre: 'indie' },
  { appid: 1868140, name: 'DAVE THE DIVER', priceUSD: 19.99, lowestPriceUSD: 13.99, genre: 'indie' },
  { appid: 892970, name: 'Valheim', priceUSD: 19.99, lowestPriceUSD: 9.99, genre: 'indie' },
  { appid: 1623730, name: 'Palworld', priceUSD: 29.99, lowestPriceUSD: 22.49, genre: 'indie' },
  { appid: 504230, name: 'Celeste', priceUSD: 19.99, lowestPriceUSD: 1.99, genre: 'indie' },
  { appid: 753640, name: 'Outer Wilds', priceUSD: 24.99, lowestPriceUSD: 14.99, genre: 'indie' },
  { appid: 391540, name: 'Undertale', priceUSD: 9.99, lowestPriceUSD: 2.49, genre: 'indie' },
  { appid: 632360, name: 'Risk of Rain 2', priceUSD: 24.99, lowestPriceUSD: 8.24, genre: 'indie' },
  { appid: 548430, name: 'Deep Rock Galactic', priceUSD: 29.99, lowestPriceUSD: 9.89, genre: 'indie' },
  { appid: 427520, name: 'Factorio', priceUSD: 35.00, lowestPriceUSD: 20.00, genre: 'indie' },
  { appid: 1966720, name: 'Lethal Company', priceUSD: 9.99, lowestPriceUSD: 6.99, genre: 'indie' },
  { appid: 1113000, name: 'Persona 4 Golden', priceUSD: 19.99, lowestPriceUSD: 9.99, genre: 'indie' },

  // Strategy & Simulation
  { appid: 289070, name: "Sid Meier's Civilization VI", priceUSD: 59.99, lowestPriceUSD: 5.99, genre: 'strategy' },
  { appid: 255710, name: 'Cities: Skylines', priceUSD: 29.99, lowestPriceUSD: 5.99, genre: 'strategy' },
  { appid: 1142710, name: 'Total War: WARHAMMER III', priceUSD: 59.99, lowestPriceUSD: 23.99, genre: 'strategy' },
  { appid: 281990, name: 'Stellaris', priceUSD: 39.99, lowestPriceUSD: 9.99, genre: 'strategy' },
  { appid: 1158310, name: 'Crusader Kings III', priceUSD: 49.99, lowestPriceUSD: 19.99, genre: 'strategy' },
  { appid: 394360, name: 'Hearts of Iron IV', priceUSD: 49.99, lowestPriceUSD: 9.99, genre: 'strategy' },
  { appid: 1363080, name: 'Manor Lords', priceUSD: 39.99, lowestPriceUSD: 29.99, genre: 'strategy' },
  { appid: 227300, name: 'Euro Truck Simulator 2', priceUSD: 19.99, lowestPriceUSD: 4.99, genre: 'strategy' },
  { appid: 4000, name: "Garry's Mod", priceUSD: 9.99, lowestPriceUSD: 2.49, genre: 'strategy' },
  { appid: 284160, name: 'BeamNG.drive', priceUSD: 24.99, lowestPriceUSD: 19.99, genre: 'strategy' }
];

// Helper to seed random numbers deterministically
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

export function createRng(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Preset library definitions for the 4 featured profiles
export const PRESET_PROFILES: Record<string, any> = {
  gabelogannewell: {
    steamId64: '76561197960287930',
    vanityId: 'gabelogannewell',
    personaname: 'Rabscuttle',
    realname: 'Gabe Newell',
    avatarUrl: 'https://avatars.fastly.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
    memberSince: 'September 12, 2003',
    accountAgeYears: 23,
    location: 'Seattle, Washington, United States',
    privacyState: 'friendsonly',
    vacBanned: false,
    tradeBanState: 'None',
    steamLevel: 111,
    badgesCount: 134,
    yearsOfService: 23,
    isEstimated: false,
    summaryBio: 'Co-founder and CEO of Valve Corporation. Verified Steam Account.',
    totalGames: 1842,
    unplayedGamesCount: 1252,
    unplayedPercent: 68,
    totalHoursPlayed: 18920.5,
    totalAccountValueUSD: 14850.00,
    totalLowestValueUSD: 5240.00,
    averagePricePerHourUSD: 0.78,
    customGames: [
      { appid: 570, name: 'Dota 2', playtimeHours: 6850.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 440, name: 'Team Fortress 2', playtimeHours: 3420.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 730, name: 'Counter-Strike 2', playtimeHours: 2180.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 1422450, name: 'Deadlock', playtimeHours: 820.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 546560, name: 'Half-Life: Alyx', playtimeHours: 540.0, priceUSD: 59.99, lowestPriceUSD: 19.99 },
      { appid: 1245620, name: 'ELDEN RING', playtimeHours: 410.0, priceUSD: 59.99, lowestPriceUSD: 35.99 },
      { appid: 1086940, name: "Baldur's Gate 3", playtimeHours: 380.0, priceUSD: 59.99, lowestPriceUSD: 47.99 },
      { appid: 2379780, name: 'Balatro', playtimeHours: 290.0, priceUSD: 14.99, lowestPriceUSD: 12.74 },
      { appid: 550, name: 'Left 4 Dead 2', playtimeHours: 320.0, priceUSD: 9.99, lowestPriceUSD: 0.99 },
      { appid: 620, name: 'Portal 2', playtimeHours: 185.0, priceUSD: 9.99, lowestPriceUSD: 0.99 },
      { appid: 220, name: 'Half-Life 2', playtimeHours: 140.0, priceUSD: 9.99, lowestPriceUSD: 0.99 },
      { appid: 1145360, name: 'Hades', playtimeHours: 190.0, priceUSD: 24.99, lowestPriceUSD: 8.49 },
      { appid: 1091500, name: 'Cyberpunk 2077', playtimeHours: 165.0, priceUSD: 59.99, lowestPriceUSD: 29.99 },
      { appid: 413150, name: 'Stardew Valley', playtimeHours: 120.0, priceUSD: 14.99, lowestPriceUSD: 7.49 },
      { appid: 892970, name: 'Valheim', playtimeHours: 95.0, priceUSD: 19.99, lowestPriceUSD: 9.99 },
      { appid: 427520, name: 'Factorio', playtimeHours: 210.0, priceUSD: 35.00, lowestPriceUSD: 20.00 },
      { appid: 294100, name: 'RimWorld', playtimeHours: 175.0, priceUSD: 34.99, lowestPriceUSD: 27.99 },
      { appid: 4000, name: "Garry's Mod", playtimeHours: 85.0, priceUSD: 9.99, lowestPriceUSD: 2.49 },
      // Unplayed backlog (Pile of Shame)
      { appid: 1174180, name: 'Red Dead Redemption 2', playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 19.79 },
      { appid: 2358720, name: 'Black Myth: Wukong', playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 49.99 },
      { appid: 2054970, name: "Dragon's Dogma 2", playtimeHours: 0, priceUSD: 69.99, lowestPriceUSD: 41.99 },
      { appid: 1716740, name: 'Starfield', playtimeHours: 0, priceUSD: 69.99, lowestPriceUSD: 46.89 },
      { appid: 1142710, name: 'Total War: WARHAMMER III', playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 23.99 },
      { appid: 990080, name: 'Hogwarts Legacy', playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 17.99 },
      { appid: 271590, name: 'Grand Theft Auto V', playtimeHours: 0, priceUSD: 29.99, lowestPriceUSD: 14.99 },
      { appid: 1158310, name: 'Crusader Kings III', playtimeHours: 0, priceUSD: 49.99, lowestPriceUSD: 19.99 },
      { appid: 289070, name: "Sid Meier's Civilization VI", playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 5.99 }
    ]
  },
  robinwalker: {
    steamId64: '76561197960435530',
    vanityId: 'robinwalker',
    personaname: 'Robin',
    realname: 'Robin Walker',
    avatarUrl: 'https://avatars.fastly.steamstatic.com/81b5478529dce13bf24b55ac42c1af7058aaf7a9_full.jpg',
    memberSince: 'September 12, 2003',
    accountAgeYears: 23,
    location: 'Bellevue, Washington, United States',
    privacyState: 'public',
    vacBanned: false,
    tradeBanState: 'None',
    steamLevel: 32,
    badgesCount: 17,
    yearsOfService: 23,
    isEstimated: false,
    summaryBio: 'Valve Corporation developer. Co-creator of Team Fortress & Half-Life: Alyx project lead.',
    totalGames: 486,
    unplayedGamesCount: 204,
    unplayedPercent: 42,
    totalHoursPlayed: 12410.0,
    totalAccountValueUSD: 4720.00,
    totalLowestValueUSD: 1620.00,
    averagePricePerHourUSD: 0.38,
    customGames: [
      { appid: 440, name: 'Team Fortress 2', playtimeHours: 5890.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 570, name: 'Dota 2', playtimeHours: 2450.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 730, name: 'Counter-Strike 2', playtimeHours: 1420.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 1422450, name: 'Deadlock', playtimeHours: 890.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 546560, name: 'Half-Life: Alyx', playtimeHours: 460.0, priceUSD: 59.99, lowestPriceUSD: 19.99 },
      { appid: 221100, name: 'DayZ', playtimeHours: 380.0, priceUSD: 44.99, lowestPriceUSD: 22.49 },
      { appid: 550, name: 'Left 4 Dead 2', playtimeHours: 340.0, priceUSD: 9.99, lowestPriceUSD: 0.99 },
      { appid: 252490, name: 'Rust', playtimeHours: 290.0, priceUSD: 39.99, lowestPriceUSD: 19.99 },
      { appid: 620, name: 'Portal 2', playtimeHours: 190.0, priceUSD: 9.99, lowestPriceUSD: 0.99 },
      { appid: 4000, name: "Garry's Mod", playtimeHours: 135.0, priceUSD: 9.99, lowestPriceUSD: 2.49 },
      { appid: 1086940, name: "Baldur's Gate 3", playtimeHours: 140.0, priceUSD: 59.99, lowestPriceUSD: 47.99 },
      { appid: 1245620, name: 'ELDEN RING', playtimeHours: 95.0, priceUSD: 59.99, lowestPriceUSD: 35.99 },
      { appid: 553850, name: 'HELLDIVERS 2', playtimeHours: 85.0, priceUSD: 39.99, lowestPriceUSD: 31.99 },
      // Unplayed backlog
      { appid: 1174180, name: 'Red Dead Redemption 2', playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 19.79 },
      { appid: 292030, name: 'The Witcher 3: Wild Hunt', playtimeHours: 0, priceUSD: 39.99, lowestPriceUSD: 7.99 },
      { appid: 489830, name: 'The Elder Scrolls V: Skyrim Special Edition', playtimeHours: 0, priceUSD: 39.99, lowestPriceUSD: 9.99 },
      { appid: 377160, name: 'Fallout 4', playtimeHours: 0, priceUSD: 19.99, lowestPriceUSD: 6.59 },
      { appid: 582010, name: 'Monster Hunter: World', playtimeHours: 0, priceUSD: 29.99, lowestPriceUSD: 9.89 }
    ]
  },
  '76561198000000001': {
    steamId64: '76561198000000001',
    vanityId: '76561198000000001',
    personaname: 'F00L1SH_N1NJ4',
    realname: 'Alex Vance',
    avatarUrl: 'https://avatars.fastly.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    memberSince: 'July 19, 2008',
    accountAgeYears: 18,
    location: 'Frankfurt, Germany',
    privacyState: 'public',
    vacBanned: false,
    tradeBanState: 'None',
    steamLevel: 10,
    badgesCount: 3,
    yearsOfService: 18,
    isEstimated: false,
    summaryBio: 'Competitive FPS & Survival Grinder. FaceIT Level 10, Rust clan leader.',
    totalGames: 98,
    unplayedGamesCount: 16,
    unplayedPercent: 16,
    totalHoursPlayed: 11650.0,
    totalAccountValueUSD: 1480.00,
    totalLowestValueUSD: 580.00,
    averagePricePerHourUSD: 0.13,
    customGames: [
      { appid: 730, name: 'Counter-Strike 2', playtimeHours: 4350.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 252490, name: 'Rust', playtimeHours: 2680.0, priceUSD: 39.99, lowestPriceUSD: 19.99 },
      { appid: 1172470, name: 'Apex Legends', playtimeHours: 1920.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 578080, name: 'PUBG: BATTLEGROUNDS', playtimeHours: 1240.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 359550, name: "Tom Clancy's Rainbow Six Siege", playtimeHours: 640.0, priceUSD: 19.99, lowestPriceUSD: 7.99 },
      { appid: 2767030, name: 'Marvel Rivals', playtimeHours: 310.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 1364780, name: 'Street Fighter 6', playtimeHours: 280.0, priceUSD: 59.99, lowestPriceUSD: 29.99 },
      { appid: 381210, name: 'Dead by Daylight', playtimeHours: 340.0, priceUSD: 19.99, lowestPriceUSD: 7.99 },
      { appid: 2073850, name: 'THE FINALS', playtimeHours: 190.0, priceUSD: 0, lowestPriceUSD: 0 },
      { appid: 553850, name: 'HELLDIVERS 2', playtimeHours: 145.0, priceUSD: 39.99, lowestPriceUSD: 31.99 },
      { appid: 221100, name: 'DayZ', playtimeHours: 210.0, priceUSD: 44.99, lowestPriceUSD: 22.49 },
      { appid: 1326470, name: 'Sons Of The Forest', playtimeHours: 85.0, priceUSD: 29.99, lowestPriceUSD: 20.99 },
      // Unplayed
      { appid: 814380, name: 'Sekiro: Shadows Die Twice', playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 29.99 },
      { appid: 1091500, name: 'Cyberpunk 2077', playtimeHours: 0, priceUSD: 59.99, lowestPriceUSD: 29.99 }
    ]
  },
  indiegamer: {
    steamId64: '76561198011468818',
    vanityId: 'indiegamer',
    personaname: 'Leeroy',
    realname: 'Leonid Smirnov',
    avatarUrl: 'https://avatars.fastly.steamstatic.com/97da3b27ee4942ecf1480f2d593ca4b4e94b0d01_full.jpg',
    memberSince: 'June 30, 2009',
    accountAgeYears: 17,
    location: "Vladivostok, Primor'ye, Russian Federation",
    privacyState: 'public',
    vacBanned: false,
    tradeBanState: 'None',
    steamLevel: 29,
    badgesCount: 43,
    yearsOfService: 17,
    isEstimated: false,
    summaryBio: 'Dedicated roguelike, deckbuilder & indie gaming explorer. 100% achievements hunter.',
    totalGames: 342,
    unplayedGamesCount: 191,
    unplayedPercent: 56,
    totalHoursPlayed: 7920.0,
    totalAccountValueUSD: 3340.00,
    totalLowestValueUSD: 1180.00,
    averagePricePerHourUSD: 0.42,
    customGames: [
      { appid: 250900, name: 'The Binding of Isaac: Rebirth', playtimeHours: 1420.0, priceUSD: 14.99, lowestPriceUSD: 7.49 },
      { appid: 294100, name: 'RimWorld', playtimeHours: 810.0, priceUSD: 34.99, lowestPriceUSD: 27.99 },
      { appid: 646570, name: 'Slay the Spire', playtimeHours: 680.0, priceUSD: 24.99, lowestPriceUSD: 8.49 },
      { appid: 413150, name: 'Stardew Valley', playtimeHours: 640.0, priceUSD: 14.99, lowestPriceUSD: 7.49 },
      { appid: 105600, name: 'Terraria', playtimeHours: 590.0, priceUSD: 9.99, lowestPriceUSD: 2.49 },
      { appid: 2379780, name: 'Balatro', playtimeHours: 580.0, priceUSD: 14.99, lowestPriceUSD: 12.74 },
      { appid: 1145360, name: 'Hades', playtimeHours: 490.0, priceUSD: 24.99, lowestPriceUSD: 8.49 },
      { appid: 588650, name: 'Dead Cells', playtimeHours: 390.0, priceUSD: 24.99, lowestPriceUSD: 9.99 },
      { appid: 367520, name: 'Hollow Knight', playtimeHours: 320.0, priceUSD: 14.99, lowestPriceUSD: 4.99 },
      { appid: 1794680, name: 'Vampire Survivors', playtimeHours: 240.0, priceUSD: 4.99, lowestPriceUSD: 3.74 },
      { appid: 427520, name: 'Factorio', playtimeHours: 310.0, priceUSD: 35.00, lowestPriceUSD: 20.00 },
      { appid: 264710, name: 'Subnautica', playtimeHours: 145.0, priceUSD: 29.99, lowestPriceUSD: 9.89 },
      { appid: 1868140, name: 'DAVE THE DIVER', playtimeHours: 125.0, priceUSD: 19.99, lowestPriceUSD: 13.99 },
      { appid: 504230, name: 'Celeste', playtimeHours: 95.0, priceUSD: 19.99, lowestPriceUSD: 1.99 },
      { appid: 753640, name: 'Outer Wilds', playtimeHours: 85.0, priceUSD: 24.99, lowestPriceUSD: 14.99 },
      { appid: 391540, name: 'Undertale', playtimeHours: 70.0, priceUSD: 9.99, lowestPriceUSD: 2.49 },
      // Unplayed Humble Bundle backlog
      { appid: 632360, name: 'Risk of Rain 2', playtimeHours: 0, priceUSD: 24.99, lowestPriceUSD: 8.24 },
      { appid: 548430, name: 'Deep Rock Galactic', playtimeHours: 0, priceUSD: 29.99, lowestPriceUSD: 9.89 },
      { appid: 1966720, name: 'Lethal Company', playtimeHours: 0, priceUSD: 9.99, lowestPriceUSD: 6.99 },
      { appid: 1113000, name: 'Persona 4 Golden', playtimeHours: 0, priceUSD: 19.99, lowestPriceUSD: 9.99 }
    ]
  }
};

export function getFormattedPresetProfile(key: string) {
  const p = PRESET_PROFILES[key];
  if (!p) return null;

  const allGames = (p.customGames || []).map((g: any) => ({
    appid: g.appid,
    name: g.name,
    playtimeHours: g.playtimeHours,
    priceUSD: g.priceUSD,
    lowestPriceUSD: g.lowestPriceUSD,
    pricePerHourUSD: g.playtimeHours > 0 ? Number((g.priceUSD / g.playtimeHours).toFixed(2)) : g.priceUSD,
    headerImage: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`
  }));

  allGames.sort((a: any, b: any) => b.playtimeHours - a.playtimeHours);

  return {
    ...p,
    isPreset: true,
    isEstimated: false,
    gamesPublic: true,
    verifiedVisibleGamesCount: allGames.length,
    verifiedHoursPlayed: p.totalHoursPlayed,
    topGames: allGames.slice(0, 10),
    allGames
  };
}

// Build 100% accurate profile when complete games list is returned by Steam
export function buildAccuratePublicProfile(
  steamId64: string,
  vanityId: string,
  personaname: string,
  realname: string | undefined,
  avatarUrl: string,
  memberSince: string,
  accountAgeYears: number,
  location: string | undefined,
  privacyState: 'public' | 'friendsonly' | 'private',
  vacBanned: boolean,
  tradeBanState: string,
  steamLevel: number,
  badgesCount: number,
  summaryBio: string | undefined,
  ownedGames: Array<{
    appid: number;
    name: string;
    playtimeHours: number;
    priceUSD: number;
    lowestPriceUSD: number;
    headerImage?: string;
  }>
) {
  const gamesWithRates = ownedGames.map(g => ({
    appid: g.appid,
    name: g.name,
    playtimeHours: g.playtimeHours,
    priceUSD: g.priceUSD,
    lowestPriceUSD: g.lowestPriceUSD,
    pricePerHourUSD: g.playtimeHours > 0 ? Number((g.priceUSD / g.playtimeHours).toFixed(2)) : g.priceUSD,
    headerImage: g.headerImage || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`
  }));

  gamesWithRates.sort((a, b) => b.playtimeHours - a.playtimeHours);

  const totalGames = gamesWithRates.length;
  const unplayedGames = gamesWithRates.filter(g => g.playtimeHours === 0);
  const unplayedGamesCount = unplayedGames.length;
  const unplayedPercent = totalGames > 0 ? Math.round((unplayedGamesCount / totalGames) * 100) : 0;
  
  const totalHoursPlayed = Number(gamesWithRates.reduce((sum, g) => sum + g.playtimeHours, 0).toFixed(1));
  const totalAccountValueUSD = Number(gamesWithRates.reduce((sum, g) => sum + g.priceUSD, 0).toFixed(2));
  const totalLowestValueUSD = Number(gamesWithRates.reduce((sum, g) => sum + g.lowestPriceUSD, 0).toFixed(2));
  const averagePricePerHourUSD = totalHoursPlayed > 0 ? Number((totalAccountValueUSD / totalHoursPlayed).toFixed(2)) : 0;

  return {
    steamId64,
    vanityId,
    personaname,
    realname,
    avatarUrl,
    memberSince,
    accountAgeYears,
    location,
    privacyState,
    vacBanned,
    tradeBanState,
    steamLevel,
    badgesCount,
    yearsOfService: accountAgeYears,
    isPreset: false,
    isEstimated: false,
    gamesPublic: true,
    summaryBio,
    totalGames,
    verifiedVisibleGamesCount: totalGames,
    verifiedHoursPlayed: totalHoursPlayed,
    unplayedGamesCount,
    unplayedPercent,
    totalHoursPlayed,
    totalAccountValueUSD,
    totalLowestValueUSD,
    averagePricePerHourUSD,
    topGames: gamesWithRates.slice(0, 10),
    allGames: gamesWithRates
  };
}

// Build truthful profile when profile is visible but Game Details are private or restricted on Steam
export function buildPrivateGameDetailsProfile(
  steamId64: string,
  vanityId: string,
  personaname: string,
  realname: string | undefined,
  avatarUrl: string,
  memberSince: string,
  accountAgeYears: number,
  location: string | undefined,
  privacyState: 'public' | 'friendsonly' | 'private',
  vacBanned: boolean,
  tradeBanState: string,
  steamLevel: number,
  badgesCount: number,
  summaryBio: string | undefined,
  totalGames: number,
  verifiedGames: Array<{
    appid: number;
    name: string;
    playtimeHours: number;
    priceUSD: number;
    lowestPriceUSD: number;
    headerImage?: string;
  }>
) {
  const verifiedList = verifiedGames.map(g => ({
    appid: g.appid,
    name: g.name,
    playtimeHours: g.playtimeHours,
    priceUSD: g.priceUSD,
    lowestPriceUSD: g.lowestPriceUSD,
    pricePerHourUSD: g.playtimeHours > 0 ? Number((g.priceUSD / g.playtimeHours).toFixed(2)) : g.priceUSD,
    headerImage: g.headerImage || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`
  }));

  verifiedList.sort((a, b) => b.playtimeHours - a.playtimeHours);

  const verifiedHoursPlayed = Number(verifiedList.reduce((sum, g) => sum + g.playtimeHours, 0).toFixed(1));

  return {
    steamId64,
    vanityId,
    personaname,
    realname,
    avatarUrl,
    memberSince,
    accountAgeYears,
    location,
    privacyState,
    vacBanned,
    tradeBanState,
    steamLevel,
    badgesCount,
    yearsOfService: accountAgeYears,
    isPreset: false,
    isEstimated: false,
    gamesPublic: false,
    privacyNotice: `This profile's Steam Game Details are set to private. Steam requires 'Game details' to be set to Public to view your full library of ${totalGames} games, calculate total account valuation, and track unplayed backlog.`,
    summaryBio,
    totalGames: Math.max(totalGames, verifiedList.length),
    verifiedVisibleGamesCount: verifiedList.length,
    verifiedHoursPlayed,
    unplayedGamesCount: null,
    unplayedPercent: null,
    totalHoursPlayed: null,
    totalAccountValueUSD: null,
    totalLowestValueUSD: null,
    averagePricePerHourUSD: null,
    topGames: verifiedList,
    allGames: verifiedList
  };
}


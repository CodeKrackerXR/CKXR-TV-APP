// ============================================================
// atlasCipherUtils.ts
// CODE KRACKER XR — Atlas Cipher Core Utilities
// ============================================================
// This file is the single source of truth for all Atlas Cipher
// encryption and decryption logic. Import this into BOTH the
// GM Panel AND the Atlas Decode page. NEVER duplicate this logic.
// ============================================================
 
export const ATLAS_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
 
// The 10 cipher mechanic names in order.
// Index 0 = Caesar, 1 = Rail Fence, etc.
// cityLetter[i] is protected by CIPHER_MECHANICS[i % 10]
export const CIPHER_MECHANICS = [
  { id: 0, name: "Caesar Cipher",        shortName: "CAESAR",       icon: "A→D" },
  { id: 1, name: "Rail Fence Cipher",    shortName: "RAIL FENCE",   icon: "⟿"  },
  { id: 2, name: "Vigenère Cipher",      shortName: "VIGENÈRE",     icon: "⊞"  },
  { id: 3, name: "Transposition Cipher", shortName: "TRANSPOSITION",icon: "⇅"  },
  { id: 4, name: "Playfair Cipher",      shortName: "PLAYFAIR",     icon: "⬛"  },
  { id: 5, name: "Nihilist Cipher",      shortName: "NIHILIST",     icon: "##" },
  { id: 6, name: "Enigma Cipher",        shortName: "ENIGMA",       icon: "⚙"  },
  { id: 7, name: "Four-Square Cipher",   shortName: "FOUR-SQUARE",  icon: "⊞⊞" },
  { id: 8, name: "Bifid Cipher",         shortName: "BIFID",        icon: "⊕"  },
  { id: 9, name: "ADFGVX Cipher",        shortName: "ADFGVX",       icon: "AD" },
];
 
// ─────────────────────────────────────────────
// CORE ENCRYPTION FUNCTION
// Called by the GM Panel when generating a session.
// ─────────────────────────────────────────────
 
/**
 * Encrypts a city name using the Atlas Cipher.
 *
 * Algorithm for each letter at index i:
 *   1. masterKeyLetter = masterKey[i % 10]
 *   2. baseShift = alphabetical position of masterKeyLetter (A=1, B=2 ... Z=26)
 *   3. mechanicModifier = (i % 10) * 3
 *   4. totalShift = (baseShift + mechanicModifier) % 26
 *   5. encryptedChar = cityLetter shifted forward by totalShift
 *
 * @param cityNam    Plain city name, letters only, uppercase (e.g. "SEDONA")
 * @param masterKey   Exactly 10 letters, uppercase (e.g. "ADVENTURES")
 * @returns           Object with encrypted string + per-letter shift details
 */
export const atlasEncrypt = (
  cityName: string,
  masterKey: string
): {
  encrypted: string;
  shifts: AtlasLetterDetail[];
} => {
  const city = cityName.toUpperCase().replace(/[^A-Z]/g, "");
  const key = masterKey.toUpperCase().replace(/[^A-Z]/g, "");
 
  if (key.length !== 10) {
    throw new Error("Master key must be exactly 10 letters.");
  }
 
  let encrypted = "";
  const shifts: AtlasLetterDetail[] = [];
 
  for (let i = 0; i < city.length; i++) {
    const plainChar = city[i];
    const plainIndex = ATLAS_ALPHABET.indexOf(plainChar);
    if (plainIndex === -1) continue;
 
    const mechanicIndex = i % 10;
    const keyChar = key[mechanicIndex];
    const baseShift = ATLAS_ALPHABET.indexOf(keyChar) + 1; // A=1
    const mechanicModifier = mechanicIndex * 3;
    const totalShift = (baseShift + mechanicModifier) % 26;
 
    const encryptedIndex = (plainIndex + totalShift) % 26;
    const encryptedChar = ATLAS_ALPHABET[encryptedIndex];
 
    encrypted += encryptedChar;
 
    shifts.push({
      position: i,
      plainChar,
      encryptedChar,
      keyChar,
      baseShift,
      mechanicModifier,
      totalShift,
      mechanicIndex,
      mechanicName: CIPHER_MECHANICS[mechanicIndex].name,
      mechanicShortName: CIPHER_MECHANICS[mechanicIndex].shortName,
    });
  }
 
  return { encrypted, shifts };
};
 
// ─────────────────────────────────────────────
// CORE DECRYPTION FUNCTION
// Called by the Atlas Decode page.
// Must be the exact inverse of atlasEncrypt.
// ─────────────────────────────────────────────
 
/**
 * Decrypts a single encrypted character at position i.
 * The player calls this after rotating the wheel to verify alignment.
 *
 * @param encryptedChar   Single uppercase letter from the encrypted city
 * @param masterKey       The confirmed 10-letter master key
 * @param position        0-based index of this letter in the city name
 * @returns               The decrypted plain letter
 */
export const atlasDecryptChar = (
  encryptedChar: string,
  masterKey: string,
  position: number
): string => {
  const key = masterKey.toUpperCase().replace(/[^A-Z]/g, "");
  const encIndex = ATLAS_ALPHABET.indexOf(encryptedChar.toUpperCase());
  if (encIndex === -1) return "";
 
  const mechanicIndex = position % 10;
  const keyChar = key[mechanicIndex];
  const baseShift = ATLAS_ALPHABET.indexOf(keyChar) + 1;
  const mechanicModifier = mechanicIndex * 3;
  const totalShift = (baseShift + mechanicModifier) % 26;
 
  const plainIndex = (encIndex - totalShift + 26) % 26;
  return ATLAS_ALPHABET[plainIndex];
};
 
/**
 * Decrypts the full encrypted city string.
 * Used for verification and hint systems.
 */
export const atlasDecrypt = (
  encrypted: string,
  masterKey: string
): string => {
  return encrypted
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .map((char, i) => atlasDecryptChar(char, masterKey, i))
    .join("");
};
 
// ─────────────────────────────────────────────
// SHIFT AMOUNT GETTER
// Used by the Atlas Decode wheel to know how
// many positions to rotate for the current letter.
// ─────────────────────────────────────────────
 
/**
 * Returns the total rotation amount needed to decode letter at position i.
 * The player must rotate the outer wheel ring by this many letter positions.
 */
export const getShiftForPosition = (
  masterKey: string,
  position: number
): number => {
  const key = masterKey.toUpperCase().replace(/[^A-Z]/g, "");
  const mechanicIndex = position % 10;
  const keyChar = key[mechanicIndex];
  const baseShift = ATLAS_ALPHABET.indexOf(keyChar) + 1;
  const mechanicModifier = mechanicIndex * 3;
  return (baseShift + mechanicModifier) % 26;
};
 
// ─────────────────────────────────────────────
// CIPHER ASSIGNMENT GENERATOR
// Builds the list of which cipher protects which letter.
// Used in the GM Panel preview and stone fragment data.
// ─────────────────────────────────────────────
 
/**
 * Returns a cipher assignment for each letter of the city.
 * For cities > 10 letters, mechanics cycle back around.
 */
export const generateCipherAssignments = (
  cityName: string
): CipherAssignment[] => {
  const city = cityName.toUpperCase().replace(/[^A-Z]/g, "");
  return city.split("").map((letter, i) => ({
    letterIndex: i,
    letter,
    mechanicIndex: i % 10,
    cipherName: CIPHER_MECHANICS[i % 10].name,
    cipherShortName: CIPHER_MECHANICS[i % 10].shortName,
  }));
};
 
// ─────────────────────────────────────────────
// STONE FRAGMENT GENERATOR
// Creates the 10 stone fragment data objects.
// Edge symbols are assigned based on master key
// alphabetical order — this determines assembly order.
// ─────────────────────────────────────────────
 
export const EDGE_SYMBOLS = [
  { id: "MOON",     symbol: "☽", name: "MOON CRESCENT" },
  { id: "STAR",     symbol: "✦", name: "STAR POINT"    },
  { id: "HEX",      symbol: "⬡", name: "HEX MARK"      },
  { id: "DIAMOND",  symbol: "◈", name: "DIAMOND CROSS" },
  { id: "TRIANGLE", symbol: "⟁", name: "TRIANGLE WAVE" },
  { id: "COMPASS",  symbol: "⊕", name: "COMPASS ROSE"  },
];
 
/**
 * Generates 10 stone fragment data objects.
 *
 * Assembly order is determined by the alphabetical rank
 * of each master key letter. The fragment for the game
 * that awarded the alphabetically-first key letter goes
 * in slot 1, and so on.
 *
 * @param masterKey       10-letter master key
 * @param keyLetterMap    Map of cipherGame → awarded letter
 * @param encryptShifts   Shift details from atlasEncrypt
 */
export const generateStoneFragments = (
  masterKey: string,
  keyLetterMap: Record<string, string>,
  encryptShifts: AtlasLetterDetail[]
): StoneFragment[] => {
  const CIPHER_GAME_NAMES = [
    "CAESAR", "RAIL FENCE", "VIGENÈRE", "TRANSPOSITION", "PLAYFAIR",
    "NIHILIST", "ENIGMA", "FOUR-SQUARE", "BIFID", "ADFGVX",
  ];
 
  // Determine correct assembly order from master key alphabetical rank
  const keyLetters = masterKey.toUpperCase().split("");
  const sortedIndices = keyLetters
    .map((letter, index) => ({ letter, index }))
    .sort((a, b) => a.letter.localeCompare(b.letter))
    .map((item) => item.index);
 
  // Edge symbol chain — fragment[i].rightEdge === fragment[i+1].leftEdge
  const symbolChain = generateEdgeSymbolChain(10);
 
  return CIPHER_GAME_NAMES.map((gameName, gameIndex) => {
    // Which assembly slot does this fragment belong in?
    const assemblySlot = sortedIndices.indexOf(gameIndex);
 
    // Shift data for this fragment (for city letters that use this mechanic)
    const relevantShifts = encryptShifts.filter(
      (s) => s.mechanicIndex === gameIndex
    );
 
    return {
      fragmentId: gameIndex,
      cipherGame: gameName,
      assemblySlot,                           // correct slot 0-9
      keyLetter: keyLetters[gameIndex],        // this fragment's key letter
      keyPosition: gameIndex + 1,             // 1-10 position in master key
      edgeSymbolLeft: symbolChain[assemblySlot].left,
      edgeSymbolRight: symbolChain[assemblySlot].right,
      innerSegment: {
        cipherMechanicId: gameIndex,
        cipherName: CIPHER_MECHANICS[gameIndex].shortName,
        cipherIcon: CIPHER_MECHANICS[gameIndex].icon,
      },
      middleSegment: {
        keyPosition: gameIndex + 1,           // reveals after correct placement
        keyLetter: keyLetters[gameIndex],
      },
      outerSegment: {
        cipherData: relevantShifts
          .slice(0, 3)
          .map((s) => s.encryptedChar)
          .join("") || "???",
      },
    };
  });
};
 
/**
 * Generates a chain of edge symbols so adjacent fragments connect.
 * fragment[i].right === fragment[i+1].left (wrapping around)
 */
const generateEdgeSymbolChain = (count: number): { left: string; right: string }[] => {
  const symbolIds = EDGE_SYMBOLS.map((s) => s.id);
  const chain: { left: string; right: string }[] = [];
 
  // Simple deterministic assignment — evenly distribute 6 symbols across 10 fragments
  for (let i = 0; i < count; i++) {
    const leftSymbol = symbolIds[i % symbolIds.length];
    const rightSymbol = symbolIds[(i + 1) % symbolIds.length];
    chain.push({ left: leftSymbol, right: rightSymbol });
  }
 
  return chain;
};
 
// ─────────────────────────────────────────────
// SESSION CODE GENERATOR
// ─────────────────────────────────────────────
 
/** Generates a random 4-digit session code string */
export const generateSessionCode = (): string => {
  return String(Math.floor(1000 + Math.random() * 9000));
};
 
// ─────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────
 
/** Returns true if masterKey is exactly 10 alpha characters */
export const validateMasterKey = (key: string): boolean => {
  return /^[A-Za-z]{10}$/.test(key);
};
 
/** Strips spaces and uppercases a city name for encryption */
export const normalizeCityName = (city: string): string => {
  return city.toUpperCase().replace(/[^A-Z]/g, "");
};
 
/** Estimates decode time in minutes based on city length */
export const estimateDecodeTime = (cityLength: number): string => {
  const seconds = cityLength * 45;
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} MIN`;
};
 
// ─────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────
 
export interface AtlasLetterDetail {
  position: number;
  plainChar: string;
  encryptedChar: string;
  keyChar: string;
  baseShift: number;
  mechanicModifier: number;
  totalShift: number;
  mechanicIndex: number;
  mechanicName: string;
  mechanicShortName: string;
}
 
export interface CipherAssignment {
  letterIndex: number;
  letter: string;
  mechanicIndex: number;
  cipherName: string;
  cipherShortName: string;
}
 
export interface StoneFragment {
  fragmentId: number;
  cipherGame: string;
  assemblySlot: number;
  keyLetter: string;
  keyPosition: number;
  edgeSymbolLeft: string;
  edgeSymbolRight: string;
  innerSegment: {
    cipherMechanicId: number;
    cipherName: string;
    cipherIcon: string;
  };
  middleSegment: {
    keyPosition: number;
    keyLetter: string;
  };
  outerSegment: {
    cipherData: string;
  };
}
 
export interface SessionData {
  sessionCode: string;
  cityName: string;
  cityNameNormalized: string;
  cityEncrypted: string;
  stateName: string;
  masterKey: string;
  gmMessage: string;
  cipherAssignments: CipherAssignment[];
  stoneFragments: StoneFragment[];
  keyLetterAssignments: KeyLetterAssignment[];
  shiftDetails: AtlasLetterDetail[];
  createdAt: number;
}
 
export interface KeyLetterAssignment {
  cipherGame: string;
  keyLetter: string;
  position: number;       // 1-10 in master key
  fragmentId: number;
}
 
export interface PlayerProgress {
  sessionCode: string;
  completedGames: string[];
  collectedKeyLetters: { game: string; letter: string }[];
  assembledFragments: number[];
  masterKeyArranged: boolean;
  atlasDecodeProgress: number;
  isComplete: boolean;
  startTime: number;
  endTime: number | null;
  totalHintsUsed: number;
  hintsPerPage: Record<string, number>;
}

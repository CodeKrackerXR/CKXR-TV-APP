export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Standard Enigma I rotor wirings (using standard historical wirings for authenticity)
export const ROTOR_WIRINGS = [
  "EKMFLGDQVZNTOWYHXUSPAIBRCJ", // Rotor I
  "AJDKSIRUXBLHWTMCQGZNPYFVOE", // Rotor II
  "BDFHJLCPRTXVZNYEIWGAKMUSQO"  // Rotor III
];

export const REFLECTOR = "YRUHQSLDPXNGOKMIEBFZCWVJAT"; // Reflector B

/**
 * Transforms a character through a rotor with a given offset.
 * direction: true for forward (into reflector), false for backward (out of reflector)
 */
export const rotorTransform = (char: string, wiring: string, offset: number, reverse: boolean = false): string => {
  const charIdx = ALPHABET.indexOf(char);
  if (charIdx === -1) return char;

  if (!reverse) {
    // Forward mapping: Input -> Wiring
    const shiftedInputIdx = (charIdx + offset + 26) % 26;
    const wiredChar = wiring[shiftedInputIdx];
    const outputIdx = (ALPHABET.indexOf(wiredChar) - offset + 26) % 26;
    return ALPHABET[outputIdx];
  } else {
    // Reverse mapping: Wiring -> Input
    const shiftedInputIdx = (charIdx + offset + 26) % 26;
    const inputChar = ALPHABET[shiftedInputIdx];
    const wiredIdx = wiring.indexOf(inputChar);
    const outputIdx = (wiredIdx - offset + 26) % 26;
    return ALPHABET[outputIdx];
  }
};

export const reflectorTransform = (char: string): string => {
  const idx = ALPHABET.indexOf(char);
  if (idx === -1) return char;
  return REFLECTOR[idx];
};

/**
 * Runs the Enigma machine on a string.
 * startStr: "A-A-A" (offsets for rotors 1, 2, 3)
 */
export const runGearedEnigma = (text: string, startStr: string, mode: 'ENCODE' | 'DECODE') => {
  const parts = startStr.split('-').map(s => ALPHABET.indexOf(s));
  let offsets = [parts[0], parts[1], parts[2]]; // [R1, R2, R3]
  
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
  let result = '';
  const history: any[] = [];

  for (const char of cleanText) {
    // In Enigma, rotors step BEFORE encoding
    // Rotor 1 steps every keypress
    offsets[0] = (offsets[0] + 1) % 26;
    
    // Rotor 2 steps if Rotor 1 completed a full circle (simplified stepping for game logic)
    if (offsets[0] === 0) {
      offsets[1] = (offsets[1] + 1) % 26;
      // Rotor 3 steps if Rotor 2 completed a full circle
      if (offsets[1] === 0) {
        offsets[2] = (offsets[2] + 1) % 26;
      }
    }

    // Step through rotors forward
    let current = char;
    current = rotorTransform(current, ROTOR_WIRINGS[0], offsets[0]);
    current = rotorTransform(current, ROTOR_WIRINGS[1], offsets[1]);
    current = rotorTransform(current, ROTOR_WIRINGS[2], offsets[2]);

    // Reflector
    current = reflectorTransform(current);

    // Step back through rotors reverse
    current = rotorTransform(current, ROTOR_WIRINGS[2], offsets[2], true);
    current = rotorTransform(current, ROTOR_WIRINGS[1], offsets[1], true);
    current = rotorTransform(current, ROTOR_WIRINGS[0], offsets[0], true);

    result += current;
    history.push({ 
      char, 
      result: current, 
      offsets: [...offsets] 
    });
  }

  return { result, history };
};

export const getLetterAtMarker = (wiring: string, offset: number): string => {
    const idx = (Math.round(offset) % 26 + 26) % 26;
    return ALPHABET[idx];
};

export const getOffsetForChar = (wiring: string, char: string): number => {
    return ALPHABET.indexOf(char.toUpperCase());
};

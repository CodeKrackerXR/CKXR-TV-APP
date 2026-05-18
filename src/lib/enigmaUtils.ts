/**
 * Enigma Geared Protocol v2.0
 * Based on the interlocked 3-wheel mechanical toy.
 *
 * Logic:
 * 1. Wheels are geared in a row: W1 - W2 - W3.
 * 2. As W3 rotates by Δθ, W2 rotates by -Δθ, and W1 rotates by Δθ.
 * 3. Operation:
 *    - To encode/decode a character:
 *    - Rotate W3 until the "Source Char" is at the W3 Top Marker.
 *    - The "Result Char" is read at the Top Marker of W1 (for odd steps) or W2 (for even steps).
 */

export const ROTOR_WIRINGS = [
  "EKMFLGDQVZNTOWYHXUSPAIBRCJ", // Rotor I (Wheel 1)
  "AJDKSIRUXBLHWTMCQGZNPYFVOE", // Rotor II (Wheel 2)
  "BDFHJLCPRTXVZNYEIWGAKMUSQO"  // Rotor III (Wheel 3)
];

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Returns the letter at the top marker of a wheel given its rotation offset.
 * Letter value indexed by (alphabetIndex - offset) % 26
 */
export const getLetterAtMarker = (wiring: string, offset: number) => {
  const idx = Math.round((26 - (offset % 26)) % 26) % 26;
  return wiring[idx];
};

/**
 * Returns the offset required to bring a specific char to the top marker.
 */
export const getOffsetForChar = (wiring: string, char: string): number => {
  const targetIdx = wiring.indexOf(char);
  // We want (26 - offset) % 26 = targetIdx
  // offset = (26 - targetIdx) % 26
  return (26 - targetIdx) % 26;
};

export const runGearedEnigma = (
  text: string,
  startPositions: string, // "A-B-C"
  mode: 'ENCODE' | 'DECODE',
  wirings: string[] = ROTOR_WIRINGS
): { result: string; finalOffsets: [number, number, number]; history: { char: string; result: string; offsets: [number, number, number] }[] } => {
  const parts = startPositions.split('-');

  // Starting offsets: what rotation puts A, B, C at the top?
  let o1 = getOffsetForChar(wirings[0], parts[0]);
  let o2 = getOffsetForChar(wirings[1], parts[1]);
  let o3 = getOffsetForChar(wirings[2], parts[2]);

  let result = "";
  const history = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();

    if (!ALPHABET.includes(char)) {
      result += char;
      continue;
    }

    if (mode === 'ENCODE') {
      // ENCODE: Find rotation to put Plaintext char P on W3, then read Ciphertext char C on W1/W2
      const deltaO = getOffsetForChar(wirings[2], char) - o3;

      // Apply movement
      o3 += deltaO;
      o2 -= deltaO;
      o1 += deltaO;

      // The ciphertext character is what's now at the marker of W1 or W2
      const targetWheelIdx = (i % 2 === 0) ? 0 : 1;
      const resChar = getLetterAtMarker(wirings[targetWheelIdx], targetWheelIdx === 0 ? o1 : o2);

      result += resChar;
      history.push({ char, result: resChar, offsets: [o1, o2, o3] as [number, number, number] });

    } else {
      // DECODE: Find rotation to put Ciphertext char C on W1/W2, then read Plaintext char P on W3
      const targetWheelIdx = (i % 2 === 0) ? 0 : 1;
      const targetWiring = wirings[targetWheelIdx];
      const currentTargetOffset = (targetWheelIdx === 0) ? o1 : o2;

      // We need: getLetterAtMarker(targetWiring, currentTargetOffset + movement) = char
      // Movement is +deltaO for W1, -deltaO for W2
      let deltaO = 0;
      const targetIdx = targetWiring.indexOf(char);
      const requiredOffset = (26 - targetIdx) % 26;

      if (targetWheelIdx === 0) {
        // W1 moves +deltaO
        deltaO = requiredOffset - currentTargetOffset;
      } else {
        // W2 moves -deltaO
        // requiredOffset = currentTargetOffset - deltaO
        deltaO = currentTargetOffset - requiredOffset;
      }

      // Normalize deltaO
      while (deltaO > 13) deltaO -= 26;
      while (deltaO <= -13) deltaO += 26;

      o3 += deltaO;
      o2 -= deltaO;
      o1 += deltaO;

      const resChar = getLetterAtMarker(wirings[2], o3);

      result += resChar;
      history.push({ char, result: resChar, offsets: [o1, o2, o3] as [number, number, number] });
    }
  }

  return { result, finalOffsets: [o1, o2, o3], history };
};
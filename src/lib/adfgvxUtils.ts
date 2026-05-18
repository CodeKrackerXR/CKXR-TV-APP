
export const ADFGVX_LABELS = ['A', 'D', 'F', 'G', 'V', 'X'];
export const ALPHABET_6X6 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Generates a 6x6 Polybius square from a keyword. 
 */
export const generatePolybiusSquare = (key: string): string[] => {
  const cleanKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const seen = new Set<string>();
  const square: string[] = [];

  for (const char of cleanKey) {
    if (!seen.has(char)) {
      seen.add(char);
      square.push(char);
    }
  }

  for (const char of ALPHABET_6X6) {
    if (!seen.has(char)) {
      seen.add(char);
      square.push(char);
    }
  }

  return square;
};

/**
 * Returns column ranks for alphabetical transposition (1-indexed).
 */
export const getColumnRanks = (key: string): number[] => {
    const chars = key.toUpperCase().split('');
    const sorted = [...chars].sort();
    const used = new Array(chars.length).fill(false);
    const ranks = new Array(chars.length);

    for (let i = 0; i < sorted.length; i++) {
        const char = sorted[i];
        // Find first occurrence of this char that hasn't been ranked
        const index = chars.findIndex((c, idx) => c === char && !used[idx]);
        ranks[index] = i + 1;
        used[index] = true;
    }
    return ranks;
};

/**
 * Performs full ADFGVX encoding.
 */
export const adfgvxEncode = (text: string, gridKey: string, transKey: string) => {
  const square = generatePolybiusSquare(gridKey);
  const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Stage 1: Fractionation
  let intermediate = '';
  const stage1Steps: { source: string; result: string }[] = [];

  for (const char of cleanText) {
    const idx = square.indexOf(char);
    if (idx === -1) continue;
    const r = Math.floor(idx / 6);
    const c = idx % 6;
    const pair = ADFGVX_LABELS[r] + ADFGVX_LABELS[c];
    intermediate += pair;
    stage1Steps.push({ source: char, result: pair });
  }

  // Stage 2: Columnar Transposition
  const numCols = transKey.length;
  if (numCols === 0) return { ciphertext: '', intermediate, grid: [], ranks: [], stage1Steps };

  const numRows = Math.ceil(intermediate.length / numCols);
  const grid: string[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(''));
  
  for (let i = 0; i < intermediate.length; i++) {
    const r = Math.floor(i / numCols);
    const c = i % numCols;
    grid[r][c] = intermediate[i];
  }

  const ranks = getColumnRanks(transKey);
  let ciphertext = '';
  
  // Read columns in rank order (1, 2, 3...)
  for (let r = 1; r <= numCols; r++) {
    const colIdx = ranks.indexOf(r);
    for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
      if (grid[rowIdx][colIdx]) {
        ciphertext += grid[rowIdx][colIdx];
      }
    }
  }

  return { ciphertext, intermediate, grid, ranks, stage1Steps };
};

/**
 * Performs full ADFGVX decoding (mental model helper).
 */
export const adfgvxDecode = (ciphertext: string, gridKey: string, transKey: string) => {
    const numCols = transKey.length;
    if (numCols === 0) return "";
    const numRows = Math.ceil(ciphertext.length / numCols);
    const fullColsCount = ciphertext.length % numCols;
    const ranks = getColumnRanks(transKey);
    const colSizes = Array.from({ length: numCols }).map((_, i) => 
        numRows - (fullColsCount !== 0 && i >= fullColsCount ? 1 : 0)
    );

    // Build the grid back
    const grid: string[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(''));
    let currentPos = 0;

    for (let r = 1; r <= numCols; r++) {
        const colIdx = ranks.indexOf(r);
        const size = colSizes[colIdx];
        for (let rowIdx = 0; rowIdx < size; rowIdx++) {
            grid[rowIdx][colIdx] = ciphertext[currentPos++];
        }
    }

    // Read rows to get intermediate
    let intermediate = '';
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            if (grid[r][c]) intermediate += grid[r][c];
        }
    }

    // Step 2: Polybius Square lookup
    const square = generatePolybiusSquare(gridKey);
    let result = '';
    for (let i = 0; i < intermediate.length; i += 2) {
        const pair = intermediate.substring(i, i + 2);
        if (pair.length < 2) break;
        const r = ADFGVX_LABELS.indexOf(pair[0]);
        const c = ADFGVX_LABELS.indexOf(pair[1]);
        if (r !== -1 && c !== -1) {
            result += square[r * 6 + c];
        }
    }

    return result;
};

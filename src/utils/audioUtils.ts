// ============================================================
// audioUtils.ts
// CODE KRACKER XR — Web Audio API Utility Functions
// ============================================================
// Works in Chrome, Safari, Firefox, Edge.
// Uses a shared AudioContext to avoid hitting browser limits.
// Import and use these functions anywhere in the app.
// ============================================================
 
// Shared AudioContext — created once, reused across all calls
let audioCtx: AudioContext | null = null;
 
const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioCtx || audioCtx.state === "closed") {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx?.state === "suspended") audioCtx.resume();
  return audioCtx;
};
 
// ─────────────────────────────────────────────
// PRIMITIVE — Play a single tone
// ─────────────────────────────────────────────
 
/**
 * Plays a single sine-wave tone.
 * @param frequency   Hz — e.g. 440 for A4
 * @param duration    Seconds — e.g. 0.2
 * @param volume      0.0 to 1.0 — default 0.3
 * @param startDelay  Seconds from now to start — default 0
 */
export const playTone = (
  frequency: number,
  duration: number,
  volume = 0.3,
  startDelay = 0
): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
 
    osc.connect(gain);
    gain.connect(ctx.destination);
 
    osc.type = "sine";
    osc.frequency.value = frequency;
 
    const startTime = ctx.currentTime + startDelay;
    const endTime = startTime + duration;
 
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);
 
    osc.start(startTime);
    osc.stop(endTime + 0.05);
  } catch (e) {
    // Silently fail — audio is non-critical
    console.warn("Audio playback unavailable:", e);
  }
};
 
// ─────────────────────────────────────────────
// CORRECT PLACEMENT SOUND
// Used when a fragment or letter is correctly placed
// ─────────────────────────────────────────────
 
/** A soft rising two-note chime — positive, satisfying */
export const playCorrectSound = (): void => {
  playTone(659, 0.15, 0.25, 0);      // E5
  playTone(880, 0.2, 0.2, 0.12);     // A5
};
 
// ─────────────────────────────────────────────
// INCORRECT PLACEMENT SOUND
// Used when a fragment or letter placement fails
// ─────────────────────────────────────────────
 
/** A low dull thud — gentle but clearly wrong */
export const playIncorrectSound = (): void => {
  playTone(180, 0.25, 0.3, 0);       // Low thump
  playTone(150, 0.2, 0.2, 0.1);      // Slightly lower
};
 
// ─────────────────────────────────────────────
// WHEEL ALIGNMENT SOUND
// Used when the Atlas Wheel aligns to a correct position
// ─────────────────────────────────────────────
 
/** A single clean chime — letter aligned */
export const playAlignmentSound = (): void => {
  playTone(523, 0.1, 0.2, 0);        // C5
  playTone(784, 0.15, 0.15, 0.08);   // G5
};
 
// ─────────────────────────────────────────────
// LETTER CONFIRMED SOUND
// Used when a decoded letter is locked in
// ─────────────────────────────────────────────
 
/** A satisfying click-lock tone */
export const playConfirmSound = (): void => {
  playTone(698, 0.08, 0.3, 0);       // F5
  playTone(880, 0.12, 0.25, 0.06);   // A5
  playTone(1047, 0.18, 0.2, 0.14);   // C6
};
 
// ─────────────────────────────────────────────
// MASTER KEY COMPLETE SOUND
// Used when all 10 key letters are arranged correctly
// ─────────────────────────────────────────────
 
/** Rising 4-note cascade — key unlocked */
export const playKeyCompleteSound = (): void => {
  playTone(523, 0.15, 0.3, 0);       // C5
  playTone(659, 0.15, 0.3, 0.15);    // E5
  playTone(784, 0.15, 0.3, 0.3);     // G5
  playTone(1047, 0.4, 0.35, 0.45);   // C6 — held longer
};
 
// ─────────────────────────────────────────────
// WHEEL COMPLETE SOUND
// Used when all 10 fragments are assembled
// ─────────────────────────────────────────────
 
/** A deep resonant unlock — ancient mechanism engaging */
export const playWheelCompleteSound = (): void => {
  playTone(220, 0.5, 0.4, 0);        // A3 — deep bass
  playTone(440, 0.4, 0.3, 0.2);      // A4
  playTone(659, 0.3, 0.25, 0.4);     // E5
  playTone(880, 0.5, 0.3, 0.6);      // A5 — rising
  playTone(1047, 0.8, 0.35, 0.9);    // C6 — sustained
};
 
// ─────────────────────────────────────────────
// TRIUMPHAL FANFARE
// Used on the City Reveal page
// ─────────────────────────────────────────────
 
/**
 * A 4-note ascending fanfare — the big win moment.
 * Same notes, compatible with all browsers via Web Audio API.
 */
export const playFanfare = (): void => {
  // Ascending triumph: C5 → E5 → G5 → C6
  playTone(523, 0.2, 0.35, 0);       // C5
  playTone(659, 0.2, 0.35, 0.25);    // E5
  playTone(784, 0.2, 0.35, 0.5);     // G5
  playTone(1047, 0.6, 0.4, 0.75);    // C6 — held
 
  // Echo reinforcement
  playTone(523, 0.1, 0.15, 1.5);     // C5 echo
  playTone(1047, 0.4, 0.25, 1.6);    // C6 echo
};
 
// ─────────────────────────────────────────────
// GAME COMPLETE SOUND
// Used when a cipher game is solved
// ─────────────────────────────────────────────
 
/** Reward sting — you solved it! */
export const playGameCompleteSound = (): void => {
  playTone(440, 0.1, 0.3, 0);        // A4
  playTone(554, 0.1, 0.3, 0.1);      // C#5
  playTone(659, 0.1, 0.3, 0.2);      // E5
  playTone(880, 0.35, 0.4, 0.3);     // A5
};
 
// ─────────────────────────────────────────────
// PASSWORD ACCEPTED SOUND (GM Panel)
// ─────────────────────────────────────────────
 
export const playAccessGrantedSound = (): void => {
  playTone(880, 0.08, 0.25, 0);
  playTone(1047, 0.12, 0.25, 0.08);
  playTone(1319, 0.2, 0.3, 0.18);
};
 
// ─────────────────────────────────────────────
// PASSWORD DENIED SOUND (GM Panel)
// ─────────────────────────────────────────────
 
export const playAccessDeniedSound = (): void => {
  playTone(300, 0.15, 0.4, 0);
  playTone(220, 0.3, 0.4, 0.15);
};

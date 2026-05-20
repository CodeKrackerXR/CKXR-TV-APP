// ============================================================
// atlasFirebaseUtils.ts
// CODE KRACKER XR — Firebase Session Management
// ============================================================
// Uses your existing Firebase setup (db, auth from '../firebase')
// All Atlas session data lives in the 'atlas_sessions' collection.
// ============================================================
 
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase"; // your existing firebase config
import type {
  SessionData,
  PlayerProgress,
  KeyLetterAssignment,
} from "./atlasCipherUtils";
 
// ─────────────────────────────────────────────
// FIRESTORE COLLECTION PATHS
// ─────────────────────────────────────────────
 
const SESSION_COLLECTION = "atlas_sessions";
const sessionRef = (code: string) =>
  doc(db, SESSION_COLLECTION, code);
const progressRef = (code: string) =>
  doc(db, SESSION_COLLECTION, code, "progress", "playerProgress");
 
// ─────────────────────────────────────────────
// GM PANEL — CREATE SESSION
// Called when GM hits Generate Mission button
// ─────────────────────────────────────────────
 
/**
 * Saves the full generated session to Firestore.
 * The session code becomes the document ID.
 */
export const createAtlasSession = async (
  sessionData: SessionData
): Promise<void> => {
  try {
    await setDoc(sessionRef(sessionData.sessionCode), {
      ...sessionData,
      createdAt: serverTimestamp(),
    });
 
    // Initialize empty player progress document
    await setDoc(progressRef(sessionData.sessionCode), {
      sessionCode: sessionData.sessionCode,
      completedGames: [],
      collectedKeyLetters: [],
      assembledFragments: [],
      masterKeyArranged: false,
      atlasDecodeProgress: 0,
      isComplete: false,
      startTime: null,
      endTime: null,
      totalHintsUsed: 0,
      hintsPerPage: {},
    });
 
    console.log(`✅ Atlas session ${sessionData.sessionCode} created.`);
  } catch (error) {
    console.error("❌ Failed to create Atlas session:", error);
    throw error;
  }
};
 
// ─────────────────────────────────────────────
// PLAYER — LOAD SESSION BY CODE
// Called when player enters the 4-digit session code
// ─────────────────────────────────────────────
 
/**
 * Loads session data by session code.
 * Returns null if the code doesn't exist.
 */
export const loadAtlasSession = async (
  sessionCode: string
): Promise<SessionData | null> => {
  try {
    const snap = await getDoc(sessionRef(sessionCode));
    if (!snap.exists()) {
      console.warn(`Session ${sessionCode} not found.`);
      return null;
    }
    return snap.data() as SessionData;
  } catch (error) {
    console.error("❌ Failed to load Atlas session:", error);
    throw error;
  }
};
 
// ─────────────────────────────────────────────
// PLAYER — LOAD PROGRESS
// ─────────────────────────────────────────────
 
export const loadPlayerProgress = async (
  sessionCode: string
): Promise<PlayerProgress | null> => {
  try {
    const snap = await getDoc(progressRef(sessionCode));
    if (!snap.exists()) return null;
    return snap.data() as PlayerProgress;
  } catch (error) {
    console.error("❌ Failed to load player progress:", error);
    return null;
  }
};
 
// ─────────────────────────────────────────────
// PLAYER — MARK GAME COMPLETE + AWARD LETTER
// This is the 3-line hook that goes into each
// cipher game's onPostResults callback.
// ─────────────────────────────────────────────
 
/**
 * Call this inside every cipher game's onPostResults handler.
 * Awards the key letter and stone fragment for that game.
 *
 * Usage in each game page:
 *   onPostResults={async (data) => {
 *     // your existing results logic here...
 *     await awardAtlasReward(sessionCode, 'CAESAR');
 *   }}
 */
export const awardAtlasReward = async (
  sessionCode: string,
  cipherGame: string
): Promise<{ keyLetter: string; fragmentId: number } | null> => {
  try {
    // 1. Load session to get the key letter for this game
    const session = await loadAtlasSession(sessionCode);
    if (!session) return null;
 
    const assignment: KeyLetterAssignment | undefined =
      session.keyLetterAssignments.find(
        (k) => k.cipherGame.toUpperCase() === cipherGame.toUpperCase()
      );
    if (!assignment) return null;
 
    const fragment = session.stoneFragments.find(
      (f) => f.cipherGame.toUpperCase() === cipherGame.toUpperCase()
    );
    if (!fragment) return null;
 
    // 2. Update progress — mark game complete, award letter and fragment
    await updateDoc(progressRef(sessionCode), {
      completedGames: arrayUnion(cipherGame.toUpperCase()),
      collectedKeyLetters: arrayUnion({
        game: cipherGame.toUpperCase(),
        letter: assignment.keyLetter,
      }),
      assembledFragments: arrayUnion(fragment.fragmentId),
    });
 
    // 3. Start timer on first game completion
    const progress = await loadPlayerProgress(sessionCode);
    if (progress && progress.completedGames.length === 1) {
      await updateDoc(progressRef(sessionCode), {
        startTime: serverTimestamp(),
      });
    }
 
    console.log(
      `🔑 Awarded letter ${assignment.keyLetter} + fragment ${fragment.fragmentId} for ${cipherGame}`
    );
 
    return {
      keyLetter: assignment.keyLetter,
      fragmentId: fragment.fragmentId,
    };
  } catch (error) {
    console.error("❌ Failed to award Atlas reward:", error);
    return null;
  }
};
 
// ─────────────────────────────────────────────
// GM PANEL — REAL-TIME PROGRESS LISTENER
// Attaches a live listener so the GM monitor
// screen updates without refreshing.
// ─────────────────────────────────────────────
 
/**
 * Subscribe to live player progress updates.
 * Returns an unsubscribe function — call it on component unmount.
 *
 * Usage in GM Panel monitor screen:
 *   useEffect(() => {
 *     const unsub = subscribeToProgress(sessionCode, setProgress);
 *     return () => unsub();
 *   }, [sessionCode]);
 */
export const subscribeToProgress = (
  sessionCode: string,
  onUpdate: (progress: PlayerProgress) => void
): (() => void) => {
  return onSnapshot(progressRef(sessionCode), (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as PlayerProgress);
    }
  });
};
 
// ─────────────────────────────────────────────
// PLAYER — UPDATE ATLAS DECODE PROGRESS
// Called each time a city letter is confirmed decoded
// ─────────────────────────────────────────────
 
export const updateDecodeProgress = async (
  sessionCode: string,
  lettersDecoded: number
): Promise<void> => {
  try {
    await updateDoc(progressRef(sessionCode), {
      atlasDecodeProgress: lettersDecoded,
    });
  } catch (error) {
    console.error("❌ Failed to update decode progress:", error);
  }
};
 
// ─────────────────────────────────────────────
// PLAYER — MARK SESSION COMPLETE
// Called when city is fully decoded
// ─────────────────────────────────────────────
 
export const completeAtlasSession = async (
  sessionCode: string
): Promise<void> => {
  try {
    await updateDoc(progressRef(sessionCode), {
      isComplete: true,
      endTime: serverTimestamp(),
    });
    console.log(`🏆 Session ${sessionCode} marked complete!`);
  } catch (error) {
    console.error("❌ Failed to complete session:", error);
  }
};
 
// ─────────────────────────────────────────────
// PLAYER — LOG HINT USED
// ─────────────────────────────────────────────
 
export const logHintUsed = async (
  sessionCode: string,
  page: string
): Promise<void> => {
  try {
    const progress = await loadPlayerProgress(sessionCode);
    if (!progress) return;
 
    const currentPageHints = progress.hintsPerPage[page] || 0;
 
    await updateDoc(progressRef(sessionCode), {
      totalHintsUsed: (progress.totalHintsUsed || 0) + 1,
      [`hintsPerPage.${page}`]: currentPageHints + 1,
    });
  } catch (error) {
    console.error("❌ Failed to log hint:", error);
  }
};
 
// ─────────────────────────────────────────────
// GM PANEL — RESET SESSION PROGRESS
// Clears all player progress but keeps session config
// ─────────────────────────────────────────────
 
export const resetSessionProgress = async (
  sessionCode: string
): Promise<void> => {
  try {
    await setDoc(progressRef(sessionCode), {
      sessionCode,
      completedGames: [],
      collectedKeyLetters: [],
      assembledFragments: [],
      masterKeyArranged: false,
      atlasDecodeProgress: 0,
      isComplete: false,
      startTime: null,
      endTime: null,
      totalHintsUsed: 0,
      hintsPerPage: {},
    });
    console.log(`🔄 Session ${sessionCode} progress reset.`);
  } catch (error) {
    console.error("❌ Failed to reset session:", error);
  }
};
 
// ─────────────────────────────────────────────
// HELPER — CHECK IF SESSION EXISTS
// ─────────────────────────────────────────────
 
export const sessionExists = async (
  sessionCode: string
): Promise<boolean> => {
  const snap = await getDoc(sessionRef(sessionCode));
  return snap.exists();
};

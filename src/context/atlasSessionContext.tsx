// ============================================================
// atlasSessionContext.tsx
// CODE KRACKER XR — Global Session State Provider
// ============================================================
// Wrap your entire app in <AtlasSessionProvider>.
// Any component can then call useAtlasSession() to access
// the current session data and player progress.
// ============================================================
 
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  loadAtlasSession,
  loadPlayerProgress,
  subscribeToProgress,
  awardAtlasReward,
  logHintUsed,
  updateDecodeProgress,
  completeAtlasSession,
} from "../utils/atlasFirebaseUtils";
import type { SessionData, PlayerProgress } from "../utils/atlasCipherUtils";
 
// ─────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────
 
interface AtlasSessionContextType {
  // Session state
  sessionCode: string | null;
  sessionData: SessionData | null;
  progress: PlayerProgress | null;
  isLoading: boolean;
  error: string | null;
 
  // Actions
  enterSessionCode: (code: string) => Promise<boolean>;
  clearSession: () => void;
  awardGameReward: (cipherGame: string) => Promise<{
    keyLetter: string;
    fragmentId: number;
  } | null>;
  markHintUsed: (page: string) => Promise<void>;
  updateDecode: (lettersDecoded: number) => Promise<void>;
  finishSession: () => Promise<void>;
 
  // Computed helpers
  isGameComplete: (cipherGame: string) => boolean;
  getKeyLetter: (cipherGame: string) => string | null;
  allGamesComplete: boolean;
  completedCount: number;
}
 
// ─────────────────────────────────────────────
// CONTEXT + HOOK
// ─────────────────────────────────────────────
 
const AtlasSessionContext = createContext<AtlasSessionContextType | null>(null);
 
export const useAtlasSession = (): AtlasSessionContextType => {
  const ctx = useContext(AtlasSessionContext);
  if (!ctx) {
    throw new Error(
      "useAtlasSession must be used inside <AtlasSessionProvider>"
    );
  }
  return ctx;
};
 
// ─────────────────────────────────────────────
// PROVIDER COMPONENT
// ─────────────────────────────────────────────
 
interface AtlasSessionProviderProps {
  children: React.ReactNode;
}
 
export const AtlasSessionProvider: React.FC<AtlasSessionProviderProps> = ({
  children,
}) => {
  const [sessionCode, setSessionCode] = useState<string | null>(() => {
    // Restore from localStorage on mount
    return localStorage.getItem("ckxr_active_session");
  });
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  // Hold the Firestore unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);
 
  // ── Load session when code is set ──
  useEffect(() => {
    if (!sessionCode) {
      setSessionData(null);
      setProgress(null);
      return;
    }
 
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await loadAtlasSession(sessionCode);
        if (!data) {
          setError("Session not found. Check the code and try again.");
          setSessionCode(null);
          localStorage.removeItem("ckxr_active_session");
          return;
        }
        setSessionData(data);
 
        const prog = await loadPlayerProgress(sessionCode);
        setProgress(prog);
 
        // Attach real-time listener for live progress updates
        if (unsubscribeRef.current) unsubscribeRef.current();
        unsubscribeRef.current = subscribeToProgress(
          sessionCode,
          (updatedProgress) => {
            setProgress(updatedProgress);
          }
        );
      } catch (err) {
        setError("Failed to load session. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
 
    load();
 
    // Cleanup listener on unmount or code change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [sessionCode]);
 
  // ── Enter a session code ──
  const enterSessionCode = useCallback(
    async (code: string): Promise<boolean> => {
      const trimmed = code.trim();
      if (!trimmed) return false;
      setSessionCode(trimmed);
      localStorage.setItem("ckxr_active_session", trimmed);
      return true;
    },
    []
  );
 
  // ── Clear session ──
  const clearSession = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setSessionCode(null);
    setSessionData(null);
    setProgress(null);
    setError(null);
    localStorage.removeItem("ckxr_active_session");
 
    // Clear all ckxr_ keys from localStorage
    Object.keys(localStorage)
      .filter((k) => k.startsWith("ckxr_"))
      .forEach((k) => localStorage.removeItem(k));
  }, []);
 
  // ── Award game reward ──
  const awardGameReward = useCallback(
    async (
      cipherGame: string
    ): Promise<{ keyLetter: string; fragmentId: number } | null> => {
      if (!sessionCode) return null;
      return awardAtlasReward(sessionCode, cipherGame);
    },
    [sessionCode]
  );
 
  // ── Log hint ──
  const markHintUsed = useCallback(
    async (page: string): Promise<void> => {
      if (!sessionCode) return;
      await logHintUsed(sessionCode, page);
    },
    [sessionCode]
  );
 
  // ── Update decode progress ──
  const updateDecode = useCallback(
    async (lettersDecoded: number): Promise<void> => {
      if (!sessionCode) return;
      await updateDecodeProgress(sessionCode, lettersDecoded);
    },
    [sessionCode]
  );
 
  // ── Complete session ──
  const finishSession = useCallback(async (): Promise<void> => {
    if (!sessionCode) return;
    await completeAtlasSession(sessionCode);
  }, [sessionCode]);
 
  // ── Computed helpers ──
  const isGameComplete = useCallback(
    (cipherGame: string): boolean => {
      if (!progress) return false;
      return progress.completedGames
        .map((g) => g.toUpperCase())
        .includes(cipherGame.toUpperCase());
    },
    [progress]
  );
 
  const getKeyLetter = useCallback(
    (cipherGame: string): string | null => {
      if (!progress) return null;
      const found = progress.collectedKeyLetters.find(
        (k) => k.game.toUpperCase() === cipherGame.toUpperCase()
      );
      return found ? found.letter : null;
    },
    [progress]
  );
 
  const completedCount = progress?.completedGames.length ?? 0;
  const allGamesComplete = completedCount === 10;
 
  // ── Context value ──
  const value: AtlasSessionContextType = {
    sessionCode,
    sessionData,
    progress,
    isLoading,
    error,
    enterSessionCode,
    clearSession,
    awardGameReward,
    markHintUsed,
    updateDecode,
    finishSession,
    isGameComplete,
    getKeyLetter,
    allGamesComplete,
    completedCount,
  };
 
  return (
    <AtlasSessionContext.Provider value={value}>
      {children}
    </AtlasSessionContext.Provider>
  );
};

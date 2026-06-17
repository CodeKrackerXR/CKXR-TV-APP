import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { ASSETS } from "../constants";
import { ChevronLeft, X } from "lucide-react";

interface AtlasGamePageProps {
  onBack: () => void;
  onReturnToEncoder: () => void;
  onNavigateToTheHunt: () => void;
  onNavigateToDigitalCoin: (finalTime?: string) => void;
  onPostResults?: (data: { sponsorKey: string; gameCode: string; time: string }) => void;
  initialCode: string;
  crackedOutput: string;
  setCrackedOutput: (val: string | ((prev: string) => string)) => void;
  mappingLetter: string;
  shift: number;
  setShift: (val: number) => void;
  targetShift?: number;
  rotation: number;
  setRotation: (val: number) => void;
  youtuber?: {
    name: string;
    avatar: string;
  };
  huntAnswers: string[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DEGREES_PER_LETTER = 360 / 26;
const CREATOR_DOC_ID = "MasterCreatorFolder";

// Helper to convert letter to 1-26 number
const letterToNumber = (char: string) => {
  const index = ALPHABET.indexOf(char.toUpperCase());
  return index === -1 ? char : (index + 1).toString();
};

export const AtlasGamePage: React.FC<AtlasGamePageProps> = ({
  onBack,
  onReturnToEncoder,
  onNavigateToTheHunt,
  onNavigateToDigitalCoin,
  onPostResults,
  initialCode,
  crackedOutput,
  setCrackedOutput,
  mappingLetter,
  shift,
  setShift,
  targetShift,
  rotation,
  setRotation,
  youtuber,
  huntAnswers,
}) => {
  const [cipherInput] = useState(initialCode);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRotationError, setShowRotationError] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ word: string; time: string } | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [pendingLetter, setPendingLetter] = useState<string | null>(null);
  const [suppressMismatch, setSuppressMismatch] = useState(false);
  const [hasInteractedWithWheel, setHasInteractedWithWheel] = useState(false);
  const [manualWord, setManualWord] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);

  // Mission Timer Logic
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const [stage2NewCode, setStage2NewCode] = useState("");
  const [stage2Episode, setStage2Episode] = useState("");
  const [stage2Riddle, setStage2Riddle] = useState("");
  const [isRiddleModalOpen, setIsRiddleModalOpen] = useState(false);
  const [stage3NewCode, setStage3NewCode] = useState("");
  const [stage3SponsorAd, setStage3SponsorAd] = useState("");
  const [stage3Position, setStage3Position] = useState("");

  const [selectedStageLetter, setSelectedStageLetter] = useState("A");
  const [pickedStageLetters, setPickedStageLetters] = useState<Set<string>>(new Set());
  const [checkCodeStatus, setCheckCodeStatus] = useState<"idle" | "success" | "fail">("idle");

  const getShiftedNumber = (numStr: string, s: number) => {
    const num = parseInt(numStr);
    if (isNaN(num)) return "";
    return (((num - 1 + s) % 10 + 10) % 10 + 1).toString();
  };

  const getShiftedLetter = (char: string, s: number) => {
    const idx = ALPHABET.indexOf(char.toUpperCase());
    if (idx === -1) return "";
    return ALPHABET[(idx + s + 26) % 26];
  };

  const currentCenterCode = useMemo(() => {
    const innerIdx = (ALPHABET.indexOf(selectedStageLetter) + shift) % 26;
    const currentNum = (innerIdx % 10) + 1;
    return `${selectedStageLetter}${currentNum}`;
  }, [selectedStageLetter, shift]);

  const handleCheckCode = () => {
    const savedCodes = JSON.parse(localStorage.getItem('atlas_live_map_codes') || '[]');
    const savedCubes = JSON.parse(localStorage.getItem('atlas_session_cubes') || '[]');

    const matchIndex = savedCodes.indexOf(currentCenterCode);

    if (currentStage === 2) {
      if (matchIndex !== -1 && matchIndex < 10) {
        setCheckCodeStatus("success");
        
        const matchedCube = savedCubes[matchIndex];
        const cipherCode = matchedCube.cipherOutput || "";

        setStage2NewCode(cipherCode);
        setStage2Episode("Episode " + (matchedCube.episode || ""));
        setStage2Riddle(matchedCube.riddle || ("Riddle " + (matchedCube.riddleNumber || "")));
        
        // Also populate Stage 3 New Code but keep extra info hidden
        setStage3NewCode(cipherCode);
        setStage3SponsorAd("");
        setStage3Position("");
      } else {
        setCheckCodeStatus("fail");
        setStage2NewCode("");
        setStage2Episode("");
        setStage2Riddle("");
      }
    } else if (currentStage === 3) {
      // Confirm what is posted in the new code box on stage 3
      if (stage3NewCode && currentCenterCode === stage3NewCode) {
        setCheckCodeStatus("success");
        // Look up the cube data to reveal extra info
        const matchedCube = savedCubes.find((c: any) => c.cipherOutput === currentCenterCode);
        if (matchedCube) {
          setStage3SponsorAd("Ad Sponsor " + (matchedCube.sponsorAd || ""));
          setStage3Position(matchedCube.identificationLabel || "");
        }
      } else {
        setCheckCodeStatus("fail");
        setStage3SponsorAd("");
        setStage3Position("");
      }
    }

    setTimeout(() => {
      setCheckCodeStatus("idle");
      setPickedStageLetters(new Set());
    }, 1000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimeLong = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const c = Math.floor((ms % 1000) / 10);
    
    // Cap at 59:59:99 (MM:SS:CC)
    if (m >= 60) return "59:59:99";
    
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${c.toString().padStart(2, "0")}`;
  };

  const expectedShift =
    targetShift !== undefined
      ? targetShift
      : useMemo(() => {
          const d1 = huntAnswers[8] || "0";
          const d2 = huntAnswers[9] || "0";
          return parseInt(d1 + d2, 10) % 26;
        }, [huntAnswers]);

  const getAngle = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (isSolved) return;
    setIsDragging(true);
    const angle = getAngle(clientX, clientY);
    setStartAngle(angle - rotation);
    setHasInteractedWithWheel(true);
    setSuppressMismatch(false);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const angle = getAngle(clientX, clientY);
    const newRotation = angle - startAngle;
    setRotation(newRotation);
    let normalizedRotation = newRotation % 360;
    if (normalizedRotation < 0) normalizedRotation += 360;
    const rotationSteps =
      Math.round(normalizedRotation / DEGREES_PER_LETTER) % 26;
    const newShiftValue = (26 - rotationSteps) % 26;
    setShift(newShiftValue);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const snappedRotationSteps = (26 - shift) % 26;
    setRotation(snappedRotationSteps * DEGREES_PER_LETTER);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
        if (isDragging) e.preventDefault();
      }
    };
    const onTouchEnd = () => handleEnd();
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, startAngle, rotation, shift]);

  const handleManualRotation = (delta: number) => {
    if (isSolved) return;
    const nextShift = (shift + delta + 26) % 26;
    setShift(nextShift);
    const nextRotationSteps = (26 - nextShift) % 26;
    setRotation(nextRotationSteps * DEGREES_PER_LETTER);
    setHasInteractedWithWheel(true);
    setSuppressMismatch(false);
  };

  const handleLetterClick = (letter: string) => {
    if (isSolved) return;
    if (crackedOutput.length >= cipherInput.length) return;
    if (currentStage === 1 && !hasInteractedWithWheel) {
      setShowRotationError(true);
      return;
    }
    if (currentStage === 1 && shift !== expectedShift && !suppressMismatch) {
      setPendingLetter(letter);
      setShowMismatchModal(true);
      return;
    }
    
    if (currentStage === 2 || currentStage === 3) {
      setSelectedStageLetter(letter);
      setPickedStageLetters(prev => new Set(prev).add(letter));
      return;
    }

    setCrackedOutput((prev) => prev + letter);
  };

  const handleMismatchConfirm = (allow: boolean) => {
    if (allow && pendingLetter && crackedOutput.length < cipherInput.length) {
      setSuppressMismatch(true);
      setCrackedOutput((prev) => prev + pendingLetter);
    }
    setPendingLetter(null);
    setShowMismatchModal(false);
  };

  const handleDeleteLast = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSolved) return;
    e.stopPropagation();
    setCrackedOutput((prev) => prev.slice(0, -1));
  };

  const handleVerifySubmission = async (overrideValue?: string) => {
    const rawValue =
      overrideValue !== undefined ? overrideValue : crackedOutput;
    const valueToVerify = rawValue.toUpperCase().replace(/[^A-Z]/g, "");
    if (!valueToVerify) return;

    setIsTimerRunning(false);
    setIsVerifying(true);
    try {
      let correctWord = "";
      
      try {
        const docRef = doc(db, "creators", CREATOR_DOC_ID);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          correctWord = (data?.TheHunt?.CityName || "")
            .toUpperCase()
            .replace(/[^A-Z]/g, "");
        }
      } catch (e) {
        console.warn("Firestore fetch failed, falling back to local decoding");
      }

      if (!correctWord) {
        correctWord = cipherInput.split('').map(char => {
          const idx = ALPHABET.indexOf(char);
          if (idx === -1) return char;
          const targetIdx = (idx - expectedShift + 26) % 26;
          return ALPHABET[targetIdx];
        }).join('').toUpperCase();
      }
      if (valueToVerify === correctWord && correctWord !== "") {
        if (currentStage === 1) {
          // Transition to Stage 2
          setCurrentStage(2);
          setCrackedOutput("");
          setIsTimerRunning(true);
          return;
        } else if (currentStage === 2) {
          // Transition to Stage 3
          setCurrentStage(3);
          setCrackedOutput("");
          setIsTimerRunning(true);
          return;
        }

        setIsTimerRunning(false);
        const finalFormattedTime = formatTimeLong(elapsedTime);
        setIsSolved(true);
        setSuccessData({ word: correctWord, time: finalFormattedTime });
        setShowSuccessModal(true);

        const targetUid = auth.currentUser?.uid || "51H7yItLU9WMMiXl10xE";
        const submissionId = `${targetUid}_${CREATOR_DOC_ID}`;

        await setDoc(
          doc(db, "Submissions", submissionId),
          {
            userId: targetUid,
            creatorId: CREATOR_DOC_ID,
            huntTime: finalFormattedTime,
            huntSolvedAt: serverTimestamp(),
            userName: auth.currentUser?.displayName || "Agent",
            creatorName: youtuber?.name || "Unknown",
          },
          { merge: true },
        );

        const userRef = doc(db, "Users", targetUid);
        await setDoc(
          userRef,
          {
            "Level 11": { atlasCipherTime: finalFormattedTime },
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } else {
        setManualWord(valueToVerify);
        setShowErrorModal(true);
        setIsTimerRunning(true);
      }
    } catch (err: any) {
      alert("Neural uplink unstable. Ensure you have the correct City Name.");
      setIsTimerRunning(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOverrideWord = () => {
    const cleanWord = manualWord.toUpperCase().trim();
    setShowErrorModal(false);
    handleVerifySubmission(cleanWord);
  };

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-20 font-sans">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-zinc-900/40 to-black pointer-events-none" />

      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-2xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-zinc-900 border-4 border-[#22c55e]/50 p-12 rounded-[40px] text-center shadow-[0_0_100px_rgba(34,197,94,0.3)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#22c55e]/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-lg">
                  Congratulations!
                </h3>
                <p className="text-2xl md:text-3xl font-black text-white/90 uppercase tracking-tight">
                  You cracked the Atlas code <span className="text-[#22c55e] italic">"{successData.word}"</span>
                </p>
                <div className="flex flex-col items-center pt-4">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em] mb-2">In Time</span>
                  <span className="text-5xl font-black font-mono text-[#D4AF37] tracking-[0.1em]">
                    {successData.time}
                  </span>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => {
                    if (onPostResults) {
                      onPostResults({
                        sponsorKey: `${mappingLetter}=${letterToNumber(ALPHABET[expectedShift])}`,
                        gameCode: successData.word,
                        time: successData.time
                      });
                    }
                  }}
                  className="w-full h-24 bg-[#22c55e] hover:bg-[#16a34a] text-white text-3xl font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all hover:scale-[1.02] active:scale-95"
                >
                  Submit Time
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating UI Elements */}
      <div className="fixed top-[180px] left-6 md:left-[60px] z-[60] pointer-events-auto">
        <button
          onClick={onReturnToEncoder}
          className="flex items-center gap-2 group hover:text-[#D4AF37] transition-all bg-black/40 backdrop-blur-md p-3 px-4 rounded-xl border border-white/10 shadow-2xl"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-black uppercase tracking-widest text-[16px]">
            Return to Encoder
          </span>
        </button>
      </div>

      <div className="fixed top-[100px] right-6 md:right-10 z-[60] flex flex-col items-end gap-2">
        <div className="bg-black/80 border-2 border-[#D4AF37]/40 rounded-xl p-3 px-6 shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
          <div className="text-[9px] font-black text-[#D4AF37]/60 uppercase tracking-widest mb-1 text-center font-sans">
            Mission Time
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-white tracking-widest">
            {formatTimeLong(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="relative z-50 pt-48 pb-8 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-black text-[#D4AF37] tracking-[0.15em] uppercase drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] text-center px-4">
          Atlas Cipher Decoder
        </h1>
        <p className="text-[11px] font-black tracking-[0.6em] uppercase text-white/20 mt-4 ml-2">
          Numeric Calibration Terminal
        </p>
      </div>

      {showRotationError && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-xl bg-zinc-900 border-2 border-red-500/50 p-10 rounded-3xl text-center shadow-[0_0_100px_rgba(239,68,68,0.2)]">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-8">
              Calibration Required
            </h3>
            <div className="mb-8 text-7xl font-black text-white font-mono">
              {mappingLetter}=
              <span className="text-[#D4AF37]">{letterToNumber(ALPHABET[expectedShift])}</span>
            </div>
            <p className="text-[#D4AF37] text-lg mb-12 italic uppercase font-black text-center">
              "Rotate target ring to align {mappingLetter} with frequency {letterToNumber(ALPHABET[expectedShift])}"
            </p>
            <button
              onClick={() => setShowRotationError(false)}
              className="w-full py-5 text-lg bg-red-600 font-black text-white rounded-xl uppercase hover:bg-white hover:text-black transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {showMismatchModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md font-mono">
          <div className="w-full max-w-lg bg-zinc-900 border-2 border-[#D4AF37]/50 p-10 rounded-3xl text-center shadow-[0_0_100px_rgba(212,175,55,0.2)]">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-8">
              Frequeny Mismatch
            </h3>
            <div className="flex flex-col gap-6 mb-10 border-y border-white/5 py-8">
              <div className="flex justify-between items-center px-4">
                <span className="text-white/40 font-black uppercase text-xs tracking-widest">
                  Target Map:
                </span>
                <span className="text-4xl font-black text-white leading-none">
                  {mappingLetter}=
                  <span className="text-[#D4AF37]">
                    {letterToNumber(ALPHABET[expectedShift])}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center px-4">
                <span className="text-white/40 font-black uppercase text-xs tracking-widest">
                  Wheel Map:
                </span>
                <span className="text-4xl font-black text-white leading-none">
                  {mappingLetter}=
                  <span className="text-[#22c55e]">{letterToNumber(ALPHABET[shift])}</span>
                </span>
              </div>
            </div>
            <p className="text-[#D4AF37] text-md mb-12 italic font-black uppercase">
              "Frequeny offset detected. Force connection?"
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleMismatchConfirm(true)}
                className="py-4 bg-[#D4AF37] text-black font-black text-lg rounded-xl uppercase"
              >
                Proceed Anyway
              </button>
              <button
                onClick={() => handleMismatchConfirm(false)}
                className="py-4 border-2 border-[#D4AF37]/20 text-white font-black text-lg rounded-xl uppercase hover:bg-white/5"
              >
                Re-Calibrate
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
          <div className="w-full max-w-lg bg-zinc-900 border-4 border-red-600/50 p-10 rounded-3xl text-center shadow-[0_0_100px_rgba(239,68,68,0.3)]">
            <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-6 leading-tight">
              Sorry try again!
            </h3>
            <div className="text-4xl font-black text-red-500 uppercase tracking-[0.2em] bg-black/40 py-6 rounded-2xl border border-red-500/20 mb-8">
              {manualWord || crackedOutput || "EMPTY"}
            </div>
            <input
              type="text"
              value={manualWord}
              onChange={(e) => setManualWord(e.target.value.toUpperCase())}
              className="w-full bg-black border-2 border-white/5 rounded-xl px-6 py-5 text-white font-black text-2xl uppercase mb-8 text-center focus:border-[#D4AF37] outline-none"
              placeholder="RETRY SEQUENCE"
            />
            <button
              onClick={handleOverrideWord}
              className="w-full py-5 text-xl font-black bg-red-600 text-white rounded-xl uppercase"
            >
              SUBMIT
            </button>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-6 text-white/30 font-black uppercase text-xs tracking-widest hover:text-white"
            >
              Close Diagnostic
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-6 flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 py-12">
        <div className="w-full max-[500px] md:max-w-[700px] flex flex-col items-center">
          <div
            ref={wheelRef}
            className="relative w-full aspect-square select-none touch-none scale-110"
          >
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full drop-shadow-[0_0_30px_rgba(212,175,55,0.4)] overflow-visible"
            >
              <circle
                cx="50"
                cy="50"
                r="50"
                fill={
                  checkCodeStatus === "success" 
                    ? "#22c55e" 
                    : checkCodeStatus === "fail" 
                      ? "#ef4444" 
                      : "#000"
                }
                stroke={
                  checkCodeStatus === "success" 
                    ? "#22c55e" 
                    : checkCodeStatus === "fail" 
                      ? "#ef4444" 
                      : "#d4af37"
                }
                strokeWidth="0.5"
                className="transition-colors duration-300"
              />
              {ALPHABET.map((letter, i) => {
                const angle = (i * 360) / 26;
                const x = 50 + 44 * Math.cos((angle - 90) * (Math.PI / 180));
                const y = 50 + 44 * Math.sin((angle - 90) * (Math.PI / 180));
                return (
                  <text
                    key={`outer-${i}`}
                    x={x}
                    y={y}
                    fill={pickedStageLetters.has(letter) ? "#22c55e" : "white"}
                    fontSize="4.5"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-black cursor-pointer hover:fill-[#22c55e] transition-all"
                    onClick={() => handleLetterClick(letter)}
                  >
                    {letter}
                  </text>
                );
              })}
              <g
                className={`${isDragging ? "transition-none" : "transition-transform duration-500"} cursor-grab active:cursor-grabbing`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "50% 50%",
                }}
                onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                onTouchStart={(e) =>
                  handleStart(e.touches[0].clientX, e.touches[0].clientY)
                }
              >
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="rgba(212,175,55,0.05)"
                  stroke="#d4af37"
                  strokeWidth="0.8"
                />
                {ALPHABET.map((letter, i) => {
                  const angle = (i * 360) / 26;
                  const x =
                    50 + 32.5 * Math.cos((angle - 90) * (Math.PI / 180));
                  const y =
                    50 + 32.5 * Math.sin((angle - 90) * (Math.PI / 180));
                  
                  let innerDisplay = "";
                  if (currentStage === 1) {
                    innerDisplay = letter;
                  } else {
                    // Stage 2 & 3: 1-10 repeat (1,2,3,4,5,6,7,8,9,10,1,2...)
                    innerDisplay = ((i % 10) + 1).toString();
                  }

                  return (
                    <text
                      key={`inner-${i}`}
                      x={x}
                      y={y}
                      fill="#d4af37"
                      fontSize={currentStage === 1 ? "4.2" : "4.5"}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-black pointer-events-none font-mono"
                      transform={`rotate(${-rotation}, ${x}, ${y})`}
                    >
                      {innerDisplay}
                    </text>
                  );
                })}
              </g>
              <circle
                cx="50"
                cy="50"
                r="27"
                fill="#000"
                stroke="rgba(212,175,55,0.3)"
                strokeWidth="1"
              />
              <g>
                {(currentStage === 2 || currentStage === 3) ? (
                  <>
                    <text
                      x="50"
                      y="35"
                      fill="white"
                      fontSize="9"
                      textAnchor="middle"
                      className="font-black font-sans leading-none"
                    >
                      {selectedStageLetter} ={" "}
                      <tspan fill="#d4af37">
                        {(((ALPHABET.indexOf(selectedStageLetter) + shift) % 26 % 10) + 1)}
                      </tspan>
                    </text>
                    
                    <g 
                      className="cursor-pointer group"
                      onClick={handleCheckCode}
                    >
                      <circle 
                        cx="50" 
                        cy="59" 
                        r="14" 
                        fill={
                          checkCodeStatus === "success" 
                            ? "#22c55e" 
                            : checkCodeStatus === "fail" 
                              ? "#ef4444" 
                              : "#52525b"
                        }
                        className={`transition-colors duration-300 ${checkCodeStatus === "idle" ? "group-hover:fill-zinc-600" : ""}`}
                      />
                      <text
                        x="50"
                        y="57"
                        fill={checkCodeStatus === "fail" ? "white" : "white"}
                        fontSize="3.5"
                        textAnchor="middle"
                        className="font-black uppercase tracking-widest pointer-events-none"
                      >
                        Check
                      </text>
                      <text
                        x="50"
                        y="63"
                        fill={checkCodeStatus === "fail" ? "white" : "white"}
                        fontSize="3.5"
                        textAnchor="middle"
                        className="font-black uppercase tracking-widest pointer-events-none"
                      >
                        Code
                      </text>
                    </g>
                  </>
                ) : (
                  <>
                    <text
                      x="50"
                      y="32"
                      fill="white"
                      fontSize="8"
                      textAnchor="middle"
                      className="font-black font-sans leading-none"
                    >
                      {mappingLetter} ={" "}
                      <tspan fill="#d4af37">
                        {ALPHABET[(ALPHABET.indexOf(mappingLetter) + shift) % 26]}
                      </tspan>
                    </text>
                    <text
                      x="50"
                      y="42"
                      fill="#d4af37"
                      fontSize="4"
                      textAnchor="middle"
                      className="font-black uppercase opacity-60"
                    >
                      Atlas Frequency
                    </text>
                    <text
                      x="50"
                      y="49"
                      fill="#ff3333"
                      fontSize="5"
                      textAnchor="middle"
                      className="font-black tracking-widest font-mono"
                    >
                      {cipherInput}
                    </text>
                    <text
                      x="50"
                      y="58"
                      fill="white"
                      fontSize="4"
                      textAnchor="middle"
                      className="font-black uppercase opacity-60"
                    >
                      Calibration
                    </text>
                    <text
                      x="50"
                      y="65"
                      fill="#22c55e"
                      fontSize="5"
                      textAnchor="middle"
                      className="font-black tracking-widest"
                    >
                      {crackedOutput || "------"}
                    </text>
                  </>
                )}
              </g>
            </svg>
          </div>

          <div className="flex gap-10 mt-12">
            <button
              onClick={() => handleManualRotation(-1)}
              className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/30 flex items-center justify-center hover:bg-[#D4AF37]/10 active:scale-90 transition-all"
            >
              <ChevronLeft
                className="w-10 h-10 text-[#D4AF37]"
                strokeWidth={3}
              />
            </button>
            <button
              onClick={() => handleManualRotation(1)}
              className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/30 flex items-center justify-center hover:bg-[#D4AF37]/10 active:scale-90 transition-all rotate-180"
            >
              <ChevronLeft
                className="w-10 h-10 text-[#D4AF37]"
                strokeWidth={3}
              />
            </button>
          </div>
        </div>

        <div className="w-full max-w-xl space-y-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] leading-tight text-center lg:text-left">
              {isSolved ? (
                <span className="text-[#22c55e]">Target Resolved! Atlas Code Cracked</span>
              ) : currentStage === 1 ? (
                shift === expectedShift ? (
                  <span className="text-[#22c55e] font-black uppercase">
                    Select <span className="text-white">Outer Letters</span> to decode frequency
                  </span>
                ) : (
                  <span className="text-[#22c55e] font-black uppercase">
                    CALIBRATE <span className="text-[#D4AF37]">INNER</span> FREQUENCY TO SET{" "}
                    <span className="text-[#D4AF37] font-mono">
                      {mappingLetter}={ALPHABET[expectedShift]}
                    </span>
                  </span>
                )
              ) : (
                <span className="text-[#22c55e] font-black uppercase">
                  Pick <span className="text-white">letter</span> first and then rotate <span className="text-[#D4AF37]">wheel</span> to match the code
                </span>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 p-1 rounded-xl border border-white/5 mb-4">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setCurrentStage(s as any);
                  setCrackedOutput("");
                  setSelectedStageLetter("A");
                  setPickedStageLetters(new Set());
                  setHasInteractedWithWheel(false);
                }}
                className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  currentStage === s 
                    ? "bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                Stage {s}
              </button>
            ))}
          </div>

          <div className="bg-[#121212] border border-[#D4AF37]/20 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="space-y-10 relative z-10">
              {currentStage === 1 ? (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                      Incoming Signal (Encoded)
                    </label>
                    <div className="w-full bg-black/60 border border-white/5 rounded-xl p-8 font-black text-2xl text-[#D4AF37] uppercase text-center tracking-[0.2em] shadow-inner font-mono">
                      {cipherInput}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                      Decoded Sequence
                    </label>
                    <div className="relative">
                      <div className="w-full bg-black/60 border border-white/5 rounded-xl p-8 font-black text-2xl text-[#22c55e] uppercase text-center tracking-[0.2em] shadow-inner">
                        {crackedOutput || "------"}
                      </div>
                      {crackedOutput.length > 0 && (
                        <button
                          onClick={handleDeleteLast}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/40 hover:text-white transition-colors"
                        >
                          <ChevronLeft className="w-10 h-10" strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 space-y-4">
                    <button
                      onClick={() => handleVerifySubmission()}
                      disabled={isVerifying || !crackedOutput || isSolved}
                      className="w-full py-6 font-black uppercase text-2xl rounded-2xl bg-white text-black hover:shadow-[0_0_30px_#fff] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      {isVerifying ? "ANALYZING..." : isSolved ? "RESTRAINED" : "UnLock Wheel"}
                    </button>

                    <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-widest pt-4">
                      <span>Sequence: {CREATOR_DOC_ID}</span>
                      <span>Atlas Relay: ACTIVE</span>
                    </div>
                  </div>
                </>
              ) : currentStage === 2 ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block text-center">New Code</label>
                    <div className="w-full bg-black/60 border border-[#D4AF37]/30 rounded-2xl py-8 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                      <span className="text-6xl font-black text-white tracking-[0.2em] uppercase">
                        {stage2NewCode || "---"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block text-center">Episode</label>
                      <div className="w-full bg-black/60 border border-white/10 rounded-2xl py-6 flex items-center justify-center">
                        <span className="text-3xl font-black text-white tracking-widest uppercase">
                          {stage2Episode || "---"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block text-center">Riddle</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (stage2Riddle) {
                            setIsRiddleModalOpen(true);
                          }
                        }}
                        disabled={!stage2Riddle}
                        className={`w-full bg-black/60 border border-white/10 rounded-2xl p-6 min-h-[5.5rem] flex items-center justify-center transition-all duration-200 outline-none ${
                          stage2Riddle
                            ? 'cursor-pointer hover:bg-black/80 hover:border-[#D4AF37]/40 ring-offset-black hover:scale-[1.01] active:scale-[0.99] focus:ring-2 focus:ring-[#D4AF37]/50'
                            : 'opacity-60 cursor-default'
                        }`}
                      >
                        {stage2Riddle ? (
                          stage2Riddle.startsWith("Riddle ") && stage2Riddle.length < 11 ? (
                            <span className="text-3xl font-black text-white tracking-widest uppercase text-center">
                              {stage2Riddle}
                            </span>
                          ) : (
                            <div className="text-base text-gray-200 select-text font-medium leading-relaxed text-center whitespace-pre-wrap max-w-lg">
                              {stage2Riddle}
                            </div>
                          )
                        ) : (
                          <span className="text-3xl font-black text-white tracking-widest uppercase text-center">---</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block text-center">New Code</label>
                    <div className="w-full bg-black/60 border border-[#D4AF37]/30 rounded-2xl py-8 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                      <span className="text-6xl font-black text-white tracking-[0.2em] uppercase">
                        {stage3NewCode || "---"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block text-center">Sponsor Ad</label>
                      <div className="w-full bg-black/60 border border-white/10 rounded-2xl py-6 flex items-center justify-center">
                        <span className="text-3xl font-black text-white tracking-widest uppercase">
                          {stage3SponsorAd || "---"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block text-center">Position</label>
                      <div className="w-full bg-black/60 border border-white/10 rounded-2xl py-6 flex items-center justify-center">
                        <span className="text-3xl font-black text-white tracking-widest uppercase">
                          {stage3Position || "---"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/5 bg-black/90 backdrop-blur-md z-50">
        <p className="font-black text-[10px] text-white/20 uppercase tracking-[0.5em]">
          &copy; 2026 CODE KRACKER XR • ATLAS PROTOCOL
        </p>
      </div>

      {/* Expanded Riddle Modal Pop-up */}
      {isRiddleModalOpen && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          onClick={() => setIsRiddleModalOpen(false)}
        >
          <div 
            className="bg-[#0e0e0e] border-2 border-[#D4AF37] rounded-[2.5rem] w-full max-w-2xl p-8 relative flex flex-col gap-6 shadow-[0_0_60px_rgba(212,175,55,0.3)] animate-in fade-in zoom-in duration-200 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button top right */}
            <button
              type="button"
              onClick={() => setIsRiddleModalOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors cursor-pointer p-2 rounded-full hover:bg-white/5"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Riddle Header */}
            <div className="text-center pt-2">
              <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.5em] block mb-1">Riddle Review</span>
              <span className="text-xs text-white/40 uppercase tracking-[0.2em]">Atlas Wheel Stage 2</span>
            </div>

            {/* Info Grid: New Code & Episode Info */}
            <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-6">
              <div className="text-center bg-black/40 border border-white/5 rounded-2xl p-4">
                <span className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-[0.2em] block mb-1">New Code</span>
                <span className="text-3xl font-black text-white tracking-widest uppercase">{stage2NewCode || "---"}</span>
              </div>
              <div className="text-center bg-black/40 border border-white/5 rounded-2xl p-4">
                <span className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-[0.2em] block mb-1">Episode</span>
                <span className="text-3xl font-black text-white tracking-widest uppercase">{stage2Episode || "---"}</span>
              </div>
            </div>

            {/* Riddle Content */}
            <div className="py-4 max-h-[45vh] overflow-y-auto">
              {stage2Riddle ? (
                stage2Riddle.startsWith("Riddle ") && stage2Riddle.length < 11 ? (
                  <div className="text-4xl font-black text-white tracking-widest uppercase text-center py-6">
                    {stage2Riddle}
                  </div>
                ) : (
                  <div className="text-xl md:text-2xl text-gray-100 font-semibold leading-relaxed text-center whitespace-pre-wrap max-w-xl mx-auto px-2 font-sans select-text">
                    {stage2Riddle}
                  </div>
                )
              ) : (
                <div className="text-4xl font-black text-white tracking-widest uppercase text-center py-6">
                  ---
                </div>
              )}
            </div>

            {/* Bottom action button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsRiddleModalOpen(false)}
                className="px-8 py-3.5 rounded-xl bg-[#D4AF37] text-black font-extrabold uppercase text-[12px] tracking-widest hover:bg-[#D4AF37]/95 active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
              >
                Close Riddle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';

import { ASSETS } from '../constants';

import { VaultButton } from './VaultButton';

import { ChevronLeft, Info, Zap, CheckCircle2, ArrowDown, Settings, ChevronUp, ShieldCheck, ArrowRightLeft } from 'lucide-react';

import { ROTOR_WIRINGS, ALPHABET, getLetterAtMarker, getOffsetForChar, runGearedEnigma } from '../lib/enigmaUtils';

interface EnigmaGamePageProps {
  onBack: () => void;
  initialCode: string;
  initialKey: string; // "A-B-C"
  wirings?: string[];
  youtuber?: {
    name: string;
    avatar: string;
  };
  onPostResults?: (data: { sponsorKey: string; gameCode: string; time: string }) => void;
}

export const EnigmaGamePage: React.FC<EnigmaGamePageProps> = ({ onBack, initialCode, initialKey, wirings = ROTOR_WIRINGS, youtuber, onPostResults }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Gear state
  const [userKey, setUserKey] = useState<string[]>(['', '', '']);
  const isKeyComplete = userKey.every(k => k !== '');

  const k1 = getOffsetForChar(wirings[0], userKey[0] || 'A');
  const k2 = getOffsetForChar(wirings[1], userKey[1] || 'A');
  const k3 = getOffsetForChar(wirings[2], userKey[2] || 'A');

  const [rotation, setRotation] = useState(0); // Delta rotation in degrees
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const cleanCode = initialCode.toUpperCase().replace(/[^A-Z]/g, '');
  const [userDecoded, setUserDecoded] = useState<string[]>(new Array(cleanCode.length).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [decodeError, setDecodeError] = useState(false);

  const letterInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const keyInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── FIX: Compute the correct decoded answer using runGearedEnigma ───────────
  // When the user has entered a key, decode initialCode with that key so we can
  // validate their typed answer and also auto-fill the decode for the hint display.
  const correctDecoded = useMemo(() => {
    if (!isKeyComplete) return null;
    const keyStr = userKey.join('-');
    const { result } = runGearedEnigma(cleanCode, keyStr, 'DECODE', wirings);
    return result;
  }, [isKeyComplete, userKey, cleanCode, wirings]);

  // Timer logic
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setElapsedMs(prev => prev + 10);
    }, 10);
    return () => clearInterval(interval);
  }, [isFinished]);

  const formatTimeFull = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const c = Math.floor((ms % 1000) / 10);
    
    // Cap at 59:59:99 (MM:SS:CC)
    if (m >= 60) return "59:59:99";
    
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${c.toString().padStart(2, "0")}`;
  };

  const getAngle = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const lastAngle = useRef(0);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isKeyComplete) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastAngle.current = getAngle(clientX, clientY);
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const currentAngle = getAngle(clientX, clientY);
      let delta = currentAngle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      setRotation(prev => prev + delta);
      lastAngle.current = currentAngle;
    };
    const handleEnd = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  // Current offsets based on delta rotation
  const degPerStep = 360 / 26;
  const deltaSteps = rotation / degPerStep;

  const currentO3 = k3 + deltaSteps;
  const currentO2 = k2 - deltaSteps;
  const currentO1 = k1 + deltaSteps;

  const charOnW1 = getLetterAtMarker(wirings[0], Math.round(currentO1));
  const charOnW2 = getLetterAtMarker(wirings[1], Math.round(currentO2));
  const charOnW3 = getLetterAtMarker(wirings[2], Math.round(currentO3));

  const handleKeyInput = (index: number, val: string) => {
    const char = val.toUpperCase().slice(-1);
    if (!ALPHABET.includes(char) && char !== '') return;
    const newKey = [...userKey];
    newKey[index] = char;
    setUserKey(newKey);
    // Reset decoded answers when key changes so stale guesses are cleared
    setUserDecoded(new Array(cleanCode.length).fill(''));
    setDecodeError(false);
    if (char && index < 2) {
      keyInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCharInput = (index: number, val: string) => {
    const char = val.toUpperCase().slice(-1);
    if (!ALPHABET.includes(char) && char !== '') return;
    const newDecoded = [...userDecoded];
    newDecoded[index] = char;
    setUserDecoded(newDecoded);
    if (char && index < cleanCode.length - 1) {
      setActiveIndex(index + 1);
      letterInputRefs.current[index + 1]?.focus();
    }
  };

  // ─── FIX: Validate answer against the actual enigma decode ───────────────────
  const handleCrackCode = () => {
    if (!correctDecoded) return;
    const userAnswer = userDecoded.join('');
    if (userAnswer === correctDecoded) {
      setIsFinished(true); // Stop timer
      setShowSuccessModal(true); // Show popup
      setDecodeError(false);
    } else {
      setDecodeError(true);
    }
  };

  const getWheelDisplay = (wiring: string, currentStepOffset: number, isWheel3: boolean = false) => {
    const parentRotation = currentStepOffset * degPerStep;
    return wiring.split('').map((letter, i) => {
      const charAngle = (i / 26) * 360;
      return (
        <div key={i} className="absolute inset-0 flex flex-col items-center" style={{ transform: `rotate(${charAngle}deg)` }}>
          <div className="w-[1px] h-4 bg-white/5 mb-2" />
          <motion.div
            transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
            animate={{ rotate: -charAngle - parentRotation }}
            className="font-display font-black text-sm md:text-lg text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] brightness-125"
          >
            {letter}
          </motion.div>
        </div>
      );
    });
  };

  const targetWheel = (activeIndex % 2 === 0) ? 0 : 1;
  const sourceChar = cleanCode[activeIndex];

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-32">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1 }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-10 pointer-events-none" />

      {/* Mission Clock */}
      <div className="fixed top-[100px] right-6 md:right-10 z-[60] flex flex-col items-end gap-2">
        <div className="bg-black/80 border-2 border-[#D4AF37]/40 rounded-xl p-3 px-6 shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
          <div className="text-[9px] font-black text-[#D4AF37]/60 uppercase tracking-widest mb-1 text-center font-sans">
            Mission Time
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-white tracking-widest">
            {formatTimeFull(elapsedMs)}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-50 w-full flex justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 items-center px-8">
        <button onClick={onBack} className="flex items-center gap-2 group hover:text-vault-gold transition-colors">
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="font-display font-bold uppercase tracking-widest text-sm text-white">Return to Hub</span>
        </button>
        <div className="w-24 hidden md:block" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl flex-1">
        {/* Mission Control Bar */}
        <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-3xl p-6 lg:p-8 mb-12 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-8 lg:gap-16">

            {/* Enigma Key Setup */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              <h3 className="text-[10px] font-black text-vault-gold uppercase tracking-[0.3em] flex items-center gap-2">
                <Settings className="w-4 h-4 text-vault-gold" />
                Enigma Key Protocol
              </h3>
              <div className="flex gap-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Rotor {i + 1}</span>
                    <input
                      ref={el => keyInputRefs.current[i] = el}
                      type="text"
                      className={`w-14 h-16 md:w-16 md:h-20 bg-black border-2 rounded-xl text-center font-display font-black text-2xl md:text-3xl transition-all uppercase focus:outline-none focus:ring-1 focus:ring-vault-gold
                        ${userKey[i] ? 'border-vault-gold text-vault-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-white/10 text-white/20'}`}
                      value={userKey[i]}
                      onChange={(e) => handleKeyInput(i, e.target.value)}
                      maxLength={1}
                      placeholder="?"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Intercepted Content (Centered) */}
            <div className="w-full flex flex-col items-center lg:border-x lg:border-white/5 lg:px-8">
              <h3 className="text-[10px] font-black text-vault-gold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Intercepted Sequence
              </h3>
              <div className="flex gap-2 flex-wrap justify-center">
                {cleanCode.split('').map((char, i) => (
                  <div key={i} className={`w-10 h-12 md:w-12 md:h-14 rounded-lg flex items-center justify-center font-display font-black text-xl transition-all border-2
                    ${i === activeIndex ? 'bg-vault-gold text-black border-white shadow-[0_0_20px_rgba(212,175,55,1)] scale-110' :
                      userDecoded[i] ? 'bg-white/5 border-white/10 text-white/20' : 'bg-blue-500/10 border-blue-500/40 text-blue-400'}`}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>

            {/* Decrypted Sequence */}
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-[10px] font-black text-vault-gold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-vault-gold" />
                Decrypted Signal
              </h3>
              <div className="flex gap-2 flex-wrap justify-center">
                {userDecoded.map((char, i) => {
                  const isTyped = char !== '';
                  // ─── FIX: Per-letter correctness check ──────────────────
                  const isCorrect = correctDecoded ? char === correctDecoded[i] : null;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <input
                        ref={el => letterInputRefs.current[i] = el}
                        type="text"
                        className={`w-10 h-12 md:w-12 md:h-14 bg-black/60 border-2 rounded-lg text-center font-display font-black text-xl transition-all uppercase focus:outline-none
                          ${isTyped && isCorrect === true ? 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]' :
                            isTyped && isCorrect === false ? 'border-red-500 text-red-400 bg-red-500/10' :
                            isTyped ? 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]' :
                            activeIndex === i ? 'border-vault-gold text-vault-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'border-white/5 text-white/40'}`}
                        value={char}
                        onChange={(e) => handleCharInput(i, e.target.value)}
                        onFocus={() => setActiveIndex(i)}
                        maxLength={1}
                        placeholder="?"
                      />
                    </div>
                  );
                })}
              </div>
              {/* ─── FIX: Error feedback when answer is wrong ─────────────── */}
              {decodeError && (
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-2 animate-pulse">
                  ✗ Incorrect — check your key and decoded letters
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center">
          {/* Top Readout Row */}
          <div className="flex justify-center gap-2 md:gap-4 w-full max-w-7xl px-4 mb-4 relative z-20">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex flex-col items-center w-64 md:w-80 lg:w-[440px]">
                <div className={`px-4 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] mb-4
                  ${i === 2 ? 'border-vault-gold text-vault-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]' :
                    i === targetWheel ? 'border-green-500 text-green-400' : 'border-white/10 text-white/30'}`}>
                  {i === 2 ? 'Code' : `Answer ${i + 1}`}
                </div>
              </div>
            ))}
          </div>

          {/* Gear Row */}
          <div className="flex justify-center gap-1 md:gap-2 w-full max-w-full overflow-visible py-8">

            {/* Wheel 1 */}
            <div className="relative w-64 md:w-80 lg:w-[440px] aspect-square">
              <motion.div
                transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
                animate={{ rotate: currentO1 * degPerStep }}
                className="w-full h-full rounded-full border-4 border-white/10 bg-black/60 shadow-[0_0_50px_rgba(0,0,0,1)] relative"
              >
                {getWheelDisplay(wirings[0], currentO1)}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1/3 h-1/3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none">
                    <span className="font-display font-black text-2xl md:text-5xl text-white/20">I</span>
                  </div>
                </div>
              </motion.div>
              {/* Result Readout */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className={`text-2xl md:text-4xl font-display font-black transition-all duration-300 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]
                  ${targetWheel === 0 ? 'scale-125 brightness-125' : 'opacity-90'}`}>
                  {charOnW1}
                </div>
              </div>
            </div>

            {/* Wheel 2 */}
            <div className="relative w-64 md:w-80 lg:w-[440px] aspect-square">
              <motion.div
                transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
                animate={{ rotate: currentO2 * degPerStep }}
                className="w-full h-full rounded-full border-4 border-white/10 bg-black/60 shadow-[0_0_50px_rgba(0,0,0,1)] relative"
              >
                {getWheelDisplay(wirings[1], currentO2)}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1/3 h-1/3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none">
                    <span className="font-display font-black text-2xl md:text-5xl text-white/20">II</span>
                  </div>
                </div>
              </motion.div>
              {/* Result Readout */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className={`text-2xl md:text-4xl font-display font-black transition-all duration-300 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]
                  ${targetWheel === 1 ? 'scale-125 brightness-125' : 'opacity-90'}`}>
                  {charOnW2}
                </div>
              </div>

              {/* Crack Code Button under center wheel */}
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full flex justify-center z-30">
                {isKeyComplete && !isFinished && (
                  <VaultButton
                    variant="primary"
                    className={`py-4 px-8 text-lg md:text-xl transition-all duration-500 whitespace-nowrap
                      ${userDecoded.every(c => c !== '') ? 'shadow-[0_0_30px_rgba(255,255,255,0.2)] opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}
                    onClick={handleCrackCode}
                  >
                    <CheckCircle2 className="mr-3" />
                    CRACK CODE
                  </VaultButton>
                )}
                {isFinished && !showSuccessModal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="bg-vault-gold text-black px-8 py-3 rounded-full font-display font-black text-sm md:text-lg uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                      Intel Cracked
                    </div>
                    <VaultButton onClick={() => setShowSuccessModal(true)} variant="primary" className="py-2 px-6 bg-white text-black border-white hover:bg-vault-gold text-xs">VIEW RESULTS</VaultButton>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Wheel 3 (Draggable) */}
            <div className="relative w-64 md:w-80 lg:w-[440px] aspect-square">
              <motion.div
                ref={wheelRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                animate={{
                  rotate: currentO3 * degPerStep,
                  borderColor: isKeyComplete ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)',
                  backgroundColor: isKeyComplete ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.4)',
                }}
                transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
                style={{
                  cursor: !isKeyComplete ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
                }}
                className={`w-full h-full rounded-full border-4 relative shadow-[0_0_50px_rgba(0,0,0,1)]
                  ${!isKeyComplete ? 'grayscale' : ''}`}
              >
                {getWheelDisplay(wirings[2], currentO3, true)}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-1/3 h-1/3 rounded-full border flex items-center justify-center transition-colors duration-500
                    ${isKeyComplete ? 'bg-vault-gold/20 border-vault-gold/40' : 'bg-white/5 border-white/10'}`}>
                    <span className={`font-display font-black text-2xl md:text-5xl transition-colors duration-500
                      ${isKeyComplete ? 'text-vault-gold' : 'text-white/10'}`}>III</span>
                  </div>
                </div>
              </motion.div>
              {/* Current Setting Marker */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-display font-black text-vault-gold transition-all duration-300 drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] brightness-125 text-center">
                  {!isKeyComplete && <span className="text-[10px] block mb-1 opacity-40">LOCKED</span>}
                  {charOnW3}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Centered Message if key not complete */}
        <div className="mt-12 flex flex-col items-center justify-center">
          {!isKeyComplete && (
            <div className="bg-black/60 border border-vault-gold/30 p-8 rounded-3xl text-center max-w-md animate-pulse">
              <Settings className="w-12 h-12 text-vault-gold mx-auto mb-4" />
              <h4 className="font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-2">Protocol Uninitialized</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                The Enigma Array is currently offline. Please input the 3-letter decryption key in the control protocol above to engage the rotor gears.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
        <p className="font-display text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Enigma Rotor Protocol v2.0
        </p>
      </footer>
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline" />

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setShowSuccessModal(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-vault-panel/95 border-4 border-vault-gold rounded-[40px] p-8 md:p-12 shadow-[0_0_100px_rgba(212,175,55,0.4)] text-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_60%)] -z-10" />
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-vault-gold/20 border-2 border-vault-gold flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                  <CheckCircle2 className="w-12 h-12 text-vault-gold" />
                </div>
              </div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-white uppercase tracking-tighter mb-2">
                Congratulations!
              </h2>
              <p className="font-display text-vault-gold uppercase tracking-[0.3em] text-[10px] md:text-xs mb-10 font-bold">
                You Cracked the Code
              </p>
              <div className="space-y-8 mb-12">
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Decrypted Word</div>
                  <div className="font-display font-black text-4xl md:text-6xl text-white tracking-widest bg-white/5 py-4 rounded-2xl border border-white/10 uppercase">
                    {userDecoded.join('')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Mission Time</div>
                  <div className="font-mono text-3xl md:text-5xl font-black text-vault-gold bg-black/40 py-4 rounded-2xl border border-white/5 tabular-nums">
                    {formatTimeFull(elapsedMs)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <VaultButton
                  variant="primary"
                  className="w-full py-6 text-2xl font-black transition-transform bg-[#22c55e] border-[#22c55e] hover:bg-[#16a34a] shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                  onClick={() => {
                    if (onPostResults) {
                      onPostResults({
                        sponsorKey: userKey.join('-') || initialKey,
                        gameCode: userDecoded.join(''),
                        time: formatTimeFull(elapsedMs)
                      });
                    }
                  }}
                >
                  Submit Time
                </VaultButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { ChevronLeft, Info, Zap, CheckCircle2, Lock, Unlock, Grid3X3, Hash, ArrowRight } from 'lucide-react';

interface BifidGamePageProps {
  onBack: () => void;
  initialCode: string;
  initialKey: string;
  youtuber?: any;
  onPostResults: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

enum Phase {
  GRID = 'GRID',
  COORDS = 'COORDS',
  DECODE = 'DECODE'
}

export const BifidGamePage: React.FC<BifidGamePageProps> = ({ onBack, initialCode, initialKey, youtuber, onPostResults }) => {
  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.GRID);
  const [userSquare, setUserSquare] = useState<string[]>(new Array(25).fill(''));
  const squareRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Phase 2: Coordinates
  const cleanCipher = useMemo(() => initialCode.toUpperCase().replace(/[^A-Z]/g, ''), [initialCode]);
  const [userCoords, setUserCoords] = useState<string[]>([]);
  
  // Phase 3: Decoding
  const [userFinalLetters, setUserFinalLetters] = useState<string[]>([]);
  const [selectedDecodeIndex, setSelectedDecodeIndex] = useState<number | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<{r: number, c: number} | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [highlightedCol, setHighlightedCol] = useState<number | null>(null);

  // Refs for auto-focus
  const coordRefs = useRef<(HTMLInputElement | null)[]>([]);
  const finalLetterRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isFinished, setIsFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Stats
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setElapsedMs(prev => prev + 10);
    }, 10);
    return () => clearInterval(interval);
  }, [isFinished]);

  useEffect(() => {
     if (userCoords.length === 0 && cleanCipher.length > 0) {
         setUserCoords(new Array(cleanCipher.length * 2).fill(''));
     }
     if (userFinalLetters.length === 0 && cleanCipher.length > 0) {
         setUserFinalLetters(new Array(cleanCipher.length).fill(''));
     }
  }, [cleanCipher]);

  const formatTimeFull = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const c = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
  };

  const correctSquare = useMemo(() => {
    const cleanKey = initialKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    const seen = new Set<string>();
    const res: string[] = [];
    const addToRes = (c: string) => {
      if (!seen.has(c)) {
        seen.add(c);
        res.push(c === 'I' ? 'I/J' : c);
      }
    };
    for (const char of cleanKey) addToRes(char);
    for (const char of ALPHABET_NO_J) addToRes(char);
    return res;
  }, [initialKey]);

  const isGridCorrect = useMemo(() => userSquare.every((l, i) => l === correctSquare[i]), [userSquare, correctSquare]);

  const handleSquareInput = (idx: number, val: string) => {
    let char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    if (char === 'I' || char === 'J') char = 'I/J';
    const newSquare = [...userSquare];
    newSquare[idx] = char;
    setUserSquare(newSquare);

    if (char.length >= 1 && idx < 24) {
      squareRefs.current[idx + 1]?.focus();
    }
  };

  const getCorrectCoords = (char: string) => {
    let c = char.toUpperCase().replace(/J/g, 'I');
    if (c === 'I') c = 'I/J';
    const idx = correctSquare.indexOf(c);
    if (idx === -1) return null;
    return { r: (Math.floor(idx / 5) + 1).toString(), c: ((idx % 5) + 1).toString() };
  };

  const correctCoordsStream = useMemo(() => {
    const res: string[] = [];
    for (const char of cleanCipher) {
      const co = getCorrectCoords(char);
      if (co) {
        res.push(co.r);
        res.push(co.c);
      }
    }
    return res;
  }, [cleanCipher, correctSquare]);

  const coordsHalves = useMemo(() => {
    const mid = correctCoordsStream.length / 2;
    return {
      top: correctCoordsStream.slice(0, mid),
      bottom: correctCoordsStream.slice(mid)
    };
  }, [correctCoordsStream]);

  const correctFinalLetters = useMemo(() => {
    const res: string[] = [];
    const { top, bottom } = coordsHalves;
    for (let i = 0; i < top.length; i++) {
      const r = parseInt(top[i]) - 1;
      const c = parseInt(bottom[i]) - 1;
      res.push(correctSquare[r * 5 + c]);
    }
    return res;
  }, [coordsHalves, correctSquare]);

  const handleCoordInput = (idx: number, val: string) => {
    const v = val.replace(/[^1-5]/g, '').slice(0, 1);
    const newCoords = [...userCoords];
    newCoords[idx] = v;
    setUserCoords(newCoords);

    if (v.length === 1 && idx < userCoords.length - 1) {
      coordRefs.current[idx + 1]?.focus();
    }
  };

  const handleFinalLetterInput = (idx: number, val: string) => {
    let char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    if (char === 'I' || char === 'J') char = 'I/J';
    const newLetters = [...userFinalLetters];
    newLetters[idx] = char;
    setUserFinalLetters(newLetters);

    if (char.length >= 1 && idx < userFinalLetters.length - 1) {
      finalLetterRefs.current[idx + 1]?.focus();
    }
  };

  const checkDecipher = (row: number, col: number) => {
    if (selectedDecodeIndex !== null) {
      const char = correctSquare[row * 5 + col];
      handleFinalLetterInput(selectedDecodeIndex, char);
      
      setHighlightedCell({ r: row, c: col });
      
      setTimeout(() => {
        setHighlightedRow(null);
        setHighlightedCol(null);
        setHighlightedCell(null);
        if (selectedDecodeIndex < cleanCipher.length - 1) {
          setSelectedDecodeIndex(selectedDecodeIndex + 1);
        }
      }, 400);
    }
  };

  const handleSquareCellClick = (r: number, c: number) => {
    if (currentPhase === Phase.DECODE) {
      if (selectedDecodeIndex !== null && highlightedRow === r) {
        setHighlightedCol(c);
        checkDecipher(r, c);
      }
    } else {
      setHighlightedCell({ r, c });
    }
  };

  const allCoordsDone = userCoords.every((c, i) => c === correctCoordsStream[i]);
  const allLettersDone = userFinalLetters.every((l, i) => l === correctFinalLetters[i]);

  return (
    <div className="flex-1 flex flex-col h-full bg-black/60 backdrop-blur-md rounded-[40px] border-4 border-zinc-800 p-8 overflow-hidden relative">
      <div className="absolute right-8 top-8 z-[100] bg-zinc-900 border-2 border-[#D4AF37] px-6 py-2 rounded-2xl shadow-2xl">
         <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Mission Time</div>
         <div className="font-mono text-2xl font-black text-white tabular-nums">{formatTimeFull(elapsedMs)}</div>
      </div>

      <div className="flex items-center justify-between mb-8 border-b-2 border-zinc-800 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 group hover:text-[#D4AF37] transition-colors">
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="font-black uppercase tracking-widest text-sm text-zinc-500">Return</span>
        </button>
        <div className="text-center flex-1">
          <h1 className="text-4xl font-black text-[#D4AF37] uppercase italic tracking-tighter">Bifid Decoder</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Mission Intelligence</p>
        </div>
        <div className="w-24" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-32">
        <div className="flex justify-center gap-4 mb-10">
            <div className="bg-black/50 border border-[#D4AF37]/20 px-4 py-2 rounded-full flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${currentPhase === Phase.GRID ? 'bg-[#D4AF37] animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'bg-green-500'}`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Square</span>
            </div>
            <div className="bg-black/50 border border-[#D4AF37]/20 px-4 py-2 rounded-full flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${currentPhase === Phase.COORDS ? 'bg-[#D4AF37] animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.6)]' : (allCoordsDone ? 'bg-green-500' : 'bg-white/10')}`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Fractionate</span>
            </div>
            <div className="bg-black/50 border border-[#D4AF37]/20 px-4 py-2 rounded-full flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${currentPhase === Phase.DECODE ? 'bg-[#D4AF37] animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.6)]' : (allLettersDone ? 'bg-green-500' : 'bg-white/10')}`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Decipher</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-xl backdrop-blur-md">
                <h3 className="font-black text-sm text-[#D4AF37] uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                   <Zap className="w-4 h-4" />
                   Intercepted Intel
                </h3>
                <div className="space-y-4">
                   <div>
                     <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Cipher Text</span>
                     <div className="text-zinc-100 font-black text-xl tracking-[0.2em] break-all">
                       {initialCode}
                     </div>
                   </div>
                   <div>
                     <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 block">Keyword</span>
                     <div className="text-green-500 font-black text-xl tracking-[0.2em] break-all">
                       {initialKey}
                     </div>
                   </div>
                </div>
            </div>

            {(currentPhase === Phase.COORDS || currentPhase === Phase.DECODE) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-xl"
              >
                <h3 className="font-black text-sm text-[#D4AF37] uppercase tracking-widest mb-4 flex items-center justify-between italic">
                   <span>Polybius Square</span>
                   <Unlock className="w-4 h-4 text-green-500" />
                </h3>
                <div className="grid grid-cols-6 gap-1.5 p-2 bg-black/40 rounded-xl">
                      <div className="w-10 h-10" />
                      {[0,1,2,3,4].map(c => (
                        <div key={c} className={`w-10 h-10 flex items-center justify-center font-black text-zinc-500 text-xs`}>
                          {c + 1}
                        </div>
                      ))}
                      {[0,1,2,3,4].map(r => (
                        <React.Fragment key={r}>
                          <div className={`w-10 h-10 flex items-center justify-center font-black text-zinc-500 text-xs`}>
                            {r + 1}
                          </div>
                          {[0,1,2,3,4].map(c => {
                            const idx = r * 5 + c;
                            const char = correctSquare[idx];
                            const isRowHighlighted = currentPhase === Phase.DECODE && highlightedRow === r;
                            const isColHighlighted = currentPhase === Phase.DECODE && highlightedCol === c;
                            const isExactCell = highlightedCell?.r === r && highlightedCell?.c === c;

                            let style = "bg-white/5 border border-white/5 text-[#D4AF37]";
                            if (isExactCell) style = "bg-[#D4AF37] text-black shadow-lg z-10 scale-110";
                            else if (isRowHighlighted) style = "bg-[#D4AF37]/30 border-[#D4AF37]/50 text-white";
                            else if (isColHighlighted) style = "bg-blue-500/30 border-blue-500/50 text-white";

                            return (
                              <button
                                key={c}
                                onClick={() => handleSquareCellClick(r, c)}
                                className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-all font-black ${style} ${char === 'I/J' ? 'text-[8px]' : 'text-sm'}`}
                              >
                                 {char}
                              </button>
                            );
                          })}
                        </React.Fragment>
                      ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {currentPhase === Phase.GRID && (
                <motion.div
                  key="phase-grid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="bg-zinc-900/90 border border-[#D4AF37]/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center"
                >
                  <Lock className="w-16 h-16 text-[#D4AF37] mb-6 opacity-20" />
                  <h2 className="font-black text-2xl text-white uppercase tracking-widest mb-8 text-center italic">Square Matrix Protocol</h2>
                  <div className="grid grid-cols-5 gap-3 max-w-[400px]">
                    {userSquare.map((l, i) => {
                      const isCorrect = l === correctSquare[i];
                      return (
                        <input
                          key={i}
                          ref={el => squareRefs.current[i] = el}
                          type="text"
                          value={l}
                          onChange={(e) => handleSquareInput(i, e.target.value)}
                          className={`w-14 h-14 md:w-16 md:h-16 rounded-xl text-center font-black focus:outline-none transition-all uppercase ${l === 'I/J' ? 'text-xs' : 'text-xl'} ${isCorrect ? 'bg-green-600/20 border-2 border-green-500 text-green-400' : 'bg-black/60 border border-zinc-800 text-white focus:border-[#D4AF37]'}`}
                        />
                      );
                    })}
                  </div>
                  {isGridCorrect && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setCurrentPhase(Phase.COORDS)}
                      className="mt-10 bg-[#D4AF37] text-black px-12 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      Initialize Fractionation
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  )}
                </motion.div>
              )}

              {currentPhase === Phase.COORDS && (
                <motion.div
                  key="phase-coords"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="bg-zinc-900/90 border border-[#D4AF37]/30 rounded-3xl p-8 shadow-2xl"
                >
                  <h2 className="font-black text-xl text-[#D4AF37] uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-3 italic">
                    <Hash className="w-6 h-6" />
                    Coordinate Extraction
                  </h2>
                  <div className="flex flex-wrap justify-center gap-2 mb-10 overflow-x-auto pb-4">
                    {cleanCipher.split('').map((char, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-lg flex items-center justify-center text-[#D4AF37] font-black text-lg shadow-lg">
                          {char}
                        </div>
                        <div className="flex flex-col gap-1">
                          <input
                            ref={el => coordRefs.current[i*2] = el}
                            type="text"
                            maxLength={1}
                            value={userCoords[i*2]}
                            onChange={(e) => handleCoordInput(i*2, e.target.value)}
                            className={`w-10 h-10 rounded-lg bg-black/60 border text-center font-black transition-all ${userCoords[i*2] === correctCoordsStream[i*2] ? 'border-green-500 text-green-400' : 'border-zinc-800 text-white focus:border-[#D4AF37]'}`}
                          />
                          <input
                            ref={el => coordRefs.current[i*2+1] = el}
                            type="text"
                            maxLength={1}
                            value={userCoords[i*2+1]}
                            onChange={(e) => handleCoordInput(i*2 + 1, e.target.value)}
                            className={`w-10 h-10 rounded-lg bg-black/60 border text-center font-black transition-all ${userCoords[i*2 + 1] === correctCoordsStream[i*2 + 1] ? 'border-green-500 text-green-400' : 'border-zinc-800 text-white focus:border-[#D4AF37]'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {allCoordsDone && (
                    <div className="flex justify-center mt-8">
                      <button onClick={() => setCurrentPhase(Phase.DECODE)} className="bg-[#D4AF37] text-black px-12 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-2xl">
                        Unstack Stream
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {currentPhase === Phase.DECODE && (
                <motion.div
                  key="phase-decode"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900/90 border border-[#D4AF37]/30 rounded-3xl p-8 shadow-2xl"
                >
                   <h2 className="font-black text-xl text-[#D4AF37] uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-3 italic">
                      <Zap className="w-6 h-6" />
                      Unstacked Decryption
                   </h2>
                   <div className="flex flex-col gap-6 mb-10 bg-black/40 p-8 rounded-3xl border border-[#D4AF37]/20">
                      <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                         <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest w-12 text-right">Row</span>
                         <div className="flex gap-2">
                            {coordsHalves.top.map((v, i) => (
                               <button
                                 key={i}
                                 onClick={() => {
                                   setSelectedDecodeIndex(i);
                                   setHighlightedRow(parseInt(v.toString()) - 1);
                                   setHighlightedCol(null);
                                 }}
                                 className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg transition-all ${selectedDecodeIndex === i && highlightedRow !== null ? 'bg-[#D4AF37] text-black scale-110 shadow-lg' : 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]'}`}
                               >
                                 {v}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                         <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest w-12 text-right">Col</span>
                         <div className="flex gap-2">
                            {coordsHalves.bottom.map((v, i) => (
                               <button
                                 key={i}
                                 onClick={() => {
                                   setSelectedDecodeIndex(i);
                                   const c = parseInt(v.toString()) - 1;
                                   setHighlightedCol(c);
                                   if (highlightedRow !== null) checkDecipher(highlightedRow, c);
                                 }}
                                 className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg transition-all ${selectedDecodeIndex === i && highlightedCol !== null ? 'bg-blue-500 text-white scale-110 shadow-lg' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'}`}
                               >
                                 {v}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-6 border-t border-white/5 overflow-x-auto pb-2 custom-scrollbar">
                         <span className="w-12" />
                         <div className="flex gap-2">
                           {userFinalLetters.map((l, i) => (
                             <input
                               key={i}
                               ref={el => finalLetterRefs.current[i] = el}
                               type="text"
                               value={l}
                               onFocus={() => setSelectedDecodeIndex(i)}
                               onChange={(e) => handleFinalLetterInput(i, e.target.value)}
                               className={`w-10 h-10 rounded-xl bg-black border-2 border-zinc-800 text-center font-black text-lg transition-all ${userFinalLetters[i] === correctFinalLetters[i] ? 'border-green-500 text-green-400' : 'text-white focus:border-[#D4AF37]'}`}
                             />
                           ))}
                         </div>
                      </div>
                   </div>

                   {allLettersDone && (
                     <div className="flex flex-col items-center gap-6 mt-8">
                        {!isFinished ? (
                           <button onClick={() => setIsFinished(true)} className="bg-[#D4AF37] text-black px-16 py-6 rounded-2xl font-black text-2xl uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                              Finalize Crack
                           </button>
                        ) : (
                           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
                              <div className="bg-green-600 text-white px-12 py-4 rounded-full font-black text-lg uppercase tracking-widest flex items-center gap-3 shadow-2xl">
                                 <CheckCircle2 className="w-7 h-7" />
                                 Mission Succeeded
                              </div>
                              <button
                                onClick={() => onPostResults({
                                  gameCode: userFinalLetters.join(''),
                                  time: formatTimeFull(elapsedMs),
                                  sponsorKey: initialKey
                                })}
                                className="mt-4 bg-[#D4AF37] text-black px-12 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-white hover:text-black transition-all"
                              >
                                Post Intelligence Results
                              </button>
                           </motion.div>
                        )}
                     </div>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
    </div>
  );
};

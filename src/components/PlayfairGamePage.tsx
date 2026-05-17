import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { LucideChevronLeft, LucideInfo, LucideZap, LucideCheckCircle2, LucideLayoutGrid } from 'lucide-react';

interface PlayfairGamePageProps {
 onBack: () => void;
 initialCode: string;
 initialKey?: string;
 onPostResults?: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

export const PlayfairGamePage: React.FC<PlayfairGamePageProps> = ({ 
  onBack, 
  initialCode, 
  initialKey = 'CODE',
  onPostResults,
  youtuber 
}) => {
 const [isFinished, setIsFinished] = useState(false);
 const [elapsedMs, setElapsedMs] = useState(0);
 const [showCongratulationPopup, setShowCongratulationPopup] = useState(false);

 // Manual grid state (5x5)
 const [userGrid, setUserGrid] = useState<string[][]>(Array.from({ length: 5 }, () => new Array(5).fill('')));
 const gridRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: 5 }, () => new Array(5).fill(null)));

 // Interactive selection state
 const [activePairIndex, setActivePairIndex] = useState(0);
 const [selectedSourceCells, setSelectedSourceCells] = useState<{r: number, c: number}[]>([]);
 const [selectedTargetCells, setSelectedTargetCells] = useState<{r: number, c: number}[]>([]);

 // Decrypted digraphs state
 const [userDigraphs, setUserDigraphs] = useState<string[]>([]);

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
   
   if (m >= 60) return "59:59:99";
   return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
 };

 const cipherText = initialCode.toUpperCase().replace(/[^A-Z]/g, '');
 const cipherDigraphs = useMemo(() => {
   const pairs: string[] = [];
   for (let i = 0; i < cipherText.length; i += 2) {
     pairs.push(cipherText.substring(i, i + 2));
   }
   return pairs;
 }, [cipherText]);

 // Initialize user digraphs state
 useEffect(() => {
   if (userDigraphs.length === 0 && cipherDigraphs.length > 0) {
     setUserDigraphs(new Array(cipherDigraphs.length).fill(''));
   }
 }, [cipherDigraphs, userDigraphs.length]);

 const handleGridChange = (r: number, c: number, val: string) => {
   if (isFinished) return;
   const input = val.toUpperCase();
   const newGrid = [...userGrid];
   newGrid[r] = [...newGrid[r]];
  
   if (input === 'I' || input === 'J' || input === 'I/J') {
     newGrid[r][c] = 'I/J';
   } else {
     newGrid[r][c] = input.replace(/[^A-Z]/g, '').slice(0, 1);
   }
   setUserGrid(newGrid);

   // Auto-focus next cell
   if (newGrid[r][c].length >= 1) {
     let nextR = r;
     let nextC = c + 1;
     if (nextC > 4) {
       nextC = 0;
       nextR++;
     }
     if (nextR <= 4) {
       gridRefs.current[nextR][nextC]?.focus();
     }
   }
 };

 const currentCipherPair = cipherDigraphs[activePairIndex] || '';
 const expectedTargets = useMemo(() => {
   if (selectedSourceCells.length !== 2) return [];
   const r1 = selectedSourceCells[0].r;
   const c1 = selectedSourceCells[0].c;
   const r2 = selectedSourceCells[1].r;
   const c2 = selectedSourceCells[1].c;

   if (r1 === r2) {
     return [{ r: r1, c: (c1 - 1 + 5) % 5 }, { r: r2, c: (c2 - 1 + 5) % 5 }];
   } else if (c1 === c2) {
     return [{ r: (r1 - 1 + 5) % 5, c: c1 }, { r: (r2 - 1 + 5) % 5, c: c2 }];
   } else {
     return [{ r: r1, c: c2 }, { r: r2, c: c1 }];
   }
 }, [selectedSourceCells]);

 const handleCellClick = (r: number, c: number) => {
   if (isFinished) return;
   const letter = userGrid[r][c];
   if (!letter) return;

   // Phase 1: Selecting Source Letters
   if (selectedSourceCells.length < 2) {
     const targetChar = currentCipherPair[selectedSourceCells.length];
     const isMatch = (targetChar === 'I' || targetChar === 'J')
       ? (letter === 'I/J' || letter === 'I' || letter === 'J')
       : letter === targetChar;

     if (isMatch) {
       setSelectedSourceCells(prev => [...prev, { r, c }]);
     }
     return;
   }

   // Phase 2: Selecting Target Letters
   if (selectedSourceCells.length === 2 && selectedTargetCells.length < 2) {
     const isTarget = expectedTargets.some(t => t.r === r && t.c === c);
     if (isTarget) {
       if (selectedTargetCells.some(t => t.r === r && t.c === c)) return;
      
       const newTargets = [...selectedTargetCells, { r, c }];
       setSelectedTargetCells(newTargets);

       if (newTargets.length === 2) {
         const targetLetters = expectedTargets.map(t => {
           const val = userGrid[t.r][t.c];
           return val === 'I/J' ? 'I' : val;
         }).join('');
        
         const newDigraphs = [...userDigraphs];
         newDigraphs[activePairIndex] = targetLetters;
         setUserDigraphs(newDigraphs);

         setTimeout(() => {
           setSelectedSourceCells([]);
           setSelectedTargetCells([]);
           setActivePairIndex(prev => prev + 1);
         }, 600);
       }
     }
   }
 };

 const decodedString = userDigraphs.join('');

 return (
   <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-32">
     <div
       className="fixed inset-0 z-0 pointer-events-none opacity-20"
       style={{
         backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
         backgroundSize: 'cover',
         backgroundPosition: 'center',
       }}
     />
     <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />

     {/* Floating Timer */}
     <div className="fixed right-6 top-32 z-[100] pointer-events-none">
       <div className="bg-zinc-900/40 border-2 border-[#D4AF37]/40 backdrop-blur-xl px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center min-w-[120px]">
         <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Mission Time</div>
         <div className="font-mono text-2xl font-black text-white tabular-nums">{formatTimeFull(elapsedMs)}</div>
       </div>
     </div>

     {/* Header */}
     <div className="relative z-[70] w-full pt-12 px-8">
       <div className="w-full max-w-7xl mx-auto flex flex-col items-start">
         <div className="mb-8">
           <button
             onClick={onBack}
             className="flex items-center gap-2 group hover:text-[#D4AF37] transition-all bg-black/60 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl"
           >
             <LucideChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-[#D4AF37]" />
             <span className="font-black uppercase tracking-widest text-[10px] text-white">Return to Encoder</span>
           </button>
         </div>

         <div className="w-full flex flex-col items-center">
           <motion.h1 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="font-black text-4xl md:text-6xl text-[#D4AF37] uppercase tracking-tighter mb-2 italic text-center"
           >
             Playfair Cipher Decoder
           </motion.h1>
           <p className="text-[#22c55e] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-12">
             Code cracking game
           </p>
         </div>
       </div>
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
       <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl p-8 mb-12 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-8">
                <div>
                   <label className="block text-xs text-green-500 uppercase tracking-widest font-black mb-4 italic underline">Mirror Key Word </label>
                   <div className="bg-green-500/5 border-2 border-green-500/30 rounded-2xl p-6 flex flex-col items-center">
                      <span className="text-4xl md:text-7xl font-black text-green-500 uppercase tracking-[0.3em] italic">
                         {initialKey || '---'}
                      </span>
                   </div>
                </div>

                <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl">
                   <h3 className="flex items-center gap-2 font-black uppercase text-xs text-blue-400 mb-4 tracking-widest">
                      <LucideInfo className="w-4 h-4" />
                      Procedure Manual
                   </h3>
                   <ul className="text-[10px] text-white/60 leading-loose font-black uppercase space-y-3">
                      <li><span className="text-[#D4AF37]">1. Matrix Build:</span> Key characters first, no repeats. Fill remaining with alphabet (A-Z, Skip J).</li>
                      <li><span className="text-[#D4AF37]">2. Digraph Reversal:</span> Find pairs in grid. Apply logic rules to decrypt.</li>
                   </ul>
                </div>
             </div>

             <div className="flex flex-col items-center">
                <label className="block text-sm text-blue-500/60 uppercase tracking-widest font-black mb-6 flex items-center gap-2 italic">
                   <LucideLayoutGrid className="w-5 h-5 text-blue-400" />
                   Interactive 5x5 Key Matrix
                </label>
                <div className="grid grid-cols-5 gap-2 md:gap-3 p-4 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                   {userGrid.map((row, rIdx) =>
                      row.map((cell, cIdx) => {
                         const isSourceSelected = selectedSourceCells.some(s => s.r === rIdx && s.c === cIdx);
                         const isTargetSelected = selectedTargetCells.some(t => t.r === rIdx && t.c === cIdx);

                         let cellStyle = "bg-black/60 border-2 border-white/10 text-[#D4AF37]";
                         if (isSourceSelected) cellStyle = "bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                         if (isTargetSelected) cellStyle = "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]";

                         return (
                           <input
                             key={`${rIdx}-${cIdx}`}
                             type="text"
                             ref={(el) => gridRefs.current[rIdx][cIdx] = el}
                             value={cell}
                               onChange={(e) => handleGridChange(rIdx, cIdx, e.target.value)}
                               className={`w-12 h-12 md:w-20 md:h-20 rounded-xl text-center font-black focus:outline-none transition-all uppercase ${cellStyle} ${!cell ? 'cursor-text' : 'cursor-pointer'} ${cell === 'I/J' ? 'text-lg md:text-2xl' : 'text-2xl md:text-4xl'}`}
                               maxLength={3}
                               onClick={() => cell && handleCellClick(rIdx, cIdx)}
                           />
                         );
                      })
                   )}
                </div>
             </div>
          </div>
       </div>

       <div className="bg-zinc-900/90 backdrop-blur-2xl border border-[#D4AF37]/40 rounded-3xl overflow-hidden shadow-2xl mb-12">
          <div className="bg-blue-600 py-6 px-10 flex justify-center items-center gap-4 shadow-lg italic">
             <h2 className="font-black text-2xl md:text-4xl text-white uppercase tracking-widest">
               Reassembly Grid
             </h2>
             <LucideZap className="w-8 h-8 text-white animate-pulse" />
          </div>

          <div className="bg-black/60 border-b border-white/10 py-10 px-8 text-center">
             <label className="block text-xs font-black text-[#D4AF37]/40 uppercase tracking-widest mb-4 italic">Ciphered Intelligence (Reference)</label>
             <div className="text-3xl md:text-6xl font-black text-[#D4AF37] tracking-[0.3em] break-all leading-tight italic uppercase font-mono drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                {cipherText || '---'}
             </div>
          </div>

          <div className="p-12 overflow-x-auto custom-vault-scrollbar">
             <div className="flex flex-wrap justify-center gap-8 min-w-max">
                {cipherDigraphs.map((pair, idx) => {
                   const isActive = idx === activePairIndex;
                   return (
                   <div key={idx} className={`flex flex-col items-center gap-4 transition-all ${isActive ? 'scale-110' : 'opacity-40 scale-90'}`}>
                      <div className={`text-3xl md:text-5xl font-black tracking-widest px-6 py-3 rounded-xl border italic ${isActive ? 'text-blue-500 bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-blue-500/60 bg-blue-500/5 border-blue-500/20'}`}>
                         {pair}
                      </div>
                      <LucideZap className={`w-6 h-6 rotate-180 transition-colors ${isActive ? 'text-[#D4AF37] animate-bounce' : 'text-[#D4AF37]/20'}`} />
                      <div className={`w-24 h-24 md:w-32 md:h-32 bg-black/60 border-4 rounded-2xl flex items-center justify-center font-black text-4xl md:text-6xl text-white transition-all italic ${isActive ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-[#D4AF37]/30'}`}>
                         {userDigraphs[idx] || '??'}
                      </div>
                      <span className="text-[12px] font-black text-[#D4AF37]/40 uppercase tracking-widest">Pair {idx + 1}</span>
                   </div>
                   );
                })}
             </div>
          </div>
       </div>

       <div className="max-w-5xl mx-auto mb-10">
          <div className="bg-black/80 border border-[#D4AF37]/50 rounded-[3rem] p-12 text-center shadow-[0_0_100px_rgba(212,175,55,0.15)] relative overflow-hidden">
             <label className="text-sm md:text-lg font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-8 block italic">Decrypted Tactical Output</label>
            
             <div className="text-2xl md:text-5xl font-black text-white tracking-[0.2em] break-all uppercase leading-none min-h-[3rem] italic font-mono">
                {decodedString || '---'}
             </div>

             <div className="mt-16 flex justify-center">
                {!isFinished ? (
                  <VaultButton
                    variant="primary"
                    className="py-10 px-20 text-3xl shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                    onClick={() => {
                        setIsFinished(true);
                        setShowCongratulationPopup(true);
                    }}
                  >
                    <LucideCheckCircle2 className="w-10 h-10 mr-6" />
                    CRACK CODE
                  </VaultButton>
                ) : (
                  <div className="flex flex-col items-center gap-8">
                    <div className="bg-[#D4AF37] text-black px-16 py-6 rounded-3xl font-black text-2xl uppercase tracking-widest flex items-center gap-4 shadow-[0_0_50px_rgba(212,175,55,0.6)] border-2 border-white/30 italic">
                      <LucideCheckCircle2 className="w-10 h-10" />
                      Intelligence Cracked
                    </div>
                  </div>
                )}
             </div>
          </div>
       </div>
     </div>

     {/* Success Popup */}
     <AnimatePresence>
        {showCongratulationPopup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center px-6">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900/90 border-4 border-[#D4AF37] p-12 rounded-[40px] max-w-2xl w-full text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] relative overflow-hidden backdrop-blur-2xl">
                    <LucideCheckCircle2 className="w-20 h-20 text-[#22c55e] mx-auto mb-6 shadow-2xl" />
                    <h2 className="text-white text-5xl font-black uppercase italic tracking-tighter mb-4">Congratulations!</h2>
                    <p className="text-[#D4AF37] text-2xl font-bold uppercase tracking-widest mb-4 italic underline">You Crack the Code</p>
                    <div className="flex flex-col gap-4 mb-8 bg-black/40 p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center px-4">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Cracked Word:</span>
                            <span className="text-white font-black text-2xl tracking-[0.2em] font-mono">{decodedString}</span>
                        </div>
                        <div className="flex justify-between items-center px-4">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Mission Time:</span>
                            <span className="text-[#D4AF37] font-mono text-2xl font-black italic">{formatTimeFull(elapsedMs)}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (onPostResults) {
                                onPostResults({
                                    gameCode: decodedString,
                                    time: formatTimeFull(elapsedMs),
                                    sponsorKey: initialKey
                                });
                            }
                        }}
                        className="w-full bg-[#22c55e] text-white py-6 rounded-2xl text-2xl font-black uppercase tracking-widest hover:bg-[#16a34a] transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95"
                    >
                        Submit Time
                    </button>
                </motion.div>
            </motion.div>
        )}
     </AnimatePresence>

     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

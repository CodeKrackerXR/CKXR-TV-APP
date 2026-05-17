import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import {
  ChevronLeft,
  Info,
  Zap,
  CheckCircle2,
  LayoutGrid,
  Calculator,
  ArrowDown,
  Lock,
  Check,
  HelpCircle
} from 'lucide-react';

interface NihilistGamePageProps {
 onBack: () => void;
 initialCode: string;
 initialGridKey: string;
 initialAddKey: string;
 onPostResults?: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

type MissionPhase = 'RECONSTRUCT_SQUARE' | 'KEY_CONVERSION' | 'SUBTRACTION' | 'DECODE';

export const NihilistGamePage: React.FC<NihilistGamePageProps> = ({
 onBack,
 initialCode,
 initialGridKey = 'VAULT',
 initialAddKey = 'KEY',
 onPostResults,
 youtuber
}) => {
 const [phase, setPhase] = useState<MissionPhase>('RECONSTRUCT_SQUARE');
 const [isFinished, setIsFinished] = useState(false);
 const [elapsedMs, setElapsedMs] = useState(0);
 const [showCongratulationPopup, setShowCongratulationPopup] = useState(false);

 // Phase 1: Square Reconstruction
 const [userSquare, setUserSquare] = useState<string[][]>(Array.from({ length: 5 }, () => new Array(5).fill('')));
  // Phase 2: Key Conversion
 const [userKeyCoords, setUserKeyCoords] = useState<string[]>([]);
 const [highlightedCell, setHighlightedCell] = useState<{r: number, c: number} | null>(null);
  // Phase 3: Subtraction
 const [userPlaintextCoords, setUserPlaintextCoords] = useState<string[]>([]);
  // Phase 4: Final Decode
 const [userFinalLetters, setUserFinalLetters] = useState<string[]>([]);
 const [activeDecodeIndex, setActiveDecodeIndex] = useState(0);
 const [selectedDecodeRow, setSelectedDecodeRow] = useState<number | null>(null);

 // Refs for auto-focus
 const squareRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: 5 }, () => new Array(5).fill(null)));
 const keyCoordRefs = useRef<(HTMLInputElement | null)[]>([]);
 const plaintextCoordRefs = useRef<(HTMLInputElement | null)[]>([]);

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

 // Helper: Get correct square
 const correctSquare = useMemo(() => {
   const cleanKey = initialGridKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   const seen = new Set<string>();
   const res: string[] = [];
   const addToRes = (c: string) => {
     if (!seen.has(c)) {
       seen.add(c);
       res.push(c === 'I' ? 'I/J' : c);
     }
   };
   for (const char of cleanKey) {
     addToRes(char);
   }
   for (const char of ALPHABET_NO_J) {
     addToRes(char);
   }
   return res;
 }, [initialGridKey]);

 // Helper: Get coordinates for a character in the correct square
 const getCorrectCoords = (char: string) => {
   let c = char.toUpperCase().replace(/J/g, 'I');
   if (c === 'I') c = 'I/J';
   const idx = correctSquare.indexOf(c);
   if (idx === -1) return null;
   const r = Math.floor(idx / 5) + 1;
   const col = (idx % 5) + 1;
   return `${r}${col}`;
 };

 // Ciphertext numbers
 const cipherNumbers = useMemo(() => {
   return initialCode.split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
 }, [initialCode]);

 // Keystream sequence (coords of Period Key repeated)
 const keystreamCoords = useMemo(() => {
   const cleanKey = initialAddKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   const coords = cleanKey.split('').map(char => getCorrectCoords(char)).filter(x => x !== null) as string[];
   return coords;
 }, [initialAddKey, correctSquare]);

 const fullKeystream = useMemo(() => {
   if (keystreamCoords.length === 0) return [];
   const stream: string[] = [];
   for (let i = 0; i < cipherNumbers.length; i++) {
     stream.push(keystreamCoords[i % keystreamCoords.length]);
   }
   return stream;
 }, [cipherNumbers, keystreamCoords]);

 // Correct results for verification
 const correctPlaintextCoords = useMemo(() => {
   return cipherNumbers.map((num, i) => {
     const keyVal = parseInt(fullKeystream[i] || '0', 10);
     let diff = num - keyVal;
     if (diff < 11) diff += 100;
     return diff.toString();
   });
 }, [cipherNumbers, fullKeystream]);

 const correctFinalLetters = useMemo(() => {
   return correctPlaintextCoords.map(coordStr => {
     const r = parseInt(coordStr[0], 10) - 1;
     const c = parseInt(coordStr[coordStr.length - 1], 10) - 1;
     return correctSquare[r * 5 + c] || '?';
   });
 }, [correctPlaintextCoords, correctSquare]);

 const handleSquareInput = (r: number, c: number, val: string) => {
   let char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
   if (char === 'I' || char === 'J') char = 'I/J';

   const newSquare = userSquare.map(row => [...row]);
   newSquare[r][c] = char;
   setUserSquare(newSquare);

   if (char.length >= 1) {
     let nextR = r;
     let nextC = c + 1;
     if (nextC > 4) {
       nextC = 0;
       nextR++;
     }
     if (nextR <= 4) {
       squareRefs.current[nextR][nextC]?.focus();
     }
   }

   const flattened = newSquare.flat();
   if (flattened.every((char, i) => char === correctSquare[i])) {
     setTimeout(() => setPhase('KEY_CONVERSION'), 800);
   }
 };

 const handleKeyCoordInput = (idx: number, val: string) => {
   const clean = val.replace(/[^1-5]/g, '').slice(0, 2);
   const newKeyCoords = [...userKeyCoords];
   if (userKeyCoords.length === 0) {
     const cleanKey = initialAddKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
     const initial = new Array(cleanKey.length).fill('');
     initial[idx] = clean;
     setUserKeyCoords(initial);
   } else {
     newKeyCoords[idx] = clean;
     setUserKeyCoords(newKeyCoords);
   }

   if (clean.length === 2 && idx < keystreamCoords.length - 1) {
     keyCoordRefs.current[idx + 1]?.focus();
   }

   const cleanKey = initialAddKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   if (newKeyCoords.length === cleanKey.length && newKeyCoords.every((c, i) => c === keystreamCoords[i])) {
     setTimeout(() => setPhase('SUBTRACTION'), 800);
   }
 };

 const handlePlaintextCoordInput = (idx: number, val: string) => {
   const clean = val.replace(/[^0-9]/g, '').slice(0, 3);
   const newCoords = userPlaintextCoords.length === 0 ? new Array(cipherNumbers.length).fill('') : [...userPlaintextCoords];
   newCoords[idx] = clean;
   setUserPlaintextCoords(newCoords);

   if (clean.length === correctPlaintextCoords[idx].length && idx < cipherNumbers.length - 1) {
     plaintextCoordRefs.current[idx + 1]?.focus();
   }

   if (newCoords.every((c, i) => c === correctPlaintextCoords[i])) {
     setTimeout(() => setPhase('DECODE'), 800);
   }
 };

 const handleFinalLetterInput = (idx: number, val: string) => {
   let char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
   if (char === 'I' || char === 'J') char = 'I/J';
   const newLetters = userFinalLetters.length === 0 ? new Array(cipherNumbers.length).fill('') : [...userFinalLetters];
   newLetters[idx] = char;
   setUserFinalLetters(newLetters);
 };

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
     <div className="fixed right-6 top-32 z-[100] pointer-events-none hidden md:block">
       <div className="bg-zinc-900/40 border-2 border-[#D4AF37]/40 backdrop-blur-xl px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center min-w-[120px]">
         <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Mission Time</div>
         <div className="font-mono text-xl font-black text-white tabular-nums">{formatTimeFull(elapsedMs)}</div>
       </div>
     </div>

     {/* Header */}
     <div className="relative z-[70] w-full pt-12 px-8">
       <div className="w-full max-w-7xl mx-auto flex flex-col items-start">
         <div className="mb-8">
           <button onClick={onBack} className="flex items-center gap-2 group hover:text-[#D4AF37] transition-all bg-black/60 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl">
             <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-[#D4AF37]" />
             <span className="font-black uppercase tracking-widest text-[10px] text-white">Return to Encoder</span>
           </button>
         </div>

         <div className="w-full flex flex-col items-center">
           <motion.h1 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="font-black text-4xl md:text-6xl text-[#D4AF37] uppercase tracking-tighter mb-2 italic text-center"
           >
             Nihilist Decoder
           </motion.h1>
           <p className="text-[#22c55e] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-12">
             Code cracking game
           </p>
         </div>
       </div>
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
       {/* Phase Indicators */}
       <div className="grid grid-cols-4 gap-2 mb-10">
         {[
           { id: 'RECONSTRUCT_SQUARE', label: '1. Square', icon: LayoutGrid },
           { id: 'KEY_CONVERSION', label: '2. Period Key', icon: Lock },
           { id: 'SUBTRACTION', label: '3. Math', icon: Calculator },
           { id: 'DECODE', label: '4. Decode', icon: CheckCircle2 }
         ].map((item, idx) => {
           const isActive = phase === item.id;
           const isCompleted = ['RECONSTRUCT_SQUARE', 'KEY_CONVERSION', 'SUBTRACTION', 'DECODE'].indexOf(phase) > idx || isFinished;
           return (
             <div key={item.id} className={`flex flex-col items-center gap-2 transition-all ${isActive ? 'scale-105' : 'opacity-40'}`}>
               <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-[#22c55e] border-[#22c55e]' : isActive ? 'bg-[#D4AF37] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 border-white/10'}`}>
                 {isCompleted ? <Check className="w-6 h-6 text-white" /> : <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'text-black' : 'text-white/40'}`} />}
               </div>
               <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
             </div>
           );
         })}
       </div>

       <AnimatePresence mode="wait">
         {phase === 'RECONSTRUCT_SQUARE' && (
           <motion.div
             key="p1"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-xl"
           >
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-center lg:text-left">
               <div className="lg:col-span-12">
                 <h2 className="font-black text-2xl text-[#D4AF37] uppercase mb-4 tracking-tight italic">Step 1: The Polybius Matrix</h2>
                 <p className="text-white/60 text-xs mb-6 leading-relaxed uppercase font-black tracking-widest">
                   Reconstruct the <span className="text-[#D4AF37]">5x5 Grid</span> using the Square Keyword.
                 </p>
                 <label className="block text-[10px] text-[#D4AF37]/40 uppercase tracking-widest font-black mb-2 italic underline">Square Keyword</label>
                 <div className="bg-black/60 border-2 border-[#D4AF37]/30 rounded-2xl p-6 text-center shadow-inner mb-8">
                   <span className="text-3xl md:text-5xl font-black text-[#D4AF37] uppercase tracking-[0.3em] italic">{initialGridKey}</span>
                 </div>
               </div>

               <div className="lg:col-span-12 flex justify-center">
                 <div className="grid grid-cols-6 gap-2 bg-black/40 p-4 rounded-3xl border border-white/5 shadow-2xl">
                   <div className="w-10 h-10 md:w-12 md:h-12" />
                   {[1,2,3,4,5].map(n => <div key={n} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-white text-sm md:text-lg">{n}</div>)}
                   {[0,1,2,3,4].map(r => (
                     <React.Fragment key={r}>
                       <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-white text-sm md:text-lg">{r+1}</div>
                       {[0,1,2,3,4].map(c => {
                         const isCorrect = userSquare[r][c] === correctSquare[r*5 + c];
                         return (
                           <input
                             key={c}
                             ref={(el) => squareRefs.current[r][c] = el}
                             type="text"
                             value={userSquare[r][c]}
                             onChange={(e) => handleSquareInput(r, c, e.target.value)}
                             className={`w-10 h-10 md:w-12 md:h-12 rounded-xl text-center font-black focus:outline-none transition-all uppercase ${userSquare[r][c] === 'I/J' ? 'text-xs md:text-sm' : 'text-lg md:text-xl'} ${isCorrect ? 'bg-[#22c55e]/20 border-2 border-[#22c55e] text-[#22c55e]' : 'bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:bg-[#D4AF37]/5'}`}
                           />
                         );
                       })}
                     </React.Fragment>
                   ))}
                 </div>
               </div>
             </div>
           </motion.div>
         )}

         {phase === 'KEY_CONVERSION' && (
           <motion.div
             key="p2"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-xl"
           >
             <div className="text-center mb-8">
               <h2 className="font-black text-2xl text-[#D4AF37] uppercase tracking-tight mb-2 italic">Step 2: Period Key Transformation</h2>
               <p className="text-white/60 text-xs md:text-sm uppercase font-black tracking-widest">
                 Convert the Period Key into numeric coordinates using your Polybius Square.
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="flex flex-col items-center">
                  <label className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-widest mb-4 italic">Matrix Reference</label>
                  <div className="grid grid-cols-6 gap-2 p-4 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                     <div className="w-10 h-10 md:w-14 md:h-14" />
                     {[0,1,2,3,4].map(c => (
                       <div key={c} className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-black transition-all rounded-lg ${highlightedCell?.c === c ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white text-sm md:text-lg'}`}>
                         {c + 1}
                       </div>
                     ))}
                     {[0,1,2,3,4].map(r => (
                       <React.Fragment key={r}>
                         <div className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-black transition-all rounded-lg ${highlightedCell?.r === r ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white text-sm md:text-lg'}`}>
                           {r + 1}
                         </div>
                         {[0,1,2,3,4].map(c => {
                           const idx = r * 5 + c;
                           const char = correctSquare[idx];
                           const isHighlighted = highlightedCell?.r === r && highlightedCell?.c === c;
                           return (
                             <button
                               key={c}
                               onClick={() => setHighlightedCell({r, c})}
                               className={`w-10 h-10 md:w-14 md:h-14 border rounded-xl flex flex-col items-center justify-center relative shadow-lg transition-all ${isHighlighted ? 'bg-[#D4AF37]/40 border-[#D4AF37]' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                             >
                               <span className={`font-black ${isHighlighted ? 'text-white' : 'text-[#D4AF37]'} ${char === 'I/J' ? 'text-xs md:text-base' : 'text-xl md:text-2xl'} italic`}>{char}</span>
                             </button>
                           );
                         })}
                       </React.Fragment>
                     ))}
                  </div>
               </div>

               <div className="flex flex-col justify-center gap-6">
                  <div className="bg-black/80 border-2 border-[#D4AF37]/20 rounded-3xl p-8 shadow-inner">
                     <label className="block text-xs text-[#D4AF37]/60 uppercase tracking-widest font-black mb-6 text-center italic underline">Period Key</label>
                     <div className="flex flex-wrap justify-center gap-4">
                       {initialAddKey.toUpperCase().replace(/[^A-Z]/g, '').split('').map((char, i) => {
                         const isCorrect = userKeyCoords[i] === keystreamCoords[i];
                         return (
                           <div key={i} className="flex flex-col items-center gap-3">
                             <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-black font-black text-2xl md:text-3xl shadow-lg italic">
                               {char}
                             </div>
                             <ArrowDown className="w-4 h-4 text-[#D4AF37]/40" />
                             <input
                               type="text"
                               ref={(el) => keyCoordRefs.current[i] = el}
                               value={userKeyCoords[i] || ''}
                               onChange={(e) => handleKeyCoordInput(i, e.target.value)}
                               placeholder="??"
                               className={`w-12 h-10 md:w-16 md:h-12 rounded-xl text-center font-mono font-black text-lg md:text-xl focus:outline-none transition-all ${isCorrect ? 'bg-[#22c55e] text-white border-2 border-[#22c55e]' : 'bg-black/60 border border-[#D4AF37]/30 text-[#D4AF37] focus:border-[#D4AF37]'}`}
                               maxLength={2}
                             />
                           </div>
                         );
                       })}
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                     <Info className="w-5 h-5 text-blue-400 shrink-0" />
                     <p className="text-[10px] text-blue-300 font-black uppercase leading-tight tracking-[0.1em]">
                        Each letter becomes a 2-digit code: (Row)(Column).
                     </p>
                  </div>
               </div>
             </div>
           </motion.div>
         )}

         {phase === 'SUBTRACTION' && (
           <motion.div
             key="p3"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-xl"
           >
             <div className="text-center mb-8">
               <h2 className="font-black text-2xl text-[#D4AF37] uppercase tracking-tight mb-2 italic text-center">Step 3: Ciphertext Subtraction</h2>
               <p className="text-white/60 text-xs md:text-sm uppercase font-black tracking-widest text-center">
                  Subtract the Keystream sequence from the Ciphertext numbers to reveal Plaintext Coordinates.
               </p>
             </div>

             <div className="overflow-x-auto pb-4 custom-vault-scrollbar">
                <div className="min-w-[800px] bg-black/40 rounded-[2rem] border border-white/5 p-6 shadow-2xl">
                   <table className="w-full text-center border-separate border-spacing-y-4">
                      <thead>
                         <tr className="text-[9px] font-black uppercase text-[#D4AF37]/40 tracking-widest italic">
                            <th className="pb-2">Cipher Number</th>
                            <th className="pb-2">Op</th>
                            <th className="pb-2">Key Sequence</th>
                            <th className="pb-2">Op</th>
                            <th className="pb-2 text-[#D4AF37] underline">Plaintext Coord</th>
                         </tr>
                      </thead>
                       <tbody>
                          {cipherNumbers.map((num, i) => {
                            const keyVal = fullKeystream[i];
                            const isResultCorrect = userPlaintextCoords[i] === correctPlaintextCoords[i];
                            return (
                               <tr key={i}>
                                  <td className="w-1/5">
                                     <div className="bg-white/5 border border-white/10 p-4 rounded-2xl font-mono font-black text-xl md:text-2xl text-white shadow-xl">
                                        {num}
                                     </div>
                                  </td>
                                  <td className="px-2 text-[#D4AF37] font-black opacity-60 text-2xl">−</td>
                                   <td className="w-1/5">
                                     <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl font-mono font-black text-xl md:text-2xl text-blue-400">
                                        {keyVal}
                                     </div>
                                  </td>
                                  <td className="px-2 text-[#D4AF37] font-black opacity-60 text-2xl">=</td>
                                  <td className="w-1/5">
                                     <input
                                        type="text"
                                        ref={(el) => plaintextCoordRefs.current[i] = el}
                                        value={userPlaintextCoords[i] || ''}
                                        onChange={(e) => handlePlaintextCoordInput(i, e.target.value)}
                                        className={`w-full p-4 rounded-2xl text-center font-mono font-black text-xl md:text-2xl focus:outline-none transition-all ${isResultCorrect ? 'bg-[#22c55e] text-white border-2 border-[#22c55e]' : 'bg-black/60 border-2 border-[#D4AF37]/30 text-[#D4AF37] focus:border-[#D4AF37]'}`}
                                     />
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="mt-8 flex justify-center">
                <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 max-w-xl italic">
                   <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
                   <p className="text-[10px] text-blue-300 font-black uppercase leading-tight tracking-[0.1em]">
                      If the Cipher Number is smaller than the Key, add 100 before subtracting.
                   </p>
                </div>
             </div>
           </motion.div>
         )}

         {phase === 'DECODE' && (
           <motion.div
             key="p4"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-xl"
           >
             <div className="text-center mb-8">
               <h2 className="font-black text-2xl text-[#D4AF37] uppercase tracking-tight mb-2 italic">Final Step: Visual Decoding</h2>
               <p className="text-white/60 text-xs md:text-sm uppercase font-black tracking-widest mb-8">
                  Locate each Plaintext Coordinate on your Polybius Square to reveal the final message.
               </p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 flex flex-col items-center">
                   <label className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-widest mb-4 italic">Select Row then Letter</label>
                   <div className="grid grid-cols-6 gap-2 bg-black/40 p-4 rounded-3xl border border-white/5 shadow-2xl">
                      <div className="w-10 h-10 md:w-14 md:h-14" />
                      {[1,2,3,4,5].map(n => <div key={n} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-black text-white text-sm md:text-lg">{n}</div>)}
                      {[0,1,2,3,4].map(r => {
                        const isRowSelected = selectedDecodeRow === r;
                        return (
                          <React.Fragment key={r}>
                            <button
                              onClick={() => setSelectedDecodeRow(r)}
                              className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-black rounded-lg transition-all text-sm md:text-lg ${isRowSelected ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                            >
                              {r+1}
                            </button>
                            {[0,1,2,3,4].map(c => (
                              <button
                                key={c}
                                onClick={() => {
                                  if (selectedDecodeRow === r) {
                                    const char = correctSquare[r * 5 + c];
                                    handleFinalLetterInput(activeDecodeIndex, char);
                                    if (activeDecodeIndex < cipherNumbers.length - 1) {
                                      setActiveDecodeIndex(activeDecodeIndex + 1);
                                    }
                                    setSelectedDecodeRow(null);
                                  }
                                }}
                                disabled={selectedDecodeRow !== r}
                                className={`w-10 h-10 md:w-14 md:h-14 border rounded-xl flex items-center justify-center transition-all ${isRowSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20' : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'} font-black text-[#D4AF37] ${correctSquare[r*5 + c] === 'I/J' ? 'text-xs md:text-base' : 'text-xl md:text-2xl'} shadow-lg italic`}
                              >
                                 {correctSquare[r*5 + c]}
                              </button>
                            ))}
                          </React.Fragment>
                        );
                      })}
                   </div>
                </div>

                <div className="lg:col-span-7">
                   <div className="bg-black/80 border-2 border-[#D4AF37]/30 rounded-3xl p-8 shadow-2xl space-y-8">
                      <div className="flex flex-wrap justify-center gap-6">
                         {correctPlaintextCoords.map((coord, i) => {
                            const isCorrect = userFinalLetters[i] === correctFinalLetters[i];
                            const isActive = activeDecodeIndex === i;
                            return (
                               <button
                                 key={i}
                                 onClick={() => setActiveDecodeIndex(i)}
                                 className={`flex flex-col items-center gap-4 group transition-all ${isActive ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                               >
                                  <div className={`bg-[#D4AF37]/10 border-2 px-4 py-2 rounded-xl text-[#D4AF37] font-mono font-black text-xl transition-all ${isActive ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-[#D4AF37]/20'}`}>
                                     {coord}
                                  </div>
                                  <ArrowDown className={`w-4 h-4 transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-[#D4AF37]/20'}`} />
                                  <div
                                     className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl transition-all italic ${isCorrect ? 'bg-[#22c55e] text-white border-2 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.4)]' : isActive ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-black border-2 border-[#D4AF37]/20 text-white/20'}`}
                                  >
                                     {userFinalLetters[i] || '?'}
                                  </div>
                               </button>
                            );
                         })}
                      </div>

                      <div className="pt-6 border-t border-white/10 text-center">
                         <label className="text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-widest mb-3 block italic">Signal Reconstruction Preview</label>
                         <div className="text-2xl md:text-5xl font-black text-[#D4AF37] tracking-[0.2em] break-all min-h-[2.5rem] mb-12 italic font-mono drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                            {userFinalLetters.map(l => l || '_').join('')}
                         </div>

                         {userFinalLetters.every((c, i) => c === correctFinalLetters[i]) && !isFinished && (
                           <VaultButton
                             variant="primary"
                             className="py-6 px-16 text-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                             onClick={() => {
                                setIsFinished(true);
                                setShowCongratulationPopup(true);
                             }}
                           >
                             <CheckCircle2 className="w-8 h-8 mr-3" />
                             CRACK CODE
                           </VaultButton>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <AnimatePresence>
         {showCongratulationPopup && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center px-6"
           >
             <motion.div
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-zinc-900/90 border-4 border-[#D4AF37] p-12 rounded-[40px] max-w-2xl w-full text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] relative overflow-hidden backdrop-blur-2xl"
             >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
               
                <div className="mb-8 flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.6)] border-4 border-white/20">
                    <CheckCircle2 className="w-12 h-12 text-black" />
                  </div>
                </div>

                <h2 className="text-white text-5xl font-black uppercase italic tracking-tighter mb-4">Mission Accomplished</h2>
                <p className="text-[#D4AF37] text-2xl font-bold uppercase tracking-widest mb-10 italic underline">You Cracked the Nihilist code</p>
                
                <div className="flex flex-col gap-4 mb-8 bg-black/40 p-6 rounded-2xl border border-white/10 italic">
                    <div className="flex justify-between items-center px-4">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Extracted Word:</span>
                        <span className="text-white font-black text-2xl tracking-[0.2em] font-mono uppercase">{userFinalLetters.join('')}</span>
                    </div>
                    <div className="flex justify-between items-center px-4">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Mission Time:</span>
                        <span className="text-[#D4AF37] font-mono text-2xl font-black">{formatTimeFull(elapsedMs)}</span>
                    </div>
                </div>

                <button 
                  onClick={() => {
                    if (onPostResults) {
                      onPostResults({
                        gameCode: userFinalLetters.join(''),
                        time: formatTimeFull(elapsedMs),
                        sponsorKey: `${initialGridKey} + ${initialAddKey}`
                      });
                    } else {
                      onBack();
                    }
                  }}
                  className="w-full bg-[#22c55e] text-white py-6 rounded-2xl text-2xl font-black uppercase tracking-widest hover:bg-[#16a34a] transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95"
                >
                  <Zap className="w-6 h-6 mr-3 inline rotate-12 transition-transform" />
                  SUBMIT TIME
                </button>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
     </div>

     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

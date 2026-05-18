import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ChevronLeft, Info, Zap, CheckCircle2, LayoutGrid, Table, ArrowRightLeft } from 'lucide-react';
import { ADFGVX_LABELS, getColumnRanks } from '../lib/adfgvxUtils';

interface ADFGVXGamePageProps {
  onReturnToEncoder: () => void;
  initialCode: string;
  initialKey?: string; // Format "GRIDKEY|TRANSKEY"
  onPostResults: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
}

export const ADFGVXGamePage: React.FC<ADFGVXGamePageProps> = ({ onReturnToEncoder, initialCode, initialKey = 'CIPHER|CODE', onPostResults }) => {
 const [gridPart, transPart] = initialKey.split('|');
 const [isFinished, setIsFinished] = useState(false);
 const [showCongratulationPopup, setShowCongratulationPopup] = useState(false);
 const [elapsedMs, setElapsedMs] = useState(0);

 // Stage 1: Polybius Square (6x6)
 const [userGrid, setUserGrid] = useState<string[][]>(Array.from({ length: 6 }, () => new Array(6).fill('')));
 const gridRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: 6 }, () => new Array(6).fill(null)));

 // Stage 2: Transposition Undo
 const numRows = Math.ceil(initialCode.length / transPart.length);
 const [userRanks, setUserRanks] = useState<string[]>(new Array(transPart.length).fill(''));
 const [userTransGrid, setUserTransGrid] = useState<string[][]>(Array.from({ length: numRows }, () => new Array(transPart.length).fill('')));
 const transGridRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: numRows }, () => new Array(transPart.length).fill(null)));
 const rankRefs = useRef<(HTMLInputElement | null)[]>(new Array(transPart.length).fill(null));

 // Determine which cells in the grid should be "dead" (empty)
 const deadCells = useMemo(() => {
   const dead: { r: number; c: number }[] = [];
   const fullColsCount = initialCode.length % transPart.length;
   if (fullColsCount === 0) return dead; // All columns full

   for (let c = fullColsCount; c < transPart.length; c++) {
     dead.push({ r: numRows - 1, c }); // Last row in these columns is empty
   }
   return dead;
 }, [initialCode.length, transPart.length, numRows]);

 const isDead = (r: number, c: number) => deadCells.some(d => d.r === r && d.c === c);

 // Stage 3: Polybius Pairs Decode
 const [userDecodedChars, setUserDecodedChars] = useState<string[]>([]);
   const [activePairIndex, setActivePairIndex] = useState(0);

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
   return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
 };

 const transRanks = useMemo(() => getColumnRanks(transPart), [transPart]);

 const colSizes = useMemo(() => {
   const fullColsCount = initialCode.length % transPart.length;
   return Array.from({ length: transPart.length }).map((_, cIdx) =>
     numRows - (fullColsCount !== 0 && cIdx >= fullColsCount ? 1 : 0)
   );
 }, [initialCode.length, transPart.length, numRows]);

 // Grouped Ciphertext Intelligence - Now maps to user-assigned column ranks and fits physical column sizes
 const groupedCiphertext = useMemo(() => {
   const segments: string[] = [];
   let currentPos = 0;
  
   // Iterate through ranks 1 to N
   for (let r = 1; r <= transPart.length; r++) {
     // Find which column index has been assigned this rank
     const colIdx = userRanks.findIndex(rankVal => parseInt(rankVal) === r);
    
     if (colIdx !== -1) {
       const size = colSizes[colIdx];
       const chunk = initialCode.substring(currentPos, currentPos + size);
       segments.push(chunk.padEnd(size, '•'));
       currentPos += size;
     } else {
       segments.push('○○○');
     }
   }
   return segments.join('   ');
 }, [userRanks, colSizes, initialCode, transPart.length]);

 const handleGridChange = (r: number, c: number, val: string) => {
   if (isFinished) return;
   const input = val.toUpperCase().slice(0, 1);
   if (!/[A-Z0-9]/.test(input) && input !== '') return;
  
   const newGrid = [...userGrid];
   newGrid[r] = [...newGrid[r]];
   newGrid[r][c] = input;
   setUserGrid(newGrid);

   if (input !== '') {
     let nextR = r;
     let nextC = c + 1;
     if (nextC > 5) {
       nextC = 0;
       nextR++;
     }
     if (nextR <= 5) {
       gridRefs.current[nextR][nextC]?.focus();
     }
   }
 };

 const isGridComplete = useMemo(() => {
   return userGrid.every(row => row.every(cell => cell !== ''));
 }, [userGrid]);

 const handleRankChange = (idx: number, val: string) => {
   const num = val.replace(/[^0-9]/g, '');
   const newRanks = [...userRanks];
   newRanks[idx] = num;
   setUserRanks(newRanks);
   if (num && idx < transPart.length - 1) {
     rankRefs.current[idx + 1]?.focus();
   }
 };

 const handleTransGridChange = (r: number, c: number, val: string) => {
   if (isFinished) return;
   const input = val.toUpperCase().slice(-1);
   if (!['A', 'D', 'F', 'G', 'V', 'X'].includes(input) && input !== '') return;

   const newGrid = [...userTransGrid];
   newGrid[r] = [...newGrid[r]];
   newGrid[r][c] = input;
   setUserTransGrid(newGrid);

   if (input !== '') {
     // Jump to next letter in the column, or next column top
     let nextR = r + 1;
     let nextC = c;

     if (nextR >= numRows || (nextR === numRows - 1 && isDead(nextR, nextC))) {
       nextR = 0;
       nextC = c + 1;
     }

     if (nextC < transPart.length) {
       transGridRefs.current[nextR][nextC]?.focus();
     }
   }
 };

 const isTransGridComplete = useMemo(() => {
   return userTransGrid.every((row, r) =>
     row.every((cell, c) => isDead(r, c) || cell !== '')
   ) && userRanks.every(rank => rank !== '');
 }, [userTransGrid, userRanks]);

 const reconstructedIntermediate = useMemo(() => {
   if (!isTransGridComplete) return "";
   let s = "";
   for (let r = 0; r < numRows; r++) {
     for (let c = 0; c < transPart.length; c++) {
       if (!isDead(r, c)) s += userTransGrid[r][c];
     }
   }
   return s;
 }, [userTransGrid, isTransGridComplete, numRows, transPart.length]);

 const [selectedPolyRow, setSelectedPolyRow] = useState<number | null>(null);
 const [selectedPolyCol, setSelectedPolyCol] = useState<number | null>(null);

 const intermediatePairs = useMemo(() => {
   if (!reconstructedIntermediate) return [];
   const pairs: string[] = [];
   for (let i = 0; i < reconstructedIntermediate.length; i += 2) {
     pairs.push(reconstructedIntermediate.substring(i, i + 2));
   }
   return pairs;
 }, [reconstructedIntermediate]);

 useEffect(() => {
   if (userDecodedChars.length === 0 && intermediatePairs.length > 0) {
     setUserDecodedChars(new Array(intermediatePairs.length).fill(''));
   }
 }, [intermediatePairs.length, userDecodedChars.length]);

 const handleDecodedChange = (idx: number, val: string) => {
   if (isFinished) return;
   const char = val.toUpperCase().slice(-1);
   const newChars = [...userDecodedChars];
   newChars[idx] = char;
   setUserDecodedChars(newChars);
   if (char !== '') {
  setActivePairIndex(idx + 1);
  setSelectedPolyRow(null);
  setSelectedPolyCol(null);
 }
 };

 const finalResult = userDecodedChars.join('');

 // Manual interaction enabled

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
     <div className="fixed inset-0 z-0 bg-mesh opacity-10 pointer-events-none" />

     {/* Floating Timer */}
     <div className="fixed right-6 top-24 z-[100] pointer-events-none">
       <div className="bg-vault-gold/20 border-2 border-vault-gold/40 backdrop-blur-xl px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center min-w-[140px]">
         <div className="text-[10px] font-black text-vault-gold uppercase tracking-widest mb-1">Mission Time</div>
         <div className="font-mono text-2xl font-black text-white tabular-nums">{formatTimeFull(elapsedMs)}</div>
       </div>
     </div>

     <div className="relative z-50 w-full flex justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm h-16 md:h-20 items-center px-4 md:px-8">
       <button onClick={onReturnToEncoder} className="flex items-center gap-2 group hover:text-vault-gold transition-colors">
         <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
         <span className="font-display font-black uppercase tracking-widest text-[10px] md:text-xs">Abort Operation</span>
       </button>
       <div className="w-24 hidden md:block" />
     </div>

     <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
       <div className="text-center mb-12">
         <h1 className="font-display font-black text-4xl md:text-6xl text-vault-gold uppercase tracking-tighter mb-1">ADFGVX Protocol</h1>
         <p className="text-white/40 font-display text-[10px] uppercase tracking-[0.4em]">Decryption Game</p>
       </div>

       {/* Intelligence Brief */}
       <div className="bg-black/60 border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl backdrop-blur-md">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
           <div>
             <div className="space-y-6">
               <div>
                 <label className="text-xs text-green-500 uppercase tracking-widest font-black mb-2 block">Grid Key</label>
                 <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-4 text-center">
                   <span className="text-3xl md:text-5xl font-display font-black text-green-500 uppercase tracking-widest">{gridPart}</span>
                 </div>
               </div>
               <div>
                 <label className="text-xs text-blue-500 uppercase tracking-widest font-black mb-2 block">Transposition Key</label>
                 <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-4 text-center">
                   <span className="text-3xl md:text-5xl font-display font-black text-blue-500 uppercase tracking-widest">{transPart}</span>
                 </div>
               </div>
             </div>
             <div className="mt-8 bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl">
               <h3 className="flex items-center gap-2 font-display font-black uppercase text-xs text-blue-400 mb-4">
                 <Info className="w-4 h-4" />
                 Decryption Workflow
               </h3>
               <ul className="text-[9px] text-white/50 leading-relaxed font-black uppercase space-y-2">
                 <li><span className="text-vault-gold">1. REBUILD GRID:</span> Use Grid Key to populate Polybius square.</li>
                 <li><span className="text-vault-gold">2. UNDO TRANS:</span> Rebuild transposition grid by rank-order columns.</li>
                 <li><span className="text-vault-gold">3. FINAL DECODE:</span> Map remaining pairs to letters using your grid.</li>
               </ul>
             </div>
           </div>

           <div className="flex flex-col items-center">
             <label className="text-xs text-blue-500/60 uppercase tracking-widest font-black mb-6 flex items-center gap-2">
               <LayoutGrid className="w-4 h-4" />
               Polybius Reconstruction
             </label>
             <div className="grid grid-cols-7 gap-1 md:gap-2 p-4 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
               <div />
               {ADFGVX_LABELS.map(l => <div key={l} className="w-10 h-10 flex items-center justify-center font-display font-black text-white/80">{l}</div>)}
               {ADFGVX_LABELS.map((rl, r) => (
                 <React.Fragment key={rl}>
                   <div className="w-10 h-10 flex items-center justify-center font-display font-black text-white/80">{rl}</div>
                   {Array.from({ length: 6 }).map((_, c) => (
                     <input
                       key={c}
                       ref={el => gridRefs.current[r][c] = el}
                       value={userGrid[r][c]}
                       onChange={e => handleGridChange(r, c, e.target.value)}
                       className={`w-10 h-10 md:w-12 md:h-12 bg-black/60 border-2 rounded-lg text-center font-display font-black text-lg transition-all focus:outline-none
                         ${userGrid[r][c] ? 'border-yellow-400 text-yellow-400' : 'border-white/10 text-white/20'}`}
                       maxLength={1}
                     />
                   ))}
                 </React.Fragment>
               ))}
             </div>
             {isGridComplete && <div className="mt-4 text-xs font-black text-vault-gold uppercase animate-pulse">GRID CONFIRMED</div>}
           </div>
         </div>
       </div>

       {/* Stage 1: Undo Transposition */}
       <div className="mb-12">
         <div className="bg-blue-600 py-4 px-8 rounded-t-[2rem] flex items-center justify-between shadow-lg">
           <h2 className="font-display font-black text-xl text-white uppercase tracking-widest flex items-center gap-3">
             <Table className="w-5 h-5" />
             Stage 1: Undo Transposition
           </h2>
           <div className="text-[10px] text-white/50 font-black uppercase tracking-widest">
             Grid Integrity: {isTransGridComplete ? 'VERIFIED' : 'PENDING'}
           </div>
         </div>
         <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-b-[2rem] p-8 shadow-2xl">
            <div className="mb-8 text-center bg-black/60 p-4 rounded-xl border border-white/5">
               <label className="text-[8px] text-vault-gold/40 uppercase block mb-2 font-black tracking-widest">Ciphertext Intelligence (Grouped by Rank)</label>
               <div className="text-xl md:text-3xl font-display font-black text-vault-gold tracking-widest break-all">
                 {groupedCiphertext}
               </div>
            </div>

            <div className="overflow-x-auto">
               <div className="flex gap-2 justify-center" style={{ minWidth: transPart.length * 50 }}>
                  {transPart.split('').map((char, i) => {
                    const rankVal = userRanks[i];
                   
                    return (
                       <div key={i} className="flex-1 min-w-[44px] flex flex-col gap-2">
                         <div className="flex flex-col gap-1 mb-2">
                           <label className="text-[8px] text-white/40 text-center font-black uppercase">RANK</label>
                           <input
                             ref={el => rankRefs.current[i] = el}
                             value={rankVal}
                             onChange={e => handleRankChange(i, e.target.value)}
                             className={`h-10 rounded-lg font-display font-black text-center transition-all border-2 focus:outline-none
                               ${rankVal ? 'bg-green-600 border-green-400 text-white' : 'bg-white/5 border-white/10 text-white/40 focus:border-blue-500'}`}
                             maxLength={2}
                           />
                         </div>
                         <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg font-display font-black text-center text-white text-lg mb-2">
                           {char}
                         </div>
                         <div className="flex flex-col gap-1">
                           {userTransGrid.map((row, rIdx) => {
                             const dead = isDead(rIdx, i);
                             return (
                               <input
                                 key={rIdx}
                                 ref={el => (transGridRefs.current[rIdx][i] = el)}
                                 value={row[i] || ''}
                                 onChange={e => handleTransGridChange(rIdx, i, e.target.value)}
                                 disabled={dead}
                                 className={`h-8 rounded flex items-center justify-center font-mono font-bold text-sm text-center border focus:outline-none transition-all
                                   ${dead ? 'bg-red-950/40 border-red-500/30 text-transparent cursor-not-allowed' :
                                     row[i] ? 'bg-green-950/40 border-green-500/30 text-green-400' : 'bg-black/40 border-white/10 text-white/50 focus:border-blue-500'}`}
                                 maxLength={1}
                               />
                             );
                           })}
                         </div>
                       </div>
                    );
                  })}
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
               <label className="text-[8px] text-blue-400 uppercase block mb-2 font-black tracking-widest">Reconstructed Intermediate Result</label>
               <div className="bg-black/60 p-4 md:p-6 rounded-xl border border-blue-500/30 min-h-[60px] font-mono text-xl md:text-3xl text-blue-400 text-center flex items-center justify-center">
                  {reconstructedIntermediate.match(/.{1,2}/g)?.join(' ') || 'ASSEMBLY IN PROGRESS...'}
               </div>
            </div>
         </div>
       </div>

       {/* Stage 2: Polybius Decode */}
       <div className="mb-20">
         <div className="bg-vault-gold py-4 px-8 rounded-t-[2rem] flex items-center justify-between shadow-lg">
           <h2 className="font-display font-black text-xl text-black uppercase tracking-widest flex items-center gap-3">
             <Zap className="w-5 h-5" />
             Stage 2: Polybius Decode
           </h2>
           <div className="text-[10px] text-black/40 font-black uppercase tracking-widest italic">
             Grid Access Required
           </div>
         </div>
         <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-b-[2rem] p-6 md:p-10 shadow-2xl">
            {/* Reference Helper Added */}
            <div className="mb-10 pb-8 border-b border-white/5">
               <label className="text-[10px] text-zinc-500 uppercase block mb-3 font-black tracking-widest flex items-center gap-2">
                 <ArrowRightLeft className="w-3 h-3" />
                 Reference: Reconstructed Stage 1 Sequence
               </label>
               <div className="bg-black/40 p-6 md:p-8 rounded-xl border border-white/5 font-mono text-2xl md:text-5xl text-blue-400 font-bold tracking-[0.3em] flex items-center justify-center min-h-[100px] text-center shadow-inner">
                 {reconstructedIntermediate
                   ? reconstructedIntermediate.match(/.{1,2}/g)?.join(' ')
                   : 'Waiting for stage 1 reconstruction...'}
               </div>
            </div>

            <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-8 transition-all justify-items-center ${isGridComplete ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
               {intermediatePairs.map((pair, idx) => {
                 const isActive = idx === activePairIndex;
                 return (
                   <div key={idx} className={`flex flex-col items-center gap-2 transition-all w-full max-w-[80px] ${isActive ? 'scale-110' : 'opacity-60'}`}>
                      <button 
                        onClick={() => setActivePairIndex(idx)}
                        className={`w-full py-1.5 rounded-lg font-display font-black text-center text-xs tracking-widest border transition-all hover:scale-105 active:scale-95
                        ${isActive ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-blue-600/10 border-blue-500/20 text-blue-400'}`}>
                        {pair}
                      </button>
                      <div className="flex flex-col items-center">
                        <div className={`w-[2px] h-3 ${isActive ? 'bg-vault-gold' : 'bg-vault-gold/20'}`} />
                        <input
                          type="text"
                          value={userDecodedChars[idx] || ''}
                          onChange={e => handleDecodedChange(idx, e.target.value)}
                          onFocus={() => setActivePairIndex(idx)}
                          className={`w-12 h-12 md:w-16 md:h-16 bg-black border-2 rounded-xl text-center font-display font-black text-xl md:text-2xl focus:outline-none transition-all
                            ${isActive ? 'border-vault-gold text-white shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'border-white/10 text-white/40'}`}
                          maxLength={1}
                        />
                      </div>
                   </div>
                 );
               })}
               {intermediatePairs.length === 0 && <div className="col-span-full py-10 text-white/20 font-black uppercase text-xs italic">Waiting for stage 1 reconstruction...</div>}
            </div>
         </div>
       </div>

       {/* Final Crack Section */}
       <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-center bg-black/90 border-2 border-vault-gold/40 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-vault-gold/30" />
            
             {/* Left Column: Grid Reference */}
             <div className="lg:col-span-5 flex flex-col items-center lg:border-r lg:border-white/5 lg:pr-12">
                <label className="text-[10px] text-vault-gold/40 uppercase tracking-[0.4em] font-black mb-8 text-center uppercase">
                 Recovery Grid Reference
                 <span className="block text-[8px] text-white/20 mt-1">Select row/col to highlight intersection</span>
                </label>
                <div className="grid grid-cols-7 gap-1 md:gap-2 p-5 bg-black/40 rounded-3xl border border-white/5 shadow-inner scale-90 md:scale-110">
                   <div />
                   {ADFGVX_LABELS.map((l, cIdx) => (
                     <button
                       key={l}
                       onClick={() => setSelectedPolyCol(selectedPolyCol === cIdx ? null : cIdx)}
                       className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-display font-black text-xs md:text-sm transition-all rounded hover:bg-white/10
                         ${selectedPolyCol === cIdx ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'text-white/40'}`}
                     >
                       {l}
                     </button>
                   ))}
                   {ADFGVX_LABELS.map((rl, rIdx) => (
                     <React.Fragment key={rl}>
                       <button
                         onClick={() => setSelectedPolyRow(selectedPolyRow === rIdx ? null : rIdx)}
                         className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-display font-black text-xs md:text-sm transition-all rounded hover:bg-white/10
                           ${selectedPolyRow === rIdx ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'text-white/40'}`}
                       >
                         {rl}
                       </button>
                       {Array.from({ length: 6 }).map((_, cIdx) => {
                         const isHighlighted = selectedPolyRow === rIdx || selectedPolyCol === cIdx;
                         const isIntersection = selectedPolyRow === rIdx && selectedPolyCol === cIdx;
                         return (
                           <button
                             key={cIdx}
                             onClick={() => {
                               if (userGrid[rIdx][cIdx]) {
                                 handleDecodedChange(activePairIndex, userGrid[rIdx][cIdx]);
                                 // We don't nullify anymore so the highlighting stays stuck to the pair
                               }
                             }}
                             className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border rounded-lg font-display font-black text-sm md:text-lg transition-all
                               ${isIntersection ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.8)] z-10 scale-110' :
                                 isHighlighted ? 'bg-yellow-400/10 border-yellow-400/30 text-white' :
                                 userGrid[rIdx][cIdx] ? 'border-white/10 text-white/60 hover:border-white/30' : 'border-white/5 text-transparent'}`}
                           >
                             {userGrid[rIdx][cIdx] || ''}
                           </button>
                         );
                       })}
                     </React.Fragment>
                   ))}
                </div>
             </div>

             {/* Right Column: Tactical Output */}
             <div className="lg:col-span-7 flex flex-col items-center text-center">
                 <label className="text-[10px] font-black text-vault-gold uppercase tracking-[0.8em] mb-8 block opacity-60">Tactical Decrypted Output</label>
                 <div className={`font-display font-black text-white tracking-[0.3em] break-all uppercase mb-16 drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]
                   ${finalResult ? 'text-4xl md:text-6xl lg:text-7xl min-h-[4rem]' : 'text-xl md:text-2xl lg:text-3xl opacity-40'}`}>
                   {finalResult || 'MISSION IN PROGRESS'}
                 </div>

                 <div className="w-full flex justify-center">
                    {!isFinished ? (
                      <VaultButton
                       variant="primary"
                       className="py-10 px-20 text-2xl shadow-[0_0_60px_rgba(212,175,55,0.3)] group w-full max-w-md bg-vault-gold text-black hover:scale-105 transition-transform"
                       onClick={() => {
                         setIsFinished(true);
                         setShowCongratulationPopup(true);
                       }}
                       disabled={!finalResult}
                      >
                        <CheckCircle2 className="mr-4 group-hover:scale-110 transition-transform w-8 h-8 text-black" />
                        CRACK CODE
                      </VaultButton>
                    ) : (
                      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                         <div className="bg-vault-gold text-black px-12 py-5 rounded-2xl font-display font-black text-2xl uppercase tracking-widest flex items-center gap-3 shadow-[0_0_50px_rgba(212,175,55,0.6)]">
                           Intelligence Cracked
                         </div>
                         <button
                            onClick={() => onPostResults({
                              gameCode: finalResult,
                              time: formatTimeFull(elapsedMs),
                              sponsorKey: `${gridPart}|${transPart}`
                            })}
                            className="mt-4 bg-vault-gold text-black px-12 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-white hover:text-black transition-all"
                          >
                            Post Intelligence Results
                          </button>
                         <VaultButton onClick={onReturnToEncoder} variant="secondary" className="mt-6">DISMISS DEBRIEF</VaultButton>
                      </div>
                    )}
                 </div>
             </div>
          </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-6 text-center border-t border-white/10 bg-black/95 backdrop-blur-xl z-50">
       <p className="font-display text-[9px] text-white uppercase tracking-[0.5em] opacity-40">
          &copy; 2026 CODE KRACKER XR | ADFGVX Dual-Stage Protocol v1.0
       </p>
     </div>
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
              className="bg-vault-panel border-4 border-vault-gold p-12 rounded-[40px] max-w-2xl w-full text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-vault-gold animate-pulse" />
              <CheckCircle2 className="w-20 h-20 text-[#22c55e] mx-auto mb-6" />
              <h2 className="text-white text-5xl font-black uppercase italic tracking-tighter mb-4">Congratulations!</h2>
              <p className="text-[#D4AF37] text-2xl font-bold uppercase tracking-widest mb-4 italic">You Crack the Code</p>
              
              <div className="flex flex-col gap-4 mb-8 bg-black/40 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center px-4">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Cracked Word:</span>
                  <span className="text-white font-display font-black text-2xl tracking-[0.2em]">{finalResult}</span>
                </div>
                <div className="flex justify-between items-center px-4">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Mission Time:</span>
                  <span className="text-vault-gold font-mono text-2xl font-black">{formatTimeFull(elapsedMs)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  onPostResults({
                    gameCode: finalResult,
                    time: formatTimeFull(elapsedMs),
                    sponsorKey: `${gridPart}|${transPart}`
                  });
                }}
                className="w-full bg-[#22c55e] text-white py-6 rounded-2xl text-2xl font-black uppercase tracking-widest hover:bg-[#16a34a] transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95"
              >
                Submit Time
              </button>
              
              <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

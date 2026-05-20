import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { LucideChevronLeft, LucideZap, LucideCheckCircle2 } from 'lucide-react';

interface TranspositionGamePageProps {
 onBack: () => void;
 initialCode: string;
 initialKey: string;
 targetText?: string;
 onPostResults?: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

export const TranspositionGamePage: React.FC<TranspositionGamePageProps> = ({ 
  onBack, 
  initialCode, 
  initialKey, 
  targetText,
  onPostResults,
  youtuber 
}) => {
 const [userKeyword, setUserKeyword] = useState('');
 const [isFinished, setIsFinished] = useState(false);
 const [elapsedMs, setElapsedMs] = useState(0);
 const [showCongratulationPopup, setShowCongratulationPopup] = useState(false);

 // Column ranking state (user types these in)
 const [userRankings, setUserRankings] = useState<Record<number, string>>({});

 // Grid content state (manual letter entry)
 const [gridData, setGridData] = useState<string[][]>([]);

 // Refs for auto-focus
 const rankingRefs = useRef<(HTMLInputElement | null)[]>([]);
 const gridRefs = useRef<(HTMLInputElement | null)[][]>([]);

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

 const cleanKey = useMemo(() => userKeyword.toUpperCase().replace(/[^A-Z]/g, ''), [userKeyword]);
 const numCols = cleanKey.length || 1;
 const numRows = Math.ceil(initialCode.length / numCols);

 const keyRanking = useMemo(() => {
   if (!cleanKey) return [];
   const sorted = cleanKey.split('').map((char, i) => ({ char, i }))
     .sort((a, b) => a.char.localeCompare(b.char) || a.i - b.i);
   const ranks = new Array(cleanKey.length);
   sorted.forEach((item, index) => {
     ranks[item.i] = index + 1;
   });
   return ranks;
 }, [cleanKey]);

 const fillOrder = useMemo(() => {
   if (!keyRanking.length) return [];
   const order = new Array(numCols);
   keyRanking.forEach((rank, idx) => {
     order[rank - 1] = idx;
   });
   return order;
 }, [keyRanking, numCols]);

 // Initialize/adjust grid when dimensions change
 useEffect(() => {
   setGridData(prev => {
     const newData = Array.from({ length: numRows }, (_, r) =>
       Array.from({ length: numCols }, (_, c) => prev[r]?.[c] || '')
     );
     return newData;
   });
 }, [numRows, numCols]);

 const isConfigComplete = useMemo(() => {
   return cleanKey.length > 0 &&
          Object.keys(userRankings).length === numCols &&
          Object.values(userRankings).every(v => v !== '');
 }, [cleanKey, userRankings, numCols]);

 const currentFillStep = useMemo(() => {
   if (!isConfigComplete) return -1;
   for (let i = 0; i < fillOrder.length; i++) {
       const cIdx = fillOrder[i];
       const isColumnFull = gridData.every(row => row[cIdx] !== '');
       if (!isColumnFull) return i;
   }
   return numCols - 1;
 }, [gridData, fillOrder, isConfigComplete, numCols]);

 const currentColumnIndex = useMemo(() => {
   if (currentFillStep === -1) return -1;
   return fillOrder[currentFillStep];
 }, [currentFillStep, fillOrder]);

 const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
   if (isFinished || !isConfigComplete) return;
   if (cIdx !== currentColumnIndex) return;
  
   const newData = [...gridData];
   newData[rIdx] = [...newData[rIdx]];
   newData[rIdx][cIdx] = val.toUpperCase().slice(0, 1);
   setGridData(newData);

   if (newData[rIdx][cIdx].length >= 1) {
     if (rIdx < numRows - 1) {
       gridRefs.current[rIdx + 1]?.[cIdx]?.focus();
     } else {
       const currentInOrder = fillOrder.indexOf(cIdx);
       if (currentInOrder < fillOrder.length - 1) {
         const nextC = fillOrder[currentInOrder + 1];
         gridRefs.current[0]?.[nextC]?.focus();
       }
     }
   }
 };

 const handleRankingChange = (idx: number, val: string) => {
   if (isFinished) return;
   const numeric = val.replace(/[^0-9]/g, '');
   setUserRankings(prev => ({ ...prev, [idx]: numeric }));

   if (numeric.length >= 1 && idx < numCols - 1) {
     rankingRefs.current[idx + 1]?.focus();
   }
 };

 const handleReset = () => {
   setGridData(Array.from({ length: numRows }, () => new Array(numCols).fill('')));
   setUserRankings({});
   setIsFinished(false);
 };

 const finalPlaintext = useMemo(() => {
   let res = '';
   for (let r = 0; r < numRows; r++) {
     for (let c = 0; c < numCols; c++) {
       res += gridData[r]?.[c] || '';
     }
   }
   return res;
 }, [gridData, numRows, numCols]);

 const handleCrackCode = () => {
   setIsFinished(true); // Stop timer
   setShowCongratulationPopup(true); // Show success popup
 };

 const panelHeaderStyle = "bg-black/60 text-white font-black text-[22px] lg:text-[30px] py-2 px-4 uppercase text-center tracking-widest border-b border-[#D4AF37]/10 italic";

 return (
   <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-20">
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
             Transposition Cipher Decoder
           </motion.h1>
           <p className="text-[#22c55e] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-12">
             Code cracking game
           </p>
         </div>
       </div>
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
         <div className="lg:col-span-12">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="font-black text-sm text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Mission Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <div>
                     <label className="block text-xs text-green-500 uppercase tracking-widest font-black mb-3 italic underline shadow-lg">Type in Key Word (Length = Cols)</label>
                     <input
                       type="text" 
                       value={userKeyword} 
                       onChange={(e) => !isFinished && setUserKeyword(e.target.value.toUpperCase())}
                       disabled={isFinished}
                       className="w-full bg-black/60 border border-green-500/30 rounded-lg p-5 font-black text-2xl text-green-500 focus:outline-none focus:border-green-500 tracking-[0.2em] font-mono shadow-2xl disabled:opacity-50"
                       placeholder="ENTER KEYWORD"
                     />
                   </div>
                 </div>

                 <div className="flex flex-col justify-center items-center bg-black/40 rounded-xl p-8 border border-white/5 overflow-x-auto">
                   <div className="min-w-max flex flex-col items-center">
                      <label className="block text-sm text-blue-500/60 uppercase tracking-widest font-black mb-4 self-center">Column Rankings</label>
                      <div className="flex justify-start gap-3 mb-6 border-b border-white/10 pb-6 w-full">
                        {cleanKey.split('').map((l, i) => {
                          const isActive = i === currentColumnIndex;
                          return (
                            <div key={i} className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isActive ? 'bg-green-500/10 ring-1 ring-green-500/30' : ''}`}>
                              <div className={`font-black text-4xl w-20 h-20 flex items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-green-500 text-black' : 'bg-blue-500/10 text-blue-500 underline'}`}>{l}</div>
                              <input
                                type="text"
                                ref={(el) => rankingRefs.current[i] = el}
                                value={userRankings[i] || ''}
                                onChange={(e) => handleRankingChange(i, e.target.value)}
                                className={`w-20 bg-black/60 border-2 text-[#D4AF37] font-black text-xl text-center py-2 rounded-lg focus:outline-none transition-colors ${isActive ? 'border-green-500' : 'border-[#D4AF37]/40 focus:border-[#D4AF37]'}`}
                                placeholder="#"
                              />
                            </div>
                          );
                        })}
                      </div>
                     
                      <label className="block text-sm font-black uppercase tracking-widest text-red-600/60 mt-4 italic">Grid Setup: {numRows} Rows x {numCols} Cols</label>
                   </div>
                 </div>
              </div>
           </div>
         </div>
       </div>

       {/* Grid Area */}
       <div className="w-full bg-zinc-900/90 backdrop-blur-2xl border border-[#D4AF37]/40 rounded-xl overflow-hidden shadow-2xl mb-10 relative">
         <div className="bg-blue-600 text-white font-black text-[24px] md:text-[28px] py-3 px-6 uppercase text-center tracking-[0.4em] flex items-center justify-center gap-4 italic shadow-2xl">
           Reassembly Grid
           <button onClick={handleReset} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <LucideZap className="w-5 h-5 rotate-180" />
           </button>
         </div>

         <div className="bg-black/60 border-b border-white/10 py-8 px-6 text-center">
            <div className="text-sm font-black text-[#D4AF37]/60 uppercase tracking-widest mb-3 text-center italic">Ciphered Intelligence (Reference)</div>
            <div className="text-4xl md:text-7xl font-black text-[#D4AF37] tracking-[0.2em] break-all leading-tight italic uppercase font-mono drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
               {initialCode || '---'}
            </div>
         </div>
        
         <div className="p-8 overflow-x-auto custom-vault-scrollbar">
            <div className="min-w-max">
               <div className="flex justify-center gap-2">
                  {Array.from({ length: numCols }).map((_, cIdx) => {
                     const isActiveColumn = cIdx === currentColumnIndex;
                     return (
                     <div key={cIdx} className="flex flex-col gap-1 items-center">
                        <div className="font-black text-[#3b82f6] text-2xl mb-1 italic">
                           {cleanKey[cIdx] || ''}
                        </div>
                        <div className={`w-12 md:w-16 h-8 bg-black/40 border border-white/10 rounded-t-lg font-black text-[8px] flex items-center justify-center transition-colors ${isActiveColumn ? 'bg-green-600/20 border-green-500/50 text-green-500' : 'text-white/40'}`}>
                          COL {cIdx + 1}
                        </div>
                       
                        <div className="flex flex-col gap-1">
                           {Array.from({ length: numRows }).map((_, rIdx) => (
                              <input
                                key={rIdx}
                                type="text"
                                ref={(el) => {
                                  if (!gridRefs.current[rIdx]) gridRefs.current[rIdx] = [];
                                  gridRefs.current[rIdx][cIdx] = el;
                                }}
                                value={gridData[rIdx]?.[cIdx] || ''}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                disabled={!isConfigComplete || isFinished}
                                className={`w-12 h-12 md:w-16 md:h-16 bg-black/60 border rounded-lg flex items-center justify-center text-center font-black text-xl md:text-3xl focus:outline-none transition-all ${!isConfigComplete ? 'opacity-30 border-white/5 cursor-not-allowed' : isActiveColumn ? 'border-green-500 bg-green-500/5 text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-white/10 text-white focus:border-[#D4AF37]'}`}
                                maxLength={1}
                              />
                           ))}
                        </div>
                     </div>
                     );
                  })}
               </div>
            </div>
         </div>
       </div>

       {/* Output */}
       <div className="w-full bg-zinc-900/90 border border-[#D4AF37]/20 rounded-lg overflow-hidden shadow-lg mb-10">
         <div className={panelHeaderStyle}>Decrypted Tactical Output</div>
         <div className="p-6 md:p-10 flex flex-col items-center justify-center gap-6">
           <div className="relative w-full">
             <div className="w-full bg-black/80 border-2 border-[#D4AF37] rounded-2xl p-8 font-black text-2xl md:text-5xl text-[#D4AF37] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] tracking-[0.1em] break-all uppercase min-h-[140px] flex items-center justify-center text-center leading-relaxed font-mono italic">
               {finalPlaintext || '---'}
             </div>
           </div>

           <div className="flex justify-center mt-4">
             {!isFinished ? (
               <VaultButton
                 variant="primary"
                 className="py-6 px-12 text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                 onClick={handleCrackCode}
               >
                 <LucideCheckCircle2 className="w-6 h-6 mr-3" />
                 CRACK CODE
               </VaultButton>
             ) : (
               <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center gap-3"
               >
                 <div className="bg-[#D4AF37] text-black px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.5)] border-2 border-white/20">
                   <LucideCheckCircle2 className="w-6 h-6" />
                   Mission Complete
                 </div>
                 <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em] bg-black/40 px-4 py-1 rounded-lg border border-[#D4AF37]/20">Time: {formatTimeFull(elapsedMs)}</p>
               </motion.div>
             )}
           </div>
         </div>
       </div>
     </div>

     {/* Success Popup */}
     <AnimatePresence>
       {showCongratulationPopup && (
         <div className="fixed inset-0 z-[500] flex items-center justify-center px-6 bg-black/95 backdrop-blur-xl">
           <motion.div
             initial={{ scale: 0.9, y: 20, opacity: 0 }}
             animate={{ scale: 1, y: 0, opacity: 1 }}
             exit={{ scale: 0.9, y: 20, opacity: 0 }}
             className="bg-zinc-900/90 border-4 border-[#D4AF37] p-12 rounded-[40px] max-w-2xl w-full text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] relative overflow-hidden backdrop-blur-2xl"
           >
             <div className="mb-8 flex justify-center">
               <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                 <LucideCheckCircle2 className="w-12 h-12 text-[#22c55e]" />
               </div>
             </div>
             <h2 className="text-white text-5xl font-black uppercase italic tracking-tighter mb-4">Congratulations!</h2>
             <p className="text-[#D4AF37] text-2xl font-bold uppercase tracking-widest mb-4 italic font-bold">You Cracked the Code</p>
             
             <div className="flex flex-col gap-4 mb-8 bg-black/40 p-6 rounded-2xl border border-white/10">
               <div className="flex justify-between items-center px-4">
                 <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Cracked Word:</span>
                 <span className="text-white font-black text-2xl tracking-[0.2em] font-mono uppercase">{finalPlaintext}</span>
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
                     gameCode: finalPlaintext,
                     time: formatTimeFull(elapsedMs),
                     sponsorKey: userKeyword || initialKey || "NONE"
                   });
                 }
               }}
               className="w-full bg-[#22c55e] text-white py-6 rounded-2xl text-2xl font-black uppercase tracking-widest hover:bg-[#16a34a] transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95"
             >
               Submit Time
             </button>
           </motion.div>
         </div>
       )}
     </AnimatePresence>

     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

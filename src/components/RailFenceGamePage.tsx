import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ChevronLeft, Info, Zap, Grid3X3, CheckCircle2, RotateCcw } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface RailFenceGamePageProps {
 onBack: () => void;
 onPostResults?: (data: { sponsorKey: string; gameCode: string; time: string }) => void;
 youtuber?: {
   name: string;
   avatar: string;
 };
 initialCode: string;
 targetRails: number;
 targetCols: number;
 creatorDocId: string;
}

export const RailFenceGamePage: React.FC<RailFenceGamePageProps> = ({ 
  onBack, 
  youtuber, 
  initialCode, 
  targetRails, 
  targetCols,
  onPostResults,
  creatorDocId
}) => {
 const [numRails, setNumRails] = useState(1);
 const [numCols, setNumCols] = useState(1);
 const [userGrid, setUserGrid] = useState<string[][]>([]);
 const [isFinished, setIsFinished] = useState(false);
 const [elapsedMs, setElapsedMs] = useState(0);
 const [isTimerRunning, setIsTimerRunning] = useState(true);
 const [isVerifying, setIsVerifying] = useState(false);
 const [showSuccessModal, setShowSuccessModal] = useState(false);
 const [successData, setSuccessData] = useState<{ word: string; time: string } | null>(null);
 const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

 // Refs for auto-focus
 const gridRefs = useRef<(HTMLInputElement | null)[][]>([]);

 // Timer and Clock
 useEffect(() => {
  let interval: NodeJS.Timeout;
  if (isTimerRunning) {
    interval = setInterval(() => {
      setElapsedMs(prev => prev + 10);
    }, 10);
  }
  return () => clearInterval(interval);
}, [isTimerRunning]);

 useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

 const formatTimeFull = (ms: number) => {
   const totalSeconds = Math.floor(ms / 1000);
   const m = Math.floor(totalSeconds / 60);
   const s = totalSeconds % 60;
   const c = Math.floor((ms % 1000) / 10);
   
   // Cap at 59:59:99 (MM:SS:CC)
   if (m >= 60) return "59:59:99";
   
   return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
 };

 // Initialize/Update grid when rails or cols change
 useEffect(() => {
   if (numRails > 0 && numCols > 0) {
     setUserGrid(Array.from({ length: numRails }, () => new Array(numCols).fill('')));
   } else {
     setUserGrid([]);
   }
 }, [numRails, numCols]);

 const handleCellChange = (r: number, c: number, val: string) => {
   if (isFinished) return;
   const newGrid = [...userGrid];
   newGrid[r] = [...newGrid[r]];
   newGrid[r][c] = val.toUpperCase().substring(0, 1);
   setUserGrid(newGrid);

   if (newGrid[r][c].length >= 1) {
     // Row-major search for next onPath cell
     let foundCurrent = false;
     for (let currR = 0; currR < numRails; currR++) {
       for (let currC = 0; currC < numCols; currC++) {
          let railForCol = 0;
          if (numRails > 1) {
            const period = 2 * (numRails - 1);
            const pos = currC % period;
            railForCol = pos < numRails ? pos : period - pos;
          }
         
          if (railForCol === currR) {
             if (foundCurrent) {
               gridRefs.current[currR]?.[currC]?.focus();
               return;
             }
             if (currR === r && currC === c) {
               foundCurrent = true;
             }
          }
       }
     }
   }
 };

 const crackedResult = useMemo(() => {
   let result = '';
   if (!userGrid || userGrid.length === 0) return '';
   if (numRails <= 1) return userGrid[0]?.join('') || '';

   let rail = 0;
   let direction = 1;
   for (let i = 0; i < numCols; i++) {
       if (userGrid[rail] && userGrid[rail][i] !== undefined) {
           result += userGrid[rail][i] || '?';
       }
       if (numRails > 1) {
         rail += direction;
         if (rail === numRails - 1 || rail === 0) direction *= -1;
       }
   }
   return result;
 }, [userGrid, numRails, numCols]);

  const handleCrackCode = async () => {
    if (isVerifying || isFinished) return;
    setIsVerifying(true);
    try {
      const docRef = doc(db, "creators", creatorDocId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("CREATOR_DATA_MISSING");

      const data = snap.data();
      const correctWord = (data?.TheHunt?.CityName || "").toUpperCase().replace(/[^A-Z]/g, "");

      if (crackedResult === correctWord && correctWord !== "" && numRails === targetRails && numCols === targetCols) {
        setIsTimerRunning(false);
        const finalTime = formatTimeFull(elapsedMs);
        setIsFinished(true);
        setSuccessData({ word: correctWord, time: finalTime });
        setShowSuccessModal(true);

        const targetUid = auth.currentUser?.uid || "51H7yItLU9WMMiXl10xE";
        const submissionId = `${targetUid}_${creatorDocId}`;

        await setDoc(
          doc(db, "Submissions", submissionId),
          {
            userId: targetUid,
            creatorId: creatorDocId,
            type: "RailFence",
            result: crackedResult,
            timeElapsed: elapsedMs,
            rails: numRails,
            cols: numCols,
            submittedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        alert("Verification failed. Check your coordinates and grid configuration.");
      }
    } catch (err: any) {
      alert("Cipher verification link unstable. Ensure signal integrity.");
    } finally {
      setIsVerifying(false);
    }
  };

 const teamName = (youtuber as any)?.teamName || (youtuber?.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`);

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
     <div className="fixed inset-0 z-0 bg-mesh opacity-10 pointer-events-none" />

     {/* Mission Timer - Flush Right */}
     <div className="fixed top-24 right-8 z-[100] flex flex-col items-end space-y-2 pointer-events-none">
        <div className="bg-zinc-900/40 border-2 border-[#D4AF37]/40 backdrop-blur-xl px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center min-w-[120px]">
            <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Mission Time</div>
            <div className="font-mono text-xl md:text-2xl font-black text-white tabular-nums">{formatTimeFull(elapsedMs)}</div>
        </div>
     </div>

     {/* Header */}
     <div className="relative z-[70] w-full flex flex-col items-center pt-24 px-8">
        <div className="w-full max-w-7xl relative flex flex-col items-center">
            {/* Return to Encoder - Level with Title */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 group hover:text-[#D4AF37] transition-all bg-black/60 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-[#D4AF37]" />
                    <span className="font-black uppercase tracking-widest text-[10px] text-white">Return to Encoder</span>
                </button>
            </div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-black text-4xl md:text-7xl text-[#D4AF37] uppercase tracking-[-0.02em] md:tracking-[-0.05em] mb-2 italic drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              Rail Fence Cipher Decoder
            </motion.h1>
            
            <p className="text-[#22c55e] text-sm md:text-base font-black uppercase tracking-[0.4em] mb-12">
              {isFinished ? "CONGRATULATIONS! CODE CRACKED" : "Now map the cipher into the grid"}
            </p>
            
            {/* Mobile Return Button */}
            <div className="md:hidden mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 group hover:text-[#D4AF37] transition-all bg-black/60 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md"
                >
                    <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-black uppercase tracking-widest text-[9px] text-white">Return to Encoder</span>
                </button>
            </div>
        </div>
     </div>

     <AnimatePresence>
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
                                You cracked the code <span className="text-[#22c55e] italic">"{successData.word}"</span>
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
                                            sponsorKey: `${targetRails}-${targetCols}`,
                                            gameCode: successData.word,
                                            time: successData.time
                                        });
                                    }
                                }}
                                className="w-full h-24 bg-[#008044] hover:bg-[#006435] text-white text-3xl font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(0,128,68,0.4)] transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Post Results
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
     </AnimatePresence>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl flex-1">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         <div className="lg:col-span-3 space-y-6">
            <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
              <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                <Zap className="w-4 h-4 text-[#D4AF37]" />
                Grid Config
              </h3>
             
                <div className="space-y-10">
                  <div>
                     <label className="block text-[14px] uppercase tracking-widest text-[#D4AF37] font-black mb-3 flex justify-between items-baseline">
                       <span>Number of Rails</span>
                       <span className="text-4xl text-[#22c55e] tabular-nums drop-shadow-[0_0_10px_rgba(34,197,94,0.3)] italic">{numRails}</span>
                     </label>
                     <input
                       type="range" min="1" max="6"
                       value={numRails}
                       onChange={(e) => setNumRails(Math.max(1, parseInt(e.target.value)))}
                       disabled={isFinished}
                       className="w-full accent-white h-2 bg-black/40 rounded-lg appearance-none cursor-pointer"
                     />
                  </div>
                  <div>
                     <label className="block text-[14px] uppercase tracking-widest text-[#D4AF37] font-black mb-3 flex justify-between items-baseline">
                       <span>Total Columns</span>
                       <span className="text-4xl text-[#22c55e] tabular-nums drop-shadow-[0_0_10px_rgba(34,197,94,0.3)] italic">{numCols}</span>
                     </label>
                     <input
                       type="range" min="1" max="30"
                       value={numCols}
                       onChange={(e) => setNumCols(Math.max(1, parseInt(e.target.value)))}
                       disabled={isFinished}
                       className="w-full accent-white h-2 bg-black/40 rounded-lg appearance-none cursor-pointer"
                     />
                  </div>
               
                <VaultButton
                 variant="secondary"
                 className="w-full py-3 text-xs border uppercase font-black"
                 disabled={isFinished}
                 onClick={() => setUserGrid(Array.from({ length: numRails }, () => new Array(numCols).fill('')))}
                >
                  <RotateCcw className="w-3 h-3 mr-2 text-[#D4AF37]" />
                  Reset Grid
                </VaultButton>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 p-5 rounded-2xl">
               <h4 className="font-black text-[10px] text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2 italic">
                 <Info className="w-3 h-3" />
                 Tactical Intel
               </h4>
               <p className="text-[10px] text-white/60 leading-relaxed font-bold uppercase">
                 Map the cipher letters into the zig-zag pattern. The bottom display will reveal the hidden message.
               </p>
            </div>
         </div>

         <div className="lg:col-span-9 space-y-8">
           <div className="flex justify-center mb-6">
              <span className="text-[#D4AF37] text-3xl md:text-5xl font-black font-mono tracking-[0.15em] md:tracking-[0.25em] uppercase italic drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                {initialCode}
              </span>
           </div>

           <div className="bg-zinc-900/90 border border-[#D4AF37]/30 rounded-3xl shadow-2xl backdrop-blur-xl p-6 md:p-10 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-black text-sm text-white uppercase tracking-widest flex items-center gap-2 italic">
                   <Grid3X3 className="w-5 h-5 text-[#D4AF37]" />
                   Decryption Workbench
                 </h3>
                 <div className="flex gap-2">
                   <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
                   <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse delay-100" />
                 </div>
              </div>

              <div className="overflow-x-auto pb-6 scrollbar-hide">
                 <div className="inline-block min-w-full">
                    <div className="grid gap-3" style={{ gridTemplateRows: `repeat(${numRails}, minmax(48px, 1fr))` }}>
                       {userGrid.map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-3">
                             {row.map((char, cIdx) => {
                                let onPath = false;
                                let currRail = 0;
                                let dir = 1;
                                for(let i=0; i <= cIdx; i++) {
                                   if (i === cIdx && currRail === rIdx) onPath = true;
                                   if (numRails > 1) {
                                       currRail += dir;
                                       if (currRail === numRails - 1 || currRail === 0) dir *= -1;
                                   }
                                }

                                return (
                                   <div key={`${rIdx}-${cIdx}`} className="relative group">
                                      <input
                                         type="text"
                                         ref={(el) => {
                                           if (!gridRefs.current[rIdx]) gridRefs.current[rIdx] = [];
                                           gridRefs.current[rIdx][cIdx] = el;
                                         }}
                                         value={char}
                                         onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                          disabled={!onPath || isFinished}
                                         className={`w-12 h-12 md:w-14 md:h-14 bg-black/60 border-2 rounded-xl text-center font-black text-xl md:text-2xl focus:outline-none transition-all duration-300
                                           ${onPath ? 'border-[#D4AF37]/60 text-[#D4AF37] focus:border-[#D4AF37] focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-white/5 text-transparent opacity-10 cursor-not-allowed pointer-events-none'}`}
                                         maxLength={1}
                                      />
                                   </div>
                                );
                             })}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-4 text-center">Deciphered Sequence</label>
                 <div className="bg-black/90 border-2 border-[#D4AF37] rounded-2xl p-4 md:p-6 font-black text-center text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden min-h-[140px] flex items-center justify-center">
                   <span
                     className="uppercase transition-all duration-300 break-all md:px-4 italic font-mono"
                     style={{
                       fontSize: crackedResult.length > 30 ? '1.2rem' : crackedResult.length > 20 ? '1.8rem' : crackedResult.length > 12 ? '2.5rem' : '4rem',
                       lineHeight: '1.2',
                       letterSpacing: crackedResult.length > 20 ? '0.1em' : '0.2em'
                     }}
                   >
                     {crackedResult || 'SYSTEM READY'}
                   </span>
                 </div>
                
                 <div className="mt-8 flex justify-center">
                   {!isFinished ? (
                     <VaultButton
                       variant="primary"
                       className="py-6 px-12 text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] bg-white text-black font-black uppercase italic"
                       onClick={() => handleCrackCode()}
                       disabled={isVerifying}
                     >
                       {isVerifying ? "Verifying..." : "Crack Code"}
                     </VaultButton>
                   ) : (
                     <motion.div
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="flex flex-col items-center gap-3"
                     >
                       <div className="bg-[#22c55e] text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.5)] border-2 border-white/20 italic">
                         <CheckCircle2 className="w-6 h-6 shadow-sm" />
                         Cipher Cracked
                       </div>
                     </motion.div>
                   )}
                 </div>
              </div>
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Tactical Cracking Interface v1.0
       </p>
     </div>
     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

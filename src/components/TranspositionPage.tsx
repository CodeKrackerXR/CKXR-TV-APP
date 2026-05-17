import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3, LucideHash } from 'lucide-react';

interface TranspositionPageProps {
 onBack: () => void;
 onPlay?: (data: { code: string; key: string }) => void;
 onNavigateToGame?: () => void;
 inputText: string;
 setInputText: (val: string) => void;
 keyword: string;
 setKeyword: (val: string) => void;
 youtuber?: {
   name: string;
   avatar: string;
 };
}

export const TranspositionPage: React.FC<TranspositionPageProps> = ({ 
  onBack, 
  onPlay, 
  onNavigateToGame,
  inputText,
  setInputText,
  keyword,
  setKeyword,
  youtuber 
}) => {
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const getTranspositionData = (text: string, key: string, isEncode: boolean) => {
   if (!key) return { result: text, grid: [] as string[][], keyOrder: [] as number[], cleanKey: '' };
  
   const cleanText = text.toUpperCase().replace(/\s/g, '');
   const cleanKey = key.toUpperCase().replace(/\s/g, '');
   const numCols = cleanKey.length;
  
   // Determine key order (alphabetical rank)
   const sortedKey = cleanKey.split('').map((char, originalIndex) => ({ char, originalIndex }))
     .sort((a, b) => a.char.localeCompare(b.char));
  
   const keyOrder = new Array(numCols);
   sortedKey.forEach((item, index) => {
     keyOrder[item.originalIndex] = index;
   });

   if (isEncode) {
     const numRows = Math.ceil(cleanText.length / numCols);
     const grid: string[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(''));
    
     for (let i = 0; i < cleanText.length; i++) {
       const r = Math.floor(i / numCols);
       const c = i % numCols;
       grid[r][c] = cleanText[i];
     }

     for (let r = 0; r < numRows; r++) {
         for (let c = 0; c < numCols; c++) {
             if (grid[r][c] === '') grid[r][c] = 'X';
         }
     }

     let result = '';
     const readingOrder = sortedKey.map(item => item.originalIndex);
    
     readingOrder.forEach(colIdx => {
       for (let r = 0; r < numRows; r++) {
         result += grid[r][colIdx];
       }
     });

     return { result, grid, keyOrder, cleanKey };
   } else {
     const numRows = Math.ceil(cleanText.length / numCols);
     const grid: string[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(''));
    
     let charIdx = 0;
     const fillingOrder = sortedKey.map(item => item.originalIndex);
    
     fillingOrder.forEach(colIdx => {
       for (let r = 0; r < numRows; r++) {
         if (charIdx < cleanText.length) {
           grid[r][colIdx] = cleanText[charIdx++];
         }
       }
     });

     let result = '';
     for (let r = 0; r < numRows; r++) {
       for (let c = 0; c < numCols; c++) {
         result += grid[r][c];
       }
     }

     return { result, grid, keyOrder, cleanKey };
   }
 };

 const { result, grid, keyOrder, cleanKey } = useMemo(() => {
   return getTranspositionData(inputText, keyword, mode === 'ENCODE');
 }, [inputText, keyword, mode]);

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

     {/* Header */}
     <div className="relative z-50 w-full flex justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm h-20 md:h-24 items-center px-4 md:px-8">
       <button
         onClick={onBack}
         className="flex items-center gap-2 group hover:text-[#D4AF37] transition-colors"
       >
         <LucideChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
         <span className="font-black uppercase tracking-widest text-sm">Return to Hub</span>
       </button>
      
       <div className="w-24 hidden md:block" />
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl flex-1">
       <div className="text-center mb-12">
         <motion.h1
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="font-black text-4xl md:text-6xl text-[#D4AF37] uppercase tracking-tighter mb-2 italic"
         >
           Transposition Cipher
         </motion.h1>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         {/* Controls */}
         <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <h2 className="font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2 italic">
               <LucideZap className="w-5 h-5 text-[#D4AF37]" />
               Cipher Config
             </h2>

             <div className="space-y-6">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Operation Mode</label>
                 <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                   <button
                     onClick={() => setMode('ENCODE')}
                     className={`flex-1 py-1 font-black text-xs uppercase transition-all rounded-md ${mode === 'ENCODE' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                   >
                     Encode
                   </button>
                   <button
                     onClick={() => setMode('DECODE')}
                     className={`flex-1 py-1 font-black text-xs uppercase transition-all rounded-md ${mode === 'DECODE' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                   >
                     Decode
                   </button>
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Secret Keyword</label>
                 <input
                   type="text"
                   value={keyword}
                   onChange={(e) => setKeyword(e.target.value.substring(0, 8).toUpperCase().replace(/[^A-Z]/g, ''))}
                   className={`w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-black text-2xl focus:outline-none focus:border-[#D4AF37] transition-colors tracking-[0.2em] font-mono ${keyword === 'CODE' ? 'text-white' : 'text-[#22c55e]'}`}
                   placeholder="KEYWORD..."
                 />
                 <p className="text-right text-[10px] text-white/30 uppercase mt-1">Dictates Column Order (Max 8)</p>
               </div>

               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Input Message</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.substring(0, 40).toUpperCase())}
                   className={`w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg focus:outline-none focus:border-[#D4AF37] transition-colors resize-none uppercase ${inputText === 'MISSIONCONTROL' ? 'text-white' : 'text-[#22c55e]'}`}
                   rows={2}
                   placeholder="Enter message..."
                 />
                 <p className="text-right text-[10px] text-white/30 uppercase mt-1">Max 40 Characters</p>
               </div>
             </div>
           </div>

           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
             <h3 className="flex items-center gap-2 font-black uppercase text-xs text-blue-400 mb-3 tracking-widest">
               <LucideInfo className="w-4 h-4" />
               The Mechanism
             </h3>
             <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase">
               The message is written in a grid, width determined by the keyword. The columns are then reordered according to the alphabetical rank of the keyword's letters and read vertically.
             </p>
           </div>
         </div>

         {/* Visualization */}
         <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden min-h-[450px] flex flex-col">
             <div className="bg-black/60 px-6 py-4 border-b border-white/10 flex justify-between items-center">
               <h2 className="font-black text-xl text-white uppercase tracking-widest flex items-center gap-2 italic">
                 <LucideGrid3X3 className="w-5 h-5 text-[#D4AF37]" />
                 Tactical Grid Analysis
               </h2>
               <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,1)]" />
               </div>
             </div>

             <div className="flex-1 p-6 overflow-x-auto custom-vault-scrollbar">
               <div className="inline-block min-w-full">
                 <div className="flex flex-col gap-4">
                   <div className="flex gap-2 mb-2">
                     {cleanKey.split('').map((char, i) => (
                       <div key={`head-${i}`} className="flex flex-col gap-1 w-12 md:w-16">
                         <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-t-lg h-12 flex items-center justify-center font-black text-xl text-[#D4AF37]">
                           {char}
                         </div>
                         <div className="bg-[#D4AF37] text-black rounded-b-lg h-6 flex items-center justify-center font-black text-[10px]">
                           RANK {keyOrder[i] + 1}
                         </div>
                       </div>
                     ))}
                   </div>

                   <div className="flex flex-col gap-2">
                     {grid.map((row, rIdx) => (
                       <div key={`row-${rIdx}`} className="flex gap-2">
                         {row.map((char, cIdx) => (
                           <motion.div
                             key={`cell-${rIdx}-${cIdx}`}
                             initial={{ opacity: 0, y: 5 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: (rIdx * cleanKey.length + cIdx) * 0.015 }}
                             className={`w-12 md:w-16 h-12 md:h-16 flex items-center justify-center rounded-lg font-black text-lg md:text-xl border transition-all duration-300
                               ${char !== '' ? 'bg-white/5 border-white/20 text-white shadow-lg' : 'bg-black/20 border-white/5 text-white/10'}`}
                           >
                             {char || '-'}
                           </motion.div>
                         ))}
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>

             <div className="bg-black/40 p-6 border-t border-white/10">
               <div className="flex flex-col md:flex-row items-center gap-6">
                 <div className="flex-1 w-full order-2 md:order-1 text-center">
                   <div className="flex justify-between items-end mb-2">
                     <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black italic">Resultant Jumble Output</label>
                   </div>
                   <div className="bg-black/80 border-2 border-[#D4AF37] rounded-xl p-4 font-black text-2xl md:text-4xl text-[#D4AF37] shadow-[inset_0_2px_15px_rgba(0,0,0,0.9)] tracking-[0.1em] break-all min-h-[4rem] flex items-center justify-center uppercase font-mono italic">
                     {result || '---'}
                   </div>
                 </div>
                
                 <div className="w-full md:w-auto order-1 md:order-2 flex flex-col gap-3">
                   {onNavigateToGame && (
                    <button
                      className="w-full md:w-auto h-20 px-10 bg-green-600 text-white hover:bg-green-500 font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                      onClick={onNavigateToGame}
                    >
                      Play
                    </button>
                    )}
                 </div>
               </div>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <LucideHash className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-[10px] text-white/40 font-black uppercase">Grid Logic</div>
                  <div className="text-xs font-bold text-white/80">Reading Order: Alpha-Sequence</div>
                </div>
             </div>
             <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <LucideGrid3X3 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-[10px] text-white/40 font-black uppercase">Padding Type</div>
                  <div className="text-xs font-bold text-white/80">'X' Padding Applied</div>
                </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Transposition Logic Module V1.2
       </p>
     </div>
    
     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

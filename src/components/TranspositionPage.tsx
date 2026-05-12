import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3, LucideHash } from 'lucide-react';

interface TranspositionPageProps {
 onBack: () => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

export const TranspositionPage: React.FC<TranspositionPageProps> = ({ onBack, youtuber }) => {
 const [inputText, setInputText] = useState('MISSIONCONTROL');
 const [keyword, setKeyword] = useState('CODE');
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const getTranspositionData = (text: string, key: string, isEncode: boolean) => {
   if (!key) return { result: text, grid: [], keyOrder: [], cleanKey: '' };
  
   const cleanText = text.toUpperCase().replace(/\s/g, '');
   const cleanKey = key.toUpperCase().replace(/\s/g, '');
   const numCols = cleanKey.length;
  
   const sortedKey = cleanKey.split('').map((char, originalIndex) => ({ char, originalIndex }))
     .sort((a, b) => a.char.localeCompare(b.char) || a.originalIndex - b.originalIndex);
  
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

 const teamName = youtuber?.teamName || (youtuber?.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`);

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

     {/* Header */}
     <div className="relative z-50 w-full flex justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm h-20 md:h-24 items-center px-4 md:px-8">
       <button
         onClick={onBack}
         className="flex items-center gap-2 group hover:text-[#D4AF37] transition-colors"
       >
         <LucideChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
         <span className="font-bold uppercase tracking-widest text-sm">Return to Hub</span>
       </button>
      
       <div className="text-white flex items-center gap-1">
         <span className="text-xl font-black uppercase tracking-tighter">The Code</span>
         <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] flex items-center justify-center p-1 overflow-hidden">
           <img src="https://i.ibb.co/67vY2yYj/Gold-X-Green-R.png" alt="XR Logo" className="w-full h-full object-contain" />
         </div>
         <span className="text-xl font-black uppercase tracking-tighter">Challenge</span>
       </div>
      
       <div className="w-24 hidden md:block" />
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl flex-1">
       <div className="text-center mb-12">
         <motion.h1
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="font-black text-4xl md:text-6xl text-[#D4AF37] uppercase tracking-tighter mb-2 italic"
         >
           Columnar Transposition
         </motion.h1>
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs md:text-sm"
         >
           Grid-Based Permutation Encryption
         </motion.p>
       </div>

       {youtuber && (
         <div className="flex items-center justify-center gap-4 mb-12 bg-zinc-900/40 border border-[#D4AF37]/20 p-4 rounded-2xl backdrop-blur-md max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] overflow-hidden">
              <img src={youtuber.avatar} alt={youtuber.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-black text-xl text-[#D4AF37] uppercase tracking-wider italic">{youtuber.name}</h3>
              <p className="font-bold text-xs text-red-600 uppercase tracking-widest">{teamName}</p>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         {/* Controls - Left Side */}
         <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <h2 className="font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2 italic">
               <LucideZap className="w-5 h-5 text-[#D4AF37]" />
               Cipher Config
             </h2>

             <div className="space-y-6">
               {/* Mode Toggle */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Operation Mode</label>
                 <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                   <button
                     onClick={() => setMode('ENCODE')}
                     className={`flex-1 py-2 font-black text-sm uppercase transition-all rounded-md ${mode === 'ENCODE' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                   >
                     Encode
                   </button>
                   <button
                     onClick={() => setMode('DECODE')}
                     className={`flex-1 py-2 font-black text-sm uppercase transition-all rounded-md ${mode === 'DECODE' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                   >
                     Decode
                   </button>
                 </div>
               </div>

               {/* Keyword Input */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Secret Keyword</label>
                 <input
                   type="text"
                   value={keyword}
                   onChange={(e) => setKeyword(e.target.value.substring(0, 8).toUpperCase().replace(/[^A-Z]/g, ''))}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-black text-2xl text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors tracking-[0.2em] font-mono"
                   placeholder="KEYWORD..."
                 />
                 <p className="text-right text-[10px] text-white/30 uppercase mt-1">Dictates Column Order (Max 8)</p>
               </div>

               {/* Input Text */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Input Message</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.substring(0, 40))}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors resize-none uppercase"
                   rows={2}
                   placeholder="Enter message..."
                 />
                 <p className="text-right text-[10px] text-white/30 uppercase mt-1">Max 40 Characters</p>
               </div>
             </div>
           </div>

           {/* Info Box */}
           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
             <h3 className="flex items-center gap-2 font-black uppercase text-sm text-blue-400 mb-3">
               <LucideInfo className="w-4 h-4" />
               The Mechanism
             </h3>
             <p className="text-xs text-white/70 leading-relaxed font-medium">
               The message is written in a grid, width determined by the keyword. The columns are then reordered according to the alphabetical rank of the keyword's letters and read vertically.
             </p>
           </div>
         </div>

         {/* Visualization - Right Side */}
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

             <div className="flex-1 p-6 overflow-x-auto">
               <div className="inline-block min-w-full">
                 <div className="flex flex-col gap-4 font-mono">
                   {/* Header Row (Keyword + Rank) */}
                   <div className="flex gap-2 mb-2">
                     {cleanKey.split('').map((char, i) => (
                       <div key={`head-${i}`} className="flex flex-col gap-1 w-12 md:w-16">
                         <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-t-lg h-12 flex items-center justify-center font-black text-xl text-[#D4AF37]">
                           {char}
                         </div>
                         <div className="bg-[#D4AF37] text-black rounded-b-lg h-6 flex items-center justify-center font-black text-[10px]">
                           RK {keyOrder[i] + 1}
                         </div>
                       </div>
                     ))}
                   </div>

                   {/* Grid Body */}
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
                 <div className="flex-1 w-full">
                   <div className="flex justify-between items-end mb-2 text-zinc-500">
                     <label className="text-[10px] uppercase tracking-widest font-black italic">Resultant Jumble</label>
                     <div className="text-[10px] font-bold uppercase">Cols: {cleanKey.length}</div>
                   </div>
                   <div className="bg-black border-2 border-[#D4AF37] rounded-xl p-4 font-black text-2xl text-center text-[#D4AF37] shadow-[inset_0_2px_15px_rgba(0,0,0,0.9)] tracking-[0.1em] break-all min-h-[4rem] flex items-center justify-center font-mono">
                     {result || '---'}
                   </div>
                 </div>
                
                 <button
                   className="w-full md:w-auto h-14 px-8 bg-[#008044] text-white hover:bg-[#006435] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                   onClick={() => {
                      navigator.clipboard.writeText(result);
                   }}
                 >
                   Copy To Vault
                 </button>
               </div>
             </div>
           </div>

           {/* Tactical Legend */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <LucideHash className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-[10px] text-white/40 font-black uppercase italic">Grid Logic</div>
                  <div className="text-xs font-bold text-white/80">Reading Order: Alpha-Sequence</div>
                </div>
             </div>
             <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <LucideGrid3X3 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-[10px] text-white/40 font-black uppercase italic">Padding Type</div>
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
   </div>
 );
};

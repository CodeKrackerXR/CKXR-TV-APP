import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ChevronLeft, Info, Zap, Grid3X3, ArrowRightLeft, Table } from 'lucide-react';
import { generatePolybiusSquare, adfgvxEncode, ADFGVX_LABELS } from '../lib/adfgvxUtils';

interface ADFGVXPageProps {
 onBack: () => void;
 onPlay?: (data: { code: string; key: string }) => void;
 youtuber?: {
   name: string;
   avatar: string;
 };
}

export const ADFGVXPage: React.FC<ADFGVXPageProps> = ({ onBack, onPlay }) => {
 const [inputText, setInputText] = useState('AGENT007');
 const [gridKey, setGridKey] = useState('CIPHER');
 const [transKey, setTransKey] = useState('CODE');
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const square = useMemo(() => generatePolybiusSquare(gridKey), [gridKey]);

 const hasDuplicateTransKey = useMemo(() => {
   const chars = transKey.toUpperCase().replace(/[^A-Z]/g, '').split('');
   return new Set(chars).size !== chars.length;
 }, [transKey]);

 const { ciphertext, intermediate, grid, ranks, stage1Steps } = useMemo(() => {
   if (!transKey || hasDuplicateTransKey) return { ciphertext: '', intermediate: '', grid: [], ranks: [], stage1Steps: [] };
   return adfgvxEncode(inputText, gridKey, transKey);
 }, [inputText, gridKey, transKey, hasDuplicateTransKey]);

 return (
   <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-20">
     <div
       className="fixed inset-0 z-0 pointer-events-none"
       style={{
         backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
         backgroundSize: 'cover',
         backgroundPosition: 'center',
         opacity: 0.15
       }}
     />
     <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
     <div className="fixed inset-0 z-0 bg-mesh opacity-10 pointer-events-none" />

     {/* Header */}
     <div className="relative z-50 w-full flex justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm h-20 md:h-24 items-center px-4 md:px-8">
       <button
         onClick={onBack}
         className="flex items-center gap-2 group hover:text-vault-gold transition-colors"
       >
         <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
         <span className="font-display font-bold uppercase tracking-widest text-sm text-white">Return to Hub</span>
       </button>
      
       <div className="w-24 hidden md:block" />
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl flex-1">
       <div className="text-center mb-12">
         <motion.h1
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="font-display font-black text-4xl md:text-6xl text-vault-gold uppercase tracking-tighter mb-2"
         >
           ADFGVX Cipher
         </motion.h1>
         <p className="text-white/40 font-display text-[10px] uppercase tracking-[0.5em]">Dual-Stage Transposition Protocol</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         {/* Controls */}
         <div className="lg:col-span-4 space-y-6">
           <div className="bg-vault-panel/80 border border-vault-gold/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <h2 className="font-display font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
               <Zap className="w-5 h-5 text-vault-gold" />
               Cipher Config
             </h2>

             <div className="space-y-4">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-2">Operation Mode</label>
                 <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                   <button
                     onClick={() => setMode('ENCODE')}
                     className={`flex-1 py-1 px-3 font-display font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'ENCODE' ? 'bg-vault-gold text-black' : 'text-white/40'}`}
                   >
                     Encode
                   </button>
                   <button
                     onClick={() => setMode('DECODE')}
                     className={`flex-1 py-1 px-3 font-display font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'DECODE' ? 'bg-vault-gold text-black' : 'text-white/40'}`}
                   >
                     Decode
                   </button>
                 </div>
               </div>

               <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-1">Grid Key</label>
                  <input
                   type="text"
                   value={gridKey}
                   onChange={(e) => setGridKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                   className="w-full bg-black/60 border border-vault-gold/20 rounded-lg p-3 font-display font-bold text-vault-gold focus:outline-none focus:border-vault-gold"
                   placeholder="Enter grid keyword..."
                 />
               </div>

               <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-1">Transposition Key</label>
                  <input
                   type="text"
                   value={transKey}
                   onChange={(e) => setTransKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                   className="w-full bg-black/60 border border-vault-gold/20 rounded-lg p-3 font-display font-bold text-vault-gold focus:outline-none focus:border-vault-gold"
                   placeholder="Enter transposition keyword..."
                 />
                 {hasDuplicateTransKey && (
                   <p className="text-[9px] text-red-500 font-bold uppercase mt-1 tracking-tighter">Warning: Duplicate letters in transposition key not allowed.</p>
                 )}
               </div>

               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-1">Input Text</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                   className="w-full bg-black/60 border border-vault-gold/20 rounded-xl p-4 font-mono text-lg text-vault-gold focus:outline-none focus:border-vault-gold resize-none"
                   rows={3}
                 />
               </div>
             </div>
           </div>

           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
             <h3 className="flex items-center gap-2 font-display font-black uppercase text-sm text-blue-400 mb-3">
               <Info className="w-4 h-4" />
               The Rules
             </h3>
             <ul className="text-[10px] text-white/70 leading-relaxed font-bold uppercase space-y-2">
               <li><span className="text-vault-gold">STAGE 1:</span> Each letter is replaced by its row + column label in the 6×6 grid.</li>
               <li><span className="text-vault-gold">STAGE 2:</span> The result is written into columns ranked by the transposition key.</li>
               <li><span className="text-vault-gold">DECODE:</span> Reverse transposition first, then reverse the Polybius lookup.</li>
             </ul>
           </div>
         </div>

         {/* Visualization */}
         <div className="lg:col-span-8 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Polybius Square */}
              <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6">
                 <h2 className="font-display font-black text-sm text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                   <Grid3X3 className="w-4 h-4 text-vault-gold" />
                   6x6 Polybius Square
                 </h2>

                 <div className="grid grid-cols-7 gap-1 md:gap-2 max-w-xs mx-auto mb-6">
                   <div className="w-8 h-8 md:w-10 md:h-10 border border-white/5 bg-black/20 flex items-center justify-center">
                      <span className="text-[10px] text-zinc-600 font-bold">\</span>
                   </div>
                   {ADFGVX_LABELS.map(l => (
                     <div key={l} className="w-8 h-8 md:w-10 md:h-10 border border-white/10 bg-black/40 flex items-center justify-center">
                       <span className="font-display font-black text-xs text-white">{l}</span>
                     </div>
                   ))}
                   {ADFGVX_LABELS.map((rowLabel, r) => (
                     <React.Fragment key={rowLabel}>
                       <div className="w-8 h-8 md:w-10 md:h-10 border border-white/10 bg-black/40 flex items-center justify-center">
                         <span className="font-display font-black text-xs text-white">{rowLabel}</span>
                       </div>
                       {Array.from({ length: 6 }).map((_, c) => (
                         <div key={c} className="w-8 h-8 md:w-10 md:h-10 border border-white/5 bg-white/5 flex items-center justify-center rounded-sm">
                           <span className="font-display font-black text-xs text-white/40">{square[r * 6 + c]}</span>
                         </div>
                       ))}
                     </React.Fragment>
                   ))}
                 </div>

                 <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <label className="text-[8px] uppercase tracking-widest text-vault-gold/40 font-black mb-1 block">Stage 1 Output</label>
                    <div className="font-mono text-xs text-vault-gold break-all tracking-widest bg-black p-2 rounded border border-vault-gold/20">
                      {intermediate || '---'}
                    </div>
                 </div>
              </div>

              {/* Columnar Transposition */}
              <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6">
                 <h2 className="font-display font-black text-sm text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                   <Table className="w-4 h-4 text-vault-gold" />
                   Columnar Transposition
                 </h2>

                 <div className="overflow-x-auto mb-6">
                   <div className="flex gap-1" style={{ minWidth: transKey.length * 40 }}>
                     {transKey.split('').map((char, i) => (
                       <div key={i} className="flex-1 min-w-[36px] flex flex-col gap-1">
                         <div className="bg-vault-gold text-black font-display font-black text-center py-1 rounded-sm text-xs">{char}</div>
                         <div className="bg-black/60 text-vault-gold/40 font-mono text-center text-[10px] py-1 rounded-sm border border-vault-gold/20">{ranks[i]}</div>
                         <div className="flex flex-col gap-1 mt-1">
                           {grid.map((row, rIdx) => (
                             <div key={rIdx} className="bg-white/5 border border-white/10 h-7 flex items-center justify-center rounded-sm">
                               <span className="font-mono text-xs text-white/40">{row[i] || ''}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                   <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest leading-relaxed italic">
                     Columns are read in numerical order (1 &rarr; 2 &rarr; 3...) to produce final transmission.
                   </p>
                 </div>
              </div>
           </div>

           {/* Transform Log & Final Result */}
           <div className="space-y-6">
               <div className="bg-vault-panel/40 border border-white/5 p-6 rounded-xl">
                 <h4 className="text-[10px] font-black uppercase text-vault-gold/40 mb-3 flex items-center gap-2">
                   <ArrowRightLeft className="w-3 h-3" />
                   Transformation Log
                 </h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                     {stage1Steps.slice(0, 16).map((step, i) => (
                       <div key={i} className="bg-black/40 p-3 rounded-lg border border-white/5 flex flex-col items-center">
                         <div className="flex items-center gap-2 mb-1">
                             <span className="text-vault-gold font-bold">{step.source}</span>
                             <span className="text-white/20 text-xs">&rarr;</span>
                             <span className="text-blue-400 font-bold">{step.result}</span>
                         </div>
                       </div>
                     ))}
                     {stage1Steps.length > 16 && <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex items-center justify-center text-[10px] text-white/40 uppercase font-black italic">...</div>}
                 </div>
               </div>

               <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                 <div className="bg-black/60 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-inner">
                   <div className="flex-1 w-full text-center md:text-left">
                       <label className="text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-2 block">Coded Result</label>
                       <div className="bg-black border-2 border-vault-gold rounded-xl p-4 md:p-6 font-display font-black text-2xl md:text-5xl text-center text-vault-gold shadow-[inset_0_2px_15px_rgba(0,0,0,1)] tracking-[0.2em] break-all min-h-[50px]">
                         {ciphertext || '---'}
                       </div>
                   </div>
                   <VaultButton
                     variant="primary"
                     className="h-16 px-10 whitespace-nowrap bg-green-600 hover:bg-green-500 border-green-400"
                     onClick={() => {
                       if (onPlay && ciphertext && transKey && !hasDuplicateTransKey) {
                         onPlay({ code: ciphertext, key: `${gridKey}|${transKey}` });
                       }
                     }}
                     disabled={!ciphertext || hasDuplicateTransKey}
                   >
                     Play Mission
                   </VaultButton>
                 </div>
               </div>
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-display text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Global Comms Interface V2.0
       </p>
     </div>

     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

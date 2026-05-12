import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3, LucideCalculator, LucideHash } from 'lucide-react';

interface NihilistPageProps {
 onBack: () => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export const NihilistPage: React.FC<NihilistPageProps> = ({ onBack, youtuber }) => {
 const [inputText, setInputText] = useState('HELPME');
 const [gridKey, setGridKey] = useState('VAULT');
 const [addKey, setAddKey] = useState('KEY');
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const generateSquare = (key: string) => {
   const cleanKey = key.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   const seen = new Set<string>();
   const square: string[] = [];

   for (const char of cleanKey) {
     if (!seen.has(char)) {
       seen.add(char);
       square.push(char);
     }
   }

   for (const char of ALPHABET_NO_J) {
     if (!seen.has(char)) {
       seen.add(char);
       square.push(char);
     }
   }

   return square;
 };

 const square = useMemo(() => generateSquare(gridKey), [gridKey]);

 const getCoordinates = (char: string, polybius: string[]) => {
   const c = char.toUpperCase().replace(/J/g, 'I');
   const idx = polybius.indexOf(c);
   if (idx === -1) return null;
   const row = Math.floor(idx / 5) + 1;
   const col = (idx % 5) + 1;
   return parseInt(`${row}${col}`);
 };

 const getCharFromCoords = (coords: number, polybius: string[]) => {
   const s = coords.toString();
   if (s.length !== 2) return '?';
   const row = parseInt(s[0]) - 1;
   const col = parseInt(s[1]) - 1;
   if (row < 0 || row > 4 || col < 0 || col > 4) return '?';
   return polybius[row * 5 + col];
 };

 const { result, steps } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   const cleanAddKey = addKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  
   if (!cleanAddKey) return { result: '', steps: [] };

   const keyCoords = cleanAddKey.split('').map(c => getCoordinates(c, square)).filter(n => n !== null) as number[];
  
   let res = '';
   const currentSteps: any[] = [];

   if (mode === 'ENCODE') {
     cleanText.split('').forEach((char, i) => {
       const textCoord = getCoordinates(char, square);
       if (textCoord === null) return;
       const addK = keyCoords[i % keyCoords.length];
       const sum = textCoord + addK;
       res += sum + ' ';
       currentSteps.push({ char, textCoord, addK, sum });
     });
   } else {
     const numStrings = inputText.trim().split(/\s+/);
     numStrings.forEach((numStr, i) => {
       const sum = parseInt(numStr);
       if (isNaN(sum)) return;
       const addK = keyCoords[i % keyCoords.length];
       const diff = sum - addK;
       const char = getCharFromCoords(diff, square);
       res += char;
       currentSteps.push({ char, textCoord: diff, addK, sum });
     });
   }

   return { result: res.trim(), steps: currentSteps };
 }, [inputText, gridKey, addKey, mode, square]);

 const teamName = youtuber?.teamName || (youtuber?.name === "Dude Perfect" ? "Team Perfect" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`);

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
           Nihilist Cipher
         </motion.h1>
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs md:text-sm"
         >
           Double-Lock Numerical Encryption
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
         {/* Controls */}
         <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <h2 className="font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2 italic">
               <LucideZap className="w-5 h-5 text-[#D4AF37]" />
               Auth Protocol
             </h2>

             <div className="space-y-4">
               {/* Mode Toggle */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Operation Mode</label>
                 <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                   <button
                     onClick={() => setMode('ENCODE')}
                     className={`flex-1 py-1 px-3 font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'ENCODE' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40'}`}
                   >
                     Encode
                   </button>
                   <button
                     onClick={() => setMode('DECODE')}
                     className={`flex-1 py-1 px-3 font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'DECODE' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40'}`}
                   >
                     Decode
                   </button>
                 </div>
               </div>

               {/* Grid Key */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Polybius Key</label>
                 <input
                   type="text"
                   value={gridKey}
                   onChange={(e) => setGridKey(e.target.value.substring(0, 12).toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-2 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] font-mono uppercase"
                 />
               </div>

               {/* Adding Key */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Additive Key</label>
                 <input
                   type="text"
                   value={addKey}
                   onChange={(e) => setAddKey(e.target.value.substring(0, 12).toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-2 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] font-mono uppercase tracking-widest"
                 />
               </div>

               {/* Input Text */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">
                   {mode === 'ENCODE' ? 'Input Stream' : 'Numerical Input'}
                 </label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors resize-none uppercase"
                   rows={mode === 'ENCODE' ? 2 : 3}
                 />
               </div>
             </div>
           </div>

           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl shadow-lg">
             <h3 className="flex items-center gap-2 font-black uppercase text-sm text-blue-400 mb-3">
               <LucideInfo className="w-4 h-4" />
               Nihilist Specs
             </h3>
             <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase">
               A combination of substitution (Polybius) and addition (Numerical Vigenère). Every letter becomes a two-digit coordinate, which is then added to the key's own coordinates.
             </p>
           </div>
         </div>

         {/* Visualization */}
         <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Left: Polybius Matrix */}
                 <div>
                   <h2 className="font-black text-xl text-white uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                     <LucideGrid3X3 className="w-5 h-5 text-[#D4AF37]" />
                     Polybius Matrix
                   </h2>
                   <div className="grid grid-cols-6 gap-1 bg-black/40 p-2 rounded-xl border border-white/5 font-mono">
                     <div className="w-8 h-8 md:w-10 md:h-10" />
                     {[1,2,3,4,5].map(n => <div key={`t-${n}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-[#D4AF37]/40 text-xs">{n}</div>)}
                    
                     {[1,2,3,4,5].map(r => (
                       <React.Fragment key={`row-${r}`}>
                         <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-[#D4AF37]/40 text-xs">{r}</div>
                         {[1,2,3,4,5].map(c => (
                           <div key={`c-${r}-${c}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded bg-white/5 border border-white/5 font-bold text-white/80 text-sm md:text-base">
                             {square[(r-1)*5 + (c-1)]}
                           </div>
                         ))}
                       </React.Fragment>
                     ))}
                   </div>
                 </div>

                 {/* Right: Step Analysis */}
                 <div className="flex flex-col h-full">
                   <h2 className="font-black text-xl text-white uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                     <LucideCalculator className="w-5 h-5 text-[#D4AF37]" />
                     Calculation Matrix
                   </h2>
                   <div className="flex-1 bg-black/60 rounded-xl p-4 overflow-y-auto max-h-[300px] font-mono">
                     {steps.length > 0 ? (
                       <div className="space-y-3">
                         {steps.map((step, i) => (
                           <motion.div
                             key={i}
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.05 }}
                             className="flex items-center gap-2 text-xs border-b border-white/5 pb-2 last:border-0"
                           >
                             <span className="w-6 h-6 bg-[#D4AF37] text-black rounded-full flex items-center justify-center font-black italic">{step.char}</span>
                             <span className="text-white/40">{step.textCoord}</span>
                             <span className="text-[#D4AF37] font-bold">+</span>
                             <span className="text-blue-400">{step.addK}</span>
                             <span className="text-white/40">=</span>
                             <span className="text-red-500 font-black text-[14px]">{step.sum}</span>
                           </motion.div>
                         ))}
                       </div>
                     ) : (
                       <div className="h-full flex items-center justify-center text-white/20 text-[10px] font-black uppercase tracking-widest text-center">
                         Awaiting Input Flow...
                       </div>
                     )}
                   </div>
                 </div>
              </div>

              {/* Result Area */}
              <div className="mt-8 pt-8 border-t border-white/10">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 w-full text-center">
                     <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2 block">Output Stream</label>
                     <div className="bg-black border-2 border-[#D4AF37] rounded-xl p-4 font-black text-2xl md:text-4xl text-center text-[#D4AF37] shadow-[inset_0_2px_20px_rgba(0,0,0,1)] tracking-[0.2em] break-all min-h-[5rem] flex items-center justify-center font-mono">
                       {result || '--- --- ---'}
                     </div>
                   </div>
                  
                   <button
                     className="w-full md:w-auto h-16 px-10 bg-[#008044] text-white hover:bg-[#006435] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                     onClick={() => navigator.clipboard.writeText(result)}
                   >
                     Copy To DNA
                   </button>
                 </div>
              </div>
           </div>

           <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                <LucideHash className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-[10px] text-white/40 font-black uppercase italic">Tactical Warning</div>
                <div className="text-xs font-bold text-white/80">The Nihilist cipher is effectively a Vigenère cipher over a Polybius base.</div>
              </div>
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Numerical Obfuscation Protocol v2.5
       </p>
     </div>
   </div>
 );
};

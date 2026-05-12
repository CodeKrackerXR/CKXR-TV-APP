import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3, LucideArrowRightLeft } from 'lucide-react';

interface PlayfairPageProps {
 onBack: () => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export const PlayfairPage: React.FC<PlayfairPageProps> = ({ onBack, youtuber }) => {
 const [inputText, setInputText] = useState('PLAYFAIR');
 const [key, setKey] = useState('CODE');
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const square = useMemo(() => {
   const cleanKey = key.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   const seen = new Set<string>();
   const res: string[] = [];

   for (const char of cleanKey) {
     if (!seen.has(char)) {
       seen.add(char);
       res.push(char);
     }
   }

   for (const char of ALPHABET_NO_J) {
     if (!seen.has(char)) {
       seen.add(char);
       res.push(char);
     }
   }

   return res;
 }, [key]);

 const getPosition = (char: string) => {
   const c = char.toUpperCase().replace(/J/g, 'I');
   const idx = square.indexOf(c);
   if (idx === -1) return null;
   return { r: Math.floor(idx / 5), c: idx % 5 };
 };

 const getChar = (r: number, c: number) => {
   const row = (r + 5) % 5;
   const col = (c + 5) % 5;
   return square[row * 5 + col];
 };

 const { result, steps } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   if (!cleanText) return { result: '', steps: [] };

   // Prepare text (handle double letters and odd length)
   let preparedText = '';
   for (let i = 0; i < cleanText.length; i++) {
       preparedText += cleanText[i];
       if (i < cleanText.length - 1 && cleanText[i] === cleanText[i+1]) {
           preparedText += 'X';
       }
   }
   if (preparedText.length % 2 !== 0) preparedText += 'X';

   const currentBigrams: [string, string][] = [];
   for (let i = 0; i < preparedText.length; i += 2) {
       currentBigrams.push([preparedText[i], preparedText[i+1]]);
   }

   let resText = '';
   const currentSteps: any[] = [];

   currentBigrams.forEach(([a, b]) => {
       const posA = getPosition(a);
       const posB = getPosition(b);

       if (!posA || !posB) return;

       let char1 = '';
       let char2 = '';
       let rule = '';

       if (posA.r === posB.r) {
           rule = 'Same Row';
           const shift = mode === 'ENCODE' ? 1 : -1;
           char1 = getChar(posA.r, posA.c + shift);
           char2 = getChar(posB.r, posB.c + shift);
       } else if (posA.c === posB.c) {
           rule = 'Same Column';
           const shift = mode === 'ENCODE' ? 1 : -1;
           char1 = getChar(posA.r + shift, posA.c);
           char2 = getChar(posB.r + shift, posB.c);
       } else {
           rule = 'Rectangle';
           char1 = getChar(posA.r, posB.c);
           char2 = getChar(posB.r, posA.c);
       }

       resText += char1 + char2;
       currentSteps.push({ a, b, c1: char1, c2: char2, posA, posB, rule });
   });

   return { result: resText, steps: currentSteps };
 }, [inputText, square, mode]);

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
           Playfair Cipher
         </motion.h1>
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs md:text-sm"
         >
           Bigram Substitution Protocol
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
               Cipher Config
             </h2>

             <div className="space-y-4">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Operation Mode</label>
                 <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                   <button
                     onClick={() => setMode('ENCODE')}
                     className={`flex-1 py-1 px-3 font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'ENCODE' ? 'bg-[#D4AF37] text-black' : 'text-white/40'}`}
                   >
                     Encode
                   </button>
                   <button
                     onClick={() => setMode('DECODE')}
                     className={`flex-1 py-1 px-3 font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'DECODE' ? 'bg-[#D4AF37] text-black' : 'text-white/40'}`}
                   >
                     Decode
                   </button>
                 </div>
               </div>

               <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Grid Key</label>
                  <input
                   type="text"
                   value={key}
                   onChange={(e) => setKey(e.target.value.toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-3 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] font-mono tracking-widest uppercase"
                   placeholder="Enter keyword..."
                 />
               </div>

               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Input Text</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] resize-none"
                   rows={3}
                 />
               </div>
             </div>
           </div>

           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl shadow-lg">
             <h3 className="flex items-center gap-2 font-black uppercase text-sm text-blue-400 mb-3">
               <LucideInfo className="w-4 h-4" />
               The Rules
             </h3>
             <ul className="text-[10px] text-white/70 leading-relaxed font-bold uppercase space-y-2">
               <li><span className="text-[#D4AF37]">1. RECTANGLE:</span> Swap corners within rows.</li>
               <li><span className="text-[#D4AF37]">2. SAME ROW:</span> Shift right (wrap).</li>
               <li><span className="text-[#D4AF37]">3. SAME COLUMN:</span> Shift down (wrap).</li>
             </ul>
           </div>
         </div>

         {/* Visualization */}
         <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl p-8 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-8 border-b border-white/10 pb-4">
                 <h2 className="font-black text-xl text-white uppercase tracking-widest flex items-center gap-2 italic">
                   <LucideGrid3X3 className="w-5 h-5 text-[#D4AF37]" />
                   5x5 Playfair Matrix
                 </h2>
              </div>

              <div className="grid grid-cols-5 gap-2 md:gap-4 max-w-sm mx-auto font-mono">
                   {square.map((char, i) => {
                       const r = Math.floor(i / 5);
                       const c = i % 5;
                      
                       const firstStep = steps[0];
                       const isActive = firstStep && (
                           (r === firstStep.posA.r && c === firstStep.posA.c) ||
                           (r === firstStep.posB.r && c === firstStep.posB.c)
                       );
                       const isTarget = firstStep && (
                           (char === firstStep.c1) || (char === firstStep.c2)
                       );

                       return (
                         <div
                           key={i}
                           className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-xl font-black text-xl md:text-2xl border transition-all duration-300
                             ${isActive
                               ? 'bg-[#D4AF37] text-black border-white/50 scale-110 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                               : isTarget
                                   ? 'bg-blue-500 text-black border-white/50 scale-105'
                                   : 'bg-white/5 text-white/40 border-transparent opacity-60'}`}
                         >
                           {char}
                         </div>
                       );
                   })}
              </div>

              <div className="mt-12 w-full pt-8 border-t border-white/10">
                 <div className="bg-black/60 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-inner">
                   <div className="flex-1 w-full text-center">
                      <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2 block">Coded Result</label>
                      <div className="bg-black border-2 border-[#D4AF37] rounded-xl p-4 md:p-6 font-black text-2xl md:text-5xl text-[#D4AF37] shadow-[inset_0_2px_15px_rgba(0,0,0,1)] tracking-[0.2em] break-all font-mono uppercase">
                       {result || '---'}
                      </div>
                   </div>
                   <button
                     className="w-full md:w-auto h-16 px-10 bg-[#008044] text-white hover:bg-[#006435] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                     onClick={() => navigator.clipboard.writeText(result)}
                   >
                     Sync To DNA
                   </button>
                 </div>
              </div>
           </div>

           {/* Tactical Feed */}
           <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-xl">
              <h4 className="text-[10px] font-black uppercase text-[#D4AF37]/40 mb-3 flex items-center gap-2 italic">
                <LucideArrowRightLeft className="w-3 h-3" />
                Transformation Log
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 {steps.slice(0, 8).map((step, i) => (
                   <div key={i} className="bg-black/40 p-3 rounded-lg border border-white/5 flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[#D4AF37] font-bold">{step.a}{step.b}</span>
                         <span className="text-white/20 text-xs">&rarr;</span>
                         <span className="text-blue-400 font-bold">{step.c1}{step.c2}</span>
                      </div>
                      <div className="text-[8px] uppercase text-white/40 font-black">{step.rule}</div>
                   </div>
                 ))}
                 {steps.length > 8 && <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex items-center justify-center text-[10px] text-zinc-500 uppercase font-black italic">Buffer Overload...</div>}
              </div>
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Bigram Processing Unit v1.0
       </p>
     </div>
   </div>
 );
};

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3, LucideHash } from 'lucide-react';

interface FourSquarePageProps {
 onBack: () => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export const FourSquarePage: React.FC<FourSquarePageProps> = ({ onBack, youtuber }) => {
 const [inputText, setInputText] = useState('HELPME');
 const [key1, setKey1] = useState('VAULT');
 const [key2, setKey2] = useState('SECRET');
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

 const squareTL = useMemo(() => ALPHABET_NO_J.split(''), []);
 const squareBR = useMemo(() => ALPHABET_NO_J.split(''), []);
 const squareTR = useMemo(() => generateSquare(key1), [key1]);
 const squareBL = useMemo(() => generateSquare(key2), [key2]);

 const { result, steps } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
   let textToProcess = cleanText;
   if (textToProcess.length % 2 !== 0) textToProcess += 'X';

   const bigrams: [string, string][] = [];
   for (let i = 0; i < textToProcess.length; i += 2) {
     bigrams.push([textToProcess[i], textToProcess[i + 1]]);
   }

   let res = '';
   const currentSteps: any[] = [];

   bigrams.forEach(([a, b]) => {
     if (mode === 'ENCODE') {
       const idxA = squareTL.indexOf(a);
       const idxB = squareBR.indexOf(b);

       const rA = Math.floor(idxA / 5);
       const cA = idxA % 5;
       const rB = Math.floor(idxB / 5);
       const cB = idxB % 5;

       const char1 = squareTR[rA * 5 + cB];
       const char2 = squareBL[rB * 5 + cA];
       res += char1 + char2;
       currentSteps.push({ a, b, c1: char1, c2: char2, rA, cA, rB, cB });
     } else {
       const idxA = squareTR.indexOf(a);
       const idxB = squareBL.indexOf(b);

       const rA = Math.floor(idxA / 5);
       const cA = idxA % 5;
       const rB = Math.floor(idxB / 5);
       const cB = idxB % 5;

       const char1 = squareTL[rA * 5 + cB];
       const char2 = squareBR[rB * 5 + cA];
       res += char1 + char2;
       currentSteps.push({ a, b, c1: char1, c2: char2, rA, cA, rB, cB });
     }
   });

   return { result: res, steps: currentSteps };
 }, [inputText, key1, key2, mode, squareTR, squareBL]);

 const teamName = youtuber?.teamName || (youtuber?.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`);

 const renderSquare = (square: string[], title: string, activePoints: { r: number, c: number }[]) => (
   <div className="flex flex-col gap-2">
     <div className="flex justify-between items-center px-1">
       <span className="text-[10px] font-black uppercase text-white/40 italic">{title}</span>
     </div>
     <div className="grid grid-cols-5 gap-1 bg-black/40 p-2 rounded-lg border border-white/5 font-mono">
       {square.map((char, i) => {
         const r = Math.floor(i / 5);
         const c = i % 5;
         const isActive = activePoints.some(p => p.r === r && p.c === c);
         return (
           <div
             key={i}
             className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded text-xs md:text-sm font-black border transition-all duration-300
               ${isActive
                 ? `bg-[#D4AF37] text-black border-white/20 scale-110 z-10 shadow-lg`
                 : 'bg-white/5 text-white/40 border-transparent opacity-60'}`}
           >
             {char}
           </div>
         );
       })}
     </div>
   </div>
 );

 const currentStep = steps[0] || { rA: -1, cA: -1, rB: -1, cB: -1 };

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
           Four-Square Cipher
         </motion.h1>
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs md:text-sm"
         >
           Advanced Polygraphic Substitution
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
               Encryption Core
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

               {/* Keywords */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Key 1 (TR)</label>
                   <input
                     type="text"
                     value={key1}
                     onChange={(e) => setKey1(e.target.value.substring(0, 10).toUpperCase())}
                     className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-2 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] font-mono uppercase"
                     placeholder="KEY 1"
                   />
                 </div>
                  <div>
                   <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Key 2 (BL)</label>
                   <input
                     type="text"
                     value={key2}
                     onChange={(e) => setKey2(e.target.value.substring(0, 10).toUpperCase())}
                     className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-2 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] font-mono uppercase"
                     placeholder="KEY 2"
                   />
                 </div>
               </div>

               {/* Input Text */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Input Stream</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.substring(0, 20).toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors resize-none uppercase"
                   rows={2}
                 />
               </div>
             </div>
           </div>

           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl shadow-lg">
             <h3 className="flex items-center gap-2 font-black uppercase text-sm text-blue-400 mb-3">
               <LucideInfo className="w-4 h-4" />
               Cipher Specs
             </h3>
             <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase">
               Uses four 5x5 matrices. Top-Left & Bottom-Right are standard ABC grids. Top-Right & Bottom-Left are keyed. To encrypt, find intersections of bigram pairs across the quadrants.
             </p>
           </div>
         </div>

         {/* Visualization */}
         <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                 <h2 className="font-black text-xl text-white uppercase tracking-widest flex items-center gap-2 italic">
                   <LucideGrid3X3 className="w-5 h-5 text-[#D4AF37]" />
                   Four Quadrant Grid
                 </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
                 {/* Top Left (Standard) */}
                 {renderSquare(squareTL, "A: Top-Left (Standard)", [{ r: currentStep.rA, c: currentStep.cA }])}
                
                 {/* Top Right (Keyed 1) */}
                 {renderSquare(squareTR, `B: Top-Right (Key: ${key1 || 'None'})`, mode === 'ENCODE' ? [{ r: currentStep.rA, c: currentStep.cB }] : [{ r: currentStep.rA, c: currentStep.cA }])}

                 {/* Bottom Left (Keyed 2) */}
                 {renderSquare(squareBL, `C: Bottom-Left (Key: ${key2 || 'None'})`, mode === 'ENCODE' ? [{ r: currentStep.rB, c: currentStep.cA }] : [{ r: currentStep.rB, c: currentStep.cB }])}

                 {/* Bottom Right (Standard) */}
                 {renderSquare(squareBR, "D: Bottom-Right (Standard)", [{ r: currentStep.rB, c: currentStep.cB }])}
              </div>

              {/* Result Area */}
              <div className="mt-12 bg-black/60 border border-white/10 rounded-2xl p-6">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 w-full text-center">
                     <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2 block">Output Stream</label>
                     <div className="bg-black border-2 border-[#D4AF37] rounded-xl p-4 font-black text-3xl text-center text-[#D4AF37] shadow-[inset_0_2px_15px_rgba(0,0,0,0.9)] tracking-[0.3em] font-mono">
                       {result || '---'}
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
                <div className="text-[10px] text-white/40 font-black uppercase italic">Tactical Advantage</div>
                <div className="text-xs font-bold text-white/80">Double-Keyed matrices significantly increase complexity over Playfair.</div>
              </div>
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Polygraphic Engine V4.0
       </p>
     </div>
   </div>
 );
};

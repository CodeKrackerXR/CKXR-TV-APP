import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3 } from 'lucide-react';

interface BeaufortPageProps {
 onBack: () => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const BeaufortPage: React.FC<BeaufortPageProps> = ({ onBack, youtuber }) => {
 const [inputText, setInputText] = useState('CRYPTO');
 const [key, setKey] = useState('KEY');

 const { result, steps } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/[^A-Z]/g, '');
   const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
   if (!cleanText || !cleanKey) return { result: '', steps: [] };

   let res = '';
   const currentSteps: any[] = [];

   // Beaufort logic: Cipher = (Key - Plaintext) mod 26
   // Since it's reciprocal, Decoding is the same: Plaintext = (Key - Cipher) mod 26
   for (let i = 0; i < cleanText.length; i++) {
       const pChar = cleanText[i];
       const kChar = cleanKey[i % cleanKey.length];
      
       const pIdx = ALPHABET.indexOf(pChar);
       const kIdx = ALPHABET.indexOf(kChar);
      
       const cIdx = (kIdx - pIdx + 26) % 26;
       const cChar = ALPHABET[cIdx];
      
       res += cChar;
       currentSteps.push({ pChar, kChar, cChar, pIdx, kIdx, cIdx });
   }

   return { result: res, steps: currentSteps };
 }, [inputText, key]);

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
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="font-black text-4xl md:text-6xl text-[#D4AF37] uppercase tracking-tighter mb-2 italic"
         >
           Beaufort Cipher
         </motion.h1>
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="flex items-center justify-center gap-4"
         >
           <span className="h-px w-8 bg-[#D4AF37]/30" />
           <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-[10px] md:text-xs">
              Reciprocal Polyalphabetic Substitution
           </p>
           <span className="h-px w-8 bg-[#D4AF37]/30" />
         </motion.div>
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
               Logic Core
             </h2>

             <div className="space-y-4">
               <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Additive Key</label>
                  <input
                   type="text"
                   value={key}
                   onChange={(e) => setKey(e.target.value.toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-3 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] tracking-widest"
                   placeholder="Enter key..."
                 />
               </div>

               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Message Stream</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] resize-none"
                   rows={4}
                 />
                 <p className="text-[9px] text-white/30 uppercase mt-2 italic font-bold">Note: Beaufort is reciprocal. Encoding and Decoding use the same logic.</p>
               </div>
             </div>
           </div>

           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl shadow-lg">
             <h3 className="flex items-center gap-2 font-black uppercase text-[10px] text-blue-400 mb-3 tracking-[0.2em]">
               <LucideInfo className="w-4 h-4" />
               The Algorithm
             </h3>
             <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase">
               Beaufort equals (Key Letter - Plaintext Letter) mod 26. This creates a mirrored encryption where applying the same key to the ciphertext returns the original message.
             </p>
           </div>
         </div>

         {/* Visualization */}
         <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl p-4 md:p-8">
             <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center justify-center gap-2 italic">
               <LucideGrid3X3 className="w-4 h-4 text-[#D4AF37]" />
               Tabula Recta (The Grid)
             </h3>
            
             <div className="overflow-x-auto mb-8">
               <div className="min-w-[500px]">
                 <div className="grid grid-cols-[25px_repeat(26,1fr)] gap-[1px] bg-white/5 p-[1px] border border-white/10 rounded-sm font-mono">
                   <div className="bg-black/80 h-6" />
                   {ALPHABET.split('').map(l => (
                     <div key={l} className="bg-[#D4AF37]/10 text-[#D4AF37] font-black text-[9px] flex items-center justify-center h-6">
                       {l}
                     </div>
                   ))}
                   {ALPHABET.split('').map((rowL, rIdx) => (
                     <React.Fragment key={rowL}>
                       <div className="bg-[#D4AF37]/10 text-[#D4AF37] font-black text-[9px] flex items-center justify-center w-[25px] h-6">
                         {rowL}
                       </div>
                       {ALPHABET.split('').map((colL, cIdx) => {
                         const charIdx = (rIdx + cIdx) % 26;
                         const char = ALPHABET[charIdx];
                        
                         const activeStep = steps[0];
                         const isActiveRow = activeStep?.cChar === rowL;
                         const isActiveCol = activeStep?.pChar === colL;
                         const isResultChar = char === activeStep?.kChar && isActiveRow && isActiveCol;

                         return (
                           <div
                             key={colL}
                             className={`flex items-center justify-center h-6 text-[10px] transition-colors
                               ${isResultChar ? 'bg-[#D4AF37] text-black font-black scale-105 z-10' :
                                 isActiveRow || isActiveCol ? 'bg-[#D4AF37]/5 text-white/80' : 'bg-black/40 text-white/20'}`}
                           >
                             {char}
                           </div>
                         );
                       })}
                     </React.Fragment>
                   ))}
                 </div>
               </div>
             </div>

              {/* Output Area */}
              <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 w-full text-center">
                      <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2 block">
                        Reciprocal Output
                      </label>
                      <div className="bg-black/80 border-2 border-[#D4AF37] rounded-xl p-6 font-black text-4xl md:text-6xl text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.1)] tracking-[0.2em] break-all min-h-[5rem] flex items-center justify-center uppercase font-mono">
                       {result || '--- ---'}
                      </div>
                   </div>
                   <button
                     className="w-full md:w-auto h-20 px-10 bg-[#008044] text-white hover:bg-[#006435] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                     onClick={() => navigator.clipboard.writeText(result)}
                   >
                     Copy To DNA
                   </button>
                 </div>
              </div>
           </div>

           {/* Shift Track */}
           <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl overflow-x-auto flex gap-4">
               {steps.slice(0, 12).map((s: any, i: number) => (
                  <div key={i} className="flex flex-col items-center bg-black/40 p-3 rounded-lg border border-white/5 min-w-[70px]">
                     <div className="text-[10px] text-white/40 font-bold mb-1">#{i+1}</div>
                     <div className="flex flex-col items-center gap-0.5">
                        <span className="text-white font-black text-xs">{s.pChar}</span>
                        <span className="text-[#D4AF37] text-[10px]">&darr;</span>
                        <span className="text-blue-400 font-bold text-[10px]">{s.kChar}</span>
                        <span className="text-white/20 text-[10px]">=</span>
                        <span className="text-red-600 font-black text-sm">{s.cChar}</span>
                     </div>
                  </div>
               ))}
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Reciprocal Cipher Interface v1.0
       </p>
     </div>
   </div>
 );
};

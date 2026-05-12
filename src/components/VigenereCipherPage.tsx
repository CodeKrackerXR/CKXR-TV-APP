import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3 } from 'lucide-react';

interface VigenereCipherPageProps {
 onBack: () => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const VigenereCipherPage: React.FC<VigenereCipherPageProps> = ({ onBack, youtuber }) => {
 const [inputText, setInputText] = useState('VAULT');
 const [key, setKey] = useState('CODE');
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const { result, steps } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/[^A-Z]/g, '');
   const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
   if (!cleanText || !cleanKey) return { result: '', steps: [] };

   let res = '';
   const currentSteps: any[] = [];

   for (let i = 0; i < cleanText.length; i++) {
       const char = cleanText[i];
       const keyChar = cleanKey[i % cleanKey.length];
      
       const charIdx = ALPHABET.indexOf(char);
       const keyIdx = ALPHABET.indexOf(keyChar);
      
       let targetIdx;
       if (mode === 'ENCODE') {
           targetIdx = (charIdx + keyIdx) % 26;
       } else {
           targetIdx = (charIdx - keyIdx + 26) % 26;
       }
      
       const resultChar = ALPHABET[targetIdx];
       res += resultChar;
       currentSteps.push({ char, keyChar, resultChar, charIdx, keyIdx, targetIdx });
   }

   return { result: res, steps: currentSteps };
 }, [inputText, key, mode]);

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
           Vigenère Cipher
         </motion.h1>
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="flex items-center justify-center gap-4"
         >
           <span className="h-px w-8 bg-[#D4AF37]/30" />
           <p className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-[10px] md:text-xs">
             Polyalphabetic Substitution Matrix
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
               Transmission Config
             </h2>

             <div className="space-y-5">
                <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Operation Mode</label>
                 <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                   <button
                     onClick={() => setMode('ENCODE')}
                     className={`flex-1 py-1 font-black text-xs uppercase transition-all rounded-md ${mode === 'ENCODE' ? 'bg-[#D4AF37] text-black' : 'text-white/40'}`}
                   >
                     Encode
                   </button>
                   <button
                     onClick={() => setMode('DECODE')}
                     className={`flex-1 py-1 font-black text-xs uppercase transition-all rounded-md ${mode === 'DECODE' ? 'bg-[#D4AF37] text-black' : 'text-white/40'}`}
                   >
                     Decode
                   </button>
                 </div>
               </div>

               <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Repeating Key</label>
                  <input
                   type="text"
                   value={key}
                   onChange={(e) => setKey(e.target.value.substring(0, 15).toUpperCase())}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-3 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] tracking-widest"
                   placeholder="KEYWORD..."
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
               </div>
             </div>
           </div>

           <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl">
             <h3 className="flex items-center gap-2 font-black uppercase text-xs text-white/40 mb-4 tracking-widest">
               <LucideInfo className="w-4 h-4" />
               Vigenère Logic
             </h3>
             <p className="text-[10px] text-white/60 leading-relaxed font-bold uppercase">
               The key is repeated to match the length of the message. For each letter, find the row starting with the key letter and the column starting with the message letter. The intersection is the ciphertext.
             </p>
           </div>
         </div>

         {/* Matrix Visualization */}
         <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl p-4 md:p-8">
             <h3 className="font-black text-sm text-white uppercase tracking-widest mb-6 flex items-center justify-center gap-2 italic">
               <LucideGrid3X3 className="w-4 h-4 text-[#D4AF37]" />
               Tabula Recta (The Grid)
             </h3>
            
             <div className="overflow-x-auto">
               <div className="min-w-[500px]">
                 <div className="grid grid-cols-[25px_repeat(26,1fr)] gap-[1px] bg-white/5 p-[1px] border border-white/10 rounded-sm">
                   {/* Header corner */}
                   <div className="bg-black/80 flex items-center justify-center h-6" />
                   {/* Header Columns */}
                   {ALPHABET.split('').map(l => (
                     <div key={l} className="bg-[#D4AF37]/10 text-[#D4AF37] font-black text-[9px] flex items-center justify-center h-6">
                       {l}
                     </div>
                   ))}
                   {/* Rows */}
                   {ALPHABET.split('').map((rowL, rIdx) => (
                     <React.Fragment key={rowL}>
                       <div className="bg-[#D4AF37]/10 text-[#D4AF37] font-black text-[9px] flex items-center justify-center w-[25px] h-6">
                         {rowL}
                       </div>
                       {ALPHABET.split('').map((colL, cIdx) => {
                         const charIdx = (rIdx + cIdx) % 26;
                         const char = ALPHABET[charIdx];
                        
                         // Check if highlighted in current steps
                         const activeStep = steps[0];
                         const isKeyRow = activeStep?.keyChar === rowL;
                         const isInputCol = mode === 'ENCODE' ? activeStep?.char === colL : activeStep?.resultChar === colL;
                         const isResult = mode === 'ENCODE'
                           ? (activeStep?.keyChar === rowL && activeStep?.char === colL)
                           : (activeStep?.keyChar === rowL && activeStep?.char === char);

                         return (
                           <div
                             key={colL}
                             className={`flex items-center justify-center h-6 font-mono text-[10px] transition-colors
                               ${isResult ? 'bg-[#D4AF37] text-black font-black scale-105 z-10' :
                                 isKeyRow || isInputCol ? 'bg-[#D4AF37]/5 text-white/80' : 'bg-black/40 text-white/20'}`}
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

             {/* Output Panel */}
             <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 w-full">
                   <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-3 block text-center md:text-left">
                     Processed Result
                   </label>
                   <div className="bg-black border-2 border-[#D4AF37] rounded-xl p-5 md:p-8 font-black text-3xl md:text-6xl text-center text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.15)] tracking-[0.2em] break-all font-mono">
                     {result || '---'}
                   </div>
                </div>
                <VaultButton
                 variant="primary"
                 className="h-20 px-12 text-sm"
                 onClick={() => navigator.clipboard.writeText(result)}
                >
                  Export Hash
                </VaultButton>
             </div>
           </div>

           {/* Sequence map */}
           <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-xl flex flex-wrap gap-4 items-center justify-center">
               {steps.slice(0, 10).map((s: any, i: number) => (
                 <div key={i} className="flex flex-col items-center bg-black/40 p-3 rounded-lg border border-white/5 min-w-[60px]">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/40 text-[10px] font-black">{s.char}</span>
                      <span className="text-[#D4AF37] text-xs">+</span>
                      <span className="text-blue-400 text-[10px] font-black">{s.keyChar}</span>
                   </div>
                   <div className="w-full h-px bg-white/10 my-1" />
                   <span className="text-[#D4AF37] font-black text-sm">{s.resultChar}</span>
                 </div>
               ))}
               {steps.length > 10 && <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">Truncated...</div>}
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Polyalphabetic Processing Module v1.0
       </p>
     </div>
   </div>
 );
};

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { LucideShieldCheck, LucideChevronLeft, LucideInfo, LucideZap, LucideGrid3X3, LucideHash, LucideArrowRight } from 'lucide-react';

interface AutokeyPageProps {
 onBack: () => void;
 onNavigateToGame?: () => void;
 inputText: string;
 setInputText: (val: string) => void;
 keyword: string;
 setKeyword: (val: string) => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const AutokeyPage: React.FC<AutokeyPageProps> = ({ onBack, onNavigateToGame, inputText, setInputText, keyword: initialKey, setKeyword, youtuber }) => {
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const { result, fullKey, steps } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/[^A-Z]/g, '');
   const cleanPrimer = initialKey.toUpperCase().replace(/[^A-Z]/g, '');
   if (!cleanText || !cleanPrimer) return { result: '', fullKey: '', steps: [] };

   let res = '';
   let currentFullKey = cleanPrimer;
   const currentSteps: any[] = [];

   if (mode === 'ENCODE') {
       // Enforce the full key by appending text to primer
       currentFullKey = (cleanPrimer + cleanText).substring(0, cleanText.length);
      
       for (let i = 0; i < cleanText.length; i++) {
           const char = cleanText[i];
           const kChar = currentFullKey[i];
          
           const charIdx = ALPHABET.indexOf(char);
           const keyIdx = ALPHABET.indexOf(kChar);
          
           const resultIdx = (charIdx + keyIdx) % 26;
           const resultChar = ALPHABET[resultIdx];
          
           res += resultChar;
           currentSteps.push({ char, kChar, resultChar });
       }
   } else {
       // Decoding is trickier: key letter i depends on decoded letter i-1
       let decodedText = '';
       currentFullKey = cleanPrimer; // Start with primer
      
       for (let i = 0; i < cleanText.length; i++) {
           // Get key char for this position
           const kChar = i < cleanPrimer.length ? cleanPrimer[i] : decodedText[i - cleanPrimer.length];
           const cChar = cleanText[i];
          
           const cIdx = ALPHABET.indexOf(cChar);
           const kIdx = ALPHABET.indexOf(kChar);
          
           const pIdx = (cIdx - kIdx + 26) % 26;
           const pChar = ALPHABET[pIdx];
          
           decodedText += pChar;
           currentSteps.push({ char: cChar, kChar, resultChar: pChar });
       }
       res = decodedText;
       currentFullKey = (cleanPrimer + decodedText).substring(0, cleanText.length);
   }

   return { result: res, fullKey: currentFullKey, steps: currentSteps };
 }, [inputText, initialKey, mode]);

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
      
       <div className="w-24 hidden md:block" />
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl flex-1">
       <div className="text-center mb-12">
         <motion.h1
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="font-black text-4xl md:text-6xl text-[#D4AF37] uppercase tracking-tighter mb-2 italic"
         >
           Autokey Cipher
         </motion.h1>
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-[10px] md:text-xs"
         >
           Dynamic Key Extraction Interface
         </motion.p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         {/* Controls */}
         <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <h2 className="font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2 italic">
               <LucideZap className="w-5 h-5 text-[#D4AF37]" />
               Cipher Core
             </h2>

             <div className="space-y-4">
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
                  <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Primer (Keyword)</label>
                  <input
                   type="text"
                   value={initialKey}
                   onChange={(e) => setKeyword(e.target.value.substring(0, 15).toUpperCase())}
                   className={`w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-3 font-bold focus:outline-none focus:border-[#D4AF37] tracking-widest transition-colors ${initialKey === 'CODE' ? 'text-white' : 'text-green-500'}`}
                   placeholder="Enter primer..."
                 />
               </div>

               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Message Stream</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.toUpperCase())}
                   className={`w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg focus:outline-none focus:border-[#D4AF37] resize-none transition-colors ${inputText === 'VAULT' ? 'text-white' : 'text-green-500'}`}
                   rows={4}
                 />
               </div>
             </div>
           </div>

           <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-2xl">
             <h3 className="flex items-center gap-2 font-black uppercase text-xs text-red-500 mb-3">
               <LucideInfo className="w-4 h-4" />
               Enhanced Security
             </h3>
             <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase">
               Autokey prevents pattern repetition by using the message itself as the future key stream. This makes it immune to Kasiski examination and standard frequency analysis.
             </p>
           </div>
         </div>

         {/* Visualization */}
         <div className="lg:col-span-8 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6 md:p-8">
             <h3 className="font-black text-sm text-white uppercase tracking-widest mb-8 flex items-center justify-center gap-2 italic">
               <LucideHash className="w-4 h-4 text-[#D4AF37]" />
               Key Stream Generation
             </h3>

             <div className="space-y-12">
                {/* Key Visualizer */}
                <div className="flex flex-col gap-2">
                   <div className="flex bg-black/40 rounded-xl border border-white/5 overflow-hidden font-black text-xs md:text-sm">
                      <div className="bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-3 border-r border-white/5 uppercase italic">Primer</div>
                      <div className="flex-1 px-4 py-3 text-[#D4AF37] tracking-widest uppercase font-mono">{initialKey || '---'}</div>
                   </div>
                   <LucideArrowRight className="w-4 h-4 text-white/20 mx-auto rotate-90" />
                   <div className="flex bg-black/60 rounded-xl border border-[#D4AF37]/20 overflow-hidden font-black text-sm md:text-xl">
                      <div className="bg-[#D4AF37] text-black px-4 md:px-6 py-4 uppercase flex items-center italic">Full Feed</div>
                      <div className="flex-1 px-4 md:px-6 py-4 text-[#D4AF37] tracking-widest break-all font-mono uppercase">
                       {fullKey.split('').map((char, i) => (
                          <span key={i} className={i < initialKey.length ? 'text-[#D4AF37]' : 'text-blue-400'}>{char}</span>
                       ))}
                      </div>
                   </div>
                </div>

                {/* Output Area */}
                <div className="pt-8 border-t border-white/10">
                   <div className="flex flex-col md:flex-row items-center gap-8">
                     <div className="flex-1 w-full text-center">
                       <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-3 block">Process Multiplier Output</label>
                       <div className="bg-black border-2 border-[#D4AF37] rounded-xl p-6 md:p-10 font-black text-4xl md:text-7xl text-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.1)] tracking-[0.2em] break-all uppercase font-mono">
                         {result || '--- ---'}
                       </div>
                     </div>
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

           {/* Steps Track */}
           <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-xl flex flex-wrap justify-center gap-3">
               {steps.slice(0, 15).map((s: any, i: number) => (
                  <div key={i} className="bg-black/60 p-3 rounded-lg border border-white/5 min-w-[65px] flex flex-col items-center">
                     <div className="text-[8px] text-white/20 font-black mb-1">POS {i+1}</div>
                     <span className="text-white font-black text-xs">{s.char}</span>
                     <span className="text-[#D4AF37] text-[10px] my-0.5">{mode === 'ENCODE' ? '+' : '-'}</span>
                     <span className="text-blue-400 font-bold text-xs">{s.kChar}</span>
                     <div className="w-4 h-px bg-white/10 my-1.5" />
                     <span className="text-red-600 font-black text-sm">{s.resultChar}</span>
                  </div>
               ))}
               {steps.length > 15 && <div className="flex items-center text-[10px] text-white/20 font-black uppercase tracking-widest px-4 italic">Stream continues...</div>}
           </div>
         </div>
       </div>
     </div>

     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Autokey Dynamic Processor v1.0
       </p>
     </div>
   </div>
 );
};

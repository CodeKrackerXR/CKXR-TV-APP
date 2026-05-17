import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ShieldCheck, ChevronLeft, Info, Zap, RotateCw, Activity } from 'lucide-react';


interface CaesarCipherPageProps {
 onBack: () => void;
 onPlay?: (data: { code: string; shift: number }) => void;
 youtuber?: {
   name: string;
   avatar: string;
 };
}


const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");


export const CaesarCipherPage: React.FC<CaesarCipherPageProps> = ({ onBack, youtuber, onPlay }) => {
 const [inputText, setInputText] = useState('CODEKRACKER');
 const [shift, setShift] = useState(3);
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

 const { result, mapping } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/[^A-Z]/g, '');
   let res = '';
   const map: { [key: string]: string } = {};

   ALPHABET.forEach((l, i) => {
     const targetIdx = (i + (mode === 'ENCODE' ? shift : 26 - shift)) % 26;
     map[l] = ALPHABET[targetIdx];
   });

   for (const char of cleanText) {
     res += map[char] || char;
   }

   return { result: res, mapping: map };
 }, [inputText, shift, mode]);

 return (
   <div className="min-h-screen w-full bg-[#0a0a0a] text-white font-sans overflow-x-hidden p-4 md:p-8">
     {/* Main Title */}
     <div className="w-full text-center mb-12">
        <h1 className="text-5xl md:text-8xl font-black text-[#D4AF37] tracking-[0.1em] uppercase drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          Caesar Cipher
        </h1>
     </div>

     <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
       {/* Left Column */}
       <div className="lg:col-span-4 space-y-6">
         <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl p-6 shadow-2xl">
           <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
             <Zap className="w-6 h-6 text-[#D4AF37]" />
             Cipher Core
           </h2>

           <div className="space-y-8">
             <div>
               <label className="text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-3 block">Operation Mode</label>
               <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                 <button
                   onClick={() => setMode('ENCODE')}
                   className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${mode === 'ENCODE' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white/40 hover:text-white'}`}
                 >
                   Encode
                 </button>
                 <button
                   onClick={() => setMode('DECODE')}
                   className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${mode === 'DECODE' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white/40 hover:text-white'}`}
                 >
                   Decode
                 </button>
               </div>
             </div>

             <div>
                <label className="flex justify-between items-center text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-3">
                  <span>Rotation Shift (Key)</span>
                  <span className="text-[#D4AF37] text-sm">{ALPHABET[shift]}</span>
                </label>
                <input
                 type="range"
                 min="0"
                 max="25"
                 value={shift}
                 onChange={(e) => setShift(parseInt(e.target.value))}
                 className="w-full accent-[#D4AF37] cursor-pointer h-1.5 bg-white/10 rounded-full"
               />
               <div className="flex justify-between text-[10px] text-white/20 font-black mt-2">
                 <span>A</span>
                 <span>M</span>
                 <span>Z</span>
               </div>
             </div>

             <div>
               <label className="text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-3 block">Input Sequence</label>
               <textarea
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value.toUpperCase())}
                 className="w-full bg-black/40 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-all resize-none h-32"
               />
             </div>
           </div>
         </div>

         <div className="bg-[#1a0505] border border-[#441111] rounded-2xl p-6">
           <h3 className="flex items-center gap-2 text-xs font-black text-[#ff4444] uppercase tracking-widest mb-4">
             <Info className="w-4 h-4" />
             Cipher Intelligence
           </h3>
           <p className="text-[10px] text-white/60 leading-relaxed font-bold uppercase tracking-wider">
             The Caesar cipher is one of the earliest known and simplest ciphers. It is a type of substitution cipher in which each letter in the plaintext is 'shifted' a certain number of places down the alphabet.
           </p>
         </div>
       </div>

       {/* Right Column */}
       <div className="lg:col-span-8 space-y-6">
         <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
             <RotateCw className="w-5 h-5 text-[#D4AF37]" />
             Shift Mapping
           </h3>

           <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
             <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide">
               {ALPHABET.map((l, i) => (
                 <div key={i} className="flex flex-col items-center gap-3 min-w-[32px]">
                   <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                     {l}
                   </div>
                   <div className="text-[#D4AF37] text-[10px]">&darr;</div>
                   <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-xs font-black text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                     {mapping[l]}
                   </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
             <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#D4AF37]" />
                  Real-time Delta
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                    <span className="text-white/40">Plaintext</span>
                    <span className="text-white text-lg">A</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                    <span className="text-[#D4AF37]/40">Shifted</span>
                    <span className="text-[#D4AF37] text-3xl">{mapping['A']}</span>
                  </div>
                  <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: `${((shift) / 25) * 100}%` }}
                       className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"
                    />
                  </div>
                </div>
             </div>

             <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex items-center">
                <p className="text-xs text-white/50 font-bold uppercase leading-relaxed italic border-l-4 border-[#D4AF37] pl-6 py-2">
                  "Each letter is shifted by {shift} positions. In cryptography, this shift acts as the shared secret key between transmitter and receiver."
                </p>
             </div>
           </div>

           <div className="pt-10 border-t border-white/5">
              <div className="text-[10px] text-center font-black text-[#D4AF37]/40 uppercase tracking-[0.3em] mb-6">Generated Output</div>
              <div className="flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1 w-full bg-black/60 border-2 border-[#D4AF37] rounded-3xl p-8 shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col items-center justify-center min-h-[160px]">
                    <div className="text-4xl md:text-6xl font-black text-[#D4AF37] tracking-[0.2em] text-center leading-tight">
                      {result || '---'}
                    </div>
                 </div>
                 
                 <button
                   onClick={() => onPlay?.({ code: result, shift })}
                   className="w-full md:w-auto h-20 px-12 bg-white text-black font-black text-xl uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] whitespace-nowrap"
                 >
                   Play Challenge
                 </button>
              </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

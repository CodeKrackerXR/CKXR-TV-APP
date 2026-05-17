import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ShieldCheck, ChevronLeft, ChevronRight, Info, Zap } from 'lucide-react';


interface RailFencePageProps {
 onBack: () => void;
 onPlay?: (data: { code: string; rails: number; cols: number }) => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
 };
}


export const RailFencePage: React.FC<RailFencePageProps> = ({ onBack, youtuber, onPlay }) => {
 const [inputText, setInputText] = useState('CODEKRACKER');
 const [numRails, setNumRails] = useState(3);
 const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');


 const cleanTextLength = useMemo(() => {
   return inputText.toUpperCase().replace(/\s/g, '').length;
 }, [inputText]);


 // Rail Fence Encoding Logic
 const getEncodedData = (text: string, rails: number) => {
   if (rails <= 1) return { result: text, grid: [text.split('')] };
  
   const grid: string[][] = Array.from({ length: rails }, () => new Array(text.length).fill(''));
   let rail = 0;
   let direction = 1; // 1 for down, -1 for up


   for (let i = 0; i < text.length; i++) {
     grid[rail][i] = text[i];
     rail += direction;
     if (rail === rails - 1 || rail === 0) direction *= -1;
   }


   const result = grid.flat().filter(char => char !== '').join('');
   return { result, grid };
 };


 // Rail Fence Decoding Logic
 const getDecodedData = (cipher: string, rails: number) => {
   if (rails <= 1) return { result: cipher, grid: [cipher.split('')] };


   const grid: string[][] = Array.from({ length: rails }, () => new Array(cipher.length).fill(''));
  
   // First, mark the zig-zag path
   let rail = 0;
   let direction = 1;
   for (let i = 0; i < cipher.length; i++) {
     grid[rail][i] = '*'; // Placeholder
     rail += direction;
     if (rail === rails - 1 || rail === 0) direction *= -1;
   }


   // Fill the path with actual characters from cipher
   let index = 0;
   for (let r = 0; r < rails; r++) {
     for (let c = 0; c < cipher.length; c++) {
       if (grid[r][c] === '*' && index < cipher.length) {
         grid[r][c] = cipher[index++];
       }
     }
   }


   // Read the zig-zag path
   let result = '';
   rail = 0;
   direction = 1;
   for (let i = 0; i < cipher.length; i++) {
     result += grid[rail][i];
     rail += direction;
     if (rail === rails - 1 || rail === 0) direction *= -1;
   }


   return { result, grid };
 };


 const { result, grid } = useMemo(() => {
   const cleanText = inputText.toUpperCase().replace(/\s/g, '');
   return mode === 'ENCODE'
     ? getEncodedData(cleanText, numRails)
     : getDecodedData(cleanText, numRails);
 }, [inputText, numRails, mode]);


 const teamName = youtuber?.teamName || (youtuber?.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`);


 return (
   <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-20">
     {/* Background elements */}
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
         className="flex items-center gap-2 group hover:text-[#D4AF37] transition-colors"
       >
         <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
         <span className="font-bold uppercase tracking-widest text-sm text-white">Return to Hub</span>
       </button>
      
       <div className="w-24 hidden md:block" />
      
       <div className="w-24 hidden md:block" /> {/* Spacer */}
     </div>


     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
       {/* Title Section */}
       <div className="text-center mb-12">
         <motion.h1
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="font-black text-4xl md:text-6xl text-[#D4AF37] uppercase tracking-tighter mb-2 italic"
         >
           Rail Fence Cipher
         </motion.h1>
         <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs md:text-sm"
         >
           Tactical Visual Transposition Encryption
         </motion.p>
       </div>


       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         {/* Controls - Left Side */}
         <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <h2 className="font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2 italic">
               <Zap className="w-5 h-5 text-[#D4AF37]" />
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


               {/* Rails & Cols Control */}
               <div className="space-y-4">
                 <div className="flex gap-4">
                   <div className="flex-1 bg-black/60 border-2 border-[#22c55e]/40 rounded-xl p-4 text-center">
                     <label className="block text-[10px] uppercase tracking-widest text-[#22c55e]/60 font-black mb-1">Rails (Key)</label>
                     <div className="font-black text-5xl text-[#22c55e] tabular-nums italic">{numRails}</div>
                   </div>
                   <div className="flex-1 bg-black/60 border-2 border-[#22c55e]/40 rounded-xl p-4 text-center">
                     <label className="block text-[10px] uppercase tracking-widest text-[#22c55e]/60 font-black mb-1">Columns</label>
                     <div className="font-black text-5xl text-[#22c55e] tabular-nums italic">{cleanTextLength}</div>
                   </div>
                 </div>


                 <div>
                   <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2 flex justify-between">
                     <span>Adjust Number of Rails</span>
                     <span className="text-[#D4AF37]">{numRails}</span>
                   </label>
                   <input
                     type="range"
                     min="2"
                     max="6"
                     step="1"
                     value={numRails}
                     onChange={(e) => setNumRails(parseInt(e.target.value))}
                     className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                   />
                   <div className="flex justify-between text-[10px] text-white/20 font-bold mt-1">
                     <span>2</span>
                     <span>3</span>
                     <span>4</span>
                     <span>5</span>
                     <span>6</span>
                   </div>
                 </div>
               </div>


               {/* Input Text */}
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Input Message</label>
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value.substring(0, 30))}
                   className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-xl text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors resize-none uppercase"
                   rows={2}
                   placeholder="Enter message..."
                 />
                 <p className="text-right text-[10px] text-white/30 uppercase mt-1">Max 30 Characters</p>
               </div>
             </div>
           </div>


           {/* Info Box */}
           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl hidden lg:block">
             <h3 className="flex items-center gap-2 font-black uppercase text-sm text-blue-400 mb-3">
               <Info className="w-4 h-4" />
               How it works
             </h3>
             <p className="text-xs text-white/70 leading-relaxed font-medium capitalize">
               Also known as the zig-zag cipher. it works by writing your message diagonally down and up across several "rails" of an imaginary fence, then reading off each rail horizontally.
             </p>
           </div>
         </div>


         {/* Visualization - Right Side */}
         <div className="lg:col-span-8 space-y-6">
           {/* Visualizer Card */}
           <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden min-h-[400px] flex flex-col">
             <div className="bg-black/60 px-6 py-4 border-b border-white/10 flex justify-between items-center">
               <h2 className="font-black text-xl text-white uppercase tracking-widest flex items-center gap-2 italic">
                 <ShieldCheck className="w-5 h-5 text-blue-500" />
                 Tactical Visualization
               </h2>
               <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75" />
                 <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse delay-150" />
               </div>
             </div>


             <div className="flex-1 p-4 md:p-8 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
               <div className="inline-block min-w-full">
                 <div className="grid gap-2" style={{ gridTemplateRows: `repeat(${numRails}, minmax(48px, 1fr))` }}>
                   {grid.map((row, rIdx) => (
                     <div key={rIdx} className="flex gap-2 min-w-max h-12 md:h-16">
                       {row.map((char, cIdx) => (
                         <motion.div
                           key={`${rIdx}-${cIdx}`}
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: (rIdx + cIdx) * 0.02 }}
                           className={`w-12 md:w-16 flex items-center justify-center rounded-lg font-black text-xl md:text-2xl border transition-all duration-300 relative
                             ${char !== ''
                               ? 'bg-[#D4AF37] text-black border-white/20 shadow-[0_0_15px_rgba(212,175,55,0.3)] z-10'
                               : 'bg-black/40 text-transparent border-white/5 opacity-20'}`}
                         >
                           {char}
                           {/* Zig-zag Path Connector (Simplified visual) */}
                           {char !== '' && (
                             <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                           )}
                         </motion.div>
                       ))}
                     </div>
                   ))}
                 </div>
               </div>
             </div>


             <div className="bg-black/40 p-6 border-t border-white/10">
               <div className="flex flex-col md:flex-row items-center gap-4">
                 <div className="flex-1 w-full">
                   <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Output String</label>
                   <div className="bg-black/80 border-2 border-[#D4AF37] rounded-xl px-6 py-3 font-black text-2xl text-center text-[#D4AF37] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] tracking-[0.2em] font-mono">
                     {result || '---'}
                   </div>
                 </div>
                
                 <VaultButton
                   variant="primary"
                   className="w-full md:w-auto h-16 px-8 bg-[#008044] hover:bg-[#006435] border-green-400"
                   onClick={() => {
                      if (onPlay) {
                        onPlay({ code: result, rails: numRails, cols: cleanTextLength });
                      }
                   }}
                 >
                   Try out the Cipher
                 </VaultButton>
               </div>
             </div>
           </div>


           {/* Mobile Info (Visible only on small screens) */}
           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl lg:hidden">
             <h3 className="flex items-center gap-2 font-black uppercase text-sm text-blue-400 mb-3">
               <Info className="w-4 h-4" />
               How it works
             </h3>
             <p className="text-xs text-white/70 leading-relaxed font-medium">
               Write message in a zig-zag across multiple rails, then read rail-by-rail.
             </p>
           </div>
         </div>
       </div>
     </div>


     <div className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Tactical Transposition Interface
       </p>
     </div>
    
     {/* Global Scanline Effect */}
     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

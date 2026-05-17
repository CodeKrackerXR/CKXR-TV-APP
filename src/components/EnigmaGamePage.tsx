import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ChevronLeft, Info, Zap, CheckCircle2, Settings, ShieldCheck } from 'lucide-react';
import { ROTOR_WIRINGS, ALPHABET, getLetterAtMarker, getOffsetForChar } from '../lib/enigmaUtils';

interface EnigmaGamePageProps {
 onBack: () => void;
 initialCode: string;
 initialKey: string; // "A-B-C"
 onPostResults: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
}

export const EnigmaGamePage: React.FC<EnigmaGamePageProps> = ({ onBack, initialCode, initialKey, onPostResults }) => {
 const [elapsedMs, setElapsedMs] = useState(0);
 const [isFinished, setIsFinished] = useState(false);
  // Gear state
 const [userKey, setUserKey] = useState<string[]>(['', '', '']);
 const isKeyComplete = userKey.every(k => k !== '');

 const k1 = getOffsetForChar(ROTOR_WIRINGS[0], userKey[0] || 'A');
 const k2 = getOffsetForChar(ROTOR_WIRINGS[1], userKey[1] || 'A');
 const k3 = getOffsetForChar(ROTOR_WIRINGS[2], userKey[2] || 'A');

 const [rotation, setRotation] = useState(0); // Delta rotation in degrees
 const [isDragging, setIsDragging] = useState(false);
 const wheelRef = useRef<HTMLDivElement>(null);

 const cleanCode = initialCode.toUpperCase().replace(/[^A-Z]/g, '');
 const [userDecoded, setUserDecoded] = useState<string[]>(new Array(cleanCode.length).fill(''));
 const [activeIndex, setActiveIndex] = useState(0);
 const letterInputRefs = useRef<(HTMLInputElement | null)[]>([]);
 const keyInputRefs = useRef<(HTMLInputElement | null)[]>([]);

 // Timer logic
 useEffect(() => {
   if (isFinished) return;
   const interval = setInterval(() => {
     setElapsedMs(prev => prev + 10);
   }, 10);
   return () => clearInterval(interval);
 }, [isFinished]);

 const formatTimeFull = (ms: number) => {
   const totalSeconds = Math.floor(ms / 1000);
   const m = Math.floor(totalSeconds / 60);
   const s = totalSeconds % 60;
   const c = Math.floor((ms % 1000) / 10);
   return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
 };

 const getAngle = (clientX: number, clientY: number) => {
   if (!wheelRef.current) return 0;
   const rect = wheelRef.current.getBoundingClientRect();
   const centerX = rect.left + rect.width / 2;
   const centerY = rect.top + rect.height / 2;
   return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
 };

 const lastAngle = useRef(0);
 const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
   if (!isKeyComplete) return; // Prevent manual rotation until key is set
   const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
   const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
   lastAngle.current = getAngle(clientX, clientY);
   setIsDragging(true);
 };

 useEffect(() => {
   const handleMove = (e: MouseEvent | TouchEvent) => {
     if (!isDragging) return;
     const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
     const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
     const currentAngle = getAngle(clientX, clientY);
     let delta = currentAngle - lastAngle.current;
     if (delta > 180) delta -= 360;
     if (delta < -180) delta += 360;
     setRotation(prev => prev + delta);
     lastAngle.current = currentAngle;
   };
   const handleEnd = () => setIsDragging(false);
   window.addEventListener('mousemove', handleMove);
   window.addEventListener('mouseup', handleEnd);
   window.addEventListener('touchmove', handleMove);
   window.addEventListener('touchend', handleEnd);
   return () => {
     window.removeEventListener('mousemove', handleMove);
     window.removeEventListener('mouseup', handleEnd);
     window.removeEventListener('touchmove', handleMove);
     window.removeEventListener('touchend', handleEnd);
   };
 }, [isDragging]);

 // Current offsets based on delta rotation
 const degPerStep = 360 / 26;
 const deltaSteps = rotation / degPerStep;
 const currentO3 = k3 + deltaSteps;
 const currentO2 = k2 - deltaSteps; // Reverses
 const currentO1 = k1 + deltaSteps; // Reverses again

 const charOnW1 = getLetterAtMarker(ROTOR_WIRINGS[0], Math.round(currentO1));
 const charOnW2 = getLetterAtMarker(ROTOR_WIRINGS[1], Math.round(currentO2));
 const charOnW3 = getLetterAtMarker(ROTOR_WIRINGS[2], Math.round(currentO3));

 const handleKeyInput = (index: number, val: string) => {
   const char = val.toUpperCase().slice(-1);
   if (!ALPHABET.includes(char) && char !== '') return;
   const newKey = [...userKey];
   newKey[index] = char;
   setUserKey(newKey);
   if (char && index < 2) {
     keyInputRefs.current[index + 1]?.focus();
   }
 };

 const handleCharInput = (index: number, val: string) => {
   const char = val.toUpperCase().slice(-1);
   if (!ALPHABET.includes(char) && char !== '') return;
   const newDecoded = [...userDecoded];
   newDecoded[index] = char;
   setUserDecoded(newDecoded);
   if (char && index < cleanCode.length - 1) {
     setActiveIndex(index + 1);
     letterInputRefs.current[index + 1]?.focus();
   }
 };

 const getWheelDisplay = (wiring: string, currentStepOffset: number) => {
   const parentRotation = currentStepOffset * degPerStep;
   return wiring.split('').map((letter, i) => {
     const charAngle = (i / 26) * 360;
     return (
       <div key={i} className="absolute inset-0 flex flex-col items-center" style={{ transform: `rotate(${charAngle}deg)` }}>
         <div className="w-[1px] h-4 bg-white/5 mb-2" />
         <motion.div
           transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
           animate={{ rotate: -charAngle - parentRotation }}
           className="font-black text-sm md:text-lg text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] brightness-125"
         >
           {letter}
         </motion.div>
       </div>
     );
   });
 };

 const targetWheel = (activeIndex % 2 === 0) ? 0 : 1;
 const sourceChar = cleanCode[activeIndex];

 return (
   <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-32">
     <div
       className="fixed inset-0 z-0 pointer-events-none"
       style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1 }}
     />
     <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
     <div className="fixed inset-0 z-0 bg-mesh opacity-10 pointer-events-none" />

     {/* Floating Timer */}
     <div className="fixed right-6 top-8 md:top-10 z-[120] pointer-events-none">
       <div className="bg-[#D4AF37]/10 border-2 border-[#D4AF37]/40 backdrop-blur-xl px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.2)] text-center min-w-[140px] md:min-w-[180px]">
         <div className="text-[10px] md:text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Elapsed Time</div>
         <div className="font-mono text-2xl md:text-4xl font-black text-white tabular-nums tracking-tighter">
           {formatTimeFull(elapsedMs)}
         </div>
       </div>
     </div>

     {/* Header */}
     <div className="relative z-50 w-full flex justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 items-center px-8">
       <button onClick={onBack} className="flex items-center gap-2 group hover:text-[#D4AF37] transition-colors">
         <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
         <span className="font-bold uppercase tracking-widest text-sm text-white">Return to Hub</span>
       </button>
       <img src={ASSETS.LANDING_BANNER} alt="CKXR" className="h-10 md:h-14 w-auto object-contain" />
       <div className="w-24 hidden md:block" />
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl flex-1">
       {/* Mission Control Bar */}
       <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-3xl p-6 lg:p-8 mb-12 backdrop-blur-xl shadow-2xl">
         <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-8 lg:gap-16">
           {/* Enigma Key Setup */}
           <div className="flex flex-col items-center lg:items-start gap-4">
             <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] flex items-center gap-2 italic">
                 <Settings className="w-4 h-4 text-[#D4AF37]" />
                 Enigma Key Protocol
             </h3>
             <div className="flex gap-4 font-mono">
                 {[0, 1, 2].map(i => (
                   <div key={i} className="flex flex-col items-center gap-2">
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Rotor {i+1}</span>
                     <input
                       ref={el => keyInputRefs.current[i] = el}
                       type="text"
                       className={`w-14 h-16 md:w-16 md:h-20 bg-black border-2 rounded-xl text-center font-black text-2xl md:text-3xl transition-all uppercase focus:outline-none focus:ring-1 focus:ring-[#D4AF37]
                         ${userKey[i] ? 'border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-white/10 text-white/20'}`}
                       value={userKey[i]}
                       onChange={(e) => handleKeyInput(i, e.target.value)}
                       maxLength={1}
                       placeholder="?"
                     />
                   </div>
                 ))}
             </div>
           </div>

           {/* Intercepted Content (Centered) */}
           <div className="w-full flex flex-col items-center lg:border-x lg:border-white/5 lg:px-8">
             <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4 flex items-center gap-2 italic">
               <ShieldCheck className="w-4 h-4 text-green-500" />
               Intercepted Sequence
             </h3>
             <div className="flex gap-2 flex-wrap justify-center">
               {cleanCode.split('').map((char, i) => (
                 <div key={i} className={`w-10 h-12 md:w-12 md:h-14 rounded-lg flex items-center justify-center font-black text-xl transition-all border-2
                   ${i === activeIndex ? 'bg-[#D4AF37] text-black border-white shadow-[0_0_20px_rgba(212,175,55,1)] scale-110' :
                     userDecoded[i] ? 'bg-white/5 border-white/10 text-white/20' : 'bg-blue-500/10 border-blue-500/40 text-blue-400'}`}
                 >
                   {char}
                 </div>
               ))}
             </div>
           </div>

           {/* Right Side Status Info */}
           <div className="hidden lg:flex flex-col items-center lg:items-end gap-2 text-right">
              <div className="bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-xl">
                <div className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-1">Signal Status</div>
                <div className="text-xs font-bold text-white/80">Secured & Encrypted</div>
              </div>
              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest max-w-[180px] leading-relaxed italic">
                Adjust rotor offset to map intercepted signal to clear text.
              </p>
           </div>
         </div>
       </div>

       <div className="relative flex flex-col items-center overflow-hidden">
         {/* Top Readout Row */}
         <div className="flex justify-center gap-2 md:gap-4 w-full max-w-7xl px-4 mb-4 relative z-20">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex flex-col items-center w-64 md:w-80 lg:w-[440px]">
                <div className={`px-4 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] mb-4 ${i === targetWheel ? 'border-green-500 text-green-400' : 'border-white/10 text-white/30'}`}>
                  {i === 2 ? 'Answer' : `Code ${i+1}`}
                </div>
              </div>
            ))}
         </div>

         {/* Gear Row */}
         <div className="flex justify-center gap-1 md:gap-2 w-full max-w-full py-8">
            {/* Wheel 1 */}
            <div className="relative w-64 md:w-80 lg:w-[440px] aspect-square">
               <motion.div
                 transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
                 animate={{ rotate: currentO1 * degPerStep }}
                 className="w-full h-full rounded-full border-4 border-white/10 bg-black/60 shadow-[0_0_50px_rgba(0,0,0,1)] relative"
               >
                  {getWheelDisplay(ROTOR_WIRINGS[0], currentO1)}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1/3 h-1/3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none">
                       <span className="font-black text-2xl md:text-5xl text-white/20">I</span>
                    </div>
                  </div>
               </motion.div>
               {/* Result Readout */}
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className={`text-2xl md:text-4xl font-black transition-all duration-300 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]
                    ${targetWheel === 0 ? 'scale-125 brightness-125' : 'opacity-90'}`}>
                     {charOnW1}
                  </div>
               </div>
            </div>

            {/* Wheel 2 */}
            <div className="relative w-64 md:w-80 lg:w-[440px] aspect-square">
               <motion.div
                 transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
                 animate={{ rotate: currentO2 * degPerStep }}
                 className="w-full h-full rounded-full border-4 border-white/10 bg-black/60 shadow-[0_0_50px_rgba(0,0,0,1)] relative"
               >
                  {getWheelDisplay(ROTOR_WIRINGS[1], currentO2)}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1/3 h-1/3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-none">
                       <span className="font-black text-2xl md:text-5xl text-white/20">II</span>
                    </div>
                  </div>
               </motion.div>
               {/* Result Readout */}
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className={`text-2xl md:text-4xl font-black transition-all duration-300 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]
                    ${targetWheel === 1 ? 'scale-125 brightness-125' : 'opacity-90'}`}>
                     {charOnW2}
                  </div>
               </div>
            </div>

            {/* Wheel 3 (Draggable) */}
            <div className="relative w-64 md:w-80 lg:w-[440px] aspect-square">
               <motion.div
                 ref={wheelRef}
                 onMouseDown={handleStart}
                 onTouchStart={handleStart}
                 animate={{
                   rotate: currentO3 * degPerStep,
                 }}
                 transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 60, damping: 20 }}
                 style={{
                   cursor: !isKeyComplete ? 'not-allowed' : isDragging ? 'grabbing' : 'grab'
                 }}
                 className={`w-full h-full rounded-full border-4 bg-black/40 relative shadow-[0_0_50px_rgba(0,0,0,1)] transition-all duration-500
                   ${isKeyComplete ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5 shadow-[0_0_50px_rgba(212,175,55,0.1)]' : 'border-white/5 grayscale'}`}
               >
                  {getWheelDisplay(ROTOR_WIRINGS[2], currentO3)}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-1/3 h-1/3 rounded-full border flex items-center justify-center transition-colors duration-500
                      ${isKeyComplete ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40' : 'bg-white/5 border-white/10'}`}>
                       <span className={`font-black text-2xl md:text-5xl transition-colors duration-500
                         ${isKeyComplete ? 'text-[#D4AF37]' : 'text-white/10'}`}>III</span>
                    </div>
                  </div>
               </motion.div>
               {/* Current Setting Marker */}
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="text-2xl md:text-4xl font-black text-[#D4AF37] transition-all duration-300 drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] brightness-125 text-center">
                     {!isKeyComplete && <span className="text-[10px] block mb-1 opacity-40">LOCKED</span>}
                     {charOnW3}
                  </div>
               </div>
            </div>
         </div>
       </div>

       {/* Decryption Interface */}
       <div className="mt-24 space-y-12">
         <div className="flex flex-col items-center gap-8">
            {!isKeyComplete ? (
              <div className="bg-black/60 border border-[#D4AF37]/30 p-8 rounded-3xl text-center max-w-md animate-pulse">
                 <Settings className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
                 <h4 className="font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 italic">Protocol Uninitialized</h4>
                 <p className="text-xs text-white/50 leading-relaxed font-bold uppercase">
                   The Enigma Array is currently offline. Please input the 3-letter decryption key in the control protocol above to engage the rotor gears.
                 </p>
              </div>
            ) : (
              <>
                <div className="flex gap-4 mb-4 flex-wrap justify-center font-mono">
                   {userDecoded.map((char, i) => (
                     <div key={i} className="flex flex-col items-center gap-4">
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{cleanCode[i]}</div>
                        <input
                         ref={el => letterInputRefs.current[i] = el}
                         type="text"
                         className={`w-14 h-14 md:w-20 md:h-20 bg-black/60 border-2 rounded-2xl text-center font-black text-2xl md:text-4xl transition-all uppercase focus:outline-none
                           ${activeIndex === i ? 'border-[#D4AF37] text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5 text-white/40'}`}
                         value={char}
                         onChange={(e) => handleCharInput(i, e.target.value)}
                         onFocus={() => setActiveIndex(i)}
                         maxLength={1}
                       />
                     </div>
                   ))}
                </div>

                {!isFinished ? (
                  <VaultButton
                   variant="primary"
                   className={`py-6 px-16 text-xl transition-all duration-500 bg-green-600 hover:bg-green-500 border-green-400
                     ${userDecoded.every(c => c !== '') ? 'shadow-[0_0_30px_rgba(255,255,255,0.2)] opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}
                   onClick={() => setIsFinished(true)}
                  >
                    <CheckCircle2 className="mr-3" />
                    CRACK CODE
                  </VaultButton>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-8"
                  >
                     <div className="bg-[#D4AF37] text-black px-12 py-4 rounded-full font-black text-xl uppercase tracking-widest flex items-center gap-3 shadow-[0_0_30px_rgba(212,175,55,0.5)] italic">
                       Intel Cracked
                     </div>
                     <button
                        onClick={() => onPostResults({
                          gameCode: userDecoded.join(''),
                          time: formatTimeFull(elapsedMs),
                          sponsorKey: userKey.join('-')
                        })}
                        className="mt-4 bg-[#D4AF37] text-black px-12 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-white hover:text-black transition-all"
                      >
                        Post Intelligence Results
                      </button>
                     <VaultButton onClick={onBack} className="py-4 px-8 bg-white text-black border-white hover:bg-[#D4AF37]">RETURN TO HUB</VaultButton>
                  </motion.div>
                )}
              </>
            )}
         </div>
       </div>
     </div>

     <footer className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
       <p className="font-bold text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Enigma Rotor Protocol v2.0
       </p>
     </footer>
     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline" />
   </div>
 );
};

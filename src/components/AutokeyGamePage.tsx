import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ChevronLeft, Zap, CheckCircle2 } from 'lucide-react';

interface AutokeyGamePageProps {
 onBack: () => void;
 initialCode: string;
 initialKey: string;
 targetText?: string;
 onPostResults?: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
 youtuber?: {
   name: string;
   avatar: string;
   teamName?: string;
   sponsor?: {
     name: string;
   };
 };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const AutokeyGamePage: React.FC<AutokeyGamePageProps> = ({ onBack, initialCode, initialKey, targetText, onPostResults, youtuber }) => {
 const [userKeyword, setUserKeyword] = useState('');
 const [crackedLetters, setCrackedLetters] = useState('');
 const [isFinished, setIsFinished] = useState(false);
 const [elapsedMs, setElapsedMs] = useState(0);
 const [showCongratulationPopup, setShowCongratulationPopup] = useState(false);

 // Interactive state for grid row and column highlighting
 const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
 const [selectedColIndex, setSelectedColIndex] = useState<number | null>(null);
 
 // Solving Popup state
 const [showPopup, setShowPopup] = useState(false);
 const [popupData, setPopupData] = useState({ keyword: '', cipher: '', cracked: '' });

 // Timer logic
 const keywordInputRef = useRef<HTMLInputElement>(null);

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
   
   if (m >= 60) return "59:59:99";
   return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
 };

 const handleRowClick = (index: number) => {
   if (isFinished) return;
   if (selectedRowIndex === index) {
     setSelectedRowIndex(null);
     setSelectedColIndex(null);
     setShowPopup(false);
   } else {
     setSelectedRowIndex(index);
     setSelectedColIndex(null);
     setShowPopup(false);
   }
 };

 const handleCellClick = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
   e.stopPropagation();
   if (isFinished) return;
   if (selectedRowIndex === rowIndex) {
     setSelectedColIndex(colIndex);
     const rowLetter = ALPHABET[rowIndex];
     // Vigenere Tableau logic for Autokey: Row(Key) + Col(Plain) = Cell(Cipher)
     const charIndex = (rowIndex + colIndex) % 26;
     const cipherLetter = ALPHABET[charIndex];
     const colLetter = ALPHABET[colIndex];
    
     setPopupData({
       keyword: rowLetter,
       cipher: cipherLetter,
       cracked: colLetter
     });
     setShowPopup(true);
   }
 };

 const handleAccept = (e: React.MouseEvent) => {
   e.stopPropagation();
   if (isFinished) return;
   setCrackedLetters(prev => prev + popupData.cracked);
   setShowPopup(false);
   setSelectedRowIndex(null);
   setSelectedColIndex(null);
 };

 // Autokey Keystream logic: Primer + Plaintext(Cracked)
 const currentKeystream = (userKeyword + crackedLetters).toUpperCase().slice(0, initialCode?.length || 0);
 const nextPairIndex = crackedLetters.length;
 const nextKeystreamLetter = currentKeystream[nextPairIndex] || '-';
 const nextCipherLetter = initialCode[nextPairIndex] || '-';

 const panelHeaderStyle = "bg-black/60 text-white font-display font-black text-[22px] lg:text-[30px] py-2 px-4 uppercase text-center tracking-widest border-b border-vault-gold/10";

 const handleFinish = () => {
    setIsFinished(true);
    setShowCongratulationPopup(true);
 };

 return (
   <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-20" onClick={() => setShowPopup(false)}>
     <div
       className="fixed inset-0 z-0 pointer-events-none opacity-20"
       style={{
         backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
         backgroundSize: 'cover',
         backgroundPosition: 'center',
       }}
     />
     <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />

     {/* Mission Timer */}
     <div className="fixed top-32 right-8 z-[100] flex flex-col items-end space-y-2 pointer-events-none">
        <div className="bg-zinc-900/40 border-2 border-vault-gold/40 backdrop-blur-xl px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center min-w-[120px]">
             <div className="text-[10px] font-black text-vault-gold uppercase tracking-widest mb-1">Mission Time</div>
             <div className="font-mono text-xl md:text-2xl font-black text-white tabular-nums">{formatTimeFull(elapsedMs)}</div>
        </div>
     </div>

     {/* Header */}
     <div className="relative z-[70] w-full pt-12 px-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-start">
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 group hover:text-vault-gold transition-all bg-black/60 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md shadow-2xl"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-vault-gold" />
                    <span className="font-black uppercase tracking-widest text-[10px] text-white">Return to Encoder</span>
                </button>
            </div>

            <div className="w-full flex flex-col items-center">
                <motion.h1
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-black text-4xl md:text-6xl text-vault-gold uppercase tracking-tighter mb-2 italic text-center"
                >
                  Autokey Cipher Decoder
                </motion.h1>
                <p className="text-[#22c55e] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-12">
                  Code Cracking Game
                </p>
            </div>
        </div>
     </div>

     <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
         <div className="lg:col-span-12">
           <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Mission Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <div>
                     <label className="block text-[10px] text-green-500 uppercase tracking-widest font-black mb-2">Type in Key Word (Primer)</label>
                     <input
                       ref={keywordInputRef}
                       type="text" 
                       value={userKeyword}
                       onChange={(e) => !isFinished && setUserKeyword(e.target.value.toUpperCase())}
                       disabled={isFinished}
                       className="w-full bg-black/60 border border-green-500/30 rounded-lg p-3 font-display font-bold text-green-500 focus:outline-none focus:border-green-500 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                       placeholder="ENTER PRIMER"
                     />
                   </div>
                 </div>

                 <div className="flex flex-col justify-center items-center bg-black/40 rounded-xl p-6 border border-white/5 overflow-x-auto">
                   <div className="min-w-max flex flex-col items-center">
                      <label className="block text-[10px] text-blue-500/60 uppercase tracking-widest font-black mb-2">Keystream (Primer + Cracked)</label>
                      <div className="flex justify-center gap-1 mb-2 border-b border-white/10 pb-2 w-full">
                        {(currentKeystream || '---').split('').map((l, i) => (
                          <div key={i} className="font-display font-black text-2xl text-blue-500 w-10 h-10 flex items-center justify-center bg-blue-500/10 rounded">{l}</div>
                        ))}
                      </div>
                      <div className="flex justify-center gap-1 w-full">
                        {(initialCode || '---').split('').map((l, i) => (
                          <div key={i} className="font-display font-black text-2xl text-[#ef4444] w-10 h-10 flex items-center justify-center bg-red-500/10 rounded">{l}</div>
                        ))}
                      </div>
                      <label className="block text-[10px] text-[#ef4444]/60 uppercase tracking-widest font-black mt-2">Ciphered Text</label>
                   </div>
                 </div>
              </div>
           </div>
         </div>
       </div>

       {/* Floating Indicators */}
       <div className="fixed right-0 top-1/2 -translate-y-1/2 w-[55px] md:w-[75px] z-[120] flex flex-col pointer-events-none shadow-2xl">
         <div className="bg-blue-600 flex flex-col items-center justify-center border-b border-black/20 pointer-events-auto py-2">
           <span className="text-[8px] font-black text-white/60 uppercase tracking-tighter mb-0.5">ROW</span>
           <span className="text-white font-display font-black text-[24px] md:text-[32px] uppercase leading-none">{nextKeystreamLetter}</span>
         </div>
         <div className="bg-vault-gold flex flex-col items-center justify-center pointer-events-auto py-2 shadow-inner">
            <span className="text-[8px] font-black text-black/60 uppercase tracking-tighter mb-0.5">TARGET</span>
            <span className="text-red-700 font-display font-black text-[24px] md:text-[32px] uppercase leading-none">{nextCipherLetter}</span>
         </div>
       </div>

       {/* Code Centered */}
       <div className="w-full flex flex-col items-center mb-8">
          <p className="text-[#ebc805]/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-center">Code To Be Cracked</p>
          <div className="text-[#ebc805] font-display font-black text-5xl md:text-7xl tracking-[0.2em] italic uppercase text-center drop-shadow-[0_0_20px_rgba(235,200,5,0.4)]">
            {initialCode || '---'}
          </div>
          <div className="w-24 h-1 bg-[#ebc805]/30 mt-4 rounded-full blur-sm" />
       </div>

       {/* Grid */}
       <div className="w-full bg-vault-panel/95 backdrop-blur-2xl border border-vault-gold/40 rounded-xl overflow-hidden shadow-2xl mb-10 relative">
         <div className="bg-[#ef4444] text-white font-display font-black text-[24px] md:text-[28px] py-3 px-6 uppercase text-center tracking-[0.4em]">
           Tabula Recta (The Grid)
         </div>
         <div className="overflow-x-auto scrollbar-hide relative">
           <table className="w-full table-fixed min-w-[1050px] border-collapse relative">
             <thead>
               <tr>
                 <th className="w-[45px] md:w-[65px] bg-[#ef4444] border border-white/20"></th>
                 <th className="w-12 bg-[#ef4444] border border-white/20"></th>
                 {ALPHABET.map((label, i) => {
                   const isSelectedCol = selectedColIndex === i;
                   return (
                     <th key={i} className={`border border-white/20 py-1 text-[11px] font-display font-black uppercase leading-none transition-colors duration-300 ${isSelectedCol ? 'bg-vault-gold text-black' : 'bg-[#ef4444] text-white'}`}>
                       {label}
                     </th>
                   );
                 })}
               </tr>
             </thead>
             <tbody>
               {ALPHABET.map((rowLetter, rowIndex) => {
                 const isSelectedRow = selectedRowIndex === rowIndex;
                 return (
                   <tr key={rowLetter} className={`group transition-colors duration-200 ${isSelectedRow ? 'bg-blue-900/60' : ''}`}>
                     {rowIndex === 0 && (
                       <td
                         rowSpan={26}
                         className="bg-[#3b82f6] text-white font-display font-black border-r border-white/20 select-none relative"
                       >
                         <div className="absolute inset-0 flex items-center justify-center">
                           <div className="uppercase tracking-[0.5em] text-[18px] md:text-[24px] -rotate-90 whitespace-nowrap">
                             Keystream
                           </div>
                         </div>
                       </td>
                     )}
                     <td
                       onClick={(e) => { e.stopPropagation(); handleRowClick(rowIndex); }}
                       className={`border border-white/20 py-2 text-center font-display font-black text-[22px] cursor-pointer transition-all duration-300 select-none ${isSelectedRow ? 'bg-blue-600 text-vault-gold shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-[#3b82f6] text-white hover:bg-blue-400'}`}
                     >
                       {rowLetter}
                     </td>
                     {ALPHABET.map((colLetter, colIndex) => {
                       // Vigenere for Autokey: Row + Col = Cipher
                       const charIndex = (rowIndex + colIndex) % 26;
                       const displayChar = ALPHABET[charIndex];
                       const isSelectedCol = selectedColIndex === colIndex;
                       const isIntersection = isSelectedRow && isSelectedCol;
                       let cellClasses = "border border-white/10 text-center font-sans font-bold text-[18px] md:text-[22px] transition-all duration-150 select-none ";
                       if (isIntersection) cellClasses += "bg-vault-gold text-red-600 font-black scale-110 z-10 shadow-[0_0_20px_rgba(212,175,55,0.8)] cursor-pointer";
                       else if (isSelectedRow) cellClasses += "text-white cursor-pointer hover:bg-vault-gold/20 ";
                       else cellClasses += "text-gray-200 group-hover:bg-vault-gold/5 cursor-default ";
                       return (
                         <td key={colLetter} onClick={(e) => handleCellClick(rowIndex, colIndex, e)} className={cellClasses}>
                           {displayChar}
                         </td>
                       );
                     })}
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
       </div>

       {/* Popup */}
       {showPopup && (
         <div
           className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200]"
           onClick={(e) => e.stopPropagation()}
         >
           <div className="bg-vault-panel/95 border-2 border-vault-gold p-8 rounded-2xl shadow-[0_0_60px_rgba(212,175,55,0.5)] backdrop-blur-2xl min-w-[380px] text-center relative overflow-hidden">
              <div className="space-y-6 font-display font-black uppercase tracking-widest">
                <p className="text-white text-xl">
                  KEYSTREAM LETTER: <span className="text-[#ebc805]/90">[{popupData.keyword}]</span>
                </p>
                <p className="text-white text-xl">
                  CIPHER LETTER: <span className="text-[#ebc805]/90">[{popupData.cipher}]</span>
                </p>
                <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-3">
                  <span className="text-white/60 text-xs tracking-[0.3em]">CRACKED LETTER:</span>
                  <div className="w-24 h-24 bg-black/80 border-2 border-[#ebc805] rounded-xl flex items-center justify-center shadow-[0_0_40px_rgba(235,200,5,0.6)]">
                    <span className="text-6xl text-[#22c55e] font-display font-black">{popupData.cracked}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={handleAccept} className="flex-1 bg-green-600 text-white py-4 font-display font-black uppercase tracking-widest text-sm hover:bg-green-500 transition-all rounded-lg shadow-lg active:scale-95">Accept</button>
                 <button onClick={() => setShowPopup(false)} className="flex-1 bg-red-600 text-white py-4 font-display font-black uppercase tracking-widest text-sm hover:bg-red-500 transition-all rounded-lg shadow-lg active:scale-95">Cancel</button>
              </div>
           </div>
         </div>
       )}

       {/* Output */}
       <div className="w-full bg-vault-panel/90 border border-vault-gold/20 rounded-lg overflow-hidden shadow-lg mb-10">
         <div className={panelHeaderStyle}>Decrypted Intelligence Output</div>
         <div className="p-6 md:p-10 flex flex-col items-center justify-center gap-6">
           <div className="relative w-full">
             <div className="w-full bg-black/80 border-2 border-vault-gold rounded-2xl p-8 font-display font-black text-4xl md:text-7xl text-vault-gold shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] tracking-[0.2em] break-all uppercase min-h-[140px] flex items-center justify-center text-center">
               {crackedLetters || '---'}
             </div>
             {crackedLetters && !isFinished && (
               <button onClick={() => setCrackedLetters(prev => prev.slice(0, -1))} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-red-500 transition-colors">
                 <Zap className="w-6 h-6 rotate-180" />
               </button>
             )}
           </div>
           <div className="flex justify-center mt-4">
             {!isFinished ? (
               <VaultButton variant="primary" className="py-6 px-12 text-lg" onClick={handleFinish}>
                 <CheckCircle2 className="w-6 h-6 mr-3" />
                 CRACK CODE
               </VaultButton>
             ) : (
               <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                 <div className="bg-vault-gold text-black px-10 py-4 rounded-full font-display font-black text-sm uppercase tracking-widest flex items-center gap-2">
                   <CheckCircle2 className="w-6 h-6" />
                   Mission Complete
                 </div>
                 <p className="text-vault-gold text-xs font-black uppercase tracking-[0.3em] bg-black/40 px-4 py-1 rounded-lg border border-vault-gold/20">Time: {formatTimeFull(elapsedMs)}</p>
               </motion.div>
             )}
           </div>
         </div>
       </div>
     </div>

     {/* Success Popup */}
     <AnimatePresence>
        {showCongratulationPopup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center px-6">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-vault-panel border-4 border-vault-gold p-12 rounded-[40px] max-w-2xl w-full text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] relative overflow-hidden">
                    <CheckCircle2 className="w-20 h-20 text-[#22c55e] mx-auto mb-6" />
                    <h2 className="text-white text-5xl font-black uppercase italic tracking-tighter mb-4">Congratulations!</h2>
                    <p className="text-[#D4AF37] text-2xl font-bold uppercase tracking-widest mb-4 italic">You Crack the Code</p>
                    <div className="flex flex-col gap-4 mb-8 bg-black/40 p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center px-4">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Cracked Word:</span>
                            <span className="text-white font-display font-black text-2xl tracking-[0.2em]">{crackedLetters}</span>
                        </div>
                        <div className="flex justify-between items-center px-4">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Mission Time:</span>
                            <span className="text-vault-gold font-mono text-2xl font-black">{formatTimeFull(elapsedMs)}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (onPostResults) {
                                onPostResults({
                                    gameCode: crackedLetters,
                                    time: formatTimeFull(elapsedMs),
                                    sponsorKey: userKeyword || "NONE"
                                });
                            }
                        }}
                        className="w-full bg-[#22c55e] text-white py-6 rounded-2xl text-2xl font-black uppercase tracking-widest hover:bg-[#16a34a] transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95"
                    >
                        Submit Time
                    </button>
                </motion.div>
            </motion.div>
        )}
     </AnimatePresence>
     <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
   </div>
 );
};

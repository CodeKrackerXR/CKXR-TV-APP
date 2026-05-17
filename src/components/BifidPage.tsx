import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { ChevronLeft, Info, Zap, Grid3X3, Calculator, Layers, Hash } from 'lucide-react';

interface BifidPageProps {
  onBack: () => void;
  onNavigateToGame?: () => void;
  inputText: string;
  setInputText: (val: string) => void;
  cipherKey: string;
  setCipherKey: (val: string) => void;
  youtuber?: {
    name: string;
    avatar: string;
    teamName?: string;
  };
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export const BifidPage: React.FC<BifidPageProps> = ({ 
  onBack, 
  onNavigateToGame,
  inputText,
  setInputText,
  cipherKey,
  setCipherKey,
  youtuber 
}) => {
  const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

  const square = useMemo(() => {
    const cleanKey = cipherKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
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
  }, [cipherKey]);

  const getCoords = (char: string) => {
    const c = char.toUpperCase().replace(/J/g, 'I');
    const idx = square.indexOf(c);
    if (idx === -1) return null;
    return { r: Math.floor(idx / 5) + 1, c: (idx % 5) + 1 };
  };

  const getChar = (r: number, c: number) => {
    const idx = (r - 1) * 5 + (c - 1);
    return square[idx] || '?';
  };

  const { result, fractionation } = useMemo(() => {
    const cleanText = inputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    if (!cleanText) return { result: '', fractionation: {} as any };

    if (mode === 'ENCODE') {
      const rows: number[] = [];
      const cols: number[] = [];
      const steps: any[] = [];

      for (const char of cleanText) {
        const coords = getCoords(char);
        if (coords) {
          rows.push(coords.r);
          cols.push(coords.c);
          steps.push({ char, r: coords.r, c: coords.c });
        }
      }

      const combined = [...rows, ...cols];
      let resText = '';
      const pairs: any[] = [];

      for (let i = 0; i < combined.length; i += 2) {
        const r = combined[i];
        const c = combined[i + 1];
        const char = getChar(r, c);
        resText += char;
        pairs.push({ r, c, char });
      }

      return { result: resText, fractionation: { steps, rows, cols, combined, pairs } };
    } else {
      const coords: number[] = [];
      for (const char of cleanText) {
        const c = getCoords(char);
        if (c) {
          coords.push(c.r);
          coords.push(c.c);
        }
      }

      const mid = coords.length / 2;
      const rows = coords.slice(0, mid);
      const cols = coords.slice(mid);

      let resText = '';
      const decodedSteps: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        const char = getChar(rows[i], cols[i]);
        resText += char;
        decodedSteps.push({ char, r: rows[i], c: cols[i] });
      }

      return { result: resText, fractionation: { coords, rows, cols, decodedSteps } };
    }
  }, [inputText, square, mode]);

  const teamName = youtuber?.teamName || (youtuber?.name === "JSTU" ? "Team JSTU" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`);

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
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
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
            Bifid Cipher
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 font-medium uppercase tracking-[0.3em] text-xs md:text-sm"
          >
            Fractionated Grid Permutation Indexing
          </motion.p>
        </div>

        {/* YouTuber profile removed per site-wide rule */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
              <h2 className="font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2 italic">
                <Zap className="w-5 h-5 text-[#D4AF37]" />
                Cipher Core
              </h2>

              <div className="space-y-4">
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

                <div>
                   <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Key (Square)</label>
                   <input
                    type="text"
                    value={cipherKey}
                    onChange={(e) => setCipherKey(e.target.value.substring(0, 15).toUpperCase())}
                    className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-2 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] font-mono uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-1">Input Stream</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.toUpperCase())}
                    className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-3 font-mono text-sm text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors resize-none uppercase"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-2xl shadow-lg">
              <h3 className="flex items-center gap-2 font-black uppercase text-sm text-red-500 mb-3">
                <Info className="w-4 h-4" />
                Complexity Specs
              </h3>
              <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase">
                Bifid is a fractionated cipher that combines substitution (identifying grid coordinates) and transposition (unstacking and re-pairing coordinates).
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-black text-xl text-white uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                    <Grid3X3 className="w-5 h-5 text-[#D4AF37]" />
                    Polybius Matrix
                  </h3>
                  <div className="grid grid-cols-6 gap-1 bg-black/40 p-2 rounded-xl border border-white/5 font-mono">
                    <div className="w-8 h-8" />
                    {[1,2,3,4,5].map(n => <div key={n} className="w-8 h-8 flex items-center justify-center font-black text-[#D4AF37]/40 text-[10px]">{n}</div>)}
                    {[1,2,3,4,5].map(r => (
                      <React.Fragment key={r}>
                        <div className="w-8 h-8 flex items-center justify-center font-black text-[#D4AF37]/40 text-[10px]">{r}</div>
                        {[1,2,3,4,5].map(c => (
                          <div key={c} className="w-8 h-8 flex items-center justify-center rounded bg-white/5 border border-white/5 font-bold text-white/80 text-xs shadow-sm">
                            {square[(r-1)*5 + (c-1)]}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="font-black text-xl text-white uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                    <Layers className="w-5 h-5 text-blue-400" />
                    Fractionation Matrix
                  </h3>
                  <div className="bg-black/60 rounded-xl p-4 flex-1 flex flex-col gap-4 font-mono text-[10px] overflow-y-auto max-h-[300px]">
                    {mode === 'ENCODE' ? (
                      <>
                        <div className="flex flex-col gap-1">
                          <div className="text-white/40 uppercase">Mapping Pulse:</div>
                          <div className="flex flex-wrap gap-2">
                            {(fractionation as any).steps?.map((s: any, i: number) => (
                               <div key={i} className="flex flex-col items-center">
                                 <span className="text-[#D4AF37] font-black italic">{s.char}</span>
                                 <span className="text-white/60">{s.r}</span>
                                 <span className="text-white/60">{s.c}</span>
                               </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                          <div className="text-white/40 uppercase">Unstacked Data:</div>
                          <div className="flex flex-wrap gap-1 text-blue-400 font-bold break-all">
                             {(fractionation as any).combined?.join('')}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                           <div className="text-white/40 uppercase">Cipher Pairs:</div>
                           <div className="flex flex-wrap gap-2">
                              {(fractionation as any).pairs?.map((p: any, i: number) => (
                                 <div key={i} className="flex flex-col items-center">
                                    <span className="text-blue-200">({p.r},{p.c})</span>
                                    <span className="text-red-500 font-black italic">{p.char}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1">
                           <div className="text-white/40 uppercase">Encoded Coords:</div>
                           <div className="flex flex-wrap gap-1 text-red-500 font-black">
                              {(fractionation as any).coords?.join('')}
                           </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                           <div className="text-white/40 uppercase">Split Stream:</div>
                           <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-blue-400 font-bold">{(fractionation as any).rows?.join('')}</span>
                              <span className="text-white/20">|</span>
                              <span className="text-[#D4AF37] font-bold">{(fractionation as any).cols?.join('')}</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                           <div className="text-white/40 uppercase">Deciphered Signal:</div>
                           <div className="flex flex-wrap gap-2">
                              {(fractionation as any).decodedSteps?.map((s: any, i: number) => (
                                 <div key={i} className="flex flex-col items-center">
                                    <span className="text-blue-400">{s.r}</span>
                                    <span className="text-[#D4AF37]">{s.c}</span>
                                    <span className="text-white font-black italic">{s.char}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 w-full text-center">
                      <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2 block">Output Stream</label>
                      <div className="bg-black/90 border-2 border-[#D4AF37] rounded-xl p-4 md:p-6 font-black text-2xl md:text-5xl text-[#D4AF37] tracking-[0.2em] shadow-[inset_0_2px_20px_rgba(0,0,0,1)] font-mono min-h-[5rem] flex items-center justify-center">
                        {result || '---'}
                      </div>
                   </div>
                   
                   {onNavigateToGame && (
                     <button
                       className="w-full md:w-auto h-16 px-10 bg-green-600 text-white hover:bg-green-500 font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                       onClick={onNavigateToGame}
                     >
                       Play
                     </button>
                   )}
                   
                   <button
                    className="w-full md:w-auto h-16 px-10 bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
                    onClick={() => navigator.clipboard.writeText(result)}
                   >
                     Copy Signal
                   </button>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 shadow-lg">
                <Calculator className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                 <div className="text-[10px] text-white/40 font-black uppercase italic">Technical Logic</div>
                 <div className="text-xs font-bold text-white/80 uppercase">Bifid uses the concept of 'Fractionation' to spread the information of each character across different positions.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
        <p className="font-bold text-[8px] text-white uppercase tracking-[0.4em] opacity-40">
           &copy; 2026 CODE KRACKER XR | Bifid Permutation Processor v1.0
        </p>
      </div>
    </div>
  );
};

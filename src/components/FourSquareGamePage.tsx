import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Info, Zap, CheckCircle2, LayoutGrid, Timer } from 'lucide-react';

interface FourSquareGamePageProps {
  onBack: () => void;
  onReturnToEncoder: () => void;
  initialCode: string;
  initialKey1?: string;
  initialKey2?: string;
  youtuber?: any;
  onPostResults: (data: { gameCode: string; time: string; sponsorKey: string }) => void;
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export const FourSquareGamePage: React.FC<FourSquareGamePageProps> = ({ 
  onBack,
  onReturnToEncoder, 
  initialCode, 
  initialKey1 = 'VAULT', 
  initialKey2 = 'SECRET',
  youtuber,
  onPostResults
}) => {
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [gridTL] = useState<string[][]>(Array.from({ length: 5 }, (_, r) => ALPHABET_NO_J.split('').slice(r * 5, r * 5 + 5)));
  const [gridBR] = useState<string[][]>(Array.from({ length: 5 }, (_, r) => ALPHABET_NO_J.split('').slice(r * 5, r * 5 + 5)));
  const [gridTR, setGridTR] = useState<string[][]>(Array.from({ length: 5 }, () => new Array(5).fill('')));
  const [gridBL, setGridBL] = useState<string[][]>(Array.from({ length: 5 }, () => new Array(5).fill('')));

  const gridTRRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: 5 }, () => new Array(5).fill(null)));
  const gridBLRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: 5 }, () => new Array(5).fill(null)));

  const [activePairIndex, setActivePairIndex] = useState(0);
  const [selectedSourceCells, setSelectedSourceCells] = useState<{square: 'TR' | 'BL', r: number, c: number}[]>([]);
  const [selectedTargetCells, setSelectedTargetCells] = useState<{square: 'TL' | 'BR', r: number, c: number}[]>([]);

  const [userDigraphs, setUserDigraphs] = useState<string[]>([]);

  useEffect(() => {
    if (isFinished) return;
    const startTime = Date.now() - elapsedMs;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 10);
    return () => clearInterval(interval);
  }, [isFinished, elapsedMs]);

  const formatTimeFull = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const c = Math.floor((ms % 1000) / 10);
    if (m >= 60) return "59:59:99";
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
  };

  const cipherText = initialCode.toUpperCase().replace(/[^A-Z]/g, '');
  const cipherDigraphs = useMemo(() => {
    const pairs: string[] = [];
    for (let i = 0; i < cipherText.length; i += 2) {
      pairs.push(cipherText.substring(i, i + 2));
    }
    return pairs;
  }, [cipherText]);

  useEffect(() => {
    if (userDigraphs.length === 0 && cipherDigraphs.length > 0) {
      setUserDigraphs(new Array(cipherDigraphs.length).fill(''));
    }
  }, [cipherDigraphs, userDigraphs.length]);

  const handleGridChange = (square: 'TR' | 'BL', r: number, c: number, val: string) => {
    if (isFinished) return;
    const input = val.toUpperCase();
    const setGrid = square === 'TR' ? setGridTR : setGridBL;
    const grid = square === 'TR' ? gridTR : gridBL;
    
    const newGrid = grid.map(row => [...row]);
    if (input === 'I' || input === 'J' || input === 'I/J') {
      newGrid[r][c] = 'I/J';
    } else {
      newGrid[r][c] = input.replace(/[^A-Z]/g, '').slice(0, 1);
    }
    setGrid(newGrid);

    if (newGrid[r][c].length >= 1) {
      let nextR = r;
      let nextC = c + 1;
      if (nextC > 4) {
        nextC = 0;
        nextR++;
      }
      if (nextR <= 4) {
        const refs = square === 'TR' ? gridTRRefs : gridBLRefs;
        refs.current[nextR][nextC]?.focus();
      }
    }
  };

  const currentCipherPair = cipherDigraphs[activePairIndex] || '';

  const expectedTargets = useMemo(() => {
    if (selectedSourceCells.length !== 2) return [];
    const cellTR = selectedSourceCells.find(s => s.square === 'TR');
    const cellBL = selectedSourceCells.find(s => s.square === 'BL');
    if (!cellTR || !cellBL) return [];

    return [
      { square: 'TL' as const, r: cellTR.r, c: cellBL.c },
      { square: 'BR' as const, r: cellBL.r, c: cellTR.c }
    ];
  }, [selectedSourceCells]);

  const handleCellClick = (square: 'TL' | 'TR' | 'BL' | 'BR', r: number, c: number) => {
    if (isFinished) return;
    const grid = square === 'TL' ? gridTL : square === 'TR' ? gridTR : square === 'BL' ? gridBL : gridBR;
    const letter = grid[r][c];
    if (!letter) return;

    if (selectedSourceCells.length < 2) {
      if (selectedSourceCells.length === 0 && square === 'TR') {
          const targetChar = currentCipherPair[0];
          const isMatch = (targetChar === 'I' || targetChar === 'J') ? (letter === 'I/J' || letter === 'I' || letter === 'J') : letter === targetChar;
          if (isMatch) setSelectedSourceCells([{square, r, c}]);
      } else if (selectedSourceCells.length === 1 && square === 'BL') {
          const targetChar = currentCipherPair[1];
          const isMatch = (targetChar === 'I' || targetChar === 'J') ? (letter === 'I/J' || letter === 'I' || letter === 'J') : letter === targetChar;
          if (isMatch) setSelectedSourceCells([...selectedSourceCells, {square, r, c}]);
      }
      return;
    }

    if (selectedSourceCells.length === 2 && selectedTargetCells.length < 2) {
      const isTarget = expectedTargets.some(t => t.square === square && t.r === r && t.c === c);
      if (isTarget) {
        if (selectedTargetCells.some(t => t.square === square && t.r === r && t.c === c)) return;
        const newTargets = [...selectedTargetCells, { square, r, c }];
        setSelectedTargetCells(newTargets);

        if (newTargets.length === 2) {
          const p1Cell = expectedTargets.find(t => t.square === 'TL')!;
          const p2Cell = expectedTargets.find(t => t.square === 'BR')!;
          const p1 = gridTL[p1Cell.r][p1Cell.c];
          const p2 = gridBR[p2Cell.r][p2Cell.c];
          
          const newDigraphs = [...userDigraphs];
          newDigraphs[activePairIndex] = (p1 + p2).replace(/I\/J/g, 'I');
          setUserDigraphs(newDigraphs);

          setTimeout(() => {
            setSelectedSourceCells([]);
            setSelectedTargetCells([]);
            setActivePairIndex(prev => prev + 1);
          }, 600);
        }
      }
    }
  };

  const decodedString = userDigraphs.join('');

  const renderGridSquare = (squareId: 'TL' | 'TR' | 'BL' | 'BR', grid: string[][], title: string, isEditable: boolean) => (
    <div className="flex flex-col items-center">
      <label className="text-[10px] font-black uppercase text-[#D4AF37]/30 tracking-widest mb-2">{title}</label>
      <div className="grid grid-cols-5 gap-1.5 p-2 bg-black/50 rounded-2xl border border-white/10 shadow-inner relative">
        {grid.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isSource = selectedSourceCells.some(s => s.square === squareId && s.r === rIdx && s.c === cIdx);
            const isTarget = selectedTargetCells.some(t => t.square === squareId && t.r === rIdx && t.c === cIdx);

            const isStandard = squareId === 'TL' || squareId === 'BR';
            let style = isStandard
              ? "bg-white/5 border border-white/5 text-[#88aaff]/60 font-medium"
              : "bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37]/70";

            if (isSource) style = "bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]";
            if (isTarget) style = "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]";

            return (
              <motion.div
                key={`${rIdx}-${cIdx}`}
                className="relative"
                whileHover={{ scale: isFinished ? 1 : 1.05 }}
                whileTap={{ scale: isFinished ? 1 : 0.95 }}
              >
                {isEditable ? (
                  <input
                    type="text"
                    ref={(el) => {
                      const refs = squareId === 'TR' ? gridTRRefs : gridBLRefs;
                      if (refs.current[rIdx]) refs.current[rIdx][cIdx] = el;
                    }}
                    value={cell}
                    onChange={(e) => handleGridChange(squareId as any, rIdx, cIdx, e.target.value)}
                    className={`w-10 h-10 md:w-14 md:h-14 rounded-xl text-center font-black focus:outline-none transition-all uppercase ${style} ${!cell ? 'cursor-text' : 'cursor-pointer'} ${cell === 'I/J' ? 'text-[10px] md:text-xs' : 'text-sm md:text-lg'}`}
                    maxLength={3}
                    onClick={() => cell && handleCellClick(squareId, rIdx, cIdx)}
                  />
                ) : (
                  <div
                    onClick={() => handleCellClick(squareId, rIdx, cIdx)}
                    className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-black cursor-pointer transition-all uppercase ${style} ${cell === 'I/J' ? 'text-[10px] md:text-xs' : 'text-sm md:text-lg'}`}
                  >
                    {cell}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-black/60 backdrop-blur-md rounded-[40px] border-4 border-zinc-800 p-8 overflow-hidden relative">
      {/* Floating UI Elements */}
      <div className="fixed top-[180px] left-6 md:left-[60px] z-[60] flex flex-col gap-4 pointer-events-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 group hover:text-[#D4AF37] transition-all bg-black/40 backdrop-blur-md p-3 px-4 rounded-xl border border-white/10 shadow-2xl"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-black uppercase tracking-widest text-[13px]">
            Back to Detail
          </span>
        </button>
        <button
          onClick={onReturnToEncoder}
          className="flex items-center gap-2 group hover:text-[#D4AF37] transition-all bg-black/40 backdrop-blur-md p-3 px-4 rounded-xl border border-white/10 shadow-2xl"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-black uppercase tracking-widest text-[13px]">
            Return to Encoder
          </span>
        </button>
      </div>

      <div className="fixed top-[100px] right-6 md:right-10 z-[60] flex flex-col items-end gap-2">
        <div className="bg-black/80 border-2 border-[#D4AF37]/40 rounded-xl p-3 px-6 shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
          <div className="text-[9px] font-black text-[#D4AF37]/60 uppercase tracking-widest mb-1 text-center font-sans tracking-widest">
            Mission Time
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-white tracking-widest tabular-nums">
            {formatTimeFull(elapsedMs)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 border-b-2 border-zinc-800 pb-6 pt-48">
        <div className="w-24" />
        <div className="text-center flex-1">
          <h1 className="text-4xl font-black text-[#D4AF37] uppercase italic tracking-tighter">Four-Square Decoder</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Mission Challenge</p>
        </div>
        <div className="w-24" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Intelligence Feed */}
          <div className="lg:col-span-12 bg-zinc-900/60 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-3 space-y-4">
                <div>
                   <label className="block text-[10px] text-green-500 uppercase tracking-widest font-black mb-2">Mirror Key 1</label>
                   <div className="bg-black/60 border border-green-500/30 rounded-xl p-3 flex flex-col items-center">
                      <span className="text-2xl font-black text-green-500 uppercase tracking-widest">
                         {initialKey1 || '---'}
                      </span>
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] text-green-500 uppercase tracking-widest font-black mb-2">Mirror Key 2</label>
                   <div className="bg-black/60 border border-green-500/30 rounded-xl p-3 flex flex-col items-center">
                      <span className="text-2xl font-black text-green-500 uppercase tracking-widest">
                         {initialKey2 || '---'}
                      </span>
                   </div>
                </div>
                <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-xl">
                   <h3 className="flex items-center gap-2 font-black uppercase text-[9px] text-blue-400 mb-2 tracking-widest">
                      <Info className="w-3.5 h-3.5" />
                      Status Intel
                   </h3>
                   <ul className="text-[9px] text-white/50 space-y-1.5 font-bold uppercase">
                      <li><span className="text-[#D4AF37]">1. MATRIX:</span> Fill Keyed Square TR and BL with the mirror keys.</li>
                      <li><span className="text-[#D4AF37]">2. DECODE:</span> Find bigrams in TR/BL to unlock chars in TL/BR.</li>
                   </ul>
                </div>
              </div>

              <div className="lg:col-span-9 flex flex-col items-center">
                <div className="grid grid-cols-2 gap-4 md:gap-8 bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-2xl relative">
                   <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/5 -translate-y-1/2" />
                   <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-white/5 -translate-x-1/2" />
                   {renderGridSquare('TL', gridTL, "Square A (Standard)", false)}
                   {renderGridSquare('TR', gridTR, "Square B (Key 1)", true)}
                   {renderGridSquare('BL', gridBL, "Square C (Key 2)", true)}
                   {renderGridSquare('BR', gridBR, "Square D (Standard)", false)}
                </div>
              </div>
            </div>
          </div>

          {/* Reassembly Section */}
          <div className="lg:col-span-12 bg-zinc-900 border border-[#D4AF37]/30 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="bg-blue-600 py-4 px-8 flex justify-between items-center text-white">
              <h2 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                Reassembly Grid
                <Zap className="w-6 h-6 animate-pulse" />
              </h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex flex-wrap justify-center gap-6">
                {cipherDigraphs.map((pair, idx) => {
                  const isActive = idx === activePairIndex;
                  return (
                    <div key={idx} className={`flex flex-col items-center gap-3 transition-all ${isActive ? 'scale-105' : 'opacity-40 scale-95'}`}>
                      <div className={`text-2xl font-black tracking-widest px-4 py-2 rounded-xl border ${isActive ? 'text-blue-400 bg-blue-500/20 border-blue-500' : 'text-blue-400/60 bg-blue-500/5 border-blue-500/20'}`}>
                         {pair}
                      </div>
                      <div className={`w-16 h-16 rounded-xl bg-black/60 border-2 flex items-center justify-center font-black text-2xl text-white transition-all ${isActive ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-zinc-800'}`}>
                         {userDigraphs[idx] || '??'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center pt-8 border-t border-white/5">
                <label className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-4 block">Decrypted Intelligence</label>
                <div className="text-4xl font-black text-white tracking-[0.15em] uppercase min-h-[3rem]">
                  {decodedString || 'WAITING FOR DATA...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {decodedString.length >= cipherText.length && !isFinished && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent flex justify-center z-[100]"
          >
            <button
              onClick={() => setIsFinished(true)}
              className="bg-[#D4AF37] text-black px-16 py-6 rounded-2xl font-black text-2xl uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              <CheckCircle2 className="w-8 h-8" />
              Intelligence Cracked
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFinished && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full bg-zinc-900 border-4 border-[#D4AF37] p-12 rounded-[40px] text-center space-y-8"
            >
              <div className="w-24 h-24 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-16 h-16 text-black" />
              </div>
              <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Congratulations Agent!</h2>
              <p className="text-zinc-400 text-xl font-bold uppercase tracking-widest">Code Successfully Cracked</p>
              
              <div className="grid grid-cols-2 gap-4 py-8">
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                  <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest mb-1 block">Final Time</span>
                  <span className="text-3xl font-black text-white font-mono">{formatTimeFull(elapsedMs)}</span>
                </div>
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                  <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest mb-1 block">Game Code</span>
                  <span className="text-3xl font-black text-white font-mono">{decodedString.substring(0, 8)}</span>
                </div>
              </div>

              <button
                onClick={() => onPostResults({
                  gameCode: decodedString.substring(0, 8),
                  time: formatTimeFull(elapsedMs),
                  sponsorKey: `K1:${initialKey1} K2:${initialKey2}`
                })}
                className="w-full h-20 bg-[#D4AF37] text-black text-2xl font-black uppercase tracking-widest rounded-2xl hover:bg-[#B8860B] transition-transform active:scale-95 shadow-2xl"
              >
                Post Results
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

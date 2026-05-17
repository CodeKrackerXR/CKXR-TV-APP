import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Zap, ChevronLeft, Info, Grid3X3, Hash } from 'lucide-react';

interface FourSquarePageProps {
  onBack: () => void;
  onNavigateToGame: () => void;
  inputText: string;
  setInputText: (text: string) => void;
  key1: string;
  setKey1: (key: string) => void;
  key2: string;
  setKey2: (key: string) => void;
  youtuber?: {
    name: string;
    avatar: string;
  };
}

const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export const FourSquarePage: React.FC<FourSquarePageProps> = ({ 
  onBack, 
  onNavigateToGame,
  inputText,
  setInputText,
  key1,
  setKey1,
  key2,
  setKey2,
  youtuber 
}) => {
  const [mode, setMode] = React.useState<'ENCODE' | 'DECODE'>('ENCODE');

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

  const standardSquare = ALPHABET_NO_J.split('');
  const squareTL = standardSquare;
  const squareBR = standardSquare;
  const squareTR = useMemo(() => generateSquare(key1), [key1]);
  const squareBL = useMemo(() => generateSquare(key2), [key2]);

  const processText = () => {
    const cleanText = inputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    let textToProcess = cleanText;
    if (textToProcess.length % 2 !== 0) textToProcess += 'X';

    const bigrams: [string, string][] = [];
    for (let i = 0; i < textToProcess.length; i += 2) {
      bigrams.push([textToProcess[i], textToProcess[i + 1]]);
    }

    let result = '';
    const visualSteps: any[] = [];

    bigrams.forEach(([a, b]) => {
      const idxA = squareTL.indexOf(a);
      const idxB = squareBR.indexOf(b);

      const rowA = Math.floor(idxA / 5);
      const colA = idxA % 5;
      const rowB = Math.floor(idxB / 5);
      const colB = idxB % 5;

      if (mode === 'ENCODE') {
        const char1 = squareTR[rowA * 5 + colB];
        const char2 = squareBL[rowB * 5 + colA];
        result += char1 + char2;
        visualSteps.push({ a, b, c1: char1, c2: char2, rowA, colA, rowB, colB });
      } else {
        const sTR_idx = squareTR.indexOf(a);
        const sBL_idx = squareBL.indexOf(b);
        const sTR_row = Math.floor(sTR_idx / 5);
        const sTR_col = sTR_idx % 5;
        const sBL_row = Math.floor(sBL_idx / 5);
        const sBL_col = sBL_idx % 5;
        const char1 = squareTL[sTR_row * 5 + sBL_col];
        const char2 = squareBR[sBL_row * 5 + sTR_col];
        result += char1 + char2;
        visualSteps.push({ a, b, c1: char1, c2: char2, rowA: sTR_row, colA: sTR_col, rowB: sBL_row, colB: sBL_col });
      }
    });

    return { result, visualSteps };
  };

  const { result, visualSteps } = useMemo(() => processText(), [inputText, key1, key2, mode, squareTR, squareBL]);

  const renderSquare = (square: string[], title: string, highlightColor: string, activePoints: { r: number, c: number }[]) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-black uppercase text-white/40">{title}</span>
      </div>
      <div className="grid grid-cols-5 gap-1 bg-black/40 p-1.5 rounded-lg border border-white/5">
        {square.map((char, i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          const isActive = activePoints.some(p => p.r === r && p.c === c);
          return (
            <div
              key={i}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded text-xs md:text-sm font-display font-black border transition-all duration-300
                ${isActive
                  ? `${highlightColor} text-black border-white/20 scale-110 z-10 shadow-lg`
                  : 'bg-white/5 text-white/40 border-transparent opacity-60'}`}
            >
              {char}
            </div>
          );
        })}
      </div>
    </div>
  );

  const currentStep = visualSteps[0] || { rowA: -1, colA: -1, rowB: -1, colB: -1 };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-black/60 backdrop-blur-md rounded-[40px] border-4 border-zinc-800 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b-2 border-zinc-800 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="font-black uppercase tracking-widest text-sm">Back</span>
        </button>
        <div className="text-center flex-1">
          <h1 className="text-4xl font-black text-[#D4AF37] uppercase italic tracking-tighter">Four-Square Cipher</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Encryption Core</p>
        </div>
        <div className="w-24" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/80 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl">
              <h2 className="font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#D4AF37]" />
                Encryption Core
              </h2>

              <div className="space-y-4">
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

                {/* Keywords */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Key 1 (TR)</label>
                    <input
                      type="text"
                      value={key1}
                      onChange={(e) => setKey1(e.target.value.substring(0, 10).toUpperCase())}
                      className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-2 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="KEY 1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Key 2 (BL)</label>
                    <input
                      type="text"
                      value={key2}
                      onChange={(e) => setKey2(e.target.value.substring(0, 10).toUpperCase())}
                      className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-lg p-2 font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="KEY 2"
                    />
                  </div>
                </div>

                {/* Input Text */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2">Input Bigrams</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.substring(0, 20).toUpperCase())}
                    className="w-full bg-black/60 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-colors resize-none uppercase"
                    rows={2}
                    placeholder="Enter message..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
              <h3 className="flex items-center gap-2 font-black uppercase text-sm text-blue-400 mb-3">
                <Info className="w-4 h-4" />
                Cipher Specs
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-medium">
                Uses four 5x5 matrices. Top-Left & Bottom-Right are standard ABC grids. Top-Right & Bottom-Left are keyed. To encrypt, find intersections of bigram pairs across the quadrants.
              </p>
            </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-900/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h2 className="font-black text-xl text-white uppercase tracking-widest flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-[#D4AF37]" />
                  Four Quadrant Grid
                </h2>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-[#D4AF37] text-black px-2 py-1 rounded font-black">ACTIVE STEP: {inputText.substring(0,2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
                {renderSquare(squareTL, "A: Top-Left (Standard)", "bg-blue-500", [{ r: currentStep.rowA, c: currentStep.colA }])}
                {renderSquare(squareTR, `B: Top-Right (Key: ${key1 || 'None'})`, "bg-[#D4AF37]", mode === 'ENCODE' ? [{ r: currentStep.rowA, c: currentStep.colB }] : [{ r: currentStep.rowA, c: currentStep.colA }])}
                {renderSquare(squareBL, `C: Bottom-Left (Key: ${key2 || 'None'})`, "bg-[#D4AF37]", mode === 'ENCODE' ? [{ r: currentStep.rowB, c: currentStep.colA }] : [{ r: currentStep.rowB, c: currentStep.colB }])}
                {renderSquare(squareBR, "D: Bottom-Right (Standard)", "bg-blue-500", [{ r: currentStep.rowB, c: currentStep.colB }])}
              </div>

              {/* Result Area */}
              <div className="mt-12 bg-black/60 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-black mb-2 block">Output Stream</label>
                    <div className="bg-black/80 border-2 border-[#D4AF37] rounded-xl p-4 font-black text-3xl text-center text-[#D4AF37] shadow-[inset_0_2px_15px_rgba(0,0,0,0.9)] tracking-[0.3em] break-all">
                      {result || '---'}
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToGame}
                    className="h-16 px-10 order-first md:order-last bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-900/20"
                  >
                    Play
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded-xl flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 flex items-center justify-center text-[#ef4444]">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 font-black uppercase">Tactical Advantage</div>
                <div className="text-xs font-bold text-white/80">Double-Keyed matrices significantly increase complexity over Playfair.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';

import { ASSETS } from '../constants';

import { VaultButton } from './VaultButton';

import { ShieldCheck, ChevronLeft, Info, Zap, Grid3X3, Hash, ArrowRightLeft, Settings, RefreshCw } from 'lucide-react';

import { runGearedEnigma, ALPHABET, ROTOR_WIRINGS, getOffsetForChar } from '../lib/enigmaUtils';

interface EnigmaPageProps {
  onBack: () => void;
  onPlay?: (data: { code: string; key: string; wirings: string[] }) => void;
  youtuber?: {
    name: string;
    avatar: string;
  };
  initialWirings?: string[];
}

export const EnigmaPage: React.FC<EnigmaPageProps> = ({ onBack, youtuber, onPlay, initialWirings }) => {
  const [inputText, setInputText] = useState('AGENT');
  const [rotorPos, setRotorPos] = useState<[string, string, string]>(['A', 'A', 'A']);
  const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');
  const [currentWirings, setCurrentWirings] = useState<string[]>(initialWirings || ROTOR_WIRINGS);

  const scrambleWirings = () => {
    const shuffle = (str: string) => {
      const arr = str.split('');
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join('');
    };
    setCurrentWirings([shuffle(ALPHABET), shuffle(ALPHABET), shuffle(ALPHABET)]);
  };

  const { result, history } = useMemo(() => {
    const startStr = rotorPos.join('-');
    return runGearedEnigma(inputText, startStr, mode, currentWirings);
  }, [inputText, rotorPos, mode, currentWirings]);

  const updateRotor = (index: number, val: string) => {
    const char = val.toUpperCase().slice(-1);
    if (ALPHABET.includes(char) || char === '') {
      const newPos = [...rotorPos] as [string, string, string];
      newPos[index] = char || 'A';
      setRotorPos(newPos);
    }
  };

  // Helper to get 5 letters around current offset for visualization
  const getRotorStrip = (wiring: string, offset: number) => {
    const strip = [];
    const roundedOffset = Math.round(offset);
    for (let i = -2; i <= 2; i++) {
      const charIdx = (wiring.length - (roundedOffset % 26) + i + 26) % 26;
      strip.push(wiring[charIdx]);
    }
    return strip;
  };

  const currentOffsets = useMemo(() => {
    if (inputText.length > 0 && history.length > 0) {
      return history[history.length - 1].offsets;
    }
    // Return starting offsets based on rotorPos
    return [
      getOffsetForChar(currentWirings[0], rotorPos[0]),
      getOffsetForChar(currentWirings[1], rotorPos[1]),
      getOffsetForChar(currentWirings[2], rotorPos[2]),
    ];
  }, [history, rotorPos, currentWirings, inputText]);

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white pb-20">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-50 w-full flex justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm h-20 md:h-24 items-center px-4 md:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 group hover:text-vault-gold transition-colors"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="font-display font-bold uppercase tracking-widest text-sm text-white">Return to Hub</span>
        </button>
        <div className="w-24 hidden md:block" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl flex-1">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-display font-black text-4xl md:text-6xl text-vault-gold uppercase tracking-tighter mb-2"
          >
            Enigma Cipher
          </motion.h1>
          <p className="font-display text-[10px] uppercase tracking-[0.5em] text-white/40">Rotor Protocol Encryption</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-vault-panel/80 border border-vault-gold/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
              <h2 className="font-display font-black text-xl text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-vault-gold" />
                Cipher Config
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-2">Operation Mode</label>
                  <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setMode('ENCODE')}
                      className={`flex-1 py-2 px-3 font-display font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'ENCODE' ? 'bg-vault-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white/40'}`}
                    >
                      Encode
                    </button>
                    <button
                      onClick={() => setMode('DECODE')}
                      className={`flex-1 py-2 px-3 font-display font-black text-[10px] md:text-xs uppercase transition-all rounded-md ${mode === 'DECODE' ? 'bg-vault-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white/40'}`}
                    >
                      Decode
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-2">Rotor Start Positions</label>
                  <div className="grid grid-cols-3 gap-3">
                    {rotorPos.map((val, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-white/20 mb-1">ROTOR {i + 1}</span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => updateRotor(i, e.target.value)}
                          className="w-full bg-black/60 border border-vault-gold/20 rounded-lg p-3 text-center font-display font-black text-xl text-vault-gold focus:outline-none focus:border-vault-gold transition-all uppercase"
                          maxLength={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-2">Input Text</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.toUpperCase())}
                    className="w-full bg-black/60 border border-vault-gold/20 rounded-xl p-4 font-mono text-lg text-vault-gold focus:outline-none focus:border-vault-gold resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl">
              <h3 className="flex items-center gap-2 font-display font-black uppercase text-sm text-blue-400 mb-3">
                <Info className="w-4 h-4" />
                The Protocol
              </h3>
              <ul className="text-[10px] text-white/70 leading-relaxed font-bold uppercase space-y-3">
                <li><span className="text-vault-gold">RULE 1:</span> Set all 3 rotors to your start position.</li>
                <li><span className="text-vault-gold">RULE 2:</span> Each letter steps ROTOR I forward by 1 position.</li>
                <li><span className="text-vault-gold">RULE 3:</span> Every 26 steps of a rotor advances the next one.</li>
              </ul>
            </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-vault-panel/80 border border-vault-gold/30 rounded-2xl shadow-2xl backdrop-blur-xl p-8 flex flex-col items-center min-h-[500px]">
              <div className="flex justify-between items-center w-full mb-12 border-b border-white/10 pb-4">
                <h2 className="font-display font-black text-xl text-white uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-5 h-5 text-vault-gold animate-spin-slow" />
                  Rotor Array Status
                </h2>
                <VaultButton
                  variant="secondary"
                  className="h-10 px-4 text-[10px] bg-red-900/20 border-red-500/40 text-red-400 group"
                  onClick={scrambleWirings}
                >
                  <RefreshCw className="w-3 h-3 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Scramble
                </VaultButton>
              </div>

              {/* Rotor Widgets */}
              <div className="flex gap-4 md:gap-12 mb-16">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-vault-gold/40 mb-4 uppercase tracking-[0.2em]">Rotor {i + 1}</span>
                    <div className="relative w-16 md:w-20 bg-black/60 border-2 border-white/10 rounded-2xl overflow-hidden py-4 shadow-inner group">
                      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10" />
                      <div className="flex flex-col items-center gap-1">
                        {getRotorStrip(currentWirings[i], currentOffsets[i]).map((letter, lidx) => {
                          const isCenter = lidx === 2;
                          return (
                            <div
                              key={lidx}
                              className={`h-10 flex items-center justify-center font-display font-black text-2xl md:text-3xl transition-all duration-300
                                ${isCenter ? 'text-vault-gold scale-125 z-20' : 'text-white/10 scale-90'}`}
                            >
                              {letter}
                            </div>
                          );
                        })}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <div className="w-full h-12 border-y border-vault-gold/30 bg-vault-gold/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result Box */}
              <div className="mt-auto w-full pt-8 border-t border-white/10">
                <div className="bg-black/60 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-inner">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase tracking-widest text-vault-gold/60 font-black mb-2 block">Tactical Signal Output</label>
                    <div className="bg-black border-2 border-vault-gold rounded-xl p-4 md:p-6 font-display font-black text-2xl md:text-5xl text-center text-vault-gold shadow-[inset_0_2px_15px_rgba(0,0,0,1)] tracking-[0.2em] break-all">
                      {result || '---'}
                    </div>
                  </div>
                  <VaultButton
                    variant="primary"
                    className="h-16 px-12 whitespace-nowrap bg-green-600 hover:bg-green-500 border-green-400 group"
                    onClick={() => {
                      if (onPlay) onPlay({ code: result, key: rotorPos.join('-'), wirings: currentWirings });
                    }}
                  >
                    <Zap className="mr-2 group-hover:animate-pulse" />
                    Deploy
                  </VaultButton>
                </div>
              </div>
            </div>

            {/* Tactical Feed */}
            <div className="bg-vault-panel/40 border border-white/5 p-6 rounded-xl overflow-hidden">
              <h4 className="text-[10px] font-black uppercase text-vault-gold/40 mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-3 h-3" />
                Transmission Log
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {history.length > 10 && (
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5 flex items-center justify-center text-[8px] text-white/20 uppercase font-black text-center leading-tight">
                    Buffer<br />Encryption...
                  </div>
                )}
                {history.slice(-10).map((entry, i, arr) => (
                  <div key={i} className={`bg-black/40 p-3 rounded-lg border flex flex-col items-center transition-all ${i === arr.length - 1 ? 'border-vault-gold shadow-lg scale-105' : 'border-white/5 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-black">{entry.char}</span>
                      <span className="text-vault-gold/40 text-[8px]">&rarr;</span>
                      <span className="text-vault-gold font-black">{entry.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
        <p className="font-display text-[9px] text-white uppercase tracking-[0.4em] opacity-40">
          &copy; 2026 CODE KRACKER XR | Enigma Rotor Protocol v1.0
        </p>
      </footer>
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] scanline"></div>
    </div>
  );
};

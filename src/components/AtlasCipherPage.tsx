import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ShieldCheck, ChevronLeft, Info, Zap, RotateCw, Activity, Box, Save, Check } from 'lucide-react';


import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Define OperationType and FirestoreErrorInfo for better error handling as per skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

// Lazy initialization of Firebase to avoid crashing if config is missing
let db: any = null;
let auth: any = null;

const initFirebase = async () => {
  if (db) return { db, auth };
  try {
    // @ts-ignore - this file is generated after firebase setup
    const configModule = await import(/* @vite-ignore */ '../firebase-applet-config.json');
    const firebaseConfig = configModule.default;
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Validate connection
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (e) {
      console.warn("Firebase connection test failed, might be offline or unprovisioned.");
    }
    
    return { db, auth };
  } catch (e) {
    console.error("Firebase config not found or invalid. Please complete Firebase setup.");
    return { db: null, auth: null };
  }
};

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null, authInstance: any) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authInstance?.currentUser?.uid,
      email: authInstance?.currentUser?.email,
    },
    operationType,
    path
  };
  const jsonStr = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonStr);
  throw new Error(jsonStr);
};


interface AtlasCipherPageProps {
  onBack: () => void;
  onPlay?: (data: { code: string; shift: number }) => void;
  onGoToCube?: () => void;
  youtuber?: {
    name: string;
    avatar: string;
  };
}


const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Helper to convert letter to 1-26 number
const letterToNumber = (char: string) => {
  const index = ALPHABET.indexOf(char.toUpperCase());
  return index === -1 ? char : (index + 1).toString();
};


// Helper for number shift (1-10 wrap around)
const getShiftedNumber = (numStr: string, s: number) => {
  const num = parseInt(numStr);
  if (isNaN(num)) return "";
  return (((num - 1 + s) % 10 + 10) % 10 + 1).toString(); // handles negative shift if decoding later
};

// Helper for letter shift (already exists in mapping, but for clarity:)
const getShiftedLetter = (char: string, s: number) => {
  const idx = ALPHABET.indexOf(char.toUpperCase());
  if (idx === -1) return "";
  return ALPHABET[(idx + s + 26) % 26];
};

// Helper for Row and Position labels
const getRowPosLabel = (idx: number) => {
  if (idx < 10) { // Live Map (Cubes 1-10, indices 0-9)
    const row = idx < 5 ? 'T' : 'B';
    return `L1${row}${idx + 1}`;
  }
  if (idx >= 10 && idx < 20) { // Decoy 1 (Cubes 11-20, indices 10-19)
    const row = idx < 15 ? 'T' : 'B';
    return `D1${row}${idx + 1}`;
  }
  if (idx >= 20 && idx < 30) { // Decoy 2 (Cubes 21-30, indices 20-29)
    const row = idx < 25 ? 'T' : 'B';
    return `D2${row}${idx + 1}`;
  }
  if (idx >= 30 && idx < 40) { // Decoy 3 (Cubes 31-40, indices 30-39)
    const row = idx < 35 ? 'T' : 'B';
    return `D3${row}${idx + 1}`;
  }
  return null;
};


export const AtlasCipherPage: React.FC<AtlasCipherPageProps> = ({ onBack, youtuber, onPlay, onGoToCube }) => {
  const [inputText, setInputText] = useState('CODEKRACKER');
  const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');
  
  const [isSaving, setIsSaving] = useState(false);

  // Lazy initialize 60 cubes
  const [cubes, setCubes] = useState<any[]>(() => {
    const savedCubes = localStorage.getItem('atlas_session_cubes');
    if (savedCubes) {
      try {
        const parsed = JSON.parse(savedCubes);
        if (Array.isArray(parsed) && parsed.length === 60) {
          return parsed.map((c: any) => ({
            letter: c.letter || '',
            number: c.number || '',
            episode: c.episode || '',     // Live Map only
            sponsorAd: c.sponsorAd || '',   // Live Map only
            rotation: c.rotation || '',     // Live Map only
            cipherOutput: c.cipherOutput || '',
            identificationLabel: c.identificationLabel || '',
            riddleNumber: c.riddleNumber || ''
          }));
        }
      } catch (e) {
        console.error("Failed to parse saved cubes", e);
      }
    }
    return Array.from({ length: 60 }, () => ({ 
      letter: '', 
      number: '',
      episode: '',     // Live Map only
      sponsorAd: '',   // Live Map only
      rotation: ''     // Live Map only
    }));
  });

  const [shift, setShift] = useState<number>(() => {
    const savedShift = localStorage.getItem('atlas_session_shift');
    return savedShift ? parseInt(savedShift) : 3;
  });

  // Lazy initialize lastSavedSectionCubes to track dirty/saved states correctly
  const [lastSavedSectionCubes, setLastSavedSectionCubes] = useState<any[]>(() => {
    const savedCubes = localStorage.getItem('atlas_session_cubes');
    if (savedCubes) {
      try {
        const parsed = JSON.parse(savedCubes);
        if (Array.isArray(parsed) && parsed.length === 60) {
          return parsed.map((c: any) => ({
            letter: c.letter || '',
            number: c.number || '',
            episode: c.episode || '',
            sponsorAd: c.sponsorAd || '',
            rotation: c.rotation || ''
          }));
        }
      } catch (e) {
        console.error("Failed to parse saved cubes for dirty tracker", e);
      }
    }
    return Array.from({ length: 60 }, () => ({ 
      letter: '', 
      number: '',
      episode: '',
      sponsorAd: '',
      rotation: ''
    }));
  });

  // Helper to determine if a section (from startIndex to startIndex + 10) is changed/dirty
  const isSectionDirty = (startIndex: number) => {
    for (let i = startIndex; i < startIndex + 10; i++) {
      const curr = cubes[i] || { letter: '', number: '', episode: '', sponsorAd: '', rotation: '' };
      const saved = lastSavedSectionCubes[i] || { letter: '', number: '', episode: '', sponsorAd: '', rotation: '' };
      if (
        (curr.letter || '') !== (saved.letter || '') ||
        (curr.number || '') !== (saved.number || '') ||
        (curr.episode || '') !== (saved.episode || '') ||
        (curr.sponsorAd || '') !== (saved.sponsorAd || '') ||
        (curr.rotation || '') !== (saved.rotation || '')
      ) {
        return true;
      }
    }
    return false;
  };

  // Handler to save a specific section's info locally
  const handleSaveSection = (startIndex: number) => {
    setLastSavedSectionCubes(prev => {
      const updated = [...prev];
      for (let i = startIndex; i < startIndex + 10; i++) {
        const curr = cubes[i];
        updated[i] = {
          letter: curr.letter || '',
          number: curr.number || '',
          episode: curr.episode || '',
          sponsorAd: curr.sponsorAd || '',
          rotation: curr.rotation || ''
        };
      }
      return updated;
    });
    saveToLocalStorage();
  };

  // Autosave to localStorage whenever cubes or shift change
  useEffect(() => {
    // We only save if we have actual data to avoid overwriting on initial mount if state is empty
    // but here we have a default state of 60 cubes, so we can save.
    const enrichedCubes = cubes.map((c, i) => {
      const shiftedL = getShiftedLetter(c.letter, shift);
      const shiftedN = getShiftedNumber(c.number, shift);
      const label = i < 5 ? `L1T${i + 1}` : i < 10 ? `L1B${i - 4}` : `C${i + 1}`;
      return {
        ...c,
        cipherOutput: `${shiftedL}${shiftedN}`,
        identificationLabel: label,
        riddleNumber: (i + 1).toString()
      };
    });
    const liveMapCodesList = enrichedCubes.slice(0, 10).map(c => `${c.letter}${c.number}`);
    
    localStorage.setItem('atlas_live_map_codes', JSON.stringify(liveMapCodesList));
    localStorage.setItem('atlas_session_cubes', JSON.stringify(enrichedCubes));
    localStorage.setItem('atlas_session_shift', shift.toString());
  }, [cubes, shift]);

  const cubeRefs = useRef<{ letter: HTMLInputElement | null; number: HTMLInputElement | null; episode: HTMLInputElement | null; sponsorAd: HTMLInputElement | null; rotation: HTMLInputElement | null }[]>(
    Array.from({ length: 60 }, () => ({ letter: null, number: null, episode: null, sponsorAd: null, rotation: null }))
  );
  const jumpTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper for duplicate detection across all 60 cubes
  const duplicateOutputs = useMemo(() => {
    const outputs: string[] = [];
    const duplicates = new Set<string>();
    
    cubes.forEach((cube) => {
      if (cube.letter && cube.number) {
        const shiftedL = getShiftedLetter(cube.letter, shift);
        const shiftedN = getShiftedNumber(cube.number, shift);
        const code = `${shiftedL}${shiftedN}`;
        if (outputs.includes(code)) {
          duplicates.add(code);
        }
        outputs.push(code);
      }
    });
    return duplicates;
  }, [cubes, shift]);

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

  // Mapping A=1, B=2... J=10, K=1
  const letterToNumber10 = (char: string) => {
    const idx = ALPHABET.indexOf(char.toUpperCase());
    if (idx === -1) return "";
    return ((idx % 10) + 1).toString();
  };

  // Helper to check if Live Map is complete
  const isLiveMapComplete = useMemo(() => {
    return cubes.slice(0, 10).every(c => c.letter !== '' && c.number !== '');
  }, [cubes]);

  const handleCubeChange = (index: number, field: 'letter' | 'number' | 'episode' | 'sponsorAd' | 'rotation', value: string) => {
    // Clear any active jump timer to prevent collision of timeouts
    if (jumpTimer.current) {
      clearTimeout(jumpTimer.current);
      jumpTimer.current = null;
    }

    setCubes(prevCubes => {
      const newCubes = [...prevCubes];
      const currentCube = { ...newCubes[index] };
      
      if (field === 'letter') {
        const cleanVal = value.toUpperCase().slice(0, 1).replace(/[^A-Z]/g, '');
        const prevVal = currentCube.letter;
        currentCube.letter = cleanVal;
        newCubes[index] = currentCube;
        
        // Auto-sync Decoy 5 if Live Map changed
        if (index < 10) {
          newCubes[index + 50] = { ...newCubes[index + 50], letter: cleanVal };
        }
        
        // Auto jump to number field only if we added a character
        if (cleanVal !== '' && cleanVal !== prevVal) {
          setTimeout(() => {
            cubeRefs.current[index]?.number?.focus();
          }, 0);
        }
      } else if (field === 'number') {
        const val = value.replace(/[^0-9]/g, '');
        const prevVal = currentCube.number;
        const num = parseInt(val);
        
        if (val === '' || (num >= 1 && num <= 10)) {
          currentCube.number = val;
          newCubes[index] = currentCube;

          if (index < 10) {
            newCubes[index + 50] = { ...newCubes[index + 50], number: val };
          }

          if (val !== '' && val !== prevVal) {
            if (index < 10) {
              // Live Map: stay in current cube and focus 'episode'
              if (val === '1') {
                jumpTimer.current = setTimeout(() => {
                  cubeRefs.current[index]?.episode?.focus();
                  jumpTimer.current = null;
                }, 400);
              } else {
                setTimeout(() => {
                  cubeRefs.current[index]?.episode?.focus();
                }, 0);
              }
            } else {
              // Decoys: advance to next cube's letter
              const focusNext = () => {
                const nextIdx = index + 1;
                if (nextIdx < 60) {
                  cubeRefs.current[nextIdx]?.letter?.focus();
                }
              };
              if (val === '1') {
                jumpTimer.current = setTimeout(() => {
                  focusNext();
                  jumpTimer.current = null;
                }, 400);
              } else {
                setTimeout(focusNext, 0);
              }
            }
          }
        }
      } else if (field === 'episode' || field === 'sponsorAd') {
        const val = value.replace(/[^0-9]/g, '');
        const prevVal = currentCube[field];
        const num = parseInt(val);
        if (val === '' || (num >= 1 && num <= 10)) {
          currentCube[field] = val;
          newCubes[index] = currentCube;

          if (val !== '' && val !== prevVal) {
            const nextField = field === 'episode' ? 'sponsorAd' : 'rotation';
            if (val === '1') {
              jumpTimer.current = setTimeout(() => {
                cubeRefs.current[index]?.[nextField]?.focus();
                jumpTimer.current = null;
              }, 400);
            } else {
              setTimeout(() => {
                cubeRefs.current[index]?.[nextField]?.focus();
              }, 0);
            }
          }
        }
      } else if (field === 'rotation') {
        // More resilient rotation input: allow typing digits and validate values
        const val = value.replace(/[^0-9]/g, '');
        const prevVal = currentCube.rotation;
        const num = parseInt(val);
        
        // Allow typing any digits as long as they could lead to a valid degree or stay within reasonable bounds
        if (val === '' || (num >= 0 && num <= 360)) {
          currentCube.rotation = val;
          newCubes[index] = currentCube;

          if (val !== '' && val !== prevVal) {
            const focusNextCube = () => {
              const nextIdx = index + 1;
              if (nextIdx < 60) {
                cubeRefs.current[nextIdx]?.letter?.focus();
              }
            };
            if (val.length === 3 || ['0', '90', '180', '270'].includes(val)) {
              setTimeout(focusNextCube, 0);
            } else {
              jumpTimer.current = setTimeout(() => {
                focusNextCube();
                jumpTimer.current = null;
              }, 600);
            }
          }
        }
      }
      
      return newCubes;
    });
  };

  const saveToLocalStorage = () => {
    // Generate liveMapCodesList for consistency with what Game Page expects
    const enrichedCubes = cubes.map((c, i) => {
      const shiftedL = getShiftedLetter(c.letter, shift);
      const shiftedN = getShiftedNumber(c.number, shift);
      const label = i < 5 ? `L1T${i + 1}` : i < 10 ? `L1B${i - 4}` : `C${i + 1}`;
      return {
        ...c,
        cipherOutput: `${shiftedL}${shiftedN}`,
        identificationLabel: label,
        riddleNumber: (i + 1).toString()
      };
    });
    const liveMapCodesList = enrichedCubes.slice(0, 10).map(c => `${c.letter}${c.number}`);
    
    localStorage.setItem('atlas_live_map_codes', JSON.stringify(liveMapCodesList));
    localStorage.setItem('atlas_session_cubes', JSON.stringify(enrichedCubes));
    localStorage.setItem('atlas_session_shift', shift.toString());
  };

  const generateAllCodes = async () => {
    if (!isLiveMapComplete) return;
    setIsSaving(true);

    try {
      // 1. Get Live Map codes
      const liveMapCodes = cubes.slice(0, 10).map(c => `${c.letter}${c.number}`);
      const usedCodes = new Set(liveMapCodes);
      
      const newCubes = [...cubes];
      
      // 2. Generate for Decoy 1-4 (Indices 10-49)
      for (let i = 10; i < 50; i++) {
        let code = '';
        let letter = '';
        let number = '';
        let attempts = 0;
        do {
          letter = ALPHABET[Math.floor(Math.random() * 26)];
          number = (Math.floor(Math.random() * 10) + 1).toString();
          code = `${letter}${number}`;
          attempts++;
          // Break safety
          if (attempts > 500) break;
        } while (usedCodes.has(code));
        
        usedCodes.add(code);
        newCubes[i] = { ...newCubes[i], letter, number };
      }
      
      setCubes(newCubes);
      setLastSavedSectionCubes(newCubes.map((c) => ({
        letter: c.letter || '',
        number: c.number || '',
        episode: c.episode || '',
        sponsorAd: c.sponsorAd || '',
        rotation: c.rotation || ''
      })));

      // 3. Save to Firebase
      const { db: firestore, auth: firebaseAuth } = await initFirebase();
      if (firestore) {
        const sessionId = `session_${Date.now()}`;
        
        // 50 codes (Live Map + Decoy 1-4)
        const codesToSave = newCubes.slice(0, 50).map((c, i) => ({
          label: i < 10 ? `Live Map Cube ${i+1}` : `Decoy Cube ${i+1}`,
          code: `${c.letter}${c.number}`
        }));

        // 10 Cipher Outputs from Live Map
        const enrichedCubes = newCubes.map((c, i) => {
          const shiftedL = getShiftedLetter(c.letter, shift);
          const shiftedN = getShiftedNumber(c.number, shift);
          const label = i < 5 ? `L1T${i + 1}` : i < 10 ? `L1B${i - 4}` : `C${i + 1}`;
          return {
            ...c,
            cipherOutput: `${shiftedL}${shiftedN}`,
            identificationLabel: label,
            riddleNumber: (i + 1).toString()
          };
        });

        const liveMapCodesList = enrichedCubes.slice(0, 10).map(c => `${c.letter}${c.number}`);

        const cipherOutputs = enrichedCubes.slice(0, 10).map((c, i) => {
          return {
            cube: i + 1,
            output: c.cipherOutput
          };
        });

        const path = `sessions/${sessionId}`;
        try {
          await setDoc(doc(firestore, "sessions", sessionId), {
            sessionId,
            timestamp: new Date().toISOString(),
            codes: codesToSave,
            cipherOutputs,
            shift
          });
          
          // Save to localStorage for the Game Page to access during preview
          localStorage.setItem('atlas_live_map_codes', JSON.stringify(liveMapCodesList));
          localStorage.setItem('atlas_session_cubes', JSON.stringify(enrichedCubes));
          localStorage.setItem('atlas_session_shift', shift.toString());

          console.log("Session saved successfully to Firestore and localStorage.");
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, path, firebaseAuth);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderCubeSection = (title: string, startIndex: number) => {
    return (
      <div className="max-w-[1600px] mx-auto w-full mb-12">
        <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-3xl p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
              <Activity className="w-8 h-8 text-[#D4AF37]" />
              {title}
            </h3>
            
            {/* Controls Row: Key Ref + Save Info Button */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 bg-[#22c55e]/10 border border-[#22c55e]/30 px-6 py-3 rounded-xl select-none">
                 <span className="text-[10px] font-black text-[#22c55e]/60 uppercase tracking-widest">Key Ref</span>
                 <span className="text-3xl font-black text-[#22c55e] italic leading-none">C{shift}</span>
              </div>

              <button
                onClick={() => handleSaveSection(startIndex)}
                className={`px-5 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 shadow-lg select-none ${
                  isSectionDirty(startIndex)
                    ? 'bg-red-500/15 border-2 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer'
                    : 'bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)] cursor-default'
                }`}
                disabled={!isSectionDirty(startIndex)}
                id={`save-section-btn-${startIndex}`}
                title={isSectionDirty(startIndex) ? `Save Changes in ${title}` : `All Changes Saved in ${title}`}
              >
                {isSectionDirty(startIndex) ? (
                  <>
                    <Save className="w-4 h-4 animate-pulse text-red-500 group-hover:text-white" />
                    <span>Save Info</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {cubes.slice(startIndex, startIndex + 10).map((cube, innerIdx) => {
              const idx = startIndex + innerIdx;
              const shiftedL = getShiftedLetter(cube.letter, shift);
              const shiftedN = getShiftedNumber(cube.number, shift);
              const code = `${shiftedL}${shiftedN}`;
              const isDuplicate = cube.letter && cube.number && duplicateOutputs.has(code);
              const rowPosLabel = getRowPosLabel(idx);
              const isLiveMap = startIndex === 0;
              const isDecoy5 = startIndex === 50;
              const isGoldHighlight = isLiveMap || isDecoy5;

              return (
                <div key={idx} className={`bg-black/40 border-2 rounded-3xl p-8 flex flex-col gap-6 group transition-all hover:bg-black/60 shadow-xl ${isDuplicate ? (isGoldHighlight ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-red-500 bg-red-500/5') : 'border-white/5 hover:border-[#D4AF37]/30'}`}>
                  <div className="flex flex-col items-center justify-center pb-4 border-b border-white/5 mb-2">
                    <span className="text-4xl font-black text-[#22c55e] uppercase tracking-[0.1em] drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] text-center w-full">
                      Cube {idx + 1}
                    </span>
                    {isDuplicate && (
                      <div className={`flex items-center gap-1 animate-pulse mt-2 px-3 py-1 rounded-full border ${isGoldHighlight ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                        <Info className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Collision</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Letter</span>
                       <input
                         type="text"
                         ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].letter = el; }}
                         value={cube.letter}
                         onChange={(e) => handleCubeChange(idx, 'letter', e.target.value)}
                         maxLength={1}
                         placeholder="A"
                         className={`w-full bg-black/60 border-2 rounded-2xl p-4 text-center font-black text-3xl text-white focus:outline-none transition-all placeholder:opacity-20 ${isDuplicate ? (isGoldHighlight ? 'border-[#D4AF37]/50 focus:border-[#D4AF37] text-white' : 'border-red-500/50 focus:border-red-500 text-red-100') : 'border-white/10 focus:border-[#D4AF37]'}`}
                       />
                     </div>
                     <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Number</span>
                       <input
                         type="text"
                         ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].number = el; }}
                         value={cube.number}
                         onChange={(e) => handleCubeChange(idx, 'number', e.target.value)}
                         placeholder="1-10"
                         className={`w-full bg-black/60 border-2 rounded-2xl p-4 text-center font-black text-3xl text-white focus:outline-none transition-all placeholder:opacity-20 ${isDuplicate ? (isGoldHighlight ? 'border-[#D4AF37]/50 focus:border-[#D4AF37] text-white' : 'border-red-500/50 focus:border-red-500 text-red-100') : 'border-white/10 focus:border-[#D4AF37]'}`}
                       />
                     </div>
                  </div>

                  {isLiveMap && (
                    <div className="grid grid-cols-1 gap-4 mt-2">
                       <div className="flex flex-col gap-2">
                         <span className="text-[9px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em] ml-1">Episode</span>
                         <input
                           type="text"
                           ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].episode = el; }}
                           value={cube.episode}
                           onChange={(e) => handleCubeChange(idx, 'episode', e.target.value)}
                           placeholder="1-10"
                           className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-center font-black text-xl text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-mono"
                         />
                       </div>
                       <div className="flex flex-col gap-2">
                         <span className="text-[9px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em] ml-1">Riddle</span>
                         <div className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-center font-black text-xl text-white font-mono select-none">
                           Riddle {idx + 1}
                         </div>
                       </div>
                       <div className="flex flex-col gap-2">
                         <span className="text-[9px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em] ml-1">Sponsor Ad</span>
                         <input
                           type="text"
                           ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].sponsorAd = el; }}
                           value={cube.sponsorAd}
                           onChange={(e) => handleCubeChange(idx, 'sponsorAd', e.target.value)}
                           placeholder="1-10"
                           className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-center font-black text-xl text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-mono"
                         />
                       </div>
                       <div className="flex flex-col gap-2 relative">
                         <span className="text-[9px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em] ml-1">Rotation</span>
                         <div className="relative">
                           <input
                             type="text"
                             ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].rotation = el; }}
                             value={cube.rotation}
                             onChange={(e) => handleCubeChange(idx, 'rotation', e.target.value)}
                             placeholder="Degree"
                             className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-center font-black text-xl text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-mono"
                           />
                           {cube.rotation && (['0', '90', '180', '270'].includes(cube.rotation)) && (
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#D4AF37]">°</span>
                           )}
                         </div>
                       </div>
                    </div>
                  )}

                  {(isLiveMap || rowPosLabel) && (
                    <div className="mt-2 flex flex-col gap-5 p-6 bg-black/60 rounded-3xl border border-white/5 shadow-inner group-hover:bg-black/80 transition-all">
                      {isLiveMap && (
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 leading-tight">Cipher<br/>Output:</span>
                          <span className={`text-4xl font-black font-mono tracking-widest italic ${isDuplicate ? (isGoldHighlight ? 'text-[#D4AF37]' : 'text-red-500') : 'text-[#D4AF37]'}`}>
                            {shiftedL || '-'}{shiftedN || '-'}
                          </span>
                        </div>
                      )}
                      {rowPosLabel && (
                         <div className="flex flex-col items-center justify-center pt-2">
                            <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] mb-2">Identification Label</span>
                            <div className="text-2xl font-black text-[#D4AF37] tracking-[0.2em] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                              {rowPosLabel}
                            </div>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 p-8 bg-black/20 rounded-3xl border border-white/5 flex items-start gap-5">
             <Info className="w-6 h-6 text-[#D4AF37] mt-1 shrink-0" />
             <p className="text-sm text-white/40 font-bold uppercase leading-relaxed tracking-wider">
               Section Intelligence: Cube values are frequency-locked. <span className="font-black italic text-[#D4AF37]">Rule: No two cipher outputs can be identical.</span> Duplicates will be flagged on detection.
             </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white font-sans overflow-x-hidden p-4 md:p-8">
      {/* Navigation and Quick Links Bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-zinc-900 border border-white/10 hover:border-[#D4AF37] text-zinc-400 hover:text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Episode
        </button>

        {onGoToCube && (
          <button
            onClick={onGoToCube}
            className="px-5 py-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/35 hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:scale-105 active:scale-95"
            id="nav-to-atlas-cube-btn"
          >
            <Box className="w-4 h-4" />
            Config Cube Faces & 3D
          </button>
        )}
      </div>

      {/* Main Title */}
      <div className="w-full text-center mb-12">
         <h1 className="text-5xl md:text-8xl font-black text-[#D4AF37] tracking-[0.1em] uppercase drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
           Atlas Cipher
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
                   <span className="text-[#D4AF37] text-sm">{shift}</span>
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
                  <span>0</span>
                  <span>13</span>
                  <span>25</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-3 block">Input Sequence (Letters)</label>
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
              Atlas Intelligence
            </h3>
            <div className="space-y-4">
              <p className="text-[10px] text-white/60 leading-relaxed font-bold uppercase tracking-wider">
                Stage 1 communication utilizes a standard alphanumeric rotation. The Atlas Cipher shifts each character by a specific frequency designated by the game master.
              </p>
              <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                <div className="text-[9px] text-[#D4AF37] font-black uppercase mb-1">Current Key Reference</div>
                <div className="text-xl font-black text-white italic">C{shift}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <RotateCw className="w-5 h-5 text-[#D4AF37]" />
              Shift Mapping (Letters to Letters)
            </h3>

            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
              <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide font-mono">
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
                   Symmetric Delta
                 </div>
                 <div className="space-y-6">
                   <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                     <span className="text-white/40">Plaintext</span>
                     <span className="text-white text-lg">A</span>
                   </div>
                   <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                     <span className="text-[#D4AF37]/40">Mapped Letter</span>
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
                   "The shift value of {shift} determines the character offset. Each letter is converted to its respective position in the alphabet plus the key value."
                 </p>
              </div>
            </div>

            <div className="pt-10 border-t border-white/5">
               <div className="text-[10px] text-center font-black text-[#D4AF37]/40 uppercase tracking-[0.3em] mb-6">Generated Atlas Sequence</div>
               <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 w-full bg-black/60 border-2 border-[#D4AF37] rounded-3xl p-8 shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col items-center justify-center min-h-[160px]">
                     <div className="text-4xl md:text-5xl font-black text-[#D4AF37] tracking-[0.1em] text-center leading-tight font-mono break-all px-4">
                       {result || '---'}
                     </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      saveToLocalStorage();
                      onPlay?.({ code: result, shift });
                    }}
                    className="w-full md:w-auto h-20 px-12 bg-white text-black font-black text-xl uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] whitespace-nowrap"
                  >
                    Play Atlas
                  </button>
               </div>
            </div>
          </div>

        </div>
      </div>

      {renderCubeSection("Live Map", 0)}

      {/* Generate Codes Button */}
      <div className="max-w-[1600px] mx-auto w-full flex justify-center mb-12">
        <button
          onClick={generateAllCodes}
          disabled={!isLiveMapComplete || isSaving}
          className={`px-16 py-6 rounded-2xl font-black text-2xl uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center gap-4 ${
            isLiveMapComplete 
              ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-white/10 cursor-pointer' 
              : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
          } ${isSaving ? 'animate-pulse opacity-50' : ''}`}
        >
          {isSaving ? 'Saving Data...' : (
            <>
              <Zap className={`w-6 h-6 ${isLiveMapComplete ? 'text-black' : 'text-white/20'}`} />
              Generate Codes
            </>
          )}
        </button>
      </div>

      {renderCubeSection("Decoy 1", 10)}
      {renderCubeSection("Decoy 2", 20)}
      {renderCubeSection("Decoy 3", 30)}
      {renderCubeSection("Decoy 4", 40)}
      {renderCubeSection("Decoy 5", 50)}
    </div>
  );
};

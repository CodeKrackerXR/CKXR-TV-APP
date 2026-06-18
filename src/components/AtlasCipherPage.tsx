import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { ShieldCheck, ChevronLeft, Info, Zap, RotateCw, Activity, Box, Save, Check, X, Sliders } from 'lucide-react';


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
    const level = idx < 5 ? 'L1' : 'L2';
    const row = idx < 5 ? 'T' : 'B';
    return `${level}${row}${idx + 1}`;
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
  if (idx >= 40 && idx < 50) { // Decoy 4 (Cubes 41-50, indices 40-49)
    const row = idx < 45 ? 'T' : 'B';
    return `D4${row}${idx + 1}`;
  }
  if (idx >= 50 && idx < 60) { // Decoy 5 (Cubes 51-60, indices 50-59)
    const row = idx < 55 ? 'T' : 'B';
    return `D5${row}${idx + 1}`;
  }
  return null;
};


export const AtlasCipherPage: React.FC<AtlasCipherPageProps> = ({ onBack, youtuber, onPlay, onGoToCube }) => {
  const [inputText, setInputText] = useState('CODE');
  const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const alphabetScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = alphabetScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const progress = (el.scrollLeft / maxScroll) * 100;
    setScrollProgress(progress);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseFloat(e.target.value);
    setScrollProgress(progress);
    const el = alphabetScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = (progress / 100) * maxScroll;
  };

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
            finalLetter: c.finalLetter || '', // Final Cube Face - Live Map only
            finalNumber: c.finalNumber || '', // Final Cube Face - Live Map only
            cipherOutput: c.cipherOutput || '',
            identificationLabel: c.identificationLabel || '',
            riddleNumber: c.riddleNumber || '',
            riddle: c.riddle || ''          // Live Map only
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
      rotation: '',    // Live Map only
      finalLetter: '', // Final Cube Face - Live Map only
      finalNumber: '', // Final Cube Face - Live Map only
      riddle: ''       // Live Map only
    }));
  });

  const [activeShiftTarget, setActiveShiftTarget] = useState<string>('stage1');

  const [shifts, setShifts] = useState<{ [key: string]: number }>(() => {
    const savedShifts = localStorage.getItem('atlas_session_shifts_v2');
    if (savedShifts) {
      try {
        const parsed = JSON.parse(savedShifts);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved shifts", e);
      }
    }
    const oldShift = localStorage.getItem('atlas_session_shift');
    const baseShift = oldShift ? parseInt(oldShift) : 3;
    const initial: { [key: string]: number } = { stage1: baseShift };
    for (let i = 1; i <= 10; i++) {
      initial[`cube-${i}`] = baseShift;
    }
    return initial;
  });

  const getCubeShift = (cardIndex: number): number => {
    const cubeNum = (cardIndex % 10) + 1;
    return shifts[`cube-${cubeNum}`] ?? shifts.stage1 ?? 3;
  };

  const [selectedLetters, setSelectedLetters] = useState<{ [key: string]: string }>(() => {
    const savedLetters = localStorage.getItem('atlas_session_letters_v2');
    if (savedLetters) {
      try {
        const parsed = JSON.parse(savedLetters);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved letters", e);
      }
    }
    return { stage1: 'C' };
  });
  const [viewMode, setViewMode] = useState<'live-decoy' | 'cube-faces'>(() => {
    return (localStorage.getItem('atlas_cipher_view_mode') as 'live-decoy' | 'cube-faces') || 'live-decoy';
  });
  const [activeRiddleEditIndex, setActiveRiddleEditIndex] = useState<number | null>(null);
  const [tempRiddleText, setTempRiddleText] = useState<string>('');

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
            rotation: c.rotation || '',
            finalLetter: c.finalLetter || '',
            finalNumber: c.finalNumber || '',
            riddle: c.riddle || ''
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
      rotation: '',
      finalLetter: '',
      finalNumber: '',
      riddle: ''
    }));
  });

  // Helper to determine if a section (from startIndex to startIndex + 10) is changed/dirty
  const isSectionDirty = (startIndex: number) => {
    for (let i = startIndex; i < startIndex + 10; i++) {
      const curr = cubes[i] || { letter: '', number: '', episode: '', sponsorAd: '', rotation: '', finalLetter: '', finalNumber: '', riddle: '' };
      const saved = lastSavedSectionCubes[i] || { letter: '', number: '', episode: '', sponsorAd: '', rotation: '', finalLetter: '', finalNumber: '', riddle: '' };
      if (
        (curr.letter || '') !== (saved.letter || '') ||
        (curr.number || '') !== (saved.number || '') ||
        (curr.episode || '') !== (saved.episode || '') ||
        (curr.sponsorAd || '') !== (saved.sponsorAd || '') ||
        (curr.rotation || '') !== (saved.rotation || '') ||
        (curr.finalLetter || '') !== (saved.finalLetter || '') ||
        (curr.finalNumber || '') !== (saved.finalNumber || '') ||
        (curr.riddle || '') !== (saved.riddle || '')
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
          rotation: curr.rotation || '',
          finalLetter: curr.finalLetter || '',
          finalNumber: curr.finalNumber || '',
          riddle: curr.riddle || ''
        };
      }
      return updated;
    });
    saveToLocalStorage();
  };

  // Helper to determine if any of the 6 faces of Cube c is changed/dirty
  const isCubeDirty = (cubeNum: number) => {
    const cIdx = cubeNum - 1; // 0 to 9 index
    const facesIndices = [cIdx, 10 + cIdx, 20 + cIdx, 30 + cIdx, 40 + cIdx, 50 + cIdx];
    for (const i of facesIndices) {
      const curr = cubes[i] || { letter: '', number: '', episode: '', sponsorAd: '', rotation: '', finalLetter: '', finalNumber: '', riddle: '' };
      const saved = lastSavedSectionCubes[i] || { letter: '', number: '', episode: '', sponsorAd: '', rotation: '', finalLetter: '', finalNumber: '', riddle: '' };
      if (
        (curr.letter || '') !== (saved.letter || '') ||
        (curr.number || '') !== (saved.number || '') ||
        (curr.episode || '') !== (saved.episode || '') ||
        (curr.sponsorAd || '') !== (saved.sponsorAd || '') ||
        (curr.rotation || '') !== (saved.rotation || '') ||
        (curr.finalLetter || '') !== (saved.finalLetter || '') ||
        (curr.finalNumber || '') !== (saved.finalNumber || '') ||
        (curr.riddle || '') !== (saved.riddle || '')
      ) {
        return true;
      }
    }
    return false;
  };

  // Handler to save all 6 faces of Cube c
  const handleSaveCube = (cubeNum: number) => {
    const cIdx = cubeNum - 1;
    const facesIndices = [cIdx, 10 + cIdx, 20 + cIdx, 30 + cIdx, 40 + cIdx, 50 + cIdx];
    setLastSavedSectionCubes(prev => {
      const updated = [...prev];
      for (const i of facesIndices) {
        const curr = cubes[i];
        updated[i] = {
          letter: curr.letter || '',
          number: curr.number || '',
          episode: curr.episode || '',
          sponsorAd: curr.sponsorAd || '',
          rotation: curr.rotation || '',
          finalLetter: curr.finalLetter || '',
          finalNumber: curr.finalNumber || '',
          riddle: curr.riddle || ''
        };
      }
      return updated;
    });
    saveToLocalStorage();
  };

  // Autosave to localStorage whenever cubes or shifts change
  useEffect(() => {
    // We only save if we have actual data to avoid overwriting on initial mount if state is empty
    // but here we have a default state of 60 cubes, so we can save.
    const enrichedCubes = cubes.map((c, i) => {
      const currentShift = getCubeShift(i);
      const shiftedL = getShiftedLetter(c.letter, currentShift);
      const shiftedN = getShiftedNumber(c.number, currentShift);
      const label = i < 5 ? `L1T${i + 1}` : i < 10 ? `L2B${i + 1}` : `C${i + 1}`;
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
    localStorage.setItem('atlas_session_shift', (shifts.stage1 ?? 3).toString());
    localStorage.setItem('atlas_session_shifts_v2', JSON.stringify(shifts));
  }, [cubes, shifts]);

  const cubeRefs = useRef<{ letter: HTMLInputElement | null; number: HTMLInputElement | null; episode: HTMLInputElement | null; sponsorAd: HTMLInputElement | null; rotation: HTMLInputElement | null }[]>(
    Array.from({ length: 60 }, () => ({ letter: null, number: null, episode: null, sponsorAd: null, rotation: null }))
  );
  const jumpTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper for duplicate detection across all 60 cubes
  const duplicateOutputs = useMemo(() => {
    const outputs: string[] = [];
    const duplicates = new Set<string>();
    
    cubes.forEach((cube, i) => {
      if (cube.letter && cube.number) {
        const currentShift = getCubeShift(i);
        const shiftedL = getShiftedLetter(cube.letter, currentShift);
        const shiftedN = getShiftedNumber(cube.number, currentShift);
        const code = `${shiftedL}${shiftedN}`;
        if (outputs.includes(code)) {
          duplicates.add(code);
        }
        outputs.push(code);
      }
    });
    return duplicates;
  }, [cubes, shifts]);

  const { result, mapping } = useMemo(() => {
    const cleanText = inputText.toUpperCase().replace(/[^A-Z]/g, '');
    let res = '';
    const map: { [key: string]: string } = {};

    const currentShift = shifts[activeShiftTarget] ?? 3;
    ALPHABET.forEach((l, i) => {
      const targetIdx = (i + (mode === 'ENCODE' ? currentShift : 26 - currentShift)) % 26;
      map[l] = ALPHABET[targetIdx];
    });

    for (const char of cleanText) {
      res += map[char] || char;
    }

    return { result: res, mapping: map };
  }, [inputText, shifts, activeShiftTarget, mode]);

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

  const handleCubeChange = (index: number, field: 'letter' | 'number' | 'episode' | 'sponsorAd' | 'rotation' | 'finalLetter' | 'finalNumber' | 'riddle', value: string) => {
    // Clear any active jump timer to prevent collision of timeouts
    if (jumpTimer.current) {
      clearTimeout(jumpTimer.current);
      jumpTimer.current = null;
    }

    setCubes(prevCubes => {
      const newCubes = [...prevCubes];
      const currentCube = { ...newCubes[index] };
      
      if (field === 'riddle') {
        currentCube.riddle = value;
        newCubes[index] = currentCube;
      } else if (field === 'letter') {
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
      } else if (field === 'finalLetter') {
        const cleanVal = value.toUpperCase().slice(0, 1).replace(/[^A-Z]/g, '');
        currentCube.finalLetter = cleanVal;
        newCubes[index] = currentCube;
      } else if (field === 'finalNumber') {
        const val = value.replace(/[^0-9]/g, '').slice(0, 2);
        currentCube.finalNumber = val;
        newCubes[index] = currentCube;
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
              // Decoys: advance to next cube's letter (or next face's letter in cube-faces mode)
              const focusNext = () => {
                if (viewMode === 'cube-faces') {
                  const nextIdx = index + 10;
                  if (nextIdx < 60) {
                    cubeRefs.current[nextIdx]?.letter?.focus();
                  }
                } else {
                  const nextIdx = index + 1;
                  if (nextIdx < 60) {
                    cubeRefs.current[nextIdx]?.letter?.focus();
                  }
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
              if (viewMode === 'cube-faces') {
                const nextIdx = index + 10;
                if (nextIdx < 60) {
                  cubeRefs.current[nextIdx]?.letter?.focus();
                }
              } else {
                const nextIdx = index + 1;
                if (nextIdx < 60) {
                  cubeRefs.current[nextIdx]?.letter?.focus();
                }
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
      const currentShift = getCubeShift(i);
      const shiftedL = getShiftedLetter(c.letter, currentShift);
      const shiftedN = getShiftedNumber(c.number, currentShift);
      const label = i < 5 ? `L1T${i + 1}` : i < 10 ? `L2B${i + 1}` : `C${i + 1}`;
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
    localStorage.setItem('atlas_session_shift', (shifts.stage1 ?? 3).toString());
    localStorage.setItem('atlas_session_shifts_v2', JSON.stringify(shifts));
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
        rotation: c.rotation || '',
        finalLetter: c.finalLetter || '',
        finalNumber: c.finalNumber || '',
        riddle: c.riddle || ''
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
          const currentShift = getCubeShift(i);
          const shiftedL = getShiftedLetter(c.letter, currentShift);
          const shiftedN = getShiftedNumber(c.number, currentShift);
          const label = i < 5 ? `L1T${i + 1}` : i < 10 ? `L2B${i + 1}` : `C${i + 1}`;
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
            shift: shifts.stage1 ?? 3,
            shifts
          });
          
          // Save to localStorage for the Game Page to access during preview
          localStorage.setItem('atlas_live_map_codes', JSON.stringify(liveMapCodesList));
          localStorage.setItem('atlas_session_cubes', JSON.stringify(enrichedCubes));
          localStorage.setItem('atlas_session_shift', (shifts.stage1 ?? 3).toString());
          localStorage.setItem('atlas_session_shifts_v2', JSON.stringify(shifts));

          console.log("Session saved successfully to Firestore and localStorage.");
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, path, firebaseAuth);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderCubeCard = (idx: number, faceNumber?: number) => {
    const cube = cubes[idx];
    if (!cube) return null;
    const currentShift = getCubeShift(idx);
    const shiftedL = getShiftedLetter(cube.letter, currentShift);
    const shiftedN = getShiftedNumber(cube.number, currentShift);
    const code = `${shiftedL}${shiftedN}`;
    
    const isLiveMap = idx < 10;
    const isDuplicate = isLiveMap ? false : !!(cube.letter && cube.number && duplicateOutputs.has(code));
    const rowPosLabel = getRowPosLabel(idx);
    
    const isDecoy5 = idx >= 50 && idx < 60;
    const isGoldHighlight = isLiveMap || isDecoy5;

    const cubeNumForCard = (idx % 10) + 1;
    const cubeKey = `cube-${cubeNumForCard}`;
    const cardSelectedLetter = selectedLetters[cubeKey] || '?';

    return (
      <div key={idx} className={`bg-black/40 border-2 rounded-3xl p-4 sm:p-6 flex flex-col gap-5 group transition-all hover:bg-black/60 shadow-xl ${isDuplicate ? (isGoldHighlight ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-red-500 bg-red-500/5') : 'border-white/5 hover:border-[#D4AF37]/30'}`}>
        <div className="flex flex-col items-center justify-center pb-4 border-b border-white/5 mb-2">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-[#22c55e] uppercase tracking-[0.1em] drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              Cube {idx + 1}
            </span>
            {faceNumber && (
              <span className="text-white/60 text-sm font-black uppercase tracking-[0.1em] mt-1">
                Face {faceNumber}
              </span>
            )}
          </div>
          {isDuplicate && (
            <div className={`flex items-center gap-1 animate-pulse mt-2 px-3 py-1 rounded-full border ${isGoldHighlight ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
              <Info className="w-3 h-3" />
              <span className="text-[11px] font-black uppercase tracking-wider">Collision</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="flex flex-col gap-2">
             <span className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-1">Letter</span>
             <input
               type="text"
               ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].letter = el; }}
               value={cube.letter || ''}
               onChange={(e) => handleCubeChange(idx, 'letter', e.target.value)}
               maxLength={1}
               placeholder="A"
               className={`w-full bg-black/60 border-2 rounded-2xl p-4 text-center font-black text-3xl text-white focus:outline-none transition-all placeholder:opacity-20 ${isDuplicate ? (isGoldHighlight ? 'border-[#D4AF37]/50 focus:border-[#D4AF37] text-white' : 'border-red-500/50 focus:border-red-500 text-red-100') : 'border-white/10 focus:border-[#D4AF37]'}`}
             />
           </div>
           <div className="flex flex-col gap-2">
             <span className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-1">Number</span>
             <input
               type="text"
               ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].number = el; }}
               value={cube.number || ''}
               onChange={(e) => handleCubeChange(idx, 'number', e.target.value)}
               placeholder="1-10"
               className={`w-full bg-black/60 border-2 rounded-2xl p-4 text-center font-black text-3xl text-white focus:outline-none transition-all placeholder:opacity-20 ${isDuplicate ? (isGoldHighlight ? 'border-[#D4AF37]/50 focus:border-[#D4AF37] text-white' : 'border-red-500/50 focus:border-red-500 text-red-100') : 'border-white/10 focus:border-[#D4AF37]'}`}
             />
           </div>
        </div>

        {isLiveMap && (
          <div className="grid grid-cols-1 gap-4 mt-2">
             <div className="flex flex-col gap-2">
               <span className="text-[11px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em] ml-1">Episode</span>
               <input
                 type="text"
                 ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].episode = el; }}
                 value={cube.episode || ''}
                 onChange={(e) => handleCubeChange(idx, 'episode', e.target.value)}
                 placeholder="1-10"
                 className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-center font-black text-xl text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-mono"
               />
             </div>
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 ml-1">
                 <span className={`w-2.5 h-2.5 rounded-full ${
                   !cube.riddle || cube.riddle.trim() === ''
                     ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                     : cube.riddle === (lastSavedSectionCubes[idx]?.riddle || '')
                       ? 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,148,0.6)]'
                       : 'bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                 }`} />
                 <span className="text-[11px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em]">Riddle</span>
               </div>
               <button
                 type="button"
                 onClick={() => {
                   setActiveRiddleEditIndex(idx);
                   setTempRiddleText(cube.riddle || '');
                 }}
                 className="w-full bg-[#f1c40f]/10 border border-[#f1c40f]/40 hover:bg-[#f1c40f]/20 hover:border-[#f1c40f] rounded-xl p-3 text-center font-black text-xl text-[#f1c40f] font-mono transition-all duration-200 cursor-pointer active:scale-[0.98]"
               >
                 Riddle {idx + 1}
               </button>
             </div>
             <div className="flex flex-col gap-2">
               <span className="text-[11px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em] ml-1">Sponsor Ad</span>
               <input
                 type="text"
                 ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].sponsorAd = el; }}
                 value={cube.sponsorAd || ''}
                 onChange={(e) => handleCubeChange(idx, 'sponsorAd', e.target.value)}
                 placeholder="1-10"
                 className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-center font-black text-xl text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-mono"
               />
             </div>
             <div className="flex flex-col gap-2 relative">
               <span className="text-[11px] font-black text-[#D4AF37]/40 uppercase tracking-[0.2em] ml-1">Rotation</span>
               <div className="relative">
                 <input
                   type="text"
                   ref={el => { if (cubeRefs.current[idx]) cubeRefs.current[idx].rotation = el; }}
                   value={cube.rotation || ''}
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
          <div className="mt-2 flex flex-col gap-4 p-4 sm:p-5 bg-black/60 rounded-3xl border border-white/5 shadow-inner group-hover:bg-black/80 transition-all">
            {isLiveMap && (
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20 leading-tight">Cipher<br/>Output:</span>
                 <span className={`text-4xl font-black font-mono tracking-widest italic ${isDuplicate ? (isGoldHighlight ? 'text-[#D4AF37]' : 'text-red-500') : 'text-[#D4AF37]'}`}>
                  {shiftedL || '-'}{shiftedN || '-'}
                </span>
              </div>
            )}

            {isLiveMap && (
              <div className="flex flex-col gap-3 border-b border-white/5 pb-3">
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]/60 text-center">
                  Final Cube Face
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] text-center whitespace-nowrap">Letter</span>
                    <input
                      type="text"
                      value={cube.finalLetter || ''}
                      onChange={(e) => handleCubeChange(idx, 'finalLetter', e.target.value)}
                      placeholder="A"
                      maxLength={1}
                      className="w-full bg-black/60 border-2 border-[#22c55e]/30 rounded-2xl py-3 px-1 text-center font-black text-2xl text-[#22c55e] focus:outline-none transition-all placeholder:opacity-20 focus:border-[#22c55e] hover:border-[#22c55e]/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] text-center whitespace-nowrap">Number</span>
                    <input
                      type="text"
                      value={cube.finalNumber || ''}
                      onChange={(e) => handleCubeChange(idx, 'finalNumber', e.target.value)}
                      placeholder="1-10"
                      maxLength={2}
                      className="w-full bg-black/60 border-2 border-[#22c55e]/30 rounded-2xl py-3 px-1 text-center font-black text-2xl text-[#22c55e] focus:outline-none transition-all placeholder:opacity-20 focus:border-[#22c55e] hover:border-[#22c55e]/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {rowPosLabel && (
               <div className="flex flex-col items-center justify-center pt-2">
                  <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Cube Position</span>
                  <div className="text-2xl font-black text-[#D4AF37] tracking-[0.2em] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                    {rowPosLabel}
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    );
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
            
            {/* Controls Row: Save Info Button */}
            <div className="flex items-center gap-4 flex-wrap">

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
            {Array.from({ length: 10 }, (_, innerIdx) => {
              const idx = startIndex + innerIdx;
              return renderCubeCard(idx);
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

  const renderCubeFacesSection = (cubeNum: number) => {
    const cIdx = cubeNum - 1;
    const isDirty = isCubeDirty(cubeNum);

    return (
      <div key={cubeNum} className="max-w-[1600px] mx-auto w-full mb-12 animate-in fade-in duration-300">
        <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-3xl p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <div className="w-full md:w-1/3 flex justify-center md:justify-start">
              <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                <Activity className="w-8 h-8 text-[#D4AF37]" />
                Cube {cubeNum} - All Faces
              </h3>
            </div>
            
            {/* Centered Yellow Key Ref (No Box) */}
            <div className="w-full md:w-1/3 flex justify-center text-center select-none">
              <span className="text-3xl font-black text-[#D4AF37] italic uppercase tracking-[0.15em]">
                Key Ref {(selectedLetters[`cube-${cubeNum}`] || '?')}{shifts[`cube-${cubeNum}`] ?? 3}
              </span>
            </div>

            <div className="w-full md:w-1/3 flex justify-center md:justify-end">
              <button
                onClick={() => handleSaveCube(cubeNum)}
                className={`px-5 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 shadow-lg select-none ${
                  isDirty
                    ? 'bg-red-500/15 border-2 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer'
                    : 'bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)] cursor-default'
                }`}
                disabled={!isDirty}
                id={`save-cube-btn-${cubeNum}`}
                title={isDirty ? `Save Changes in Cube ${cubeNum}` : `All Changes Saved in Cube ${cubeNum}`}
              >
                {isDirty ? (
                  <>
                    <Save className="w-4 h-4 animate-pulse text-red-500 group-hover:text-white" />
                    <span>Save Cube</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {renderCubeCard(cIdx, 1)}
            {renderCubeCard(10 + cIdx, 2)}
            {renderCubeCard(20 + cIdx, 3)}
            {renderCubeCard(30 + cIdx, 4)}
            {renderCubeCard(40 + cIdx, 5)}
            {renderCubeCard(50 + cIdx, 6)}
          </div>
          
          <div className="mt-12 p-8 bg-black/20 rounded-3xl border border-white/5 flex items-start gap-5">
             <Info className="w-6 h-6 text-[#D4AF37] mt-1 shrink-0" />
             <p className="text-sm text-white/40 font-bold uppercase leading-relaxed tracking-wider">
               Cube Faces Configuration: Face 1 is the <span className="text-[#D4AF37] font-black">Active Live Map</span> block containing standard rotation keys and local riddle properties. Faces 2-6 serve as the Decoy layer.
             </p>
          </div>
        </div>
      </div>
    );
  };;

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
          {/* Key Coordinator */}
          <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
              <Sliders className="w-5 h-5 text-[#D4AF37]" />
              Key Coordinator
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-4 leading-relaxed">
              Select a target below, then use the slider to set its custom rotation offset:
            </p>

            <div className="space-y-4">
              {/* Stage 1 Option */}
              <button
                onClick={() => setActiveShiftTarget('stage1')}
                className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest border transition-all flex items-center justify-between px-5 cursor-pointer ${
                  activeShiftTarget === 'stage1'
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-[1.02]'
                    : 'bg-black/30 text-white/70 border-white/10 hover:text-white hover:border-white/30'
                }`}
              >
                <span>Stage 1 Wheel</span>
                <span className={`text-sm px-2.5 py-1 rounded-md font-mono font-black ${activeShiftTarget === 'stage1' ? 'bg-black/10 text-black' : 'bg-white/10 text-[#D4AF37]'}`}>
                  {(selectedLetters.stage1 || '?')}{shifts.stage1 ?? 3}
                </span>
              </button>

              {/* Cube 1-10 Grid */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => {
                  const cubeKey = `cube-${i + 1}`;
                  const isActive = activeShiftTarget === cubeKey;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveShiftTarget(cubeKey)}
                      className={`py-3 rounded-xl uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                        isActive
                          ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-105'
                          : 'bg-black/30 text-white/60 border-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="opacity-70 text-[11px] font-black tracking-wider">C{i + 1}</span>
                      <span className={`font-mono text-center leading-none text-sm font-black ${isActive ? 'text-black' : 'text-[#D4AF37]'}`}>
                        {(selectedLetters[cubeKey] || '?')}{shifts[cubeKey] ?? 3}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cipher Core */}
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
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg cursor-pointer ${mode === 'ENCODE' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Encode
                  </button>
                  <button
                    onClick={() => setMode('DECODE')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg cursor-pointer ${mode === 'DECODE' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white/40 hover:text-white'}`}
                  >
                    Decode
                  </button>
                </div>
              </div>

              <div>
                 <label className="flex justify-between items-center text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-3">
                   <span>Rotation Shift (Key)</span>
                   <span className="text-[#D4AF37] text-sm font-black font-mono">
                     {activeShiftTarget === 'stage1' ? 'STAGE 1' : `CUBE ${activeShiftTarget.split('-')[1]}`} : {shifts[activeShiftTarget] ?? 3}
                   </span>
                 </label>
                 <input
                  type="range"
                  min="0"
                  max="25"
                  value={shifts[activeShiftTarget] ?? 3}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setShifts(prev => {
                      const updated = { ...prev, [activeShiftTarget]: val };
                      localStorage.setItem('atlas_session_shifts_v2', JSON.stringify(updated));
                      return updated;
                    });
                  }}
                  className="w-full accent-[#D4AF37] cursor-pointer h-1.5 bg-white/10 rounded-full"
                />
                <div className="flex justify-between text-[10px] text-white/20 font-black mt-2">
                  <span>0</span>
                  <span>13</span>
                  <span>25</span>
                </div>
              </div>

              {activeShiftTarget === 'stage1' && (
                <div>
                  <label className="text-[10px] font-black text-[#D4AF37]/50 uppercase tracking-[0.2em] mb-3 block">Input Sequence (Letters)</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.toUpperCase())}
                    className="w-full bg-black/40 border border-[#D4AF37]/20 rounded-xl p-4 font-mono text-lg text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-all resize-none h-32"
                  />
                </div>
              )}
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
              <div 
                ref={alphabetScrollRef}
                onScroll={handleScroll}
                className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide font-mono"
              >
                {ALPHABET.map((l, i) => {
                  const activeLetter = selectedLetters[activeShiftTarget];
                  const isSelected = activeLetter ? l === activeLetter : false;
                  return (
                    <div key={i} className="flex flex-col items-center gap-3 min-w-[32px]">
                      <button
                        onClick={() => {
                          setSelectedLetters(prev => {
                            const updated = { ...prev, [activeShiftTarget]: l };
                            localStorage.setItem('atlas_session_letters_v2', JSON.stringify(updated));
                            return updated;
                          });
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                            : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                        }`}
                        title={`Select letter ${l} to shift from`}
                      >
                        {l}
                      </button>
                      <div className="text-[#D4AF37] text-[10px]">&darr;</div>
                      <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-xs font-black text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                        {mapping[l]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Slider Bar */}
              <div className="mt-4 flex flex-col items-center gap-2 border-t border-white/5 pt-4">
                <div className="w-full flex items-center gap-3">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">A</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={scrollProgress}
                    onChange={handleSliderChange}
                    className="flex-1 accent-[#D4AF37] cursor-pointer h-1 bg-white/10 rounded-full"
                    title="Slide to scroll Alphabet"
                  />
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Z</span>
                </div>
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
                     <span className="text-white text-lg">{selectedLetters[activeShiftTarget] || '-'}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                     <span className="text-[#D4AF37]/40">Mapped Letter</span>
                     <span className="text-[#D4AF37] text-3xl">{selectedLetters[activeShiftTarget] ? (mapping[selectedLetters[activeShiftTarget]] || '-') : '-'}</span>
                   </div>
                   <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                     <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(((shifts[activeShiftTarget] ?? 3)) / 25) * 100}%` }}
                        className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"
                     />
                   </div>
                 </div>
              </div>

              <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex items-center">
                 <p className="text-xs text-white/50 font-bold uppercase leading-relaxed italic border-l-4 border-[#D4AF37] pl-6 py-2">
                   "The shift value of {shifts[activeShiftTarget] ?? 3} determines the character offset. Each letter is converted to its respective position in the alphabet plus the key value."
                 </p>
              </div>
            </div>

            {activeShiftTarget === 'stage1' && (
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
                        onPlay?.({ code: result, shift: shifts.stage1 ?? 3 });
                      }}
                      className="w-full md:w-auto h-20 px-12 bg-white text-black font-black text-xl uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] whitespace-nowrap"
                    >
                      Play Atlas
                    </button>
                 </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="max-w-[1600px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 p-8 bg-[#121212] border border-[#D4AF37]/20 rounded-3xl shadow-xl">
        <div className="flex flex-col gap-1.5 self-start sm:self-center">
          <span className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Box className="w-6 h-6 text-[#D4AF37]" />
            Cipher Configuration Mode
          </span>
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest pl-9">
            Toggle between flat grid matrix (Live + Decoys) and 6-sided individual cube faces
          </span>
        </div>

        <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 w-full sm:max-w-md shadow-inner">
          <button
            onClick={() => {
              setViewMode('live-decoy');
              localStorage.setItem('atlas_cipher_view_mode', 'live-decoy');
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl cursor-pointer ${
              viewMode === 'live-decoy' 
                ? 'bg-[#D4AF37] text-black font-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Live Map & Decoys
          </button>
          <button
            onClick={() => {
              setViewMode('cube-faces');
              localStorage.setItem('atlas_cipher_view_mode', 'cube-faces');
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl cursor-pointer ${
              viewMode === 'cube-faces' 
                ? 'bg-[#D4AF37] text-black font-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Cube Faces
          </button>
        </div>
      </div>

      {viewMode === 'live-decoy' ? (
        <>
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
        </>
      ) : (
        <>
          {Array.from({ length: 10 }, (_, i) => renderCubeFacesSection(i + 1))}
        </>
      )}

      {activeRiddleEditIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in"
          onClick={() => setActiveRiddleEditIndex(null)}
        >
          <div 
            className="bg-[#0e0e0e] border-2 border-[#D4AF37] rounded-[2rem] w-full max-w-3xl p-8 relative flex flex-col gap-6 shadow-[0_0_50px_rgba(212,175,55,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f1c40f] animate-pulse" />
                <h3 className="text-xl font-black text-white uppercase tracking-wider font-sans">
                  Riddle {activeRiddleEditIndex + 1}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setActiveRiddleEditIndex(null)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Description */}
            <div className="text-xs text-white/50 leading-relaxed font-sans">
              Type in the full riddle for Cube {activeRiddleEditIndex + 1}. You can enter multiple sentences or separate paragraphs as needed.
            </div>

            {/* Input Textarea */}
            <textarea
              value={tempRiddleText}
              onChange={(e) => setTempRiddleText(e.target.value)}
              placeholder="Start typing your riddle here..."
              rows={14}
              className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 font-mono text-white text-base focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-white/20 leading-relaxed resize-y"
            />

            {/* Buttons / Actions */}
            <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setActiveRiddleEditIndex(null)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-bold uppercase text-[11px] tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCubeChange(activeRiddleEditIndex, 'riddle', tempRiddleText);
                  setActiveRiddleEditIndex(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black font-extrabold uppercase text-[11.5px] tracking-widest hover:bg-[#D4AF37]/90 active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                Apply Riddle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

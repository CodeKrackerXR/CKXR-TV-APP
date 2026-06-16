import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TVContainer } from '@/src/components/TVContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence, animate } from 'motion/react';
import { User, Plus, LogIn, ArrowRight, Tv, Pencil, Play, PlayCircle, History as HistoryIcon, ChevronLeft, Box } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CaesarCipherPage } from './components/CaesarCipherPage';
import { CaesarGamePage } from './components/CaesarGamePage';
import { AtlasCipherPage } from './components/AtlasCipherPage';
import { AtlasGamePage } from './components/AtlasGamePage';
import { AtlasCubePage } from './components/AtlasCubePage';
import { CurrencyAuthenticator } from './components/CurrencyAuthenticator';
import { RailFencePage } from './components/RailFencePage';
import { RailFenceGamePage } from './components/RailFenceGamePage';
import { VigenereCipherPage } from './components/VigenereCipherPage';
import { VigenereGamePage } from './components/VigenereGamePage';
import { ADFGVXPage } from './components/ADFGVXPage';
import { ADFGVXGamePage } from './components/ADFGVXGamePage';
import { TranspositionPage } from './components/TranspositionPage';
import { PlayfairPage } from './components/PlayfairPage';
import { TranspositionGamePage } from './components/TranspositionGamePage';
import { PlayfairGamePage } from './components/PlayfairGamePage';
import { FourSquarePage } from './components/FourSquarePage';
import { FourSquareGamePage } from './components/FourSquareGamePage';
import { NihilistPage } from './components/NihilistPage';
import { NihilistGamePage } from './components/NihilistGamePage';
import { BifidPage } from './components/BifidPage';
import { BifidGamePage } from './components/BifidGamePage';
import { AtlasSessionProvider } from './context/atlasSessionContext';

import { EnigmaPage } from './components/EnigmaPage';
import { EnigmaGamePage } from './components/EnigmaGamePage';
import { CipherHistoryPage } from './components/CipherHistoryPage';

type Screen = 'LOGIN' | 'PROFILE_SELECTION' | 'CREATE_PROFILE' | 'HOME' | 'EPISODE_DETAIL' | 'VIDEO_PLAYER' | 'CAESAR_WHEEL' | 'CAESAR_ENCODE' | 'CAESAR_GAME' | 'RAIL_FENCE' | 'RAIL_FENCE_GAME' | 'VIGENERE' | 'ADFGVX' | 'ADFGVX_GAME' | 'TRANSPOSITION' | 'TRANSPOSITION_GAME' | 'PLAYFAIR' | 'PLAYFAIR_GAME' | 'FOUR_SQUARE' | 'FOUR_SQUARE_GAME' | 'NIHILIST' | 'NIHILIST_GAME' | 'BIFID' | 'BIFID_GAME' | 'MORE_INFO_MENU' | 'ONE_DOLLAR_BILL' | 'PLAYERS_INFO' | 'LEADER_BOARD' | 'LEGAL' | 'EPISODE_SETTINGS' | 'VIGENERE_GAME' | 'ENIGMA_ENCODE' | 'ENIGMA_GAME' | 'CIPHER_HISTORY' | 'ATLAS_ENCODE' | 'ATLAS_GAME' | 'ATLAS_CUBE';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  serial?: string;
}

const INITIAL_PROFILES: Profile[] = [
  { id: '1', name: 'Vinny', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Felix&skinColor=edb98a', color: 'bg-blue-600', serial: 'L70191845K' },
  { id: '2', name: 'Mary', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aneka&skinColor=f8d25c', color: 'bg-red-600', serial: 'L70191845K' },
  { id: '3', name: 'Kids', avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Caleb&skinColor=fd9841', color: 'bg-yellow-500', serial: 'L70191845K' },
];

interface Youtuber {
  name: string;
  teamName: string;
  avatar: string;
  profile: string;
  TheHuntThumbNail: string;
  thumbnail: string;
  TheHuntVideo: string;
  TheBreakInThumbNail: string;
  TheBreakInVideo: string;
  DigitalCoinThumbNail: string;
  DigitalCoinShort: string;
  question?: string;
  jackpot: string;
  targetItem?: string;
  targetItemImage?: string;
  cipherName?: string;
  cipherVideoUrl?: string; // Tutorial for the cipher
  sponsor?: {
    logo: string;
    video: string;
    name: string;
    logoHeight?: string;
  };
}

const Logo: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <div 
    className="text-white hover:text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1" 
    onClick={onClick}
  >
    <span className="text-xl font-black uppercase tracking-tighter">The Code</span>
    <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] flex items-center justify-center p-1 overflow-hidden">
      <img src="https://i.ibb.co/67vY2yYj/Gold-X-Green-R.png" alt="XR Logo" className="w-full h-full object-contain" />
    </div>
    <span className="text-xl font-black uppercase tracking-tighter">Challenge</span>
  </div>
);

const DEFAULT_SPONSOR = {
  logo: "https://i.ibb.co/fYgPsJ9b/Doritos-Logo-1536x960.png",
  video: "https://www.youtube.com/watch?v=Nz4ag3kEvVU",
  name: "Doritos",
  logoHeight: "h-28"
};

const YOUTUBE_DATA: Youtuber[] = [
  {
    name: "Hullsome",
    teamName: "TEAM HULLSOME",
    avatar: "https://i.ibb.co/nMxk4hFV/Hullsome.png",
    profile: "https://www.youtube.com/@hullsome/featured",
    TheHuntThumbNail: "https://i.ibb.co/PsZ7SKsP/Hullsome-TN.png",
    thumbnail: "https://i.ibb.co/PsZ7SKsP/Hullsome-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=6aGaPtSneg8",
    TheBreakInThumbNail: "https://i.ibb.co/PsZ7SKsP/Hullsome-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=6aGaPtSneg8",
    DigitalCoinThumbNail: "https://i.ibb.co/PsZ7SKsP/Hullsome-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=6aGaPtSneg8",
    question: "What was the first number Hullsome found?",
    jackpot: "$125,000",
    targetItem: "The Ring",
    targetItemImage: "https://i.ibb.co/SwMn1K8S/Ring.png",
    cipherName: "Caesar Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=tvZ5O3RJfCQ",
    sponsor: {
      logo: "https://i.ibb.co/6JYvwTmT/verizon-wireless-logo.jpg",
      video: "https://www.youtube.com/watch?v=2lk5L0IzDO8",
      name: "Verizon",
      logoHeight: "h-20"
    }
  },
  {
    name: "Chris Ramsey",
    teamName: "Team Area 52",
    avatar: "https://i.ibb.co/jPn3tWQ3/Chris-Ramsey.png",
    profile: "https://www.youtube.com/@ChrisRamsay52",
    TheHuntThumbNail: "https://i.ibb.co/wh2WxJj9/Chris-Ramsey-TN.png",
    thumbnail: "https://i.ibb.co/wh2WxJj9/Chris-Ramsey-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=g5sZYv3edNE&t=313s",
    TheBreakInThumbNail: "https://i.ibb.co/wh2WxJj9/Chris-Ramsey-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=g5sZYv3edNE&t=313s",
    DigitalCoinThumbNail: "https://i.ibb.co/wh2WxJj9/Chris-Ramsey-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=g5sZYv3edNE&t=313s",
    question: "What was the total number of Area 52 clues?",
    jackpot: "$150,000",
    targetItem: "Drill",
    targetItemImage: "https://i.ibb.co/tTgrXWty/Drill.jpg",
    cipherName: "Rail Fence Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=1bzf5fmSusc",
    sponsor: {
      logo: "https://i.ibb.co/fYgPsJ9b/Doritos-Logo-1536x960.png",
      video: "https://www.youtube.com/watch?v=Nz4ag3kEvVU",
      name: "Doritos",
      logoHeight: "h-28"
    }
  },
  {
    name: "Hafu Go",
    teamName: "TEAM HAFU",
    avatar: "https://i.ibb.co/60PXBydQ/Ha-Fu-Go.png",
    profile: "https://www.youtube.com/@hafu",
    TheHuntThumbNail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    thumbnail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=71RjddPuSjs&t=227s",
    TheBreakInThumbNail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=71RjddPuSjs&t=227s",
    DigitalCoinThumbNail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=71RjddPuSjs&t=227s",
    question: "How many items did Hafu Go find?",
    jackpot: "$200,000",
    targetItem: "Endoscope",
    targetItemImage: "https://i.ibb.co/21ZbYtSL/Endo-Scope.jpg",
    cipherName: "Vigenère Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=J1o2zo6HleY",
    sponsor: {
      logo: "https://i.ibb.co/CXDvMFV/Chevrolet-logo.png",
      video: "https://www.youtube.com/watch?v=z-WbGh6UjCM",
      name: "Chevrolet"
    }
  },
  {
    name: "Brent Rivera",
    teamName: "TEAM BRENT",
    avatar: "https://i.ibb.co/sJ15RbhS/Brent-Rivera.png",
    profile: "https://www.youtube.com/@brentrivera",
    TheHuntThumbNail: "https://i.ibb.co/jk08Mdk2/Brent-Rivera-TN.png",
    thumbnail: "https://i.ibb.co/jk08Mdk2/Brent-Rivera-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=Z5NtYq3i-mk",
    TheBreakInThumbNail: "https://i.ibb.co/jk08Mdk2/Brent-Rivera-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=Z5NtYq3i-mk",
    DigitalCoinThumbNail: "https://i.ibb.co/jk08Mdk2/Brent-Rivera-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=Z5NtYq3i-mk",
    question: "What color was the Brent Rivera treasure box?",
    jackpot: "$250,000",
    targetItem: "Impact driver",
    targetItemImage: "https://i.ibb.co/HTzpQjZK/Imapact-Driver.jpg",
    cipherName: "Enigma Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=hiOjqskDlS0",
    sponsor: {
      logo: "https://i.ibb.co/FjsDCGM/Pringles-logo.jpg",
      video: "https://www.youtube.com/watch?v=pEYkM3boSos",
      name: "Pringles"
    }
  },
  {
    name: "FaZe Rug",
    teamName: "TEAM RUG",
    avatar: "https://i.ibb.co/0jkGf0Bf/Faze-Rug.png",
    profile: "https://www.youtube.com/@rug",
    TheHuntThumbNail: "https://i.ibb.co/PGyHJGw9/Faz-Rug-TN.png",
    thumbnail: "https://i.ibb.co/PGyHJGw9/Faz-Rug-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=nstp6Xopi-Q",
    TheBreakInThumbNail: "https://i.ibb.co/PGyHJGw9/Faz-Rug-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=nstp6Xopi-Q",
    DigitalCoinThumbNail: "https://i.ibb.co/PGyHJGw9/Faz-Rug-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=nstp6Xopi-Q",
    question: "Where did FaZe Rug find his final clue?",
    jackpot: "$300,000",
    targetItem: "Headphones",
    targetItemImage: "https://i.ibb.co/xq6Fn1M3/Headphones.jpg",
    cipherName: "ADFGVX Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=XqaJwp1EGRA"
  },
  {
    name: "Zach King",
    teamName: "TEAM KING",
    avatar: "https://i.ibb.co/Q7mrvgCF/Zach-King.png",
    profile: "https://www.youtube.com/@ZachKing",
    TheHuntThumbNail: "https://i.ibb.co/4RYgg6K7/Zach-King-TN.png",
    thumbnail: "https://i.ibb.co/4RYgg6K7/Zach-King-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=4V16xkpb9NE",
    TheBreakInThumbNail: "https://i.ibb.co/4RYgg6K7/Zach-King-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=4V16xkpb9NE",
    DigitalCoinThumbNail: "https://i.ibb.co/4RYgg6K7/Zach-King-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=4V16xkpb9NE",
    question: "What magic trick did Zach King perform?!",
    jackpot: "$350,000",
    targetItem: "Spray smoke",
    targetItemImage: "https://i.ibb.co/S4DnryVy/Smoke-Can.jpg",
    cipherName: "Transposition Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=6OtKgLtZlgg"
  },
  {
    name: "Mr. Beast",
    teamName: "TEAM BEAST",
    avatar: "https://i.ibb.co/3YTqvMwS/Mr-Beast.png",
    profile: "https://www.youtube.com/@MrBeast",
    TheHuntThumbNail: "https://i.ibb.co/NgmQbWKD/Mr-Beast-TN.png",
    thumbnail: "https://i.ibb.co/NgmQbWKD/Mr-Beast-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=iogcY_4xGjo",
    TheBreakInThumbNail: "https://i.ibb.co/NgmQbWKD/Mr-Beast-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=iogcY_4xGjo",
    DigitalCoinThumbNail: "https://i.ibb.co/NgmQbWKD/Mr-Beast-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=iogcY_4xGjo",
    question: "How many crew members were on the hunt with Mr. Beast?",
    jackpot: "$400,000",
    targetItem: "Listening device",
    targetItemImage: "https://i.ibb.co/QLTn7NS/Listening-Device.jpg",
    cipherName: "Playfair Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=PrpwPjG3jt4"
  },
  {
    name: "Mark Rober",
    teamName: "TEAM ROBER",
    avatar: "https://i.ibb.co/WvRvBBdm/Mark-Rober.png",
    profile: "https://www.youtube.com/@MarkRober",
    TheHuntThumbNail: "https://i.ibb.co/DPqstmGQ/Mark-Rober-TN.png",
    thumbnail: "https://i.ibb.co/DPqstmGQ/Mark-Rober-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=pLtHyLlLt4Y&t=36s",
    TheBreakInThumbNail: "https://i.ibb.co/DPqstmGQ/Mark-Rober-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=pLtHyLlLt4Y&t=36s",
    DigitalCoinThumbNail: "https://i.ibb.co/DPqstmGQ/Mark-Rober-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=pLtHyLlLt4Y&t=36s",
    question: "What scientific gadget did Mark Rober use first?",
    jackpot: "$450,000",
    targetItem: "Stud Finder",
    targetItemImage: "https://i.ibb.co/ymf5qPTt/Stud-Finder.jpg",
    cipherName: "Four-Square Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=HwiQ7-rL2w0"
  },
  {
    name: "Dude Perfect",
    teamName: "TEAM PERFECT",
    avatar: "https://i.ibb.co/k6BfZsS8/Dude-Perfect.png",
    profile: "https://www.youtube.com/@dudeperfect",
    TheHuntThumbNail: "https://i.ibb.co/7xybRHT8/Dude-Perfect-TN.png",
    thumbnail: "https://i.ibb.co/7xybRHT8/Dude-Perfect-TN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=dw-kwjzXSsA&t=335s",
    TheBreakInThumbNail: "https://i.ibb.co/7xybRHT8/Dude-Perfect-TN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=dw-kwjzXSsA&t=335s",
    DigitalCoinThumbNail: "https://i.ibb.co/7xybRHT8/Dude-Perfect-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=dw-kwjzXSsA&t=335s",
    question: "Which Dude Perfect member found the first clue?",
    jackpot: "$500,000",
    targetItem: "Key 1 (Solis)",
    targetItemImage: "https://i.ibb.co/shWyscy/Solis-Key.jpg",
    cipherName: "Nihilist Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=apQ11whepHo&t=11s"
  },
  {
    name: "JSTU",
    teamName: "TEAM JSTU",
    avatar: "https://i.ibb.co/9HZz6NG3/JSTU.png",
    profile: "https://www.youtube.com/@MoreJStu",
    TheHuntThumbNail: "https://i.ibb.co/8nt16wTK/JSTUTN.png",
    thumbnail: "https://i.ibb.co/8nt16wTK/JSTUTN.png",
    TheHuntVideo: "https://www.youtube.com/watch?v=XeraCWlYFwA",
    TheBreakInThumbNail: "https://i.ibb.co/8nt16wTK/JSTUTN.png",
    TheBreakInVideo: "https://www.youtube.com/watch?v=XeraCWlYFwA",
    DigitalCoinThumbNail: "https://i.ibb.co/8nt16wTK/JSTUTN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=XeraCWlYFwA",
    question: "How long did it take JSTU to reach the location?",
    jackpot: "$550,000",
    targetItem: "Key 2 (Noctis)",
    targetItemImage: "https://i.ibb.co/rJhpLhD/Noctis-Key.jpg",
    cipherName: "Bifid Cipher",
    cipherVideoUrl: "https://www.youtube.com/watch?v=V8rEh1b_Kmg"
  },
  {
    name: "TBD-Episode 11",
    teamName: "",
    avatar: "",
    profile: "https://www.youtube.com/",
    TheHuntThumbNail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    thumbnail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    TheHuntVideo: "https://www.youtube.com/",
    TheBreakInThumbNail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    TheBreakInVideo: "https://www.youtube.com/",
    DigitalCoinThumbNail: "https://i.ibb.co/Zz8ZMPTH/Ha-Fu-Go-TN.png",
    DigitalCoinShort: "https://www.youtube.com/",
    question: "Episode 11 Question TBD",
    jackpot: "$600,000",
    targetItem: "TBD",
    targetItemImage: "https://i.ibb.co/rJhpLhD/Noctis-Key.jpg",
    cipherName: "Atlas Cipher",
    cipherVideoUrl: "https://www.youtube.com/"
  }
];

const DOLLAR_BILL_LEVELS = [
  {
    level: 1,
    question: "What is the Bank of Origin?",
    secret: "The First Letter of the Serial Number.",
    explanation: "Every $1 bill is issued by one of 12 Federal Reserve Banks. That first letter (A through L) tells you which one.",
    exampleAnswer: "If the bill starts with L, the answer is \"San Francisco.\""
  },
  {
    level: 2,
    question: "What is the District Code?",
    secret: "The Black Seal (to the left of George Washington).",
    explanation: "Inside that large circular seal is a bold letter and a number. The number also appears in the four \"empty\" white spaces on the front of the bill.",
    exampleAnswer: "If the seal says \"L12,\" the player must enter 12."
  },
  {
    level: 3,
    question: "What is the Design Era?",
    secret: "The Series Year (to the right of the portrait).",
    explanation: "This isn't the year the bill was printed, but the year the design was approved.",
    exampleAnswer: "\"Series 2017\" or \"Series 2013.\""
  },
  {
    level: 4,
    question: "What is the Note Position?",
    secret: "The Small Letter & Number in the upper left.",
    explanation: "Bills are printed in large sheets. This code (like B3) tells the \"grid coordinate\" of where that specific bill was located on the sheet.",
    exampleAnswer: "B3."
  },
  {
    level: 5,
    question: "What is the Facility Mark?",
    secret: "The \"FW\" Birthplace Test (bottom right, near the small number).",
    explanation: "Only two places print U.S. money: Washington, D-C., and Fort Worth, TX. If the bill has a tiny \"FW\" before the plate number, it’s from Texas. If there is no \"FW,\" it’s from D.C.",
    exampleAnswer: "\"Texas\" or \"DC.\""
  },
  {
    level: 6,
    question: "What is the Suffix?",
    secret: "The Replacement Check (the very last character of the serial number).",
    explanation: "Most bills end in a letter. If a bill is a \"Star Note\" (a replacement for a misprint), it ends in a ★ symbol.",
    exampleAnswer: "A specific letter (like \"A\") or \"Star.\""
  },
  {
    level: 7,
    question: "Who is the Treasurer?",
    secret: "The Signature on the Left.",
    explanation: "The Treasurer of the United States signs every bill. The player must read the name.",
    exampleAnswer: "\"Rosario Marin\" or \"Mary Ellen Withrow.\""
  },
  {
    level: 8,
    question: "Who is the Secretary?",
    secret: "The Signature on the Right.",
    explanation: "The Secretary of the Treasury also signs the bill.",
    exampleAnswer: "\"Steven Mnuchin\" or \"Janet Yellen.\""
  },
  {
    level: 9,
    question: "What is the Face Plate Number?",
    secret: "The Tiny Number in the Bottom Right Corner.",
    explanation: "This identifies the specific metal engraving plate used to print the front of the bill. It is usually a 1 to 3-digit number.",
    exampleAnswer: "142."
  },
  {
    level: 10,
    question: "What is the Back Plate Number?",
    secret: "The Green Number on the Back.",
    explanation: "Flip the bill over. Look at the bottom right of the green design. There is another tiny number there for the back-side engraving plate.",
    exampleAnswer: "56."
  },
  {
    level: 11,
    question: "Episode 11 Question TBD",
    secret: "TBD",
    explanation: "TBD",
    exampleAnswer: "TBD"
  }
];

const JackpotCounter = ({ value, sponsorLogo, sponsorName, sponsorHeight = "h-28", onSponsorClick }: { value: number, sponsorLogo: string, sponsorName: string, sponsorHeight?: string, onSponsorClick?: () => void }) => {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="flex flex-col items-end text-right pr-10">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-0"
      >
        <h3 className="text-[#22c55e] text-5xl font-black italic tracking-tighter uppercase leading-none drop-shadow-lg">
          JACKPOT <span className="tracking-[0.15em] ml-1">. . .</span>
        </h3>
        <motion.div 
          className="text-white text-8xl font-black tracking-tighter leading-none drop-shadow-2xl tabular-nums"
        >
          {formatCurrency(value)}
        </motion.div>
      </motion.div>
      
      <div className="flex items-center gap-8 mt-6">
        <div className="flex flex-col items-end">
          <span className="text-red-600 font-black italic text-2xl tracking-tight leading-none uppercase">Sponsored by</span>
          <div 
            className="relative mt-2 cursor-pointer hover:scale-105 transition-transform flex flex-col items-center"
            onClick={onSponsorClick}
          >
            <div className="absolute inset-0 bg-[#D4AF37]/30 blur-3xl rounded-full" />
            <img 
              src={sponsorLogo} 
              alt={sponsorName} 
              className={`${sponsorHeight} object-contain relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]`}
              referrerPolicy="no-referrer"
            />
            <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em] mt-1 relative z-10">Experience Ad</span>
          </div>
        </div>
        
        <div className="flex flex-col items-start border-l-2 border-zinc-800/50 pl-8">
          <span className="text-[#D4AF37] font-black text-2xl tracking-tight uppercase leading-none">Monthly Prize</span>
          <span className="text-[#22c55e] font-black text-4xl tracking-tight leading-tight drop-shadow-lg">$25,000</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [atlasCubeBackScreen, setAtlasCubeBackScreen] = useState<Screen>('MORE_INFO_MENU');
  const [globalSerial, setGlobalSerial] = useState('L70191845K');
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [expandedStatsIds, setExpandedStatsIds] = useState<string[]>([]);
  const [episodePerformance, setEpisodePerformance] = useState([
    { keyword: "data", gameCode: "smart phone", time: "2:43:58", idCode: "L", seatCode: "Z" },
    { keyword: "chip", gameCode: "tasty", time: "3:13:24", idCode: "L12", seatCode: "W" },
    { keyword: "Blue", gameCode: "pending", time: "pending", idCode: "F134", seatCode: "pending" },
    ...Array(8).fill({ keyword: "---", gameCode: "****-****", time: "--:--", idCode: "---", seatCode: "---" })
  ]);
  const toggleStats = (id: string) => {
    setExpandedStatsIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  const [movieFocusedIndex, setMovieFocusedIndex] = useState(0);
  const [selectedYoutuberIndex, setSelectedYoutuberIndex] = useState<number | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [jackpotValue, setJackpotValue] = useState(1000000);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updatingProfileId, setUpdatingProfileId] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [hasSeenEpisode, setHasSeenEpisode] = useState(false);
  const [episodeAnswer, setEpisodeAnswer] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [billAnswer, setBillAnswer] = useState('');
  const [isBillVerified, setIsBillVerified] = useState(false);
  const [showBillHelp, setShowBillHelp] = useState(false);
  const [showSponsorOptions, setShowSponsorOptions] = useState(false);
  const [legalContext, setLegalContext] = useState<'SPONSOR' | 'SEAT' | null>(null);

  // Reset state when switching episodes
  useEffect(() => {
    setHasSeenEpisode(false);
    setEpisodeAnswer('');
    setShowConfirmModal(false);
    setBillAnswer('');
    setIsBillVerified(false);
    setShowBillHelp(false);
    setShowSponsorOptions(false);
  }, [selectedYoutuberIndex]);

  const triggerUpdateAvatar = (profileId: string) => {
    setUpdatingProfileId(profileId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && updatingProfileId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (updatingProfileId === 'NEW_PROFILE') {
          setCustomAvatar(result);
        } else {
          setProfiles(prev => {
            const updated = prev.map(p => p.id === updatingProfileId ? { ...p, avatar: result } : p);
            setSelectedProfile(current => 
              (current && current.id === updatingProfileId) ? { ...current, avatar: result } : current
            );
            return updated;
          });
        }
        setUpdatingProfileId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Caesar Wheel State
  const [crackedOutput, setCrackedOutput] = useState("");
  const [shift, setShift] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [caesarInitialCode, setCaesarInitialCode] = useState("CODEKRACKER");
  const [caesarTargetShift, setCaesarTargetShift] = useState(3);

  // Atlas Cipher State
  const [atlasInitialCode, setAtlasInitialCode] = useState("");
  const [atlasTargetShift, setAtlasTargetShift] = useState(0);
  const [atlasCrackedOutput, setAtlasCrackedOutput] = useState("");
  const [atlasShift, setAtlasShift] = useState(0);
  const [atlasRotation, setAtlasRotation] = useState(0);

  // Jackpot Animation Logic
  useEffect(() => {
    if (currentScreen !== 'HOME') return;

    const getJackpotTarget = (index: number) => {
      if (index === 0) return 125000;
      if (index === 1) return 150000;
      return 150000 + (index - 1) * 50000;
    };

    const getJackpotStart = (index: number) => {
      if (index === 0) return 100000;
      return getJackpotTarget(index - 1);
    };

    const target = getJackpotTarget(movieFocusedIndex);
    const startValue = getJackpotStart(movieFocusedIndex);
    
    // Reset to start value briefly to ensure animation triggers
    setJackpotValue(startValue);

    const controls = animate(startValue, target, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => setJackpotValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [movieFocusedIndex, currentScreen]);

  // Avatar Designer State
  const [avatarConfig, setAvatarConfig] = useState({
    skin: 'edb98a',
    hair: '2c1b18',
    eyes: 'default',
    top: 'shortHair',
    name: ''
  });

  const skinTones = ['edb98a', 'f8d25c', 'fd9841', 'ffdbac', 'd08b5b', 'ae5d29', '614335'];
  const hairColors = ['2c1b18', '4a312c', '77311d', 'b58143', 'd6b070', 'e8e1e1', 'f59797'];
  const tops = ['shortHair', 'longHair', 'bob', 'curly', 'shaved', 'frizzle', 'dreads'];

  // Rail Fence State
  const [railFenceInitialCode, setRailFenceInitialCode] = useState("CODEKRACKER");
  const [railFenceRails, setRailFenceRails] = useState(3);
  const [railFenceCols, setRailFenceCols] = useState(11);

  // Vigenere State
  const [vigenereInputText, setVigenereInputText] = useState("VAULT");
  const [vigenereKey, setVigenereKey] = useState("CODE");

  const vigenereEncoded = useMemo(() => {
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cleanText = vigenereInputText.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanKey = vigenereKey.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleanText || !cleanKey) return "";
    let res = "";
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const k = cleanKey[i % cleanKey.length];
      const charIdx = ALPHABET.indexOf(char);
      const kIdx = ALPHABET.indexOf(k);
      res += ALPHABET[(charIdx + kIdx) % 26];
    }
    return res;
  }, [vigenereInputText, vigenereKey]);

  // ADFGVX State
  const [adfgvxInitialCode, setAdfgvxInitialCode] = useState("");
  const [adfgvxInitialKey, setAdfgvxInitialKey] = useState("");

  // Transposition State
  const [transpositionInputText, setTranspositionInputText] = useState("VAULT");
  const [transpositionKey, setTranspositionKey] = useState("CODE");

  const transpositionEncoded = useMemo(() => {
    if (!transpositionKey) return transpositionInputText;
    
    const cleanText = transpositionInputText.toUpperCase().replace(/\s/g, '');
    const cleanKey = transpositionKey.toUpperCase().replace(/\s/g, '');
    const numCols = cleanKey.length;
    
    const sortedKey = cleanKey.split('').map((char, originalIndex) => ({ char, originalIndex }))
      .sort((a, b) => a.char.localeCompare(b.char));
    
    const numRows = Math.ceil(cleanText.length / numCols);
    const grid: string[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(''));
    
    for (let i = 0; i < cleanText.length; i++) {
      const r = Math.floor(i / numCols);
      const c = i % numCols;
      grid[r][c] = cleanText[i];
    }

    // Pad with X
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            if (grid[r][c] === '') grid[r][c] = 'X';
        }
    }

    let result = '';
    const readingOrder = sortedKey.map(item => item.originalIndex);
    
    readingOrder.forEach(colIdx => {
      for (let r = 0; r < numRows; r++) {
        result += grid[r][colIdx];
      }
    });

    return result;
  }, [transpositionInputText, transpositionKey]);

  // Playfair State
  const [playfairInputText, setPlayfairInputText] = useState("PLAYFAIR");
  const [playfairKey, setPlayfairKey] = useState("CODE");

  const playfairEncoded = useMemo(() => {
    const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
    const cleanKey = playfairKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    const cleanText = playfairInputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    if (!cleanText || !cleanKey) return "";

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

    const getPos = (c: string) => {
      const idx = square.indexOf(c);
      return { r: Math.floor(idx / 5), c: idx % 5 };
    };
    const getCharFromSquare = (r: number, c: number) => square[((r + 5) % 5) * 5 + ((c + 5) % 5)];

    let preparedText = '';
    let i = 0;
    while (i < cleanText.length) {
      const a = cleanText[i];
      const b = (i + 1 < cleanText.length) ? cleanText[i + 1] : '';
      if (a === b) { preparedText += a + 'X'; i++; }
      else if (b === '') { preparedText += a + 'X'; i += 2; }
      else { preparedText += a + b; i += 2; }
    }

    let res = "";
    for (let j = 0; j < preparedText.length; j += 2) {
      const posA = getPos(preparedText[j]);
      const posB = getPos(preparedText[j+1]);
      if (posA.r === posB.r) {
        res += getCharFromSquare(posA.r, posA.c + 1) + getCharFromSquare(posB.r, posB.c + 1);
      } else if (posA.c === posB.c) {
        res += getCharFromSquare(posA.r + 1, posA.c) + getCharFromSquare(posB.r + 1, posB.c);
      } else {
        res += getCharFromSquare(posA.r, posB.c) + getCharFromSquare(posB.r, posA.c);
      }
    }
    return res;
  }, [playfairInputText, playfairKey]);

  // Four-Square State
  const [fourSquareInputText, setFourSquareInputText] = useState("HELPME");
  const [fourSquareKey1, setFourSquareKey1] = useState("VAULT");
  const [fourSquareKey2, setFourSquareKey2] = useState("SECRET");

  // Nihilist State
  const [nihilistInputText, setNihilistInputText] = useState("DUDE");
  const [nihilistGridKey, setNihilistGridKey] = useState("PERFECT");
  const [nihilistAddKey, setNihilistAddKey] = useState("SHOT");

  // Bifid State
  const [bifidInputText, setBifidInputText] = useState("JSTU");
  const [bifidKey, setBifidKey] = useState("VAULT");

  // Enigma State
  const [enigmaInitialCode, setEnigmaInitialCode] = useState("");
  const [enigmaInitialKey, setEnigmaInitialKey] = useState("");
  const [enigmaWirings, setEnigmaWirings] = useState<string[]>([]);

  const bifidEncoded = useMemo(() => {
    const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
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

    const square = generateSquare(bifidKey);
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

    const cleanText = bifidInputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    if (!cleanText) return "";

    const rows: number[] = [];
    const cols: number[] = [];
    for (const char of cleanText) {
      const coords = getCoords(char);
      if (coords) {
        rows.push(coords.r);
        cols.push(coords.c);
      }
    }

    const combined = [...rows, ...cols];
    let res = "";
    for (let i = 0; i < combined.length; i += 2) {
      const r = combined[i];
      const c = combined[i + 1];
      res += getChar(r, c);
    }
    return res;
  }, [bifidInputText, bifidKey]);

  const nihilistEncoded = useMemo(() => {
    const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
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

    const square = generateSquare(nihilistGridKey);
    const getCoords = (char: string) => {
      const c = char.toUpperCase().replace(/J/g, 'I');
      const idx = square.indexOf(c);
      if (idx === -1) return null;
      const r = Math.floor(idx / 5) + 1;
      const col = (idx % 5) + 1;
      return parseInt(`${r}${col}`);
    };

    const cleanText = nihilistInputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    const cleanAddKey = nihilistAddKey.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    if (!cleanAddKey || !cleanText) return "";

    const keyCoords = cleanAddKey.split('').map(c => getCoords(c)).filter(n => n !== null) as number[];
    let res = "";
    cleanText.split('').forEach((char, i) => {
      const textCoord = getCoords(char);
      if (textCoord === null) return;
      const addK = keyCoords[i % keyCoords.length];
      res += (textCoord + addK) + " ";
    });

    return res.trim();
  }, [nihilistInputText, nihilistGridKey, nihilistAddKey]);

  const fourSquareEncoded = useMemo(() => {
    const ALPHABET_NO_J = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
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

    const sqTL = ALPHABET_NO_J.split('');
    const sqBR = ALPHABET_NO_J.split('');
    const sqTR = generateSquare(fourSquareKey1);
    const sqBL = generateSquare(fourSquareKey2);

    const cleanText = fourSquareInputText.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    let textToProcess = cleanText;
    if (textToProcess.length % 2 !== 0) textToProcess += 'X';

    let res = "";
    for (let i = 0; i < textToProcess.length; i += 2) {
      const a = textToProcess[i];
      const b = textToProcess[i + 1];
      const idxA = sqTL.indexOf(a);
      const idxB = sqBR.indexOf(b);
      const rA = Math.floor(idxA / 5);
      const cA = idxA % 5;
      const rB = Math.floor(idxB / 5);
      const cB = idxB % 5;
      res += sqTR[rA * 5 + cB] + sqBL[rB * 5 + cA];
    }
    return res;
  }, [fourSquareInputText, fourSquareKey1, fourSquareKey2]);

  // Simple D-pad navigation simulation for the demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const isNavigationKey = e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter';
      
      if (isInput && isNavigationKey) {
        // If it's Enter, we might still want it to submit if it's a specific form,
        // but for general navigation keys, we usually want to let the input handle them.
        // For this app, navigation is triggered by Backspace, so we must block it.
        if (e.key === 'Backspace' || e.key === 'Delete') {
          return;
        }
      }
      
      if (currentScreen === 'PROFILE_SELECTION') {
        if (e.key === 'ArrowRight') setFocusedIndex(prev => Math.min(prev + 1, profiles.length));
        if (e.key === 'ArrowLeft') setFocusedIndex(prev => Math.max(prev - 1, 0));
        if (e.key === 'Enter' && !isInput) {
          if (focusedIndex === profiles.length) {
            setCustomAvatar(null);
            setCurrentScreen('CREATE_PROFILE');
          } else {
            setSelectedProfile(profiles[focusedIndex]);
            setCurrentScreen('HOME');
          }
        }
      } else if (currentScreen === 'HOME') {
        if (e.key === 'ArrowRight') setMovieFocusedIndex(prev => Math.min(prev + 1, YOUTUBE_DATA.length - 1));
        if (e.key === 'ArrowLeft') setMovieFocusedIndex(prev => Math.max(prev - 1, 0));
        if (e.key === 'Enter' && !isInput) {
          setSelectedYoutuberIndex(movieFocusedIndex);
          setCurrentScreen('EPISODE_DETAIL');
        }
        if ((e.key === 'Backspace' || e.key === 'Delete') && !isInput) setCurrentScreen('PROFILE_SELECTION');
      } else if (currentScreen === 'EPISODE_DETAIL') {
        if ((e.key === 'Backspace' || e.key === 'Delete') && !isInput) {
          setHasSeenEpisode(false);
          setEpisodeAnswer('');
          setSelectedYoutuberIndex(null);
          setCurrentScreen('HOME');
        }
      } else if (currentScreen === 'VIDEO_PLAYER') {
        if ((e.key === 'Backspace' || e.key === 'Delete') && !isInput) {
          setCurrentScreen(selectedYoutuberIndex !== null ? 'EPISODE_DETAIL' : 'HOME');
        }
      } else if (currentScreen === 'CAESAR_WHEEL' || currentScreen === 'CAESAR_ENCODE' || currentScreen === 'CAESAR_GAME' || currentScreen === 'VIGENERE_GAME' || currentScreen === 'CIPHER_HISTORY' || currentScreen === 'ATLAS_ENCODE' || currentScreen === 'ATLAS_GAME') {
        if ((e.key === 'Backspace' || e.key === 'Delete') && !isInput) setCurrentScreen('EPISODE_DETAIL');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, profiles.length, focusedIndex, profiles]);

  const handleProgressBarInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newIndex = Math.round(percentage * (YOUTUBE_DATA.length - 1));
    setMovieFocusedIndex(newIndex);
  };

  const renderScreen = () => {
    if (selectedYoutuberIndex === null && (currentScreen === 'LEGAL' || currentScreen === 'EPISODE_SETTINGS')) {
      return null;
    }

    const currentYoutuber = YOUTUBE_DATA[selectedYoutuberIndex ?? 0];
    const currentSponsor = currentYoutuber.sponsor || DEFAULT_SPONSOR;
    const currentBillLevel = DOLLAR_BILL_LEVELS[selectedYoutuberIndex ?? 0];

    // Legal Screen Component
    const LegalScreen = () => (
      <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-950 p-12 text-center space-y-12">
        <h2 className="text-[#D4AF37] text-7xl font-black uppercase italic tracking-tighter drop-shadow-2xl">LEGAL AGREEMENT</h2>
        <div className="max-w-4xl bg-zinc-900/50 p-12 rounded-[40px] border-4 border-zinc-800 shadow-2xl">
          <p className="text-white text-4xl font-bold leading-tight uppercase tracking-tight">
            Anyone can play the game, but you must be 18 years old and have the dollar bill with the correct information to claim your prize if you are a winner. Make sure you hold onto that bill and do not lose it. Otherwise you cannot claim your prize.
          </p>
        </div>
        <div className="flex gap-8 w-full max-w-4xl">
          <Button 
            className="flex-1 h-32 bg-[#008044] text-white hover:bg-[#006435] text-4xl font-black uppercase tracking-widest rounded-3xl shadow-[0_0_50px_rgba(0,128,68,0.3)] transition-transform active:scale-95"
            onClick={() => {
              if (legalContext === 'SPONSOR') {
                setActiveVideoUrl(currentSponsor.video);
                setCurrentScreen('VIDEO_PLAYER');
              } else {
                setCurrentScreen('EPISODE_SETTINGS');
              }
            }}
          >
            I Agree
          </Button>
          <Button 
            className="flex-1 h-32 bg-zinc-800 text-white hover:bg-zinc-700 text-4xl font-black uppercase tracking-widest rounded-3xl transition-transform active:scale-95"
            onClick={() => {
              setCurrentScreen('ONE_DOLLAR_BILL');
              setLegalContext(null);
            }}
          >
            Opt Out
          </Button>
        </div>
      </div>
    );

    // Episode Settings Screen Component
    const EpisodeSettingsScreen = () => (
      <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-950 p-6 text-center space-y-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <h2 className="text-[#D4AF37] text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl">
            {currentYoutuber.name} Hunt
          </h2>
          <div className="w-32 h-1 bg-[#D4AF37] mx-auto rounded-full shadow-[0_0_20px_rgba(212,175,55,0.5)]" />
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
          {/* THE HUNT Section */}
          <div className="flex flex-col items-center space-y-4 bg-zinc-900/50 p-6 rounded-[40px] border-4 border-[#008044]/30 shadow-2xl backdrop-blur-md">
            <span className="text-[#008044] text-lg font-black uppercase tracking-[0.3em]">THE HUNT:</span>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full aspect-video rounded-[32px] overflow-hidden border-4 border-[#008044]/20 cursor-pointer group shadow-2xl"
              onClick={() => {
                setActiveVideoUrl(currentYoutuber.TheHuntVideo);
                setCurrentScreen('VIDEO_PLAYER');
              }}
            >
              <img 
                src={currentYoutuber.TheHuntThumbNail} 
                alt="The Hunt" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-black border-b-[12px] border-b-transparent ml-2" />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded text-white font-mono text-xs">
                1:23
              </div>
            </motion.div>
            <Button 
              className="w-full h-16 bg-zinc-800 text-white hover:bg-zinc-700 text-xl font-black uppercase tracking-widest rounded-xl transition-all border-2 border-white/5"
              onClick={() => {
                if (currentYoutuber.cipherName === "Rail Fence Cipher") {
                  setCurrentScreen('RAIL_FENCE');
                } else if (currentYoutuber.cipherName === "Vigenère Cipher") {
                  setCurrentScreen('VIGENERE');
                } else if (currentYoutuber.cipherName === "ADFGVX Cipher") {
                  setCurrentScreen('ADFGVX');
                } else if (currentYoutuber.cipherName === "Transposition Cipher") {
                  setCurrentScreen('TRANSPOSITION');
                } else if (currentYoutuber.cipherName === "Playfair Cipher") {
                  setCurrentScreen('PLAYFAIR');
                } else if (currentYoutuber.cipherName === "Four-Square Cipher") {
                  setCurrentScreen('FOUR_SQUARE');
                } else if (currentYoutuber.cipherName === "Nihilist Cipher") {
                  setCurrentScreen('NIHILIST');
                } else if (currentYoutuber.cipherName === "Enigma Cipher") {
                  setCurrentScreen('ENIGMA_ENCODE');
                } else if (currentYoutuber.cipherName === "Bifid Cipher") {
                  setCurrentScreen('BIFID');
                } else if (currentYoutuber.cipherName === "Atlas Cipher") {
                  setAtlasInitialCode("FRGHNHUDFNHU");
                  setAtlasTargetShift(3);
                  setCurrentScreen('ATLAS_GAME');
                } else if (currentYoutuber.cipherName === "Caesar Cipher") {
                  setCurrentScreen('CAESAR_ENCODE');
                } else {
                  setCurrentScreen('CAESAR_WHEEL');
                }
              }}
            >
              Setup the Cipher
            </Button>

              {currentYoutuber.cipherName === "Caesar Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('CAESAR_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Atlas Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('ATLAS_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Enigma Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('ENIGMA_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Rail Fence Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('RAIL_FENCE_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Vigenère Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('VIGENERE_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "ADFGVX Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('ADFGVX_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Transposition Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('TRANSPOSITION_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Playfair Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('PLAYFAIR_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Four-Square Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('FOUR_SQUARE_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Nihilist Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('NIHILIST_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName === "Bifid Cipher" && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl bg-zinc-800 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all text-xl"
                onClick={() => setCurrentScreen('BIFID_GAME')}
              >
                Try out the Cipher
              </Button>
            )}

            {currentYoutuber.cipherName && currentYoutuber.cipherName !== "TBD" && (
              <Button 
                variant="ghost"
                className="w-full h-12 text-[#D4AF37] font-black uppercase tracking-widest hover:text-white transition-all text-lg mt-2"
                onClick={() => setCurrentScreen('CIPHER_HISTORY')}
              >
                <HistoryIcon className="w-5 h-5 mr-2" />
                Cipher History
              </Button>
            )}
          </div>

          {/* Item Section */}
          <div className="flex flex-col items-center space-y-4 bg-zinc-900/50 p-6 rounded-[40px] border-4 border-zinc-800 shadow-2xl backdrop-blur-md">
            <span className="text-zinc-500 text-lg font-black uppercase tracking-[0.3em]">HUNTING FOR:</span>
            <div className="w-full aspect-square bg-zinc-800 rounded-[24px] overflow-hidden border-4 border-white/5 p-3 shadow-inner">
              <img 
                src={currentYoutuber.targetItemImage || currentYoutuber.thumbnail} 
                alt="Item" 
                className="w-full h-full object-cover rounded-xl drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-white text-3xl font-black uppercase tracking-tighter italic p-4 text-center">
              {currentYoutuber.targetItem || "Mystery Item"}
            </span>
          </div>
        </div>

        <div className="flex gap-8 w-full max-w-2xl relative z-10">
          <Button 
            className="flex-1 h-auto py-6 bg-[#008044] text-white hover:bg-[#006435] text-2xl font-black uppercase tracking-widest rounded-[2rem] shadow-[0_0_50px_rgba(0,128,68,0.3)] transition-all hover:scale-105 active:scale-95 group"
            onClick={() => {
              if (currentYoutuber.cipherVideoUrl) {
                setActiveVideoUrl(currentYoutuber.cipherVideoUrl);
                setCurrentScreen('VIDEO_PLAYER');
              }
            }}
          >
            <div className="flex flex-col items-center gap-0 leading-tight">
              <span className="text-white">Understand what</span>
              <span className="text-[#D4AF37]">{currentYoutuber.cipherName}</span>
              <span className="text-white">is about</span>
            </div>
            <ArrowRight className="w-8 h-8 ml-4 group-hover:translate-x-2 transition-transform shrink-0" />
          </Button>
        </div>

        {/* Back Button */}
        <Button 
          variant="ghost"
          className="absolute bottom-6 left-6 text-zinc-500 hover:text-white text-lg font-black uppercase tracking-widest"
          onClick={() => setCurrentScreen('ONE_DOLLAR_BILL')}
        >
          <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
          Back
        </Button>
      </div>
    );

    switch (currentScreen) {
      case 'CIPHER_HISTORY':
        return (
          <CipherHistoryPage 
            cipherName={currentYoutuber.cipherName || ""} 
            onBack={() => setCurrentScreen('EPISODE_DETAIL')} 
          />
        );
      case 'FOUR_SQUARE':
        return (
          <FourSquarePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            onNavigateToGame={() => setCurrentScreen('FOUR_SQUARE_GAME')}
            inputText={fourSquareInputText}
            setInputText={setFourSquareInputText}
            key1={fourSquareKey1}
            setKey1={setFourSquareKey1}
            key2={fourSquareKey2}
            setKey2={setFourSquareKey2}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
          />
        );
      case 'FOUR_SQUARE_GAME':
        return (
          <FourSquareGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            initialCode={fourSquareEncoded}
            initialKey1={fourSquareKey1}
            initialKey2={fourSquareKey2}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'BIFID':
        return (
          <BifidPage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            onNavigateToGame={() => setCurrentScreen('BIFID_GAME')}
            inputText={bifidInputText}
            setInputText={setBifidInputText}
            cipherKey={bifidKey}
            setCipherKey={setBifidKey}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
          />
        );
      case 'BIFID_GAME':
        return (
          <BifidGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            initialCode={bifidEncoded}
            initialKey={bifidKey}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'ENIGMA_ENCODE':
        return (
          <EnigmaPage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            onPlay={(data) => {
              setEnigmaInitialCode(data.code);
              setEnigmaInitialKey(data.key);
              setEnigmaWirings(data.wirings);
              setCurrentScreen('ENIGMA_GAME');
            }}
          />
        );
      case 'ENIGMA_GAME':
        return (
          <EnigmaGamePage 
            onBack={() => setCurrentScreen('EPISODE_DETAIL')}
            initialCode={enigmaInitialCode}
            initialKey={enigmaInitialKey}
            wirings={enigmaWirings.length > 0 ? enigmaWirings : undefined}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'NIHILIST':
        return (
          <NihilistPage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            onNavigateToGame={() => setCurrentScreen('NIHILIST_GAME')}
            inputText={nihilistInputText}
            setInputText={setNihilistInputText}
            gridKey={nihilistGridKey}
            setGridKey={setNihilistGridKey}
            addKey={nihilistAddKey}
            setAddKey={setNihilistAddKey}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
          />
        );
      case 'NIHILIST_GAME':
        return (
          <NihilistGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            initialCode={nihilistEncoded}
            initialGridKey={nihilistGridKey}
            initialAddKey={nihilistAddKey}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'PLAYFAIR':
        return (
          <PlayfairPage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            onNavigateToGame={() => setCurrentScreen('PLAYFAIR_GAME')}
            inputText={playfairInputText}
            setInputText={setPlayfairInputText}
            keyword={playfairKey}
            setKeyword={setPlayfairKey}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
          />
        );
      case 'PLAYFAIR_GAME':
        return (
          <PlayfairGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            initialCode={playfairEncoded}
            initialKey={playfairKey}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'TRANSPOSITION':
        return (
          <TranspositionPage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            onNavigateToGame={() => setCurrentScreen('TRANSPOSITION_GAME')}
            inputText={transpositionInputText}
            setInputText={setTranspositionInputText}
            keyword={transpositionKey}
            setKeyword={setTranspositionKey}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
          />
        );
      case 'TRANSPOSITION_GAME':
        return (
          <TranspositionGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            initialCode={transpositionEncoded}
            targetText={transpositionInputText}
            initialKey={transpositionKey}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'ADFGVX':
        return (
          <ADFGVXPage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            onPlay={(data) => {
              setAdfgvxInitialCode(data.code);
              setAdfgvxInitialKey(data.key);
              setCurrentScreen('ADFGVX_GAME');
            }}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
          />
        );
      case 'ADFGVX_GAME':
        return (
          <ADFGVXGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            initialCode={adfgvxInitialCode}
            initialKey={adfgvxInitialKey}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'VIGENERE':
        return (
          <VigenereCipherPage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            onNavigateToGame={() => setCurrentScreen('VIGENERE_GAME')}
            inputText={vigenereInputText}
            setInputText={setVigenereInputText}
            keyword={vigenereKey}
            setKeyword={setVigenereKey}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
          />
        );
      case 'VIGENERE_GAME':
        return (
          <VigenereGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            initialCode={vigenereEncoded}
            targetText={vigenereInputText}
            initialKey={vigenereKey}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'RAIL_FENCE':
        return (
          <RailFencePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')} 
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            onPlay={(data) => {
              setRailFenceInitialCode(data.code);
              setRailFenceRails(data.rails);
              setRailFenceCols(data.cols);
              setCurrentScreen('RAIL_FENCE_GAME');
            }}
          />
        );
      case 'RAIL_FENCE_GAME':
        return (
          <RailFenceGamePage 
            onBack={() => setCurrentScreen('EPISODE_SETTINGS')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            initialCode={railFenceInitialCode}
            targetRails={railFenceRails}
            targetCols={railFenceCols}
            creatorDocId="MasterCreatorFolder"
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
          />
        );
      case 'LEGAL':
        return <LegalScreen />;
      case 'EPISODE_SETTINGS':
        return <EpisodeSettingsScreen />;
      case 'LOGIN':
        return (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Card className="w-[500px] bg-black/90 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                    <Tv className="w-10 h-10 text-black" />
                  </div>
                  <div>
                    <img 
                      src="https://i.ibb.co/kgXgqkGB/CKXRLogo-Hor-Z.png" 
                      alt="CKXR Logo" 
                      className="h-10 w-auto object-contain mx-auto mb-2" 
                    />
                    <CardDescription className="text-lg text-zinc-400">Sign in to start the hunt</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="serial" className="text-zinc-300 text-lg">Serial Number</Label>
                    <Input 
                      id="serial" 
                      placeholder="ENTER SERIAL NUMBER..." 
                      value={globalSerial}
                      onChange={(e) => setGlobalSerial(e.target.value.toUpperCase())}
                      className="h-16 text-xl bg-zinc-900/50 border-zinc-800 focus:ring-4 focus:ring-[#D4AF37]/50 transition-all text-white uppercase tracking-widest font-mono"
                      autoFocus
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pb-10">
                  <Button 
                    className="w-full h-16 text-xl font-bold rounded-xl bg-[#D4AF37] hover:bg-[#B8860B] text-black transition-all"
                    onClick={() => {
                      setSelectedProfile(profiles[0]);
                      setCurrentScreen('HOME');
                    }}
                  >
                    Enter Experience <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        );

      case 'PROFILE_SELECTION':
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            <div className="text-center space-y-2">
              <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-6xl font-black text-white italic tracking-widest uppercase leading-none"
              >
                Avatar
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-3"
              >
                <span className="text-zinc-500 text-xl uppercase tracking-[0.3em]">Identification</span>
                <span className="text-5xl font-mono text-[#D4AF37] tracking-[0.2em] font-black drop-shadow-[0_0_20px_rgba(212,175,55,0.5)] ml-4">
                  {globalSerial}
                </span>
              </motion.div>
            </div>
            
            <div className="flex gap-10 items-start">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              {profiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: focusedIndex === index ? 1.15 : 1,
                    opacity: 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center space-y-6 cursor-pointer group relative"
                  onClick={() => {
                    if (focusedIndex === index) {
                      setSelectedProfile(profile);
                      setCurrentScreen('HOME');
                    } else {
                      setFocusedIndex(index);
                    }
                  }}
                >
                  <div className={`
                    relative w-44 h-44 rounded-xl overflow-hidden transition-all duration-300 flex items-center justify-center
                    ${focusedIndex === index 
                      ? 'border-4 border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.4)]' 
                      : 'border-4 border-transparent opacity-60'}
                  `}>
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={profile.avatar} className="object-cover" />
                      <AvatarFallback className={profile.color}>{profile.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    {/* Plus button for upload */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerUpdateAvatar(profile.id);
                      }}
                      className="absolute bottom-2 right-2 w-10 h-10 bg-[#D4AF37] hover:bg-[#B8860B] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-20"
                    >
                      <Plus className="w-6 h-6 text-black font-bold" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <input
                      type="text"
                      className={`text-2xl font-black transition-colors uppercase italic bg-transparent border-none text-center focus:ring-0 outline-none p-0 ${focusedIndex === index ? 'text-white' : 'text-zinc-500'}`}
                      value={profile.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setProfiles(prev => {
                          const updated = prev.map(p => p.id === profile.id ? { ...p, name: newName } : p);
                          setSelectedProfile(current => 
                            (current && current.id === profile.id) ? { ...current, name: newName } : current
                          );
                          return updated;
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={`text-base font-mono tracking-[0.2em] font-bold ${focusedIndex === index ? 'text-[#D4AF37]' : 'text-zinc-600'}`}>
                      ID: #{profile.serial || globalSerial}
                    </span>
                    <button 
                      className={`mt-4 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-full border-2 ${
                        focusedIndex === index 
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                          : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfile(profile);
                        setCurrentScreen('HOME');
                      }}
                    >
                      Update Avatar
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Add Profile Button */}
              <motion.div
                animate={{ 
                  scale: focusedIndex === profiles.length ? 1.15 : 1,
                }}
                className="flex flex-col items-center space-y-6 cursor-pointer"
                onClick={() => {
                  setCustomAvatar(null);
                  setCurrentScreen('CREATE_PROFILE');
                }}
              >
                <div className={`
                  w-44 h-44 rounded-xl flex items-center justify-center transition-all duration-300
                  ${focusedIndex === profiles.length 
                    ? 'border-4 border-white shadow-[0_0_40px_rgba(255,255,255,0.3)] bg-zinc-800' 
                    : 'border-4 border-transparent bg-zinc-900 opacity-60'}
                `}>
                  <Plus className={`w-20 h-20 ${focusedIndex === profiles.length ? 'text-white' : 'text-zinc-700'}`} />
                </div>
                <span className={`text-2xl font-medium transition-colors ${focusedIndex === profiles.length ? 'text-white' : 'text-zinc-500'}`}>
                  Add Profile
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-10"
            >
              <Button 
                variant="outline" 
                className="h-14 px-10 text-lg border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition-all rounded-full uppercase tracking-widest font-bold"
                onClick={() => {
                  // No link yet
                }}
              >
                Create your own avatar
              </Button>
            </motion.div>

            <Button 
              variant="ghost" 
              className="text-zinc-500 hover:text-white text-xl uppercase tracking-widest mt-10"
              onClick={() => setCurrentScreen('MORE_INFO_MENU')}
            >
              Back to Menu
            </Button>

            <div className="absolute bottom-[60px] flex gap-10 text-zinc-500 text-sm uppercase tracking-[2px]">
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 px-2 py-1 rounded font-mono text-zinc-300">OK</span> Select
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 px-2 py-1 rounded font-mono text-zinc-300">← →</span> Navigate
              </div>
            </div>
          </div>
        );

      case 'CREATE_PROFILE':
        const avatarUrl = customAvatar || `https://api.dicebear.com/7.x/personas/svg?skinColor=${avatarConfig.skin}&hairColor=${avatarConfig.hair}&seed=${avatarConfig.name || 'new'}`;
        
        return (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl grid grid-cols-2 gap-20 items-center"
            >
              <div className="space-y-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic">Design Your Avatar</h2>
                  </div>
                  <div className="flex items-center gap-2 text-[#D4AF37] font-mono font-bold tracking-widest text-3xl bg-[#D4AF37]/10 px-6 py-3 rounded-lg border border-[#D4AF37]/20 w-fit">
                    <span className="text-zinc-500 text-base">ID:</span> #{globalSerial}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xl text-zinc-300 uppercase tracking-widest font-bold">Skin Tone</Label>
                    <div className="flex gap-3">
                      {skinTones.map(tone => (
                        <button 
                          key={tone}
                          onClick={() => setAvatarConfig(prev => ({ ...prev, skin: tone }))}
                          className={`w-12 h-12 rounded-full border-2 transition-all ${avatarConfig.skin === tone ? 'border-white scale-110 ring-4 ring-white/20' : 'border-transparent opacity-70'}`}
                          style={{ backgroundColor: `#${tone}` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 text-center">
                    <Label className="text-xl text-zinc-300 uppercase tracking-widest font-bold">Variations</Label>
                    <div className="flex flex-wrap justify-center gap-3">
                      {['Style A', 'Style B', 'Style C', 'Style D', 'Style E'].map((style, idx) => (
                        <Button 
                          key={style}
                          variant={avatarConfig.name === `seed${idx}` ? 'default' : 'secondary'}
                          onClick={() => setAvatarConfig(prev => ({ ...prev, name: `seed${idx}` }))}
                          className="capitalize h-12 px-6 text-lg rounded-full"
                        >
                          {style}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xl text-zinc-300 uppercase tracking-widest font-bold">Hair Color</Label>
                    <div className="flex gap-3">
                      {hairColors.map(color => (
                        <button 
                          key={color}
                          onClick={() => setAvatarConfig(prev => ({ ...prev, hair: color }))}
                          className={`w-12 h-12 rounded-full border-2 transition-all ${avatarConfig.hair === color ? 'border-white scale-110 ring-4 ring-white/20' : 'border-transparent opacity-70'}`}
                          style={{ backgroundColor: `#${color}` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xl text-zinc-300 uppercase tracking-widest font-bold">Profile Name</Label>
                    <Input 
                      placeholder="Enter name" 
                      value={avatarConfig.name}
                      onChange={(e) => setAvatarConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="h-16 text-2xl bg-zinc-900 border-zinc-800 focus:ring-4 focus:ring-[#D4AF37]/50 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <Button 
                    className="h-16 px-12 text-xl font-bold rounded-xl bg-[#D4AF37] text-black"
                    onClick={() => {
                      const newProfile: Profile = {
                        id: Date.now().toString(),
                        name: avatarConfig.name || 'New Profile',
                        avatar: avatarUrl,
                        color: 'bg-zinc-700'
                      };
                      setProfiles([...profiles, newProfile]);
                      setSelectedProfile(newProfile);
                      setCurrentScreen('HOME');
                    }}
                  >
                    Save Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-16 px-12 text-xl text-zinc-500 hover:text-white"
                    onClick={() => setCurrentScreen('PROFILE_SELECTION')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="relative flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-[#D4AF37]/10 blur-[120px] rounded-full" />
                <motion.div 
                  key={avatarUrl}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative w-96 h-96 rounded-[4rem] bg-zinc-900 border-8 border-white/10 overflow-hidden shadow-2xl"
                >
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  
                  {/* Plus button for upload */}
                  <button 
                    onClick={() => {
                      setUpdatingProfileId('NEW_PROFILE');
                      fileInputRef.current?.click();
                    }}
                    className="absolute bottom-6 right-6 w-16 h-16 bg-[#D4AF37] hover:bg-[#B8860B] rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 z-20"
                  >
                    <Plus className="w-10 h-10 text-black font-bold" />
                  </button>
                </motion.div>
                <div className="mt-10 text-center">
                  <span className="text-4xl font-black text-[#D4AF37] uppercase tracking-tighter italic">Preview</span>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case 'HOME':
        return (
          <div className="flex-1 flex flex-col justify-between pt-0 pb-4">
            {/* Top Section: Logo & Identity */}
            <div className="flex items-start justify-between w-full px-4 pt-0">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-full space-y-0"
              >
                <div className="flex flex-col gap-0">
                  <img 
                    src="https://i.ibb.co/kgXgqkGB/CKXRLogo-Hor-Z.png" 
                    alt="CKXR Logo" 
                    className="w-[1000px] md:w-[1500px] lg:w-[2000px] h-auto object-contain drop-shadow-2xl -ml-4 -mt-4 cursor-pointer" 
                    onClick={() => {
                      setSelectedYoutuberIndex(movieFocusedIndex);
                      if (movieFocusedIndex === 10) {
                        setCurrentScreen('ATLAS_ENCODE');
                      } else {
                        setCurrentScreen('EPISODE_DETAIL');
                      }
                    }}
                  />
                  <div className="flex items-center gap-4 ml-6 -mt-4 md:-mt-6 lg:ml-[12px] lg:-mt-[15px]">
                    <div className="bg-[#D4AF37] text-black text-sm md:text-base lg:text-lg font-black px-3 py-1 rounded leading-none">NEW</div>
                    <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-sm md:text-base lg:text-lg">Interactive Experience</span>
                  </div>
                </div>
                
                <div className="max-w-4xl pt-14 ml-6 md:ml-8 lg:ml-[12px]">
                  <p className="text-3xl text-zinc-300 leading-relaxed font-medium">
                    Step into a 360° experience and join top content creators in one massive hunt to uncover hidden treasures in real locations. While they take on the journey, you enter your own version of the game—solving, exploring, and unlocking clues in real time for a chance to win monthly prizes.
                  </p>
                  <div className="flex gap-4 pt-12 px-2">
                    <Button 
                      className="h-16 px-12 text-2xl font-bold bg-white text-black hover:bg-zinc-200"
                      onClick={() => {
                        setSelectedYoutuberIndex(movieFocusedIndex);
                        if (movieFocusedIndex === 10) {
                          setCurrentScreen('ATLAS_ENCODE');
                        } else {
                          setCurrentScreen('EPISODE_DETAIL');
                        }
                      }}
                    >
                      Play Now
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="h-16 px-12 text-2xl font-bold bg-zinc-800/80 text-white hover:bg-zinc-700"
                      onClick={() => setCurrentScreen('MORE_INFO_MENU')}
                    >
                      More Info
                    </Button>
                  </div>
                </div>
              </motion.div>

              <div className="pt-24 pr-12">
                {(() => {
                  const currentEpisode = YOUTUBE_DATA[movieFocusedIndex];
                  const sponsor = currentEpisode.sponsor || DEFAULT_SPONSOR;
                  return (
                    <JackpotCounter 
                      value={jackpotValue}
                      sponsorLogo={sponsor.logo}
                      sponsorName={sponsor.name}
                      sponsorHeight={sponsor.logoHeight}
                      onSponsorClick={() => {
                        setActiveVideoUrl(sponsor.video);
                        setCurrentScreen('VIDEO_PLAYER');
                      }} 
                    />
                  );
                })()}
              </div>
            </div>

            {/* Bottom: Continue the Hunt & Carousel */}
            <div className="mt-16 space-y-4">
              <div className="space-y-4 px-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest opacity-80">Continue the Hunt</h3>
                <div 
                  ref={progressBarRef}
                  className="w-full h-1.5 bg-zinc-800 rounded-full relative"
                >
                  <motion.div 
                    className="absolute h-full bg-[#D4AF37] rounded-l-full"
                    animate={{ width: `${(movieFocusedIndex / (YOUTUBE_DATA.length - 1)) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                  <motion.div
                    drag="x"
                    dragConstraints={progressBarRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={(_, info) => {
                      if (!progressBarRef.current) return;
                      const rect = progressBarRef.current.getBoundingClientRect();
                      const x = info.point.x - rect.left;
                      const percentage = Math.max(0, Math.min(1, x / rect.width));
                      const newIndex = Math.round(percentage * (YOUTUBE_DATA.length - 1));
                      if (newIndex !== movieFocusedIndex) {
                        setMovieFocusedIndex(newIndex);
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl border-2 border-[#D4AF37] z-30 cursor-grab active:cursor-grabbing"
                    animate={{ left: `${(movieFocusedIndex / (YOUTUBE_DATA.length - 1)) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    style={{ x: "-50%" }}
                  />
                </div>
              </div>
              
              <div className="relative py-2 pb-2">
                <motion.div 
                  className="flex gap-4 cursor-grab active:cursor-grabbing pl-[60px]"
                  animate={{ x: -movieFocusedIndex * 436 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  drag="x"
                  dragConstraints={{ left: -(YOUTUBE_DATA.length - 1) * 436, right: 0 }}
                  onDragEnd={(_, info) => {
                    const threshold = 100;
                    if (info.offset.x < -threshold && movieFocusedIndex < YOUTUBE_DATA.length - 1) {
                      setMovieFocusedIndex(prev => prev + 1);
                    } else if (info.offset.x > threshold && movieFocusedIndex > 0) {
                      setMovieFocusedIndex(prev => prev - 1);
                    }
                  }}
                >
                  {YOUTUBE_DATA.map((youtuber, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: movieFocusedIndex === i ? 1.05 : 1,
                        zIndex: movieFocusedIndex === i ? 20 : 1
                      }}
                      className={`
                        flex-shrink-0 w-[420px] aspect-video rounded-md overflow-hidden transition-all duration-300 cursor-pointer
                        ${movieFocusedIndex === i 
                          ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.2)] bg-zinc-900' 
                          : 'bg-black/60 opacity-40'}
                      `}
                      onClick={() => {
                        setMovieFocusedIndex(i);
                        setSelectedYoutuberIndex(i);
                        if (i === 10) {
                          setCurrentScreen('ATLAS_ENCODE');
                        } else {
                          setCurrentScreen('EPISODE_DETAIL');
                        }
                      }}
                    >
                      <div className="w-full h-full flex items-center px-8 relative pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        
                        <div className="flex items-center gap-6 z-10">
                          {/* Avatar Circle */}
                          {youtuber.avatar && (
                            <div className="relative w-24 h-24 rounded-full border-4 border-[#D4AF37] overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                              <img 
                                src={youtuber.avatar} 
                                alt={youtuber.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Text Info */}
                          <div className="flex flex-col">
                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-tight">
                              {youtuber.name}
                            </h4>
                            {youtuber.teamName && (
                              <span className="text-lg font-bold text-red-600 uppercase tracking-widest">
                                {youtuber.teamName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="absolute bottom-6 left-8 z-20">
                          <div className="text-xs font-bold text-white uppercase tracking-[0.3em]">Episode {i + 1}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        );

      case 'MORE_INFO_MENU':
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-16">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl font-black text-white tracking-widest uppercase italic italic"
            >
              More Info
            </motion.h1>
            
            <div className="flex flex-wrap gap-8 justify-center max-w-7xl px-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-[350px] aspect-video rounded-3xl bg-zinc-900 border-4 border-zinc-800 hover:border-[#D4AF37] transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden"
                onClick={() => setCurrentScreen('ONE_DOLLAR_BILL')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/5 to-transparent" />
                <div className="w-20 h-20 bg-[#22c55e] rounded-full flex items-center justify-center shadow-lg shadow-[#22c55e]/20 relative z-10">
                  <span className="text-3xl font-black text-black leading-none">$1</span>
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter relative z-10">$1 Bill</h3>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-[350px] aspect-video rounded-3xl bg-zinc-900 border-4 border-zinc-800 hover:border-[#D4AF37] transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden"
                onClick={() => setCurrentScreen('PROFILE_SELECTION')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
                <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 relative z-10">
                  <User className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter relative z-10">Avatar</h3>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-[350px] aspect-video rounded-3xl bg-zinc-900 border-4 border-zinc-800 hover:border-[#D4AF37] transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden"
                onClick={() => setCurrentScreen('PLAYERS_INFO')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
                <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 relative z-10">
                  <div className="w-10 h-10 border-4 border-black rounded-full flex items-center justify-center p-1">
                    <img src="https://i.ibb.co/67vY2yYj/Gold-X-Green-R.png" alt="XR Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter relative z-10">Players Info</h3>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-[350px] aspect-video rounded-3xl bg-zinc-900 border-4 border-zinc-800 hover:border-[#D4AF37] transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden"
                onClick={() => setCurrentScreen('LEADER_BOARD')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
                <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 relative z-10">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-black">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter relative z-10">Leader Board</h3>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-[350px] aspect-video rounded-3xl bg-zinc-900 border-4 border-zinc-800 hover:border-[#D4AF37] transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden"
                onClick={() => {
                  setAtlasCubeBackScreen('MORE_INFO_MENU');
                  setCurrentScreen('ATLAS_CUBE');
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
                <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 relative z-10">
                  <Box className="w-10 h-10 text-black animate-pulse" />
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter relative z-10">Atlas Cube</h3>
              </motion.div>
            </div>

            <Button 
              variant="ghost" 
              className="text-zinc-500 hover:text-white text-xl uppercase tracking-widest mt-8"
              onClick={() => setCurrentScreen('HOME')}
            >
              Back to Home
            </Button>
          </div>
        );

      case 'ATLAS_CUBE':
        return (
          <AtlasCubePage 
            onBack={() => {
              setCurrentScreen(atlasCubeBackScreen);
            }} 
          />
        );

      case 'ONE_DOLLAR_BILL':
        return (
          <CurrencyAuthenticator 
            onBack={() => setCurrentScreen('MORE_INFO_MENU')} 
            onLogoClick={() => setCurrentScreen('HOME')}
            onSuccess={(serial) => {
              setGlobalSerial(serial);
              setProfiles(prev => {
                const newProfiles = prev.map((p, i) => i === 0 ? { ...p, serial: serial } : p);
                setSelectedProfile(current => 
                  (current && current.id === prev[0].id) ? { ...current, serial: serial } : current
                );
                return newProfiles;
              });
              setCurrentScreen('PROFILE_SELECTION');
            }}
          />
        );

      case 'PLAYERS_INFO':
        return (
          <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 space-y-12 overflow-y-auto custom-scrollbar h-full">
            {/* Header: User Identification */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] overflow-hidden shadow-2xl bg-zinc-900">
                <Avatar className="w-full h-full">
                  <AvatarImage src={selectedProfile?.avatar} className="object-cover" />
                  <AvatarFallback className={selectedProfile?.color}>{selectedProfile?.name?.[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                  {selectedProfile?.name}
                </h3>
                <p className="text-[#D4AF37] font-mono text-5xl font-black tracking-widest drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  {selectedProfile?.serial || globalSerial}
                </p>
              </div>
            </div>

            {/* Episode List Container */}
            <div className="w-full max-w-6xl space-y-4 pb-20">
              <div className="grid grid-cols-12 gap-4 px-6 text-white text-xs font-black uppercase tracking-[0.1em] mb-2 items-end">
                <div className="col-span-1">Ep</div>
                <div className="col-span-2">Personality</div>
                <div className="col-span-1 text-center">Sponsor<br/>Ad</div>
                <div className="col-span-2 text-center">Sponsor<br/>Keyword</div>
                <div className="col-span-2 text-center">Game<br/>Code</div>
                <div className="col-span-2 text-center">Cracked Code<br/>Time</div>
                <div className="col-span-1 text-center">$1<br/>Code</div>
                <div className="col-span-1 text-center">Seat Letter<br/>Code</div>
              </div>

              <div className="space-y-3">
                {YOUTUBE_DATA.map((youtuber, i) => {
                  const billLevel = DOLLAR_BILL_LEVELS[i];
                  const sponsor = youtuber.sponsor;
                  const performance = episodePerformance[i];
                  
                  // Border and Status logic
                  let borderClass = 'border-zinc-800 opacity-40';
                  let logoClass = 'grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100';
                  let mainTextClass = 'text-zinc-700'; 
                  let subTextClass = 'text-zinc-800';
                  
                  if (i <= 2) { // Ep 1, 2, 3
                    if (i === 0 || i === 1) { // Green for 1, 2
                      borderClass = 'border-[#008044] opacity-100 shadow-[0_0_20px_rgba(0,128,68,0.15)]';
                    } else { // Orange for 3
                      borderClass = 'border-[#f97316] opacity-100 shadow-[0_0_20px_rgba(249,115,22,0.15)]';
                    }
                    logoClass = 'grayscale-0 opacity-100';
                    mainTextClass = 'text-[#D4AF37]';
                    subTextClass = 'text-zinc-500';
                  } else if (i === 3) { // Ep 4 (Red)
                    borderClass = 'border-[#ef4444] opacity-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]';
                    // Gray out Pringles specifically for Ep 4
                    logoClass = 'grayscale opacity-30';
                    mainTextClass = 'text-zinc-700 opacity-40';
                    subTextClass = 'text-zinc-800 opacity-40';
                  } else { // Ep 5+
                    borderClass = 'border-zinc-800 opacity-40';
                    logoClass = 'grayscale opacity-30';
                    mainTextClass = 'text-zinc-700 opacity-40';
                    subTextClass = 'text-zinc-800 opacity-40';
                  }
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`grid grid-cols-12 gap-4 items-center bg-zinc-900/60 p-4 rounded-2xl border-4 ${borderClass} hover:border-[#D4AF37]/30 transition-all group`}
                    >
                      {/* Ep Number */}
                      <div className="col-span-1">
                        <span className={`${i <= 2 ? 'text-white' : 'text-zinc-600'} text-2xl font-black font-mono italic`}>#{i + 1}</span>
                      </div>

                      {/* Personality Info */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden flex-shrink-0">
                          <img src={youtuber.avatar} alt={youtuber.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`${i <= 2 ? 'text-white' : 'text-zinc-400 opacity-40'} font-black uppercase italic tracking-tighter text-sm truncate`}>{youtuber.name}</span>
                          <span className={`${i <= 2 ? 'text-red-600' : 'text-red-900 opacity-40'} font-bold uppercase text-[8px] tracking-widest truncate`}>{youtuber.teamName}</span>
                        </div>
                      </div>

                      {/* Sponsor Ad Logo */}
                      <div className="col-span-1 flex justify-center">
                        {sponsor ? (
                          <img 
                            src={sponsor.logo} 
                            alt={sponsor.name} 
                            className={`h-10 object-contain transition-all ${logoClass}`} 
                          />
                        ) : null}
                      </div>

                      {/* Sponsor Keyword */}
                      <div className="col-span-2 flex flex-col items-center">
                        <span className={`${mainTextClass} font-black uppercase italic tracking-tight text-base`}>
                          {performance ? performance.keyword : "---"}
                        </span>
                        <span className={`${subTextClass} text-[8px] font-bold uppercase tracking-widest`}>
                          {performance ? "FOUND" : "LOCKED"}
                        </span>
                      </div>

                      {/* Game Code */}
                      <div className="col-span-2 flex flex-col items-center space-y-1">
                        <span className={`${mainTextClass} font-black font-mono text-base`}>
                          {performance ? performance.gameCode : "****-****"}
                        </span>
                        <span className={`${subTextClass} text-[8px] font-bold uppercase tracking-widest`}>
                          {performance ? (performance.gameCode === "pending" ? "PENDING" : "CRACKED") : "PENDING"}
                        </span>
                      </div>

                      {/* Cracked Code Time */}
                      <div className="col-span-2 flex flex-col items-center space-y-1">
                        <span className={`${mainTextClass} font-black font-mono text-base`}>
                          {performance ? performance.time : "--:--"}
                        </span>
                        <span className={`${subTextClass} text-[8px] font-bold uppercase tracking-widest`}>
                          {performance ? (performance.time === "Pending" ? "PENDING" : "COMPLETED") : "PENDING"}
                        </span>
                      </div>

                      {/* $1 Code Column */}
                      <div className="col-span-1 flex flex-col items-center">
                        <span className={`${i <= 2 ? 'text-[#D4AF37]' : 'text-zinc-600'} font-black text-base uppercase font-mono`}>
                          {i <= 2 ? (performance ? performance.idCode : billLevel.level) : `ID ${billLevel.level}`}
                        </span>
                        <span className={`${subTextClass} text-[8px] font-bold uppercase tracking-widest`}>
                          LOCKED
                        </span>
                      </div>

                      {/* Seat Letter Code */}
                      <div className="col-span-1 flex flex-col items-center">
                        <span className={`${mainTextClass} font-black font-mono text-base`}>
                          {performance ? performance.seatCode : "---"}
                        </span>
                        <span className={`${subTextClass} text-[8px] font-bold uppercase tracking-widest`}>
                          {performance ? (performance.seatCode === "pending" ? "LOCKED" : "ISSUED") : "LOCKED"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Leadership Board Button */}
            <div className="flex flex-col items-center pt-8 pb-32 w-full">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentScreen('LEADER_BOARD')}
                className="px-12 py-6 bg-zinc-900 border-4 border-[#D4AF37] rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.15)] group hover:bg-[#D4AF37] transition-all duration-300 flex items-center space-x-4"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#D4AF37] group-hover:text-black transition-colors">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                  </svg>
                </div>
                <span className="text-3xl font-black text-[#D4AF37] group-hover:text-black uppercase italic tracking-tighter">
                  Leadership Board
                </span>
              </motion.button>
            </div>

            {/* Back Button */}
            <Button 
              variant="ghost" 
              className="fixed bottom-10 text-zinc-500 hover:text-white text-xl uppercase tracking-widest"
              onClick={() => setCurrentScreen('MORE_INFO_MENU')}
            >
              Back to Menu
            </Button>
          </div>
        );

      case 'LEADER_BOARD':
        return (
          <div className="flex-1 flex flex-col items-center justify-start py-10 px-6 space-y-16 overflow-y-auto custom-scrollbar h-full w-full max-w-full">
            {/* Header */}
            <div className="text-center space-y-4">
              <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-7xl font-black text-white italic tracking-widest uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Leader Board
              </motion.h1>
              <div className="w-48 h-1.5 bg-[#D4AF37] mx-auto rounded-full shadow-[0_0_20px_rgba(212,175,55,0.5)]" />
            </div>

            {/* Two Columns Layout */}
            <div className="grid grid-cols-2 gap-12 w-full px-12">
              {/* Friends and Family Leaders Column */}
              <div className="flex flex-col space-y-8">
                <div className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-2xl flex items-center justify-center shadow-xl">
                  <h2 className="text-3xl font-black text-[#D4AF37] uppercase italic tracking-tighter">
                    Friends and Family Leaders
                  </h2>
                </div>
                
                <div className="flex-1 bg-zinc-900/40 border-2 border-zinc-800/50 rounded-[40px] p-6 space-y-4">
                  {[
                    { name: 'Liam', time: '7:12:47', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
                    { name: 'Noah', time: '7:25:12', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
                    { name: 'Oliver', time: '7:38:59', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop' },
                    { name: 'Emma', time: '7:52:30', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
                    { name: 'Charlotte', time: '8:05:15', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
                    { name: 'James', time: '8:18:42', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
                    { name: 'Sophia', time: '8:31:05', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
                    { name: 'Amelia', time: '8:40:22', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
                    { name: 'Benjamin', time: '8:45:10', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
                    { name: 'Mia', time: '8:52:34', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop' }
                  ].map((leader, index) => {
                    const breakdownId = `F-${leader.name}`;
                    const isExpandable = ['Liam', 'Noah', 'Oliver'].includes(leader.name);
                    const isExpanded = expandedStatsIds.includes(breakdownId);
                    
                    const breakdowns: Record<string, any[]> = {
                      'Liam': [
                        { name: 'Hullsome', time: '2:15:20', avatar: 'https://i.ibb.co/nMxk4hFV/Hullsome.png', ep: 1 },
                        { name: 'Chris Ramsey', time: '2:30:15', avatar: 'https://i.ibb.co/jPn3tWQ3/Chris-Ramsey.png', ep: 2 },
                        { name: 'Hafu Go', time: '2:27:12', avatar: 'https://i.ibb.co/60PXBydQ/Ha-Fu-Go.png', ep: 3 }
                      ],
                      'Noah': [
                        { name: 'Hullsome', time: '2:20:10', avatar: 'https://i.ibb.co/nMxk4hFV/Hullsome.png', ep: 1 },
                        { name: 'Chris Ramsey', time: '2:35:12', avatar: 'https://i.ibb.co/jPn3tWQ3/Chris-Ramsey.png', ep: 2 },
                        { name: 'Hafu Go', time: '2:29:50', avatar: 'https://i.ibb.co/60PXBydQ/Ha-Fu-Go.png', ep: 3 }
                      ],
                      'Oliver': [
                        { name: 'Hullsome', time: '2:30:15', avatar: 'https://i.ibb.co/nMxk4hFV/Hullsome.png', ep: 1 },
                        { name: 'Chris Ramsey', time: '2:40:22', avatar: 'https://i.ibb.co/jPn3tWQ3/Chris-Ramsey.png', ep: 2 },
                        { name: 'Hafu Go', time: '2:28:22', avatar: 'https://i.ibb.co/60PXBydQ/Ha-Fu-Go.png', ep: 3 }
                      ]
                    };

                    return (
                      <div key={index} className="space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => isExpandable && toggleStats(breakdownId)}
                          className={`flex items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 transition-all group ${isExpandable ? 'cursor-pointer hover:bg-zinc-800/80 hover:border-[#D4AF37]/50' : 'hover:border-[#D4AF37]/30'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full border-2 border-zinc-700 overflow-hidden group-hover:border-[#D4AF37] transition-all">
                              <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-black uppercase italic tracking-tighter text-lg">{leader.name}</span>
                                {isExpandable && (
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className="text-[#D4AF37]"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                      <path d="m6 9 6 6 6-6"/>
                                    </svg>
                                  </motion.div>
                                )}
                              </div>
                              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Rank #{index + 1}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[#D4AF37] font-black font-mono text-xl tracking-tight">{leader.time}</span>
                            <div className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Completed</div>
                          </div>
                        </motion.div>
                        
                        <AnimatePresence>
                          {isExpanded && breakdowns[leader.name] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-zinc-950/40 rounded-2xl border border-zinc-800/50 mx-2"
                            >
                              <div className="p-4 space-y-3">
                                <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Episode Breakdown</div>
                                {breakdowns[leader.name].map((ep, epIndex) => (
                                  <div key={epIndex} className="flex items-center justify-between border-b border-zinc-800/30 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden">
                                        <img src={ep.avatar} alt={ep.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-zinc-300 font-bold uppercase italic tracking-tighter text-sm">{ep.name}</span>
                                        <span className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Episode {ep.ep}</span>
                                      </div>
                                    </div>
                                    <span className="text-[#D4AF37]/70 font-mono text-sm">{ep.time}</span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Total Hunt Time</span>
                                  <span className="text-[#D4AF37] font-black font-mono text-sm">{leader.time}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-8 py-3 bg-green-500/10 border-2 border-green-500 rounded-xl text-green-500 font-bold uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="16" y1="11" x2="22" y2="11" />
                    </svg>
                    <span>Invite Friends</span>
                  </motion.button>
                </div>
              </div>

              {/* National Leaders Column */}
              <div className="flex flex-col space-y-8">
                <div className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-2xl flex items-center justify-center shadow-xl">
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    National Leaders
                  </h2>
                </div>
                
                <div className="flex-1 bg-zinc-900/40 border-2 border-zinc-800/50 rounded-[40px] p-6 space-y-4 max-h-[800px] overflow-y-auto custom-scrollbar">
                  {[
                    { name: 'Jack', time: '6:34:52', avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop' },
                    { name: 'Emily', time: '6:35:10', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
                    { name: 'Alexander', time: '6:36:45', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop' },
                    { name: 'Isabella', time: '6:38:22', avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100&h=100&fit=crop' },
                    { name: 'William', time: '6:40:05', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
                    { name: 'Olivia', time: '6:42:15', avatar: 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=100&h=100&fit=crop' },
                    { name: 'Henry', time: '6:43:55', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&h=100&fit=crop' },
                    { name: 'Ava', time: '6:45:30', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=100&h=100&fit=crop' },
                    { name: 'Sebastian', time: '6:47:00', avatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=100&h=100&fit=crop' },
                    { name: 'Lily', time: '6:48:45', avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&h=100&fit=crop' },
                    { name: 'Daniel', time: '6:50:20', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop' },
                    { name: 'Chloe', time: '6:52:10', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
                    { name: 'Matthew', time: '6:53:50', avatar: 'https://images.unsplash.com/photo-1500048993953-d23a43626efc?w=100&h=100&fit=crop' },
                    { name: 'Harper', time: '6:55:25', avatar: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=100&h=100&fit=crop' },
                    { name: 'Joseph', time: '6:57:10', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop' },
                    { name: 'Evelyn', time: '6:58:55', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop' },
                    { name: 'David', time: '7:00:30', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop' },
                    { name: 'Aria', time: '7:01:45', avatar: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=100&h=100&fit=crop' },
                    { name: 'Samuel', time: '7:02:50', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
                    { name: 'Gianna', time: '7:03:55', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop' },
                    { name: 'Julian', time: '7:04:40', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop' },
                    { name: 'Mila', time: '7:05:30', avatar: 'https://images.unsplash.com/photo-1529139513065-07b2ee722693?w=100&h=100&fit=crop' },
                    { name: 'Anthony', time: '7:06:25', avatar: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=100&h=100&fit=crop' },
                    { name: 'Eleanor', time: '7:07:40', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=100&h=100&fit=crop' },
                    { name: 'Lucas', time: '7:08:45', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop' }
                  ].map((leader, index) => {
                    const breakdownId = `N-${leader.name}`;
                    const isExpandable = ['Jack', 'Emily', 'Alexander'].includes(leader.name);
                    const isExpanded = expandedStatsIds.includes(breakdownId);
                    
                    const breakdowns: Record<string, any[]> = {
                      'Jack': [
                        { name: 'Hullsome', time: '2:05:12', avatar: 'https://i.ibb.co/nMxk4hFV/Hullsome.png', ep: 1 },
                        { name: 'Chris Ramsey', time: '2:15:20', avatar: 'https://i.ibb.co/jPn3tWQ3/Chris-Ramsey.png', ep: 2 },
                        { name: 'Hafu Go', time: '2:14:20', avatar: 'https://i.ibb.co/60PXBydQ/Ha-Fu-Go.png', ep: 3 }
                      ],
                      'Emily': [
                        { name: 'Hullsome', time: '2:06:10', avatar: 'https://i.ibb.co/nMxk4hFV/Hullsome.png', ep: 1 },
                        { name: 'Chris Ramsey', time: '2:16:15', avatar: 'https://i.ibb.co/jPn3tWQ3/Chris-Ramsey.png', ep: 2 },
                        { name: 'Hafu Go', time: '2:12:45', avatar: 'https://i.ibb.co/60PXBydQ/Ha-Fu-Go.png', ep: 3 }
                      ],
                      'Alexander': [
                        { name: 'Hullsome', time: '2:07:20', avatar: 'https://i.ibb.co/nMxk4hFV/Hullsome.png', ep: 1 },
                        { name: 'Chris Ramsey', time: '2:17:15', avatar: 'https://i.ibb.co/jPn3tWQ3/Chris-Ramsey.png', ep: 2 },
                        { name: 'Hafu Go', time: '2:12:10', avatar: 'https://i.ibb.co/60PXBydQ/Ha-Fu-Go.png', ep: 3 }
                      ]
                    };

                    return (
                      <div key={index} className="space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => isExpandable && toggleStats(breakdownId)}
                          className={`flex items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 transition-all group ${isExpandable ? 'cursor-pointer hover:bg-zinc-800/80 hover:border-white/50' : 'hover:border-white/30'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full border-2 border-zinc-700 overflow-hidden group-hover:border-white transition-all">
                              <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-black uppercase italic tracking-tighter text-lg">{leader.name}</span>
                                {isExpandable && (
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className="text-white"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                      <path d="m6 9 6 6 6-6"/>
                                    </svg>
                                  </motion.div>
                                )}
                              </div>
                              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Rank #{index + 1}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-black font-mono text-xl tracking-tight">{leader.time}</span>
                            <div className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Completed</div>
                          </div>
                        </motion.div>

                        <AnimatePresence>
                          {isExpanded && breakdowns[leader.name] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-zinc-950/40 rounded-2xl border border-zinc-800/50 mx-2"
                            >
                              <div className="p-4 space-y-3">
                                <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Episode Breakdown</div>
                                {breakdowns[leader.name].map((ep, epIndex) => (
                                  <div key={epIndex} className="flex items-center justify-between border-b border-zinc-800/30 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden">
                                        <img src={ep.avatar} alt={ep.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-zinc-300 font-bold uppercase italic tracking-tighter text-sm">{ep.name}</span>
                                        <span className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest">Episode {ep.ep}</span>
                                      </div>
                                    </div>
                                    <span className="text-white/70 font-mono text-sm">{ep.time}</span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Total Hunt Time</span>
                                  <span className="text-white font-black font-mono text-sm">{leader.time}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pb-10 pt-8 flex items-center space-x-12">
              <Button 
                variant="ghost" 
                className="text-zinc-500 hover:text-white text-xl uppercase tracking-widest"
                onClick={() => setCurrentScreen('MORE_INFO_MENU')}
              >
                Back to Menu
              </Button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentScreen('PLAYERS_INFO')}
                className="px-8 py-3 bg-zinc-900 border-2 border-[#D4AF37] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.1)] group hover:bg-[#D4AF37] transition-all duration-300 flex items-center space-x-3"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-[#D4AF37] group-hover:text-black transition-colors">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="text-xl font-black text-[#D4AF37] group-hover:text-black uppercase italic tracking-tighter">
                  Players Profile
                </span>
              </motion.button>
            </div>
          </div>
        );

      case 'EPISODE_DETAIL':
        if (selectedYoutuberIndex === null) return null;
        const youtuber = YOUTUBE_DATA[selectedYoutuberIndex];
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center space-y-4"
            >
              {/* Profile Head Section */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] overflow-hidden shadow-2xl bg-zinc-900">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={selectedProfile?.avatar} className="object-cover" />
                    <AvatarFallback className={selectedProfile?.color}>{selectedProfile?.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                    {selectedProfile?.name}
                  </h3>
                  <p className="text-[#D4AF37] font-mono text-5xl font-black tracking-widest drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                    {selectedProfile?.serial || globalSerial}
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4 mt-12">
                <h2 className="text-8xl font-black text-white uppercase italic tracking-[-0.05em] drop-shadow-2xl">
                  {youtuber.name}
                </h2>
                <p className="text-2xl font-bold text-red-600 uppercase tracking-[0.3em]">
                  {youtuber.teamName}
                </p>
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-10">
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">The Hunt</h3>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-[600px] aspect-video rounded-2xl overflow-hidden border-4 border-white/10 hover:border-[#D4AF37] transition-all cursor-pointer group shadow-2xl"
                  onClick={() => {
                    setActiveVideoUrl(youtuber.TheHuntVideo);
                    setCurrentScreen('VIDEO_PLAYER');
                  }}
                >
                  <img src={youtuber.TheHuntThumbNail} alt="The Hunt" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-black border-b-[15px] border-b-transparent ml-2" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded text-white font-mono text-sm">
                    1:23
                  </div>
                </motion.div>
              </div>

              {!hasSeenEpisode ? (
                <Button
                  className="h-16 px-12 bg-[#008044] hover:bg-[#006435] text-white text-2xl font-black uppercase tracking-widest rounded-xl shadow-2xl transition-all hover:scale-105"
                  onClick={() => setHasSeenEpisode(true)}
                >
                  I've seen it already
                </Button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center space-y-6 w-full max-w-2xl bg-zinc-900/50 p-10 rounded-3xl border border-[#D4AF37]/20"
                >
                  <p className="text-[#D4AF37] text-3xl font-black uppercase text-center tracking-tight leading-tight italic">
                    {youtuber.question}
                  </p>
                    <div className="w-full space-y-2">
                      <input
                        value={episodeAnswer}
                        onChange={(e) => setEpisodeAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && episodeAnswer.trim()) {
                            setShowConfirmModal(true);
                          }
                        }}
                        placeholder="ENTER ANSWER..."
                        className="w-full h-28 bg-zinc-900 border-4 border-zinc-800 focus:border-[#008044] focus:shadow-[0_0_25px_rgba(0,128,68,0.5)] focus:outline-none text-white text-3xl font-black text-center uppercase tracking-normal rounded-3xl transition-all duration-300 px-4 overflow-hidden"
                        autoFocus
                      />
                      {episodeAnswer.trim() && (
                        <Button 
                          onClick={() => setShowConfirmModal(true)}
                          className="mt-6 w-full h-20 bg-[#008044] text-white font-black text-2xl uppercase tracking-widest rounded-2xl hover:bg-[#006435] transition-transform active:scale-95 shadow-[0_0_30px_rgba(0,128,68,0.3)]"
                        >
                          Verify Answer
                        </Button>
                      )}
                      <p className="text-zinc-600 text-sm font-bold uppercase tracking-[0.3em] text-center mt-2">Press ENTER or click VERIFY to continue</p>
                    </div>
                </motion.div>
              )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="max-w-2xl w-full bg-zinc-900 border-4 border-red-600/50 p-12 rounded-[32px] text-center space-y-10 shadow-[0_0_100px_rgba(220,38,38,0.2)]"
                >
                  <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">
                    Are you sure that<br />
                    <span className="text-red-600 underline underline-offset-8 decoration-4">"{episodeAnswer}"</span> IS CORRECT?
                  </h3>
                  <p className="text-xl text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
                    If not, you will be locked out for<br />
                    <span className="text-yellow-400 text-4xl font-black">24 HOURS!</span>
                  </p>
                  <div className="flex flex-col gap-4">
                    <Button 
                      className="h-20 bg-[#008044] hover:bg-[#006435] text-white text-2xl font-black uppercase tracking-widest rounded-2xl transition-transform hover:scale-105"
                      onClick={() => {
                        setShowConfirmModal(false);
                        setCurrentScreen('CHALLENGE_SUCCESS');
                      }}
                    >
                      Yes, Correct
                    </Button>
                    <Button 
                      variant="ghost"
                      className="h-16 text-red-600 hover:text-red-500 hover:bg-red-600/10 text-xl font-bold uppercase tracking-widest rounded-2xl"
                      onClick={() => setShowConfirmModal(false)}
                    >
                      I'm not sure
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            <Button 
              variant="ghost" 
              className="text-zinc-500 hover:text-white text-xl uppercase tracking-widest mt-12 mb-8"
              onClick={() => {
                setHasSeenEpisode(false);
                setEpisodeAnswer('');
                setSelectedYoutuberIndex(null);
                setCurrentScreen('HOME');
              }}
            >
              Back to Episodes
            </Button>
          </div>
        );

      case 'CHALLENGE_SUCCESS':
        if (selectedYoutuberIndex === null) return null;
        
        return (
          <div className="flex-1 flex flex-col items-center justify-start pt-6 relative overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center space-y-10 w-full max-w-7xl"
            >
              {/* Profile Header - Moved Higher */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-40 h-40 rounded-full border-4 border-[#008044] overflow-hidden shadow-[0_0_50px_rgba(0,128,68,0.3)] bg-zinc-900">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={selectedProfile?.avatar} className="object-cover" />
                    <AvatarFallback className={selectedProfile?.color}>{selectedProfile?.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                    {selectedProfile?.name}
                  </h3>
                  <p className="text-[#D4AF37] font-mono text-3xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    {selectedProfile?.serial || globalSerial}
                  </p>
                </div>
              </div>

              {/* Assessment Section - Massive and Borderless */}
              <div className="text-center space-y-10 w-full px-10">
                <div className="space-y-4">
                  <h4 className="text-[#D4AF37] text-7xl font-black uppercase italic tracking-tighter drop-shadow-2xl">
                    BILL ASSESSMENT - <span className="text-red-600">LEVEL {currentBillLevel.level}</span>
                  </h4>
                  <p className="text-white text-6xl font-black uppercase tracking-tighter">
                    {currentBillLevel.question}
                  </p>
                </div>
                
                <div className="flex flex-col items-center max-w-3xl mx-auto space-y-6">
                  <div className="w-full relative">
                    <input
                      type="text"
                      value={billAnswer}
                      onChange={(e) => setBillAnswer(e.target.value)}
                      placeholder="ENTER DETAIL..."
                      className="w-full h-28 bg-black/60 border-4 border-zinc-800 focus:border-[#D4AF37] outline-none text-white text-3xl font-black text-center uppercase tracking-normal rounded-3xl transition-all shadow-2xl"
                      disabled={isBillVerified}
                    />
                    {billAnswer && !isBillVerified && (
                      <Button 
                        onClick={() => setIsBillVerified(true)}
                        className="mt-6 w-full h-24 bg-[#D4AF37] text-black font-black text-3xl uppercase tracking-widest rounded-2xl hover:bg-[#B8860B] transition-transform active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                      >
                        Verify Detail
                      </Button>
                    )}
                  </div>
                  
                  {!isBillVerified && (
                    <Button
                      variant="link"
                      className="text-zinc-500 hover:text-white uppercase tracking-[0.3em] text-xl font-black"
                      onClick={() => setShowBillHelp(true)}
                    >
                      NOT SURE WHERE IT IS?
                    </Button>
                  )}
                </div>
              </div>

              {/* Prize Selection - Massive TV-Ready Buttons */}
              <div className="flex gap-16 mt-4 justify-center w-full relative">
                {/* Monthly Prize Section */}
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ 
                      opacity: isBillVerified ? 1 : 0.2,
                      filter: isBillVerified ? "grayscale(0)" : "grayscale(1)"
                    }}
                    className={`relative w-[450px] aspect-video bg-zinc-900 border-4 border-[#D4AF37]/20 overflow-hidden rounded-[40px] transition-all duration-300 shadow-2xl group flex items-center justify-center ${!isBillVerified ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#D4AF37]'}`}
                    onClick={() => {
                      if (isBillVerified) {
                        setLegalContext('SPONSOR');
                        setShowSponsorOptions(true);
                      }
                    }}
                  >
                    <img 
                      src={currentSponsor.logo} 
                      alt={currentSponsor.name} 
                      className="w-3/4 h-2/3 object-contain relative z-10 transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                  
                  <div className="text-center space-y-1">
                    <span className="text-[#D4AF37] font-black text-2xl uppercase block tracking-widest italic leading-none">Monthly Prize</span>
                    <span className="text-[#22c55e] font-black text-6xl tracking-tighter drop-shadow-lg">$25,000</span>
                  </div>
                </div>

                {/* Seat Entry Section */}
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ 
                      opacity: isBillVerified ? 1 : 0.2,
                      filter: isBillVerified ? "grayscale(0)" : "grayscale(1)"
                    }}
                    className={`relative w-[450px] aspect-video bg-zinc-900 border-4 border-white/10 overflow-hidden rounded-[40px] transition-all duration-300 shadow-2xl group ${!isBillVerified ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/40'}`}
                    onClick={() => {
                      if (isBillVerified) {
                        setLegalContext('SEAT');
                        setShowSponsorOptions(true);
                      }
                    }}
                  >
                    <img 
                      src={currentYoutuber.thumbnail} 
                      alt="Seat Entry" 
                      className="w-full h-full object-cover grayscale-[0.8] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <div className="w-24 h-24 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-2xl">
                        <Play className="w-12 h-12 text-black fill-current ml-2" />
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="text-center space-y-1">
                    <span className="text-yellow-400 font-black text-2xl uppercase block tracking-widest italic leading-none">Seat Entry</span>
                    <span className="text-[#22c55e] font-black text-6xl tracking-tighter drop-shadow-lg">{currentYoutuber.jackpot}</span>
                  </div>
                </div>

                {/* Unified Selection Menu */}
                <AnimatePresence>
                  {showSponsorOptions && isBillVerified && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSponsorOptions(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-zinc-900 border-4 border-[#D4AF37] p-10 rounded-[48px] shadow-[0_0_100px_rgba(212,175,55,0.2)] w-full max-w-xl z-[160] space-y-8"
                      >
                        <h5 className="text-center text-[#D4AF37] text-4xl font-black uppercase italic tracking-tighter">Choose Your Experience</h5>
                        <div className="grid gap-6">
                          <Button 
                            className="h-32 bg-white text-black hover:bg-zinc-200 text-3xl font-black uppercase tracking-tight rounded-2xl flex flex-col items-center justify-center transition-transform active:scale-95"
                            onClick={() => {
                              setShowSponsorOptions(false);
                              setCurrentScreen('LEGAL');
                            }}
                          >
                            Augmented Reality
                            <span className="text-sm opacity-60 font-bold">Only smart phone needed</span>
                          </Button>
                          <Button 
                            className="h-32 bg-[#008044] text-white hover:bg-[#006435] text-3xl font-black uppercase tracking-tight rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,128,68,0.3)] transition-transform active:scale-95"
                            onClick={() => {
                              setShowSponsorOptions(false);
                              setCurrentScreen('LEGAL');
                            }}
                          >
                            Virtual Reality
                            <span className="text-sm opacity-60 font-bold">VR Goggles needed to play</span>
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Help Popup */}
            <AnimatePresence>
              {showBillHelp && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                  <div className="absolute inset-0 bg-black/90" onClick={() => setShowBillHelp(false)} />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="max-w-xl w-full bg-zinc-900 border-2 border-[#D4AF37]/50 p-8 rounded-[32px] text-center space-y-6 shadow-2xl relative z-10"
                  >
                    <h5 className="text-[#D4AF37] text-2xl font-black uppercase italic">Secret Knowledge</h5>
                    <div className="space-y-4 text-left">
                      <div>
                        <span className="text-red-600 font-black uppercase block text-sm tracking-widest">The Secret</span>
                        <p className="text-white text-lg font-bold">{currentBillLevel.secret}</p>
                      </div>
                      <div>
                        <span className="text-red-600 font-black uppercase block text-sm tracking-widest">The Explanation</span>
                        <p className="text-zinc-400 font-medium">{currentBillLevel.explanation}</p>
                      </div>
                      <div className="bg-black/40 p-4 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 font-black uppercase block text-xs tracking-widest mb-1">Example</span>
                        <p className="text-[#D4AF37] font-mono">{currentBillLevel.exampleAnswer}</p>
                      </div>
                    </div>
                    <Button 
                      className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest rounded-xl"
                      onClick={() => setShowBillHelp(false)}
                    >
                      Understood
                    </Button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'VIDEO_PLAYER':
        if (!activeVideoUrl) return null;
        
        // Convert YouTube watch URL to embed URL
        const videoIdMatch = activeVideoUrl.match(/[?&]v=([^&]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : '';
        const timeMatch = activeVideoUrl.match(/[?&]t=(\d+)s/);
        const startTime = timeMatch ? timeMatch[1] : '0';
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startTime}`;

        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-black">
            <div className="relative w-full h-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-800">
              <iframe 
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <Button 
                className="absolute top-6 right-6 bg-black/60 hover:bg-black text-white rounded-full p-4"
                onClick={() => setCurrentScreen(selectedYoutuberIndex !== null ? 'EPISODE_DETAIL' : 'HOME')}
              >
                Close Video
              </Button>
            </div>
          </div>
        );

      case 'ATLAS_ENCODE':
        return (
          <AtlasCipherPage 
            onBack={() => setCurrentScreen('EPISODE_DETAIL')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            onPlay={(data) => {
              setAtlasInitialCode(data.code);
              setAtlasTargetShift(data.shift);
              setAtlasShift(data.shift); // Match the encoder shift
              setCurrentScreen('ATLAS_GAME');
            }}
            onGoToCube={() => {
              setAtlasCubeBackScreen('ATLAS_ENCODE');
              setCurrentScreen('ATLAS_CUBE');
            }}
          />
        );
      case 'ATLAS_GAME':
        return (
          <AtlasGamePage 
            onBack={() => setCurrentScreen('EPISODE_DETAIL')}
            onReturnToEncoder={() => setCurrentScreen('ATLAS_ENCODE')}
            onNavigateToTheHunt={() => setCurrentScreen('VIDEO_PLAYER')}
            onNavigateToDigitalCoin={() => setCurrentScreen('ONE_DOLLAR_BILL')}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
            initialCode={atlasInitialCode}
            crackedOutput={atlasCrackedOutput}
            setCrackedOutput={setAtlasCrackedOutput}
            mappingLetter="A"
            shift={atlasShift}
            setShift={setAtlasShift}
            targetShift={atlasTargetShift}
            rotation={atlasRotation}
            setRotation={setAtlasRotation}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            huntAnswers={["42"]}
          />
        );
      case 'CAESAR_WHEEL':
        return (
          <CaesarGamePage 
            onBack={() => setCurrentScreen('HOME')}
            onReturnToEncoder={() => setCurrentScreen('CAESAR_ENCODE')}
            onNavigateToTheHunt={() => setCurrentScreen('HOME')}
            onNavigateToDigitalCoin={() => setCurrentScreen('HOME')}
            onPostResults={(data) => {
              setEpisodePerformance(prev => {
                const next = [...prev];
                // Since this is generic, we don't have selectedYoutuberIndex reliably here?
                // Actually if it's CAESAR_WHEEL it's usually from HOME?
                // Let's check if selectedYoutuberIndex is used.
                if (selectedYoutuberIndex !== null) {
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    keyword: data.sponsorKey
                  };
                }
                return next;
              });
              setCurrentScreen('PLAYERS_INFO');
            }}
            initialCode={caesarInitialCode || "CIPHER"}
            crackedOutput={crackedOutput}
            setCrackedOutput={setCrackedOutput}
            mappingLetter="A"
            shift={shift}
            setShift={setShift}
            targetShift={caesarTargetShift}
            rotation={currentRotation}
            setRotation={setCurrentRotation}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            huntAnswers={["42"]}
          />
        );
      case 'CAESAR_ENCODE':
        return (
          <CaesarCipherPage 
            onBack={() => setCurrentScreen('EPISODE_DETAIL')}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            onPlay={(data) => {
              setCaesarInitialCode(data.code);
              setCaesarTargetShift(data.shift);
              setCurrentScreen('CAESAR_GAME');
            }}
          />
        );
      case 'CAESAR_GAME':
        return (
          <CaesarGamePage 
            onBack={() => setCurrentScreen('EPISODE_DETAIL')}
            onReturnToEncoder={() => setCurrentScreen('CAESAR_ENCODE')}
            onNavigateToTheHunt={() => setCurrentScreen('VIDEO_PLAYER')}
            onNavigateToDigitalCoin={() => setCurrentScreen('ONE_DOLLAR_BILL')}
            onPostResults={(data) => {
              if (selectedYoutuberIndex !== null) {
                setEpisodePerformance(prev => {
                  const next = [...prev];
                  next[selectedYoutuberIndex] = {
                    ...next[selectedYoutuberIndex],
                    gameCode: data.gameCode,
                    time: data.time,
                    // The design says to post Sponsor key. 
                    // Looking at the performance object, it doesn't have a place for Sponsor key specifically
                    // but I can put it in keyword if the user wants?
                    // "Post the Sponsor key that was used to crack the code. Example 'A=F'"
                    // Let's assume keyword is for sponsor key or we add it.
                    keyword: data.sponsorKey
                  };
                  return next;
                });
                setCurrentScreen('PLAYERS_INFO');
              }
            }}
            initialCode={caesarInitialCode}
            crackedOutput={crackedOutput}
            setCrackedOutput={setCrackedOutput}
            mappingLetter="A"
            shift={shift}
            setShift={setShift}
            targetShift={caesarTargetShift}
            rotation={currentRotation}
            setRotation={setCurrentRotation}
            youtuber={selectedYoutuberIndex !== null ? YOUTUBE_DATA[selectedYoutuberIndex] : undefined}
            huntAnswers={["42"]}
          />
        );
    }
  };

  const getBackgroundImage = () => {
    return 'https://storage.googleapis.com/static.antigravity.dev/ais-dev-ifpbpgsti5iover3ujwykb-20140544900.us-east1.run.app/attachments/1744730515152-inside%20Door.png';
  };

  return (
    <AtlasSessionProvider>
      <TVContainer 
        backgroundImage={getBackgroundImage()}
        onLogoClick={() => setCurrentScreen('HOME')}
        showLogo={currentScreen !== 'HOME' && currentScreen !== 'ONE_DOLLAR_BILL'}
      >
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </TVContainer>
    </AtlasSessionProvider>
  );
}

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, AlertTriangle, CheckCircle2, ChevronLeft, Info, Eye, EyeOff, Terminal, ShieldCheck, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authenticateCurrency, analyzeSerialNumber, ForensicReport } from '@/src/services/geminiService';

interface CurrencyAuthenticatorProps {
  onBack: () => void;
  onLogoClick: () => void;
  onSuccess?: (serial: string) => void;
}

const HINTS: Record<string, string> = {
  facePlate: "Front: Look for the tiny number in the bottom right corner of the green seal area.",
  backPlate: "Flip the bill over: it is the small number below the 'E' in 'ONE'.",
  facility: "Front: Look for 'FW' near the plate position on some bills. If missing, it's Washington D.C.",
  coordinate: "Front: Small letter and number (e.g. A2) located near the bank seal.",
  suffix: "Letter at the very end of the Serial Number string.",
  district: "Found inside the black Federal Reserve seal on the left.",
};

const ScanlineOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-20">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    <motion.div 
      animate={{ y: ["0%", "100%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      className="absolute top-0 left-0 w-full h-[2px] bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
    />
  </div>
);

export const CurrencyAuthenticator: React.FC<CurrencyAuthenticatorProps> = ({ onBack, onLogoClick, onSuccess }) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState<{ field: string; hint: string } | null>(null);
  const [showSpecimen, setShowSpecimen] = useState(false);
  const [manualInputSerial, setManualInputSerial] = useState("");
  const [manualInputSeries, setManualInputSeries] = useState("");

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      analyzeImage(imageSrc);
    }
  }, [webcamRef]);

  const handleStartCapture = () => {
    setError(null);
    setReport(null);
    setImgSrc(null);
    setManualInputSerial("");
    setManualInputSeries("");
    setIsCapturing(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          capture();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const analyzeImage = async (base64Img: string) => {
    setIsAnalyzing(true);
    try {
      const result = await authenticateCurrency(base64Img);
      setReport(result);
    } catch (err) {
      setError("AI Signal Lost: Connection to encryption node failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (manualInputSerial.trim() && manualInputSeries.trim()) {
      setIsAnalyzing(true);
      setError(null);
      try {
        const result = await analyzeSerialNumber(manualInputSerial.trim(), manualInputSeries.trim());
        setReport(result);
        // Set a placeholder to exit camera mode if successful
        if (result.isOneDollarBill) {
          setImgSrc("https://images.unsplash.com/photo-1559163263-e301f808722c?q=80&w=1200&auto=format&fit=crop");
        }
      } catch (err) {
        setError("Manual analysis failed. Terminal synchronization error.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const renderReportItem = (label: string, value: string, fieldKey: string) => {
    const isUnclear = value === "UNCLEAR";
    return (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center justify-between p-3 border-b border-green-900/30 group hover:bg-green-900/10 cursor-pointer ${isUnclear ? 'bg-red-950/20 animate-pulse border-red-500/50' : ''}`}
        onClick={() => isUnclear && setSelectedHint({ field: label, hint: HINTS[fieldKey] || "Observe the physical specimen carefully for this data point." })}
      >
        <span className="text-[10px] text-green-500/60 uppercase font-mono tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold font-serif ${isUnclear ? 'text-red-500' : 'text-[#c5a059]'}`}>
            {value}
          </span>
          {isUnclear && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 w-full bg-[#0a110a] flex flex-col relative overflow-hidden text-green-500 selection:bg-green-500/30">
      <ScanlineOverlay />
      
      {/* Header */}
      <div className="h-20 border-b border-green-900/50 flex items-center justify-between px-10 bg-black/40 relative z-20">
        <button onClick={onLogoClick} className="flex items-center group">
          <img 
            src="https://i.ibb.co/kgXgqkGB/CKXRLogo-Hor-Z.png" 
            alt="CKXR Logo" 
            className="h-12 w-auto object-contain" 
          />
        </button>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[0.2em] text-green-500/50">Terminal Status</span>
            <span className="text-xs font-mono font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              SECURE LINK ACTIVE
            </span>
          </div>
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="hover:bg-green-900/20 text-green-500 border border-green-900/50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> EXIT TERMINAL
          </Button>
        </div>
      </div>

      <div className="flex-1 flex p-8 gap-8 relative z-20">
        {/* Left Side: Camera/Specimen */}
        <div className="flex-[1.5] flex flex-col gap-6">
          <div className="relative aspect-[16/9] bg-black border-4 border-double border-green-900/50 rounded-lg overflow-hidden group">
            {!imgSrc ? (
              <>
                {/* @ts-ignore - Webcam types are overly strict in this environment */}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover grayscale contrast-125 brightness-75"
                />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <motion.span 
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-9xl font-black text-[#D4AF37] italic"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="px-2 py-1 bg-red-600/20 border border-red-600 text-red-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    Live Feed
                  </div>
                </div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartCapture}
                    disabled={countdown !== null}
                    className="h-16 px-12 bg-[#D4AF37] hover:bg-[#c5a059] text-black font-black uppercase tracking-tighter text-2xl flex items-center gap-3 shadow-2xl shadow-[#D4AF37]/20 disabled:opacity-50"
                  >
                    <Camera className="w-8 h-8" />
                    Initialize Capture
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="relative w-full h-full">
                <img src={imgSrc} className="w-full h-full object-cover contrast-125" />
                <div className="absolute inset-0 bg-green-500/5" />
                <div className="absolute top-4 right-4 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="bg-black/80 border-green-900 text-green-500"
                    onClick={() => setShowSpecimen(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View Bill
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-black/80 border-green-900 text-green-500"
                    onClick={() => { setImgSrc(null); setReport(null); }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Rescan
                  </Button>
                </div>
              </div>
            )}
          </div>

          {report && report.isOneDollarBill ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-green-950/20 border-2 border-[#D4AF37] rounded-xl flex items-center justify-between shadow-[0_0_30px_rgba(212,175,55,0.1)]"
            >
              <div className="space-y-1">
                <span className="text-xs uppercase text-[#D4AF37]/60 font-black tracking-widest">Serial Number Detected</span>
                <p className="text-5xl font-black text-[#D4AF37] tracking-tighter italic">{report.serialNumber}</p>
              </div>
              <div className="flex gap-4">
                <Button 
                  className="h-12 px-6 bg-[#008044] hover:bg-[#006435] text-white font-black uppercase tracking-tighter text-lg rounded-none border-b-4 border-green-900"
                  onClick={() => {
                    if (onSuccess && report?.serialNumber) {
                      onSuccess(report.serialNumber);
                    } else {
                      onLogoClick();
                    }
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Correct
                </Button>
                <Button 
                  className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-tighter text-lg rounded-none border-b-4 border-red-900"
                  onClick={() => { setImgSrc(null); setReport(null); setManualInputSerial(""); }}
                >
                  <RefreshCw className="w-5 h-5 mr-2" /> Wrong
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-950/10 border border-green-900/50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase text-green-500/50 font-bold">Lens Calibration</span>
                <p className="text-white font-mono text-xs">A-67 Optical Filter [ACTIVE]</p>
              </div>
              <div className="p-4 bg-green-950/10 border border-green-900/50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase text-green-500/50 font-bold">Forensic Node</span>
                <p className="text-white font-mono text-xs">GEMINI-FLASH-1.5</p>
              </div>
              <div className="p-4 bg-green-950/10 border border-green-900/50 rounded-lg space-y-1">
                <span className="text-[10px] uppercase text-green-500/50 font-bold">Data Encryption</span>
                <p className="text-white font-mono text-xs">AES-256 BIT ROTATION</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Forensics Report */}
        <div className="flex-1 flex flex-col bg-black/40 border-l border-green-900/50">
          <div className="p-6 border-b border-green-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Microscope className="w-6 h-6 text-[#D4AF37]" />
              <h2 className="text-xl font-black uppercase italic tracking-widest text-white">
                {!imgSrc && !isAnalyzing ? "Input Serial Number" : "Forensics Report"}
              </h2>
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                <span className="text-[10px] font-mono text-[#D4AF37]">DECODING...</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!report && !isAnalyzing && !error && (
              <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-full space-y-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-[#D4AF37] rounded-none blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <input 
                      type="text" 
                      value={manualInputSerial}
                      onChange={(e) => setManualInputSerial(e.target.value.toUpperCase())}
                      placeholder="SERIAL NUMBER..."
                      className="relative w-full h-12 bg-black border-2 border-green-900 px-4 text-xl font-black text-white placeholder:text-red-500 focus:outline-none focus:border-red-500 uppercase tracking-[0.2em]"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-[#D4AF37] rounded-none blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <input 
                      type="text" 
                      value={manualInputSeries}
                      onChange={(e) => setManualInputSeries(e.target.value.toUpperCase())}
                      placeholder="SERIES YEAR (E.G. 2017)..."
                      className="relative w-full h-12 bg-black border-2 border-green-900 px-4 text-xl font-black text-white placeholder:text-red-500 focus:outline-none focus:border-red-500 uppercase tracking-[0.2em]"
                    />
                  </div>
                  <Button 
                    className="w-full h-12 bg-[#D4AF37] hover:bg-[#c5a059] text-black font-black uppercase text-lg shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    disabled={!manualInputSerial.trim() || !manualInputSeries.trim() || isAnalyzing}
                    onClick={handleManualSubmit}
                  >
                    Enter
                  </Button>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4 animate-pulse">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-10 bg-green-900/10 border-b border-green-900/20" />
                ))}
              </div>
            )}

            {error && (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 text-red-500">
                <AlertTriangle className="w-16 h-16 animate-bounce" />
                <h3 className="text-2xl font-black uppercase italic">System Interruption</h3>
                <p className="text-xs font-mono uppercase tracking-widest">{error}</p>
                <Button variant="outline" className="border-red-500 text-red-500" onClick={() => analyzeImage(imgSrc!)}>
                  Retry Handshake
                </Button>
              </div>
            )}

            {report && (
              <div className="space-y-0.5">
                {!report.isOneDollarBill ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 border-4 border-red-500 bg-red-950/20 rounded-xl text-center space-y-6"
                  >
                    <AlertTriangle className="w-20 h-20 text-red-500 mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black text-red-500 uppercase italic tracking-tighter">Wrong Denomination</h3>
                      <p className="text-sm font-mono text-red-400 uppercase tracking-widest">{report.reasoning || "NOT A VALID US $1 BILL SPECIMEN"}</p>
                    </div>
                    <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => { setImgSrc(null); setReport(null); }}>
                      SCAN AGAIN
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-1">
                    <div className="bg-green-500/10 p-4 border-b-2 border-green-500 mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-green-400">Security Clearance</p>
                        <p className="text-xl font-black text-white italic uppercase">Authenticated $1 Bill</p>
                      </div>
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    
                    {renderReportItem("Serial Number", report.serialNumber, "serialNumber")}
                    {renderReportItem("Series Year", report.seriesYear, "seriesYear")}
                    {renderReportItem("Federal Reserve Bank", report.bank, "bank")}
                    {renderReportItem("District", report.district, "district")}
                    {renderReportItem("Design Year", report.designYear, "designYear")}
                    {renderReportItem("Plate Coordinate", report.coordinate, "coordinate")}
                    {renderReportItem("Facility", report.facility, "facility")}
                    {renderReportItem("Suffix", report.suffix, "suffix")}
                    {renderReportItem("U.S. Treasurer", report.treasurer, "treasurer")}
                    {renderReportItem("Secretary of Treasury", report.secretary, "secretary")}
                    {renderReportItem("Face Plate #", report.facePlate, "facePlate")}
                    {renderReportItem("Back Plate #", report.backPlate, "backPlate")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedHint && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-black/80"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg bg-[#0a110a] border-2 border-red-500/50 p-8 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <div className="flex items-center gap-4 text-red-500">
                <Info className="w-8 h-8" />
                <h3 className="text-2xl font-black uppercase italic italic">HINT: {selectedHint.field}</h3>
              </div>
              <p className="text-lg text-white font-serif leading-relaxed">
                {selectedHint.hint}
              </p>
              <Button 
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12"
                onClick={() => setSelectedHint(null)}
              >
                PROCEED WITH OBSERVATION
              </Button>
            </motion.div>
          </motion.div>
        )}

        {showSpecimen && imgSrc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black flex items-center justify-center p-4 md:p-20"
          >
            <div className="relative w-full h-full flex flex-col space-y-4">
              <ScanlineOverlay />
              <div className="absolute top-10 left-10 z-20 flex gap-4">
                <div className="px-4 py-2 bg-black/80 border-2 border-[#D4AF37] text-[#D4AF37] font-black uppercase tracking-widest flex items-center gap-2">
                  <Eye className="w-5 h-5" /> Bill Analysis View
                </div>
              </div>
              <div className="flex-1 bg-zinc-900 border-4 border-green-900/50 relative overflow-hidden flex items-center justify-center">
                <img src={imgSrc} className="max-w-full max-h-full object-contain contrast-125" />
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-red-500/20" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[2px] bg-red-500/20" />
              </div>
              <Button 
                variant="outline" 
                className="self-center h-16 px-12 border-2 border-green-500 text-green-500 text-xl font-black uppercase italic tracking-widest hover:bg-green-500 hover:text-black"
                onClick={() => setShowSpecimen(false)}
              >
                CLOSE BILL
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

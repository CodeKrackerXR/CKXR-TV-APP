import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Upload, 
  RotateCw, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  Box,
  Image as ImageIcon,
  CheckCircle,
  Eye,
  ZoomIn,
  ZoomOut,
  FileText,
  Save
} from 'lucide-react';

interface AtlasCubePageProps {
  onBack: () => void;
}

interface CubeFace {
  id: number;
  name: string;
  roman: string;
  image: string | null; // URL or base64
  rotation: number;     // Degrees (0, 90, 180, 270)
}

const INITIAL_FACES: CubeFace[] = [
  { id: 1, name: 'Front', roman: 'I', image: null, rotation: 0 },
  { id: 2, name: 'Back', roman: 'II', image: null, rotation: 0 },
  { id: 3, name: 'Left', roman: 'III', image: null, rotation: 0 },
  { id: 4, name: 'Right', roman: 'IV', image: null, rotation: 0 },
  { id: 5, name: 'Top', roman: 'V', image: null, rotation: 0 },
  { id: 6, name: 'Bottom', roman: 'VI', image: null, rotation: 0 },
];

export const AtlasCubePage: React.FC<AtlasCubePageProps> = ({ onBack }) => {
  const [faces, setFaces] = useState<CubeFace[]>(INITIAL_FACES);
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 3D Rotation angles
  const [rotationX, setRotationX] = useState(-15);
  const [rotationY, setRotationY] = useState(45);
  const [isDragging, setIsDragging] = useState(false);

  // Notes state
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Zoom control states & touch refs
  const [zoom, setZoom] = useState(1.0);
  const startTouchDistance = useRef<number | null>(null);
  const startZoom = useRef<number>(1.0);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const dragStart = useRef({ x: 0, y: 0 });
  const startRotation = useRef({ x: 0, y: 0 });

  // Native Wheel hook for trackpad pinch/scroll
  useEffect(() => {
    const el = viewerContainerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = e.ctrlKey ? 0.02 : 0.002;
      const newZoom = zoom - e.deltaY * zoomSpeed;
      setZoom(Math.min(Math.max(newZoom, 0.4), 3.0));
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [zoom]);

  // Load saved state from localStorage if available
  useEffect(() => {
    const savedFaces = localStorage.getItem('atlas_cube_faces');
    if (savedFaces) {
      try {
        const parsed = JSON.parse(savedFaces);
        if (Array.isArray(parsed) && parsed.length === 6) {
          // Verify exact face IDs to prevent version mismatches
          setFaces(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved cube faces', e);
      }
    }
    
    // Also load saved notes
    const savedNotes = localStorage.getItem('atlas_cube_notes');
    if (savedNotes) {
      setNotesText(savedNotes);
    }
  }, []);

  const handleSaveNotes = (text: string) => {
    setNotesText(text);
    localStorage.setItem('atlas_cube_notes', text);
    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2000);
  };

  // Sync state to localStorage with base64 images if not too large
  const saveCubeState = (updatedFaces: CubeFace[]) => {
    setFaces(updatedFaces);
    try {
      localStorage.setItem('atlas_cube_faces', JSON.stringify(updatedFaces));
    } catch (e) {
      console.warn('LocalStorage save failed (possible size quota exceed)', e);
    }
  };

  // Upload handlers
  const handleImageUpload = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const updated = faces.map((f, idx) => idx === index ? { ...f, image: dataUrl } : f);
      saveCubeState(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRotation = (index: number, direction: 'cw' | 'ccw') => {
    const updated = faces.map((f, idx) => {
      if (idx === index) {
        const delta = direction === 'cw' ? 90 : -90;
        let nextRot = (f.rotation + delta) % 360;
        if (nextRot < 0) nextRot += 360;
        return { ...f, rotation: nextRot };
      }
      return f;
    });
    saveCubeState(updated);
  };

  const removeImage = (index: number) => {
    const updated = faces.map((f, idx) => idx === index ? { ...f, image: null, rotation: 0 } : f);
    saveCubeState(updated);
  };

  const resetAll = () => {
    if (confirm("Are you sure you want to reset all 6 faces?")) {
      setFaces(INITIAL_FACES);
      localStorage.removeItem('atlas_cube_faces');
    }
  };

  // Drag-and-drop file support
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const onDragLeave = () => {
    setDragOverIndex(null);
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(index, e.dataTransfer.files[0]);
    }
  };

  // Manual gesture dragging to spin the cube
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    startRotation.current = { x: rotationX, y: rotationY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // Rotation mapping (Sensitivity)
    setRotationX(startRotation.current.x - dy * 0.5);
    setRotationY(startRotation.current.y + dx * 0.5);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      startTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
      startZoom.current = zoom;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startRotation.current = { x: rotationX, y: rotationY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && startTouchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = currentDist / startTouchDistance.current;
      setZoom(Math.min(Math.max(startZoom.current * ratio, 0.4), 3.0));
    } else if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setRotationX(startRotation.current.x - dy * 0.6);
      setRotationY(startRotation.current.y + dx * 0.6);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    startTouchDistance.current = null;
  };

  // Arrow rotational controls (exact 90-degree steps)
  const shiftRotation = (direction: 'up' | 'down' | 'left' | 'right') => {
    switch (direction) {
      case 'left':
        setRotationY(prev => prev - 90);
        break;
      case 'right':
        setRotationY(prev => prev + 90);
        break;
      case 'up':
        setRotationX(prev => prev - 90);
        break;
      case 'down':
        setRotationX(prev => prev + 90);
        break;
    }
  };

  // CSS variables or sizes
  const cubeSize = isViewerMode ? 400 : 220; // Size of the cube
  const offsetDistance = cubeSize / 2;

  // Render a futuristic technical placeholder when no texture is present
  const renderPlaceholder = (face: CubeFace) => {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center border border-[#D4AF37]/40 text-center select-none overflow-hidden group-hover:border-[#D4AF37] transition-all">
        {/* Futuristic Grid Layer */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* Circles & Reticle lines */}
        <div className="absolute w-2/3 h-2/3 border border-[#D4AF37]/10 rounded-full flex items-center justify-center">
          <div className="w-4/5 h-4/5 border border-dashed border-[#D4AF37]/20 rounded-full animate-spin [animation-duration:40s]" />
        </div>
        
        <div className="absolute w-full h-[1px] bg-[#D4AF37]/5 top-1/2 left-0 transform -translate-y-1/2" />
        <div className="absolute h-full w-[1px] bg-[#D4AF37]/5 left-1/2 top-0 transform -translate-x-1/2" />

        {/* Outer Corner Tech Accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]/30" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]/30" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]/30" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]/30" />

        {/* Content */}
        <span className="text-4xl font-serif font-bold text-[#D4AF37]/60 select-none tracking-widest">{face.roman}</span>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]/40 mt-1">{face.name}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans p-4 md:p-8 flex flex-col justify-between select-none relative overflow-x-hidden">
      
      {/* Dynamic Background subtle ambient dust */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)] pointer-events-none" />

      {/* Header Panel */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6 mb-8 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-zinc-900 border border-white/10 hover:border-[#D4AF37] text-white/70 hover:text-white rounded-xl transition-all hover:scale-105 active:scale-95"
            id="back-to-info-menu-btn"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-[0.15em] text-[#D4AF37] flex items-center gap-2">
              <Box className="w-6 h-6 animate-pulse" />
              Atlas Cube
            </h1>
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              Compile & Project Custom 3D Cipher Geometry
            </p>
          </div>
        </div>

        {/* Controls block */}
        <div className="flex bg-black/40 border border-white/15 rounded-2xl p-1.5 shadow-lg">
          <button
            onClick={() => setIsViewerMode(false)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${!isViewerMode ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15' : 'text-zinc-400 hover:text-white'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            Config Faces
          </button>
          <button
            onClick={() => setIsViewerMode(true)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isViewerMode ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15' : 'text-zinc-400 hover:text-white'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            3D Viewer
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch z-10">
        
        {/* Left Interactive Control Box or Side list */}
        <AnimatePresence mode="wait">
          {!isViewerMode && (
            <motion.div 
              key="editor-pane"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:col-span-12 xl:col-span-7 space-y-6 flex flex-col justify-start"
            >
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex-1 flex flex-col justify-start">
                <div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                    <h2 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">
                      <Sparkles className="m-0 text-[#D4AF37] w-4 h-4" />
                      Configure 6-Sided Layout
                    </h2>
                    <button 
                      onClick={resetAll}
                      className="text-xs font-mono text-zinc-500 hover:text-red-500 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-black/20 border border-white/5 hover:border-red-500/20 rounded-xl"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Clear All
                    </button>
                  </div>

                  {/* 6 Grid items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {faces.map((f, idx) => (
                      <div 
                        key={f.id} 
                        className={`bg-zinc-950/80 border rounded-2xl p-4 flex flex-col items-stretch justify-between relative transition-all group ${
                          dragOverIndex === idx ? 'border-[#D4AF37]/80 bg-zinc-900 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-white/5 hover:border-white/10'
                        }`}
                        onDragOver={(e) => onDragOver(e, idx)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, idx)}
                      >
                        {/* Header of Item card */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            Face {f.id} • <span className="text-[#D4AF37] font-bold">{f.name}</span>
                          </span>
                          {f.image && (
                            <button 
                              onClick={() => removeImage(idx)} 
                              className="text-[10px] font-mono text-zinc-500 hover:text-red-500 transition-colors uppercase tracking-widest"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        {/* Drop Preview Area */}
                        <div className="aspect-square w-full rounded-xl overflow-hidden bg-black relative border border-white/5 shadow-inner mb-3 group-hover:border-white/10 transition-all">
                          {f.image ? (
                            <div className="w-full h-full p-2 flex items-center justify-center">
                              <img 
                                src={f.image} 
                                alt={f.name} 
                                className="max-w-full max-h-full object-contain transition-transform duration-300 shadow-md"
                                style={{ transform: `rotate(${f.rotation}deg)` }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.01] transition-all group/label">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleImageUpload(idx, e.target.files[0]);
                                  }
                                }}
                                className="hidden"
                              />
                              <Upload className="w-8 h-8 text-zinc-600 group-hover/label:text-[#D4AF37] group-hover/label:scale-110 transition-all duration-300" />
                              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mt-2 group-hover/label:text-white">Upload / Drop</span>
                            </label>
                          )}

                          {/* Roman overlay designation */}
                          {!f.image && (
                            <div className="absolute top-2 right-3 font-serif font-black text-white/5 text-4xl pointer-events-none">
                              {f.roman}
                            </div>
                          )}
                        </div>

                        {/* Interactive Rotation Bar */}
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleRotation(idx, 'ccw')}
                            disabled={!f.image}
                            className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center gap-1 transition-all text-[10px] uppercase font-bold tracking-widest ${
                              f.image 
                                ? 'bg-black/30 text-white/70 hover:text-[#D4AF37] border-white/5 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5' 
                                : 'bg-transparent text-zinc-700 border-zinc-950 cursor-not-allowed'
                            }`}
                            title="Rotate 90° CCW"
                          >
                            <RotateCcw className="w-3 h-3" />
                            ↺ Rotate
                          </button>
                          
                          <button
                            onClick={() => handleRotation(idx, 'cw')}
                            disabled={!f.image}
                            className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center gap-1 transition-all text-[10px] uppercase font-bold tracking-widest ${
                              f.image 
                                ? 'bg-black/30 text-white/70 hover:text-[#D4AF37] border-white/5 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5' 
                                : 'bg-transparent text-zinc-700 border-zinc-950 cursor-not-allowed'
                            }`}
                            title="Rotate 90° CW"
                          >
                            <RotateCw className="w-3 h-3" />
                            Rotate ↻
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Big Placer Launch button */}
                <div className="mt-4 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setIsViewerMode(true)}
                    className="w-full bg-[#D4AF37] text-black font-black text-base uppercase tracking-[0.25em] py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] flex items-center justify-center gap-3 hover:bg-[#ffe281]"
                  >
                    <CheckCircle className="w-5 h-5 text-black" />
                    Place Images on Cube
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right 3D Cube Projector Screen (Stays or grows) */}
        <div className={`transition-all duration-500 ease-in-out flex flex-col items-center justify-center ${
          isViewerMode ? 'lg:col-span-12 xl:col-span-12' : 'lg:col-span-12 xl:col-span-5'
        }`}>
          
          <div ref={viewerContainerRef}
               className={`w-full bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-3xl backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ease-in-out ${
                 isViewerMode ? 'min-h-[750px] lg:min-h-[85vh]' : 'min-h-[550px]'
               }`}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onMouseMove={handleMouseMove}
               onTouchEnd={handleTouchEnd}>
            
            {/* Perspective Shield / Grid Plate */}
            <div className="text-center absolute top-6 left-6 z-10 pointer-events-none">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                Virtual Environment
              </span>
              <span className="text-xs font-black text-white/50 uppercase tracking-widest">
                {isViewerMode ? 'Primary Focused Core' : 'Live Projection'}
              </span>
            </div>

            {/* Notes Button in the UPPER RIGHT corner & Instruction Text */}
            <div className="absolute top-6 right-6 z-25 flex items-center gap-4 select-none">
              <div className="hidden md:flex flex-col text-right justify-center pointer-events-none">
                <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.12em] select-none">
                  Drag on Cube to Rotate Manually
                </div>
                <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest select-none">
                  X: {Math.round(rotationX)}° / Y: {Math.round(rotationY)}°
                </div>
              </div>

              <button
                onClick={() => setIsNotesOpen(true)}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#ffe281] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 shadow-[#D4AF37]/15 hover:scale-105"
                title="Open Notes Notepad"
                id="open-notes-panel-btn"
              >
                <FileText className="w-3.5 h-3.5 text-black" />
                Notes
              </button>
            </div>

            {/* CSS 3D Cube View Box */}
            <div 
              className="flex items-center justify-center cursor-grab active:cursor-grabbing w-full flex-1"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ perspective: '1100px' }}
            >
              {/* Outer rotated bounding node */}
              <div 
                className="relative"
                style={{ 
                  width: `${cubeSize}px`, 
                  height: `${cubeSize}px`,
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale3d(${zoom}, ${zoom}, ${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.1, 0.8, 0.2, 1)'
                }}
              >
                {/* Six Faces rendered strictly outwards */}
                {faces.map((f, index) => {
                  // Standard mapping parameters
                  let faceTransform = '';
                  switch (index) {
                    case 0: // Front
                      faceTransform = `rotateY(0deg) translateZ(${offsetDistance}px)`;
                      break;
                    case 1: // Back
                      faceTransform = `rotateY(180deg) translateZ(${offsetDistance}px)`;
                      break;
                    case 2: // Left
                      faceTransform = `rotateY(-90deg) translateZ(${offsetDistance}px)`;
                      break;
                    case 3: // Right
                      faceTransform = `rotateY(90deg) translateZ(${offsetDistance}px)`;
                      break;
                    case 4: // Top
                      faceTransform = `rotateX(90deg) translateZ(${offsetDistance}px)`;
                      break;
                    case 5: // Bottom
                      faceTransform = `rotateX(-90deg) translateZ(${offsetDistance}px)`;
                      break;
                  }

                  return (
                    <div
                      key={f.id}
                      className="absolute inset-0 bg-zinc-950 select-none overflow-hidden"
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: faceTransform,
                        backfaceVisibility: 'visible',
                        WebkitBackfaceVisibility: 'visible'
                      }}
                    >
                      {f.image ? (
                        <div className="w-full h-full relative border border-[#D4AF37]/50 flex items-center justify-center bg-black">
                          {/* Inner glowing edge highlight */}
                          <div className="absolute inset-0 border-2 border-white/5 pointer-events-none" />
                          <img
                            src={f.image}
                            alt={f.name}
                            className="w-full h-full object-cover select-none pointer-events-none"
                            style={{ transform: `rotate(${f.rotation}deg)` }}
                            referrerPolicy="no-referrer"
                          />
                          {/* Face Info tag */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 border border-white/10 rounded-md">
                            <span className="text-[9px] font-mono text-white/80 font-bold tracking-widest uppercase">{f.roman}</span>
                          </div>
                        </div>
                      ) : (
                        renderPlaceholder(f)
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D-Pad controls in the UPPER LEFT corner absolutely positioned */}
            <div className="absolute top-24 left-6 z-20 select-none">
              <div className="relative flex flex-col items-center w-32 h-32 scale-[0.85] origin-top-left">
                <div className="absolute top-0 flex justify-center">
                  <button
                    onClick={() => shiftRotation('up')}
                    className="p-2 bg-zinc-950/90 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 rounded-xl transition-all shadow-md active:scale-90"
                    title="Rotate Up"
                  >
                    <ArrowUp className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>

                <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                  <button
                    onClick={() => shiftRotation('left')}
                    className="p-2 bg-zinc-950/90 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 rounded-xl transition-all shadow-md active:scale-90"
                    title="Rotate Left"
                  >
                    <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>

                {/* Central Status Core Button */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <button
                    onClick={() => {
                      setRotationX(-15);
                      setRotationY(45);
                    }}
                    className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-[#D4AF37]/10 border border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] flex items-center justify-center transition-all group active:scale-95"
                    title="Reset Vista"
                  >
                    <span className="text-[8px] font-black text-[#D4AF37] tracking-tighter uppercase group-hover:scale-110 transition-transform">RST</span>
                  </button>
                </div>

                <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                  <button
                    onClick={() => shiftRotation('right')}
                    className="p-2 bg-zinc-950/90 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 rounded-xl transition-all shadow-md active:scale-90"
                    title="Rotate Right"
                  >
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>

                <div className="absolute bottom-0 flex justify-center">
                  <button
                    onClick={() => shiftRotation('down')}
                    className="p-2 bg-zinc-950/90 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 rounded-xl transition-all shadow-md active:scale-90"
                    title="Rotate Down"
                  >
                    <ArrowDown className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Zoom Slider in the middle right edge absolutely positioned and vertical */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 select-none flex flex-col items-center gap-2 bg-zinc-950/90 border border-white/15 rounded-2xl py-4.5 px-3 shadow-xl backdrop-blur-md">
              <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 select-none mb-1">ZOOM</span>
              
              <button 
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 3.0))}
                className="p-1 hover:text-[#D4AF37] text-white/45 hover:bg-white/5 rounded-lg transition-all active:scale-95"
                title="Zoom In (+)"
                id="atlas-cube-zoom-in"
              >
                <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
              </button>

              <div className="h-32 flex items-center justify-center py-1">
                <input 
                  type="range"
                  min="0.4"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="accent-[#D4AF37] cursor-ns-resize h-full w-2 appearance-none rounded-lg bg-zinc-800"
                  style={{
                    WebkitAppearance: 'slider-vertical',
                    writingMode: 'vertical-lr',
                  }}
                  id="atlas-cube-zoom-slider"
                />
              </div>

              <button 
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))}
                className="p-1 hover:text-[#D4AF37] text-white/45 hover:bg-white/5 rounded-lg transition-all active:scale-95"
                title="Zoom Out (-)"
                id="atlas-cube-zoom-out"
              >
                <ZoomOut className="w-4 h-4 text-zinc-400" />
              </button>

              <span className="text-[9px] font-mono text-zinc-400 font-bold select-none mt-1">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Sub-toggle link to modify textures, absolutely positioned at lower left */}
            {isViewerMode && (
              <button
                onClick={() => setIsViewerMode(false)}
                className="absolute bottom-6 left-6 text-[10px] font-mono text-zinc-500 hover:text-white transition-all uppercase tracking-[0.15em] flex items-center gap-1.5 border border-white/5 hover:border-[#D4AF37]/30 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm z-20 hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-3 h-3 animate-spin [animation-duration:8s] text-[#D4AF37]" />
                Modify Textures
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Notes Overlay Modal */}
      <AnimatePresence>
        {isNotesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-3xl flex flex-col relative"
              style={{ minHeight: '520px' }}
            >
              {/* Tech Corner Grids */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/40 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]/40 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]/40 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/40 pointer-events-none" />

              {/* Close Button / Back button that takes you back to the cube rotation */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                    <FileText className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase text-white tracking-[0.1em] flex items-center gap-2">
                      Notes Notepad
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      Write down coordinates, details, or notes
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsNotesOpen(false)}
                  className="px-4 py-2 bg-zinc-900 border border-white/10 hover:border-[#D4AF37] text-white/85 hover:text-white rounded-xl transition-all hover:scale-105 active:scale-95 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5"
                  id="notes-back-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              </div>

              {/* Content / Textarea of Notepad */}
              <div className="flex-1 flex flex-col mt-2">
                <textarea
                  value={notesText}
                  onChange={(e) => handleSaveNotes(e.target.value)}
                  placeholder="Type notes here... Your notes are automatically saved to locally-stored cache."
                  className="flex-1 w-full min-h-[280px] bg-zinc-900/40 border border-white/5 rounded-2xl p-4 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4AF37]/50 resize-none select-text"
                  id="notes-textarea"
                />
              </div>

              {/* Bottom bar with status & manual save state */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  Auto-Save Active
                </div>
                
                <div className="flex items-center gap-3">
                  {isSavedNotify && (
                    <motion.span 
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider font-bold"
                    >
                      Saved to cache
                    </motion.span>
                  )}
                  <button
                    onClick={() => handleSaveNotes(notesText)}
                    className="px-5 py-2 bg-[#D4AF37] hover:bg-[#ffe281] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    id="save-notes-btn"
                  >
                    <Save className="w-3.5 h-3.5 text-black" />
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

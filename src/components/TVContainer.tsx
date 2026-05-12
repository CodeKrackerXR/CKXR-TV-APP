import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TVContainerProps {
  children: React.ReactNode;
  backgroundImage?: string;
  onLogoClick?: () => void;
  showLogo?: boolean;
}

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-10 right-10 z-20 text-3xl font-light text-zinc-400">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
};

export const TVContainer: React.FC<TVContainerProps> = ({ children, backgroundImage, onLogoClick, showLogo = true }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0c10] text-white font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-100"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1f2b 0%, #0a0c10 100%)',
        }}
      />
      
      {backgroundImage && (
        <div 
          className="absolute inset-0 z-0 opacity-10 scale-105"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {showLogo && (
        <button 
          onClick={onLogoClick}
          className="absolute top-[60px] left-[60px] z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform cursor-pointer outline-none flex items-center gap-2"
        >
          <img 
            src="https://i.ibb.co/kgXgqkGB/CKXRLogo-Hor-Z.png" 
            alt="CKXR Logo" 
            className="h-12 w-auto object-contain" 
          />
        </button>
      )}

      <Clock />

      {/* Content Layer with Safe Zone */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full h-full p-[5%] flex flex-col"
      >
        {children}
      </motion.main>
    </div>
  );
};

import React from 'react';

interface VaultButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const VaultButton: React.FC<VaultButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-8 py-3 font-black uppercase tracking-widest transition-all duration-300 rounded-xl border-2 active:scale-95";
  const variants = {
    primary: "bg-[#D4AF37] text-black border-[#D4AF37] hover:bg-white hover:border-white",
    secondary: "bg-transparent text-white border-white/20 hover:border-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

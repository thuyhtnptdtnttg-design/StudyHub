import React from 'react';

// Hand-drawn button style
export const ComicButton = ({ onClick, children, className = '', variant = 'primary', disabled = false }: { onClick?: () => void, children?: React.ReactNode, className?: string, variant?: 'primary' | 'secondary' | 'danger', disabled?: boolean }) => {
  const baseStyle = "font-hand font-bold text-lg px-6 py-2 rounded-xl border-2 border-black transition-all transform duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-accent-blue text-black shadow-comic hover:shadow-comic-hover hover:-translate-y-1 active:shadow-comic-active",
    secondary: "bg-white text-black shadow-comic hover:shadow-comic-hover hover:-translate-y-1 active:shadow-comic-active",
    danger: "bg-accent-pink text-black shadow-comic hover:shadow-comic-hover hover:-translate-y-1 active:shadow-comic-active",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const ComicCard = ({ children, className = '', color = 'bg-white' }: { children?: React.ReactNode, className?: string, color?: string }) => {
  return (
    <div className={`${color} border-2 border-black rounded-2xl p-6 shadow-comic transition-all hover:shadow-comic-hover hover:-translate-y-0.5 ${className}`}>
      {children}
    </div>
  );
};

export const ComicInput = ({ value, onChange, placeholder, className = '' }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, className?: string }) => {
  return (
    <input 
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`font-hand text-xl w-full p-4 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-accent-yellow focus:-translate-y-1 transition-all shadow-sm ${className}`}
    />
  );
};

export const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black border-r-4 border-t-4 border-transparent"></div>
    </div>
);
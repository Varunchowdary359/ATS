import React, { useState } from 'react';
import englishLogo from '../assets/pw_logo.png';

export default function Logo({ className = "w-[120px] lg:w-[180px]", collapsed = false }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    if (collapsed) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand text-white font-bold text-base shadow-sm">
          PW
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-2 font-black tracking-tight text-brand dark:text-sky-400 select-none ${className}`}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand text-white font-extrabold text-sm shadow-sm shrink-0">
          PW
        </div>
        <span className="text-xl font-extrabold text-slate-800 dark:text-white">PeopleWorks</span>
      </div>
    );
  }

  return (
    <img 
      src={englishLogo} 
      alt="PeopleWorks Logo" 
      onError={() => setImgError(true)}
      className={`object-contain h-auto ${className}`} 
    />
  );
}


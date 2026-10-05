import React, { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import { translations } from '../constants';

const Footer = () => {
  const { activeLang } = useContext(ThemeContext);
  const t = translations[activeLang] || translations['English'];

  return (
    <footer className="w-full bg-[#1e293b] shrink-0 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 md:px-12 py-2.5 sm:py-3 z-50 text-[10px] sm:text-xs text-slate-400 font-medium relative font-cairo gap-2 sm:gap-6">
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-6 text-center">
        <a href="#" className="hover:text-white transition-colors">{t.privacy_policy || 'Privacy Policy'}</a>
        <a href="#" className="hover:text-white transition-colors">{t.terms_of_use || 'Terms of Use'}</a>
      </div>
      
      <div className="flex items-center text-center">
        {activeLang === 'Arabic' ? (
          <span>{t.footer_copyright}</span>
        ) : (
          <div className="flex items-center gap-2">
            <span>{t.footer_copyright}</span>
            <div dir="ltr" className="flex items-center hidden sm:flex">
              <span className="text-[#0ea5e9] font-semibold text-sm">people</span>
              <span className="text-[#84cc16] font-semibold text-sm">works&trade;</span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;

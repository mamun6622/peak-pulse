import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEME_OPTIONS, ThemePalette } from '../contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Palette Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-slate-100 transition-all cursor-pointer shadow-sm"
        title="Switch cool color palette"
        aria-label="Color Palette Switcher"
      >
        <span
          className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
          style={{ backgroundColor: currentTheme.primaryColor }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline font-sans">{currentTheme.name}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Cool Color Palette
            </span>
            <span className="text-[10px] text-accent font-mono font-medium">
              {THEME_OPTIONS.length} Cool Palettes
            </span>
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = opt.id === theme;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 text-slate-100 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-slate-700/50"
                      style={{ backgroundColor: opt.primaryColor }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-200">{opt.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {opt.koreanName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5 shrink-0 ml-1"
                      style={{ color: opt.primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

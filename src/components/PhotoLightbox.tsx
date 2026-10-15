import React, { useEffect } from 'react';
import { X, Calendar, Mountain, Download } from 'lucide-react';
import { PhotoItem } from '../types/activity';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  title: string;
  subtitle: string;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  title,
  subtitle,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center">
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between pb-3 text-stone-300">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-100">{title}</h3>
            <p className="text-xs text-stone-400 font-mono">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white bg-stone-900 border border-stone-800 rounded-xl transition-colors focus:outline-none"
            aria-label="Close photo preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Container */}
        <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
          <img
            src={photo.url}
            alt={photo.caption || title}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Caption */}
        {photo.caption && (
          <div className="mt-3 text-center text-xs sm:text-sm text-stone-300 max-w-2xl px-4 py-2 bg-stone-900/80 rounded-xl border border-stone-800">
            {photo.caption}
          </div>
        )}
      </div>
    </div>
  );
};

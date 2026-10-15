import React, { useState, useMemo } from 'react';
import { Camera, Filter, Mountain, Calendar } from 'lucide-react';
import { Activity, SummitLog, RunningLog, PhotoItem } from '../types/activity';

interface PhotoArchiveGalleryProps {
  activities: Activity[];
  onSelectPhoto: (photo: PhotoItem, title: string, subtitle: string) => void;
}

interface GalleryItem {
  photo: PhotoItem;
  activityTitle: string;
  mountainName?: string;
  summitNumber?: number;
  date: string;
  activityType: 'summit' | 'running';
}

export const PhotoArchiveGallery: React.FC<PhotoArchiveGalleryProps> = ({
  activities,
  onSelectPhoto,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Aggregate all photos
  const allGalleryItems: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];
    activities.forEach((act) => {
      const isSummit = act.activityType === 'summit';
      const summit = isSummit ? (act as SummitLog) : null;
      const run = !isSummit ? (act as RunningLog) : null;

      act.photos?.forEach((photo) => {
        items.push({
          photo,
          activityTitle: isSummit ? `${summit?.mountainName} Summit #${summit?.summitNumber}` : run?.title || 'Run',
          mountainName: summit?.mountainName,
          summitNumber: summit?.summitNumber,
          date: act.date,
          activityType: act.activityType,
        });
      });
    });
    return items;
  }, [activities]);

  // Extract filter categories
  const filterOptions = useMemo(() => {
    const mountains = new Set<string>();
    allGalleryItems.forEach((item) => {
      if (item.mountainName) mountains.add(item.mountainName);
    });
    return ['all', ...Array.from(mountains), 'running'];
  }, [allGalleryItems]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') return allGalleryItems;
    if (selectedFilter === 'running') return allGalleryItems.filter((i) => i.activityType === 'running');
    return allGalleryItems.filter((i) => i.mountainName === selectedFilter);
  }, [allGalleryItems, selectedFilter]);

  return (
    <section className="py-12 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>Visual Summit & Running Gallery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
              Photo Archive Across Korea's Trails
            </h2>
            <p className="text-stone-400 text-sm mt-1 max-w-2xl">
              High-resolution summit captures, sunrise vistas, ridge rock markers, and scenic trail snapshots. Click any image for full-screen inspection.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto text-xs">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedFilter(opt)}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap capitalize ${
                  selectedFilter === opt
                    ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {opt === 'all' ? `All (${allGalleryItems.length})` : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry / Bento Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/40 border border-stone-800 rounded-2xl p-8 text-stone-400">
            No photos found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item, idx) => (
              <div
                key={item.photo.id || idx}
                onClick={() => onSelectPhoto(item.photo, item.activityTitle, item.date)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 cursor-pointer hover:border-amber-400/60 transition-all duration-300"
              >
                <img
                  src={item.photo.url}
                  alt={item.photo.caption || item.activityTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                {/* Top Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-950/80 backdrop-blur-sm text-amber-300 border border-stone-800">
                    {item.summitNumber ? `Summit #${item.summitNumber}` : 'Running'}
                  </span>
                </div>

                {/* Bottom Details */}
                <div className="absolute bottom-2.5 inset-x-2.5 text-left">
                  <div className="text-xs font-bold text-stone-100 group-hover:text-amber-300 transition-colors truncate">
                    {item.activityTitle}
                  </div>
                  <div className="text-[11px] text-stone-400 truncate">
                    {item.photo.caption || item.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

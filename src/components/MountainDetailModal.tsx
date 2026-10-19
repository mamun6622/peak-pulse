import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Camera, Clock, Route, Compass, Plus, Mountain, ChevronRight, Layers, Edit, Trash2, Star } from 'lucide-react';
import { MountainSummary, SummitLog, PhotoItem } from '../types/activity';

interface MountainDetailModalProps {
  mountain: MountainSummary;
  isAdmin: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: PhotoItem, title: string, subtitle: string) => void;
  onLogNextSummit: (mountain: MountainSummary) => void;
  onEditSummit?: (summit: SummitLog) => void;
  onDeleteSummit?: (id: string) => void;
  onSetCoverPhoto?: (photoId: string, summitId: string) => void;
}

export const MountainDetailModal: React.FC<MountainDetailModalProps> = ({
  mountain,
  isAdmin,
  onClose,
  onSelectPhoto,
  onLogNextSummit,
  onEditSummit,
  onDeleteSummit,
  onSetCoverPhoto,
}) => {
  const [activeTab, setActiveTab] = useState<'summits' | 'photos' | 'routes'>('summits');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Collect all photos from all summits
  const allPhotos: Array<{ photo: PhotoItem; summit: SummitLog }> = [];
  mountain.summits.forEach((summit) => {
    summit.photos?.forEach((photo) => {
      allPhotos.push({ photo, summit });
    });
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mountain-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-accent mb-1">
              <span>{mountain.region}</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>{mountain.elevationM}m Elevation</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>{mountain.totalSummits} Summits Bagged</span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 id="mountain-modal-title" className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                {mountain.mountainName}
              </h2>
              {mountain.koreanName && (
                <span className="text-slate-400 text-lg font-medium">{mountain.koreanName}</span>
              )}
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              {mountain.peakName} · Total Vertical Gained: <strong className="text-slate-200 font-mono">{mountain.totalElevationGainedM.toLocaleString()}m</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => onLogNextSummit(mountain)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-accent hover:bg-accent-hover rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Summit #{mountain.totalSummits + 1}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('summits')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'summits'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All {mountain.totalSummits} Ascents
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 border-b-2 transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'photos'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Photo Archive</span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {allPhotos.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'routes'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Routes & Statistics
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Summit Timeline */}
          {activeTab === 'summits' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 mb-2">
                Chronological ascent history from most recent to initial summit:
              </div>

              {mountain.summits.map((summit) => (
                <div
                  key={summit.id}
                  className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-accent-subtle text-accent border border-accent-border">
                        Summit #{summit.summitNumber}
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {summit.date}
                      </span>
                      {summit.startTime && (
                        <span className="text-xs text-slate-500 font-mono">
                          {summit.startTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{summit.weather}</span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span>{summit.companions}</span>

                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-800">
                          {onEditSummit && (
                            <button
                              onClick={() => onEditSummit(summit)}
                              className="p-1 text-slate-400 hover:text-accent hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Edit this summit log"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteSummit && (
                            <button
                              onClick={() => onDeleteSummit(summit.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                              title="Delete this summit log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route & Distance info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-3 font-mono">
                    <span className="text-slate-300 font-sans">
                      <strong className="text-slate-400 font-normal">Trail: </strong>
                      {summit.trailTaken}
                    </span>
                    <span>{summit.distanceKm} km</span>
                    <span>+{summit.elevationGainM}m vert</span>
                    <span>{Math.floor(summit.durationMinutes / 60)}h {summit.durationMinutes % 60}m</span>
                  </div>

                  {/* Summit Notes */}
                  {summit.notes && (
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3 italic">
                      "{summit.notes}"
                    </p>
                  )}

                  {/* Photos for this specific summit */}
                  {summit.photos && summit.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {summit.photos.map((photo) => {
                        const isCover = photo.isCover || (mountain.coverPhoto === photo.url);
                        return (
                          <div
                            key={photo.id}
                            className={`group/photo relative aspect-[4/3] rounded-lg overflow-hidden border bg-slate-900 ${
                              isCover ? 'border-accent ring-2 ring-accent-glow' : 'border-slate-800'
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt={photo.caption || `${mountain.mountainName} photo`}
                              onClick={() => onSelectPhoto(photo, `${mountain.mountainName} · Summit #${summit.summitNumber}`, summit.date)}
                              className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-200 cursor-pointer"
                              referrerPolicy="no-referrer"
                            />

                            {/* Cover Badge / Set Cover Button */}
                            <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
                              {isCover ? (
                                <span className="px-1.5 py-0.5 rounded bg-accent text-slate-950 font-bold text-[9px] shadow flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-slate-950" />
                                  <span>Cover</span>
                                </span>
                              ) : isAdmin && onSetCoverPhoto ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSetCoverPhoto(photo.id, summit.id);
                                  }}
                                  className="opacity-0 group-hover/photo:opacity-100 px-1.5 py-0.5 rounded bg-slate-950/90 hover:bg-accent hover:text-slate-950 text-slate-200 font-medium text-[9px] border border-slate-700 shadow transition-all cursor-pointer"
                                  title="Set this photo as the mountain cover thumbnail"
                                >
                                  Set Cover
                                </button>
                              ) : null}
                            </div>

                            <div
                              onClick={() => onSelectPhoto(photo, `${mountain.mountainName} · Summit #${summit.summitNumber}`, summit.date)}
                              className="absolute inset-0 bg-slate-950/0 group-hover/photo:bg-slate-950/20 transition-colors cursor-pointer"
                            />
                            {photo.caption && (
                              <div className="absolute bottom-0 inset-x-0 p-1.5 bg-slate-950/80 text-[10px] text-slate-300 truncate pointer-events-none">
                                {photo.caption}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Photo Archive */}
          {activeTab === 'photos' && (
            <div>
              {allPhotos.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  No photos uploaded for this mountain yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allPhotos.map(({ photo, summit }) => {
                    const isCover = photo.isCover || (mountain.coverPhoto === photo.url);
                    return (
                      <div
                        key={photo.id}
                        className={`group relative aspect-[4/3] rounded-xl overflow-hidden border bg-slate-950 ${
                          isCover ? 'border-accent ring-2 ring-accent-glow' : 'border-slate-800'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          onClick={() => onSelectPhoto(photo, `${mountain.mountainName} · Summit #${summit.summitNumber}`, summit.date)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          referrerPolicy="no-referrer"
                        />
                        <div
                          onClick={() => onSelectPhoto(photo, `${mountain.mountainName} · Summit #${summit.summitNumber}`, summit.date)}
                          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                        />

                        {/* Cover Badge or Set Button */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                          {isCover ? (
                            <span className="px-2 py-0.5 rounded-md bg-accent text-slate-950 font-bold text-[10px] shadow flex items-center gap-1">
                              <Star className="w-3 h-3 fill-slate-950" />
                              <span>Mountain Cover</span>
                            </span>
                          ) : isAdmin && onSetCoverPhoto ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetCoverPhoto(photo.id, summit.id);
                              }}
                              className="px-2 py-0.5 rounded-md bg-slate-950/90 hover:bg-accent hover:text-slate-950 text-slate-200 font-medium text-[10px] border border-slate-700/80 shadow transition-all cursor-pointer backdrop-blur-sm"
                              title="Set as mountain thumbnail cover"
                            >
                              ★ Set as Cover
                            </button>
                          ) : null}
                        </div>

                        <div
                          onClick={() => onSelectPhoto(photo, `${mountain.mountainName} · Summit #${summit.summitNumber}`, summit.date)}
                          className="absolute bottom-2 left-2 right-2 text-left cursor-pointer pointer-events-none"
                        >
                          <div className="text-[11px] font-mono text-accent">
                            Summit #{summit.summitNumber} · {summit.date}
                          </div>
                          <div className="text-xs text-slate-200 truncate font-medium">
                            {photo.caption || 'Summit capture'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Routes & Mountain Stats */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Total Summits</span>
                  <span className="text-2xl font-bold font-mono text-accent">{mountain.totalSummits}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Total Vertical</span>
                  <span className="text-2xl font-bold font-mono text-slate-100">{mountain.totalElevationGainedM.toLocaleString()}m</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Total Distance</span>
                  <span className="text-2xl font-bold font-mono text-slate-100">{mountain.totalDistanceKm} km</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">First vs Latest</span>
                  <span className="text-xs font-mono text-slate-300 block">{mountain.firstSummitDate}</span>
                  <span className="text-xs font-mono text-accent block">to {mountain.latestSummitDate}</span>
                </div>
              </div>

              {/* Unique trails logged */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Route className="w-4 h-4 text-accent" />
                  <span>Trails & Routes Taken on {mountain.mountainName}</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {Array.from(new Set(mountain.summits.map((s) => s.trailTaken))).map((trail, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/60">
                      <span>{trail}</span>
                      <span className="text-xs font-mono text-slate-500">
                        {mountain.summits.filter((s) => s.trailTaken === trail).length} ascents
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

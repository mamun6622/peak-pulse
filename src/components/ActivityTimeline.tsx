import React, { useState, useMemo } from 'react';
import { Mountain, Footprints, Calendar, Clock, MapPin, Search, Filter, Camera, Trash2, ArrowUpRight, Edit } from 'lucide-react';
import { Activity, SummitLog, RunningLog, PhotoItem } from '../types/activity';

interface ActivityTimelineProps {
  activities: Activity[];
  isAdmin: boolean;
  onSelectPhoto: (photo: PhotoItem, title: string, subtitle: string) => void;
  onSelectMountain: (mountainId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  initialFilter?: 'all' | 'summit' | 'running';
  onOpenStravaModal?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  isAdmin,
  onSelectPhoto,
  onSelectMountain,
  onEditActivity,
  onDeleteActivity,
  initialFilter = 'all',
  onOpenStravaModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'summit' | 'running'>(initialFilter);
  const [selectedMountain, setSelectedMountain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique mountain names from summit logs
  const mountainNames = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.activityType === 'summit') {
        set.add(a.mountainName);
      }
    });
    return Array.from(set).sort();
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type filter
      if (filterType !== 'all' && act.activityType !== filterType) {
        return false;
      }
      // Mountain filter
      if (selectedMountain !== 'all') {
        if (act.activityType !== 'summit' || act.mountainName !== selectedMountain) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (act.activityType === 'summit') {
          const match =
            act.mountainName.toLowerCase().includes(q) ||
            act.peakName.toLowerCase().includes(q) ||
            act.trailTaken.toLowerCase().includes(q) ||
            act.notes.toLowerCase().includes(q) ||
            act.location.toLowerCase().includes(q);
          if (!match) return false;
        } else {
          const match =
            act.title.toLowerCase().includes(q) ||
            act.locationName.toLowerCase().includes(q) ||
            act.notes.toLowerCase().includes(q);
          if (!match) return false;
        }
      }
      return true;
    });
  }, [activities, filterType, selectedMountain, searchQuery]);

  return (
    <section className="py-12 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Activity Stream & Log Archive</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Chronological Trail & Run Journal
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Every mountain ascent and endurance run logged with date, GPS coordinates, weather conditions, photos, and distance.
            </p>
          </div>

          {/* Interactive Filter Controls (functional buttons) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-accent text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({activities.length})
              </button>
              <button
                onClick={() => setFilterType('summit')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'summit'
                    ? 'bg-accent text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mountain className="w-3 h-3" />
                <span>Summits ({activities.filter((a) => a.activityType === 'summit').length})</span>
              </button>
              <button
                onClick={() => setFilterType('running')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'running'
                    ? 'bg-accent text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Footprints className="w-3 h-3" />
                <span>Runs ({activities.filter((a) => a.activityType === 'running').length})</span>
              </button>
            </div>

            {isAdmin && onOpenStravaModal && (
              <button
                onClick={onOpenStravaModal}
                className="px-3 py-1.5 bg-[#fc4c02] hover:bg-[#e34402] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                title="Connect and import runs from Strava (Admin only)"
              >
                <span>⚡</span>
                <span>Sync Strava</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Mountain Dropdown bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3 w-full max-w-full">
          <div className="relative flex-1 min-w-0 sm:min-w-[240px] w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by mountain, trail, location, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {filterType !== 'running' && (
            <select
              value={selectedMountain}
              onChange={(e) => setSelectedMountain(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-accent"
              aria-label="Filter by mountain"
            >
              <option value="all">All Mountains ({mountainNames.length} peaks)</option>
              {mountainNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Activity Feed */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
            <p className="text-slate-400 text-base mb-2">No activities match your filters.</p>
            <button
              onClick={() => {
                setFilterType('all');
                setSelectedMountain('all');
                setSearchQuery('');
              }}
              className="text-xs text-accent hover:underline font-medium cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((act) => {
              const isSummit = act.activityType === 'summit';
              const summit = isSummit ? (act as SummitLog) : null;
              const run = !isSummit ? (act as RunningLog) : null;

              return (
                <div
                  key={act.id}
                  className="group relative bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                    <div>
                      {/* Unboxed Metadata Header */}
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1.5">
                        <span className="font-semibold text-accent">
                          {isSummit ? `Summit #${summit?.summitNumber}` : 'Running'}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{act.date}</span>
                        {act.startTime && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span>{act.startTime}</span>
                          </>
                        )}
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{isSummit ? summit?.location : run?.locationName}</span>
                      </div>

                      {/* Title */}
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                          {isSummit ? summit?.mountainName : run?.title}
                        </h3>
                        {isSummit && summit?.koreanName && (
                          <span className="text-slate-400 text-base font-normal">
                            {summit.koreanName}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-0.5">
                        {isSummit ? `${summit?.peakName} (${summit?.elevationM}m)` : `${run?.routeType} Route`}
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300 sm:text-right shrink-0">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Distance</span>
                        <span className="font-bold text-slate-100 text-sm">{act.distanceKm}</span> km
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Vertical</span>
                        <span className="font-bold text-accent text-sm">+{act.elevationGainM}</span>m
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-sans">Duration</span>
                        <span className="font-bold text-slate-100 text-sm">
                          {Math.floor(act.durationMinutes / 60)}h {act.durationMinutes % 60}m
                        </span>
                      </div>
                      {!isSummit && run?.paceMinPerKm && (
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-sans">Pace</span>
                          <span className="font-bold text-slate-100 text-sm">{run.paceMinPerKm}</span>/km
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course / Trail Information */}
                  {isSummit && summit?.trailTaken && (
                    <div className="text-xs text-slate-400 mb-3 font-mono">
                      <strong className="text-slate-300 font-sans font-normal">Route Course: </strong>
                      {summit.trailTaken}
                    </div>
                  )}

                  {/* Notes */}
                  {act.notes && (
                    <p className="text-slate-300 text-sm leading-relaxed mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                      "{act.notes}"
                    </p>
                  )}

                  {/* Photos Grid */}
                  {act.photos && act.photos.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {act.photos.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() =>
                            onSelectPhoto(
                              photo,
                              isSummit ? `${summit?.mountainName} Summit #${summit?.summitNumber}` : run?.title || 'Run',
                              act.date
                            )
                          }
                          className="group/photo relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Activity photo'}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-200"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-950/0 group-hover/photo:bg-slate-950/30 transition-colors flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                          </div>
                          {photo.caption && (
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-950/90 to-transparent text-[11px] text-slate-300 truncate font-sans">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {isSummit && summit?.mountainId ? (
                      <button
                        onClick={() => onSelectMountain(summit.mountainId)}
                        className="font-medium text-accent hover:text-accent-hover inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All {summit.mountainName} Repeat Ascents</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-500 font-mono">Endurance Track Log</span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditActivity(act)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-accent hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit activity details and photos"
                          aria-label="Edit activity"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteActivity(act.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete activity"
                          aria-label="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

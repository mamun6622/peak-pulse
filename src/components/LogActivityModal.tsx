import React, { useState, useEffect } from 'react';
import {
  X,
  Mountain,
  Footprints,
  Camera,
  Upload,
  Trash2,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Edit,
} from 'lucide-react';
import { Activity, SummitLog, RunningLog, PhotoItem, MountainSummary } from '../types/activity';
import { formatPace } from '../utils/activityStats';
import { KOREA_ALL_MOUNTAINS, KoreaMountain } from '../data/koreaMountainsDatabase';
import { compressImageFile } from '../utils/imageCompressor';
import { auth, loginWithGoogle } from '../services/firebase';
import { User } from 'firebase/auth';

interface LogActivityModalProps {
  mountains: MountainSummary[];
  preselectedMountain?: MountainSummary | null;
  initialActivity?: Activity | null;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  mountains,
  preselectedMountain,
  initialActivity,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialActivity);

  const [activityType, setActivityType] = useState<'summit' | 'running'>(
    initialActivity?.activityType || 'summit'
  );

  // Firebase auth state for live cloud sync
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Province filter for Korea mountains
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [mountainSearchQuery, setMountainSearchQuery] = useState<string>('');

  // Summit fields
  const [selectedMountainId, setSelectedMountainId] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.mountainId || 'geumjeongsan';
    }
    return preselectedMountain?.mountainId || 'geumjeongsan';
  });

  const [isCustomMountain, setIsCustomMountain] = useState<boolean>(false);
  const [customMountainName, setCustomMountainName] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.mountainName || '';
    }
    return '';
  });
  const [customKoreanName, setCustomKoreanName] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.koreanName || '';
    }
    return '';
  });
  const [customPeakName, setCustomPeakName] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.peakName || '';
    }
    return '';
  });
  const [customElevation, setCustomElevation] = useState<number>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.elevationM || 800;
    }
    return 800;
  });
  const [customLocation, setCustomLocation] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.location || 'Busan, South Korea';
    }
    return 'Busan, South Korea';
  });

  const [date, setDate] = useState<string>(() => {
    return initialActivity?.date || new Date().toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState<string>(() => {
    return initialActivity?.startTime || '07:30';
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    return initialActivity?.durationMinutes || 180;
  });
  const [distanceKm, setDistanceKm] = useState<number>(() => {
    return initialActivity?.distanceKm || 8.5;
  });
  const [elevationGainM, setElevationGainM] = useState<number>(() => {
    return initialActivity?.elevationGainM || 720;
  });

  const [weather, setWeather] = useState<SummitLog['weather']>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.weather || 'Clear / Sunny';
    }
    return 'Clear / Sunny';
  });
  const [companions, setCompanions] = useState<SummitLog['companions']>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.companions || 'Solo';
    }
    return 'Solo';
  });
  const [trailTaken, setTrailTaken] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'summit') {
      return initialActivity.trailTaken || 'Main Scenic Ridge Course';
    }
    return 'Main Scenic Ridge Course';
  });
  const [notes, setNotes] = useState<string>(() => {
    return initialActivity?.notes || '';
  });

  // Running fields
  const [runTitle, setRunTitle] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'running') {
      return initialActivity.title || 'Busan Oncheoncheon Riverfront 10K';
    }
    return 'Busan Oncheoncheon Riverfront 10K';
  });
  const [runLocation, setRunLocation] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'running') {
      return initialActivity.locationName || 'Oncheon Stream, Busan';
    }
    return 'Oncheon Stream, Busan';
  });
  const [runRouteType, setRunRouteType] = useState<RunningLog['routeType']>(() => {
    if (initialActivity && initialActivity.activityType === 'running') {
      return initialActivity.routeType || 'Riverfront';
    }
    return 'Riverfront';
  });
  const [runShoes, setRunShoes] = useState<string>(() => {
    if (initialActivity && initialActivity.activityType === 'running') {
      return initialActivity.shoes || 'Hoka Speedgoat 5';
    }
    return 'Hoka Speedgoat 5';
  });

  // Photos
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoItem[]>(() => {
    return initialActivity?.photos || [];
  });
  const [photoCaptionInput, setPhotoCaptionInput] = useState<string>('');

  // Form error
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Find selected mountain in Korea Master Database
  const selectedKoreaMountain =
    KOREA_ALL_MOUNTAINS.find((m) => m.id === selectedMountainId) || KOREA_ALL_MOUNTAINS[0];

  // Check if user has past summits on this mountain
  const existingSummary = mountains.find(
    (m) =>
      m.mountainId === selectedMountainId ||
      m.mountainName.toLowerCase() === selectedKoreaMountain?.name.toLowerCase()
  );
  const nextSummitNumber = initialActivity && initialActivity.activityType === 'summit'
    ? initialActivity.summitNumber
    : existingSummary
    ? existingSummary.totalSummits + 1
    : 1;

  // Filtered mountains for the select picker
  const filteredKoreaMountains = KOREA_ALL_MOUNTAINS.filter((m) => {
    if (selectedProvince !== 'all' && m.province !== selectedProvince) return false;
    if (mountainSearchQuery.trim()) {
      const q = mountainSearchQuery.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        m.koreanName.toLowerCase().includes(q) ||
        m.peakName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sync selected mountain with province filter
  useEffect(() => {
    if (
      !isEditing &&
      filteredKoreaMountains.length > 0 &&
      !filteredKoreaMountains.some((m) => m.id === selectedMountainId)
    ) {
      setSelectedMountainId(filteredKoreaMountains[0].id);
    }
  }, [selectedProvince, mountainSearchQuery, filteredKoreaMountains, selectedMountainId, isEditing]);

  // Handle Google Sign-in right from modal
  const handleQuickGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      setErrorMsg('Google sign-in was not completed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle image upload from file picker with high efficiency compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingPhotos(true);
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        // High quality web compression (~30-50KB per photo)
        const compressedUrl = await compressImageFile(file, 960, 960, 0.68);
        if (compressedUrl) {
          const newPhoto: PhotoItem = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: compressedUrl,
            caption: photoCaptionInput.trim() || file.name.replace(/\.[^/.]+$/, ''),
            isCover: uploadedPhotos.length === 0,
          };
          setUploadedPhotos((prev) => [...prev, newPhoto]);
        }
      }
      setPhotoCaptionInput('');
    } catch (err) {
      console.warn('Photo processing warning:', err);
    } finally {
      setIsCompressingPhotos(false);
      e.target.value = '';
    }
  };

  const removePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleCoverPhoto = (id: string) => {
    setUploadedPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === id,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (activityType === 'summit') {
      let finalMountainName = '';
      let finalKoreanName = '';
      let finalPeakName = '';
      let finalElevation = 0;
      let finalLocation = '';
      let finalCoordinates = { lat: 35.18, lng: 129.07 };
      let summitNum = nextSummitNumber;

      if (isCustomMountain) {
        if (!customMountainName.trim()) {
          setErrorMsg('Please enter a mountain name.');
          return;
        }
        finalMountainName = customMountainName.trim();
        finalKoreanName = customKoreanName.trim();
        finalPeakName = customPeakName.trim() || 'Summit Peak';
        finalElevation = Number(customElevation) || 500;
        finalLocation = customLocation.trim() || 'Busan / South Korea';
      } else {
        if (!selectedKoreaMountain) {
          setErrorMsg('Please select a mountain.');
          return;
        }
        finalMountainName = selectedKoreaMountain.name;
        finalKoreanName = selectedKoreaMountain.koreanName;
        finalPeakName = selectedKoreaMountain.peakName;
        finalElevation = selectedKoreaMountain.elevationM;
        finalLocation = `${selectedKoreaMountain.regionDetail} (${selectedKoreaMountain.province})`;
        finalCoordinates = selectedKoreaMountain.coordinates;
      }

      const activityId = initialActivity ? initialActivity.id : `summit-${Date.now()}`;

      const savedSummit: SummitLog = {
        id: activityId,
        activityType: 'summit',
        mountainId: isCustomMountain
          ? `custom-${finalMountainName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
          : selectedKoreaMountain.id,
        mountainName: finalMountainName,
        koreanName: finalKoreanName,
        peakName: finalPeakName,
        elevationM: finalElevation,
        summitNumber: summitNum,
        date,
        startTime,
        durationMinutes: Number(durationMinutes) || 120,
        distanceKm: Number(distanceKm) || 5,
        elevationGainM: Number(elevationGainM) || finalElevation,
        weather,
        companions,
        trailTaken: trailTaken.trim() || 'Standard Peak Trail',
        location: finalLocation,
        coordinates: finalCoordinates,
        notes: notes.trim(),
        photos: uploadedPhotos,
      };

      onSave(savedSummit);
      onClose();
    } else {
      if (!runTitle.trim()) {
        setErrorMsg('Please enter a workout title.');
        return;
      }

      const calculatedPace = formatPace(Number(durationMinutes), Number(distanceKm));
      const activityId = initialActivity ? initialActivity.id : `run-${Date.now()}`;

      const savedRun: RunningLog = {
        id: activityId,
        activityType: 'running',
        title: runTitle.trim(),
        date,
        startTime,
        durationMinutes: Number(durationMinutes) || 45,
        distanceKm: Number(distanceKm) || 8,
        elevationGainM: Number(elevationGainM) || 30,
        paceMinPerKm: calculatedPace,
        locationName: runLocation.trim() || 'Busan / South Korea',
        routeType: runRouteType,
        shoes: runShoes.trim(),
        coordinates: { lat: 35.18, lng: 129.07 },
        notes: notes.trim(),
        photos: uploadedPhotos,
      };

      onSave(savedRun);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-100 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit className="w-5 h-5 text-amber-400" />
                    <span>Edit Activity Log</span>
                  </>
                ) : (
                  <span>Log Outdoor Activity</span>
                )}
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {isEditing
                ? 'Update summit ascent or running details and synchronize with Cloud Firestore'
                : 'Record a new mountain summit or endurance run with date, elevation, and photos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white bg-stone-900 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-stone-950/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>
                Saving directly to <strong>Cloud Firestore</strong> (
                {currentUser.email || 'mamun.green213@gmail.com'})
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Offline/Local Mode. Sign in with Google to sync directly to Firebase Cloud Database.
                </span>
              </div>
              <button
                type="button"
                onClick={handleQuickGoogleSignIn}
                disabled={isSigningIn}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-950 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Activity Type Selector */}
          {!isEditing && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-2">
                Activity Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActivityType('summit')}
                  className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activityType === 'summit'
                      ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-md'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <Mountain className="w-4 h-4" />
                  <span>Mountain Summit Ascent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityType('running')}
                  className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activityType === 'running'
                      ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-md'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <Footprints className="w-4 h-4" />
                  <span>Trail & River Run</span>
                </button>
              </div>
            </div>
          )}

          {/* SUMMIT FORM FIELDS */}
          {activityType === 'summit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Select Korean Mountain
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMountain(!isCustomMountain)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  {isCustomMountain ? '← Pick from Directory' : '+ Custom / Local Peak'}
                </button>
              </div>

              {!isCustomMountain ? (
                <div className="space-y-2.5 p-3.5 bg-stone-950 rounded-xl border border-stone-800">
                  {/* Region filter chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-stone-500 mr-1">Region:</span>
                    {['all', 'Busan', 'Seoul', 'Gangwon', 'Gyeonggi', 'Chungcheong', 'Jeolla', 'Gyeongsang', 'Jeju'].map(
                      (prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setSelectedProvince(prov)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            selectedProvince === prov
                              ? 'bg-amber-400 text-stone-950 font-bold'
                              : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {prov === 'all' ? 'All Korea' : prov}
                        </button>
                      )
                    )}
                  </div>

                  {/* Mountain dropdown */}
                  <select
                    value={selectedMountainId}
                    onChange={(e) => setSelectedMountainId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400"
                  >
                    {filteredKoreaMountains.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.koreanName}) - {m.peakName} ({m.elevationM}m) [{m.province}]
                      </option>
                    ))}
                  </select>

                  {/* Selected Mountain Info badge */}
                  {selectedKoreaMountain && (
                    <div className="pt-2 text-xs flex flex-wrap items-center justify-between gap-2 text-stone-400 border-t border-stone-850">
                      <span>
                        Peak: <strong className="text-stone-200">{selectedKoreaMountain.peakName}</strong> (
                        {selectedKoreaMountain.elevationM}m)
                      </span>
                      <span>
                        Recorded Ascents: <strong className="text-amber-400">#{nextSummitNumber}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Custom Mountain inputs */
                <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Mountain Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Geumjeongsan, Hwangnyeongsan"
                        value={customMountainName}
                        onChange={(e) => setCustomMountainName(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Hangul Name (Korean)</label>
                      <input
                        type="text"
                        placeholder="e.g. 금정산"
                        value={customKoreanName}
                        onChange={(e) => setCustomKoreanName(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Peak Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Godangbong"
                        value={customPeakName}
                        onChange={(e) => setCustomPeakName(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Peak Elevation (m)</label>
                      <input
                        type="number"
                        value={customElevation}
                        onChange={(e) => setCustomElevation(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Course & Weather */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Trail / Route Taken</label>
                  <input
                    type="text"
                    placeholder="e.g. Beomeosa Temple → Godangbong → North Gate"
                    value={trailTaken}
                    onChange={(e) => setTrailTaken(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Weather Conditions</label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Clear / Sunny">Clear / Sunny ☀️</option>
                    <option value="Crisp Sunrise">Crisp Sunrise 🌅</option>
                    <option value="Autumn Foliage">Autumn Foliage 🍁</option>
                    <option value="Winter Snow / Ice">Winter Snow / Ice ❄️</option>
                    <option value="Misty / Foggy">Misty / Foggy 🌫️</option>
                    <option value="Sunset Golden Hour">Sunset Golden Hour 🌇</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* RUNNING FORM FIELDS */}
          {activityType === 'running' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Workout Title</label>
                <input
                  type="text"
                  placeholder="e.g. Busan Haeundae Beach Promenade 10K"
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Location / Course</label>
                  <input
                    type="text"
                    placeholder="e.g. Haeundae Dongbaekseom Island, Busan"
                    value={runLocation}
                    onChange={(e) => setRunLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Route Terrain</label>
                  <select
                    value={runRouteType}
                    onChange={(e) => setRunRouteType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Riverfront">Riverfront / Coastal 🌊</option>
                    <option value="Mountain Trail">Mountain Trail 🌲</option>
                    <option value="City Loop">City Loop 🏙️</option>
                    <option value="Track / Park">Track / Park 🏃</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Footwear / Shoes</label>
                <input
                  type="text"
                  placeholder="e.g. Hoka Speedgoat 5, Nike Pegasus Trail"
                  value={runShoes}
                  onChange={(e) => setRunShoes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* SHARED METRICS: Date, Time, Distance, Duration, Elevation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-850">
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Elevation Gain (m)</label>
              <input
                type="number"
                min="0"
                value={elevationGainM}
                onChange={(e) => setElevationGainM(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* PHOTOS SECTION */}
          <div className="pt-2 border-t border-stone-850 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Summit Photos ({uploadedPhotos.length})</span>
              </label>
              <span className="text-[11px] text-stone-500">
                Compressed automatically for Cloud Firestore
              </span>
            </div>

            <div className="space-y-3">
              <label className="w-full py-4 px-4 border-2 border-dashed border-stone-800 hover:border-amber-400/60 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-950/60 hover:bg-stone-950 transition-all text-center">
                <Upload className="w-5 h-5 text-stone-400" />
                <span className="text-xs font-medium text-stone-300">
                  {isCompressingPhotos
                    ? 'Optimizing photos for database storage...'
                    : 'Click or drag photos to upload (Summit stone, panoramas, trail)'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isCompressingPhotos}
                  className="hidden"
                />
              </label>

              {/* Photo preview list */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {uploadedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-xl overflow-hidden border border-stone-800 aspect-square bg-stone-950"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="p-1 rounded bg-rose-500/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCoverPhoto(photo.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer text-center ${
                            photo.isCover
                              ? 'bg-amber-400 text-stone-950 font-bold'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                        >
                          {photo.isCover ? '★ Cover' : 'Set Cover'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-stone-850">
            <label className="text-[11px] text-stone-400 block mb-1">
              Personal Notes & Experience Story
            </label>
            <textarea
              rows={3}
              placeholder="Reflections on the ridge, weather conditions, trail highlights, gear notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isEditing ? 'Save Changes to Database' : activityType === 'summit' ? 'Save Summit Ascent' : 'Save Run Log'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

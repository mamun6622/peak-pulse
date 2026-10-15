import React, { useState, useEffect } from 'react';
import { X, Mountain, Footprints, Camera, Upload, Trash2, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { Activity, SummitLog, RunningLog, PhotoItem, MountainSummary } from '../types/activity';
import { formatPace } from '../utils/activityStats';
import { KOREA_ALL_MOUNTAINS, KoreaMountain } from '../data/koreaMountainsDatabase';
import { compressImageFile } from '../utils/imageCompressor';

interface LogActivityModalProps {
  mountains: MountainSummary[];
  preselectedMountain?: MountainSummary | null;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  mountains,
  preselectedMountain,
  onClose,
  onSave,
}) => {
  const [activityType, setActivityType] = useState<'summit' | 'running'>('summit');

  // Province filter for Korea mountains
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [mountainSearchQuery, setMountainSearchQuery] = useState<string>('');

  // Summit fields
  const [selectedMountainId, setSelectedMountainId] = useState<string>(
    preselectedMountain?.mountainId || 'bukhansan'
  );
  const [isCustomMountain, setIsCustomMountain] = useState<boolean>(false);
  const [customMountainName, setCustomMountainName] = useState<string>('');
  const [customKoreanName, setCustomKoreanName] = useState<string>('');
  const [customPeakName, setCustomPeakName] = useState<string>('');
  const [customElevation, setCustomElevation] = useState<number>(800);
  const [customLocation, setCustomLocation] = useState<string>('Seoul, South Korea');

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>('07:30');
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [distanceKm, setDistanceKm] = useState<number>(8.5);
  const [elevationGainM, setElevationGainM] = useState<number>(720);
  const [weather, setWeather] = useState<SummitLog['weather']>('Clear / Sunny');
  const [companions, setCompanions] = useState<SummitLog['companions']>('Solo');
  const [trailTaken, setTrailTaken] = useState<string>('Main Scenic Fortress Course');
  const [notes, setNotes] = useState<string>('');

  // Running fields
  const [runTitle, setRunTitle] = useState<string>('Han River Sunset Run 10K');
  const [runLocation, setRunLocation] = useState<string>('Yeouido Hangang Park, Seoul');
  const [runRouteType, setRunRouteType] = useState<RunningLog['routeType']>('Riverfront');
  const [runShoes, setRunShoes] = useState<string>('Nike Pegasus Trail');

  // Photos
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoItem[]>([]);
  const [photoCaptionInput, setPhotoCaptionInput] = useState<string>('');

  // Form error
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Find selected mountain in Korea Master Database
  const selectedKoreaMountain = KOREA_ALL_MOUNTAINS.find((m) => m.id === selectedMountainId) || KOREA_ALL_MOUNTAINS[0];

  // Check if user has past summits on this mountain
  const existingSummary = mountains.find(
    (m) => m.mountainId === selectedMountainId || m.mountainName.toLowerCase() === selectedKoreaMountain?.name.toLowerCase()
  );
  const nextSummitNumber = existingSummary ? existingSummary.totalSummits + 1 : 1;

  // Filtered mountains for the select picker
  const filteredKoreaMountains = KOREA_ALL_MOUNTAINS.filter((m) => {
    if (selectedProvince !== 'all' && m.province !== selectedProvince) return false;
    if (mountainSearchQuery.trim()) {
      const q = mountainSearchQuery.toLowerCase().trim();
      return m.name.toLowerCase().includes(q) || m.koreanName.toLowerCase().includes(q) || m.peakName.toLowerCase().includes(q);
    }
    return true;
  });

  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);

  // Handle image upload from file picker with automatic client-side compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingPhotos(true);
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        const compressedUrl = await compressImageFile(file, 1440, 1440, 0.78);
        if (compressedUrl) {
          const newPhoto: PhotoItem = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: compressedUrl,
            caption: photoCaptionInput.trim() || file.name.replace(/\.[^/.]+$/, ''),
          };
          setUploadedPhotos((prev) => [...prev, newPhoto]);
        }
      }
      setPhotoCaptionInput('');
    } catch (err) {
      console.warn('Photo processing warning:', err);
    } finally {
      setIsCompressingPhotos(false);
      // Reset input value so user can re-upload if needed
      e.target.value = '';
    }
  };

  const removePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
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
      let finalCoordinates = { lat: 37.5, lng: 127.0 };
      let summitNum = 1;

      if (isCustomMountain) {
        if (!customMountainName.trim()) {
          setErrorMsg('Please enter a mountain name.');
          return;
        }
        finalMountainName = customMountainName.trim();
        finalKoreanName = customKoreanName.trim();
        finalPeakName = customPeakName.trim() || 'Summit';
        finalElevation = Number(customElevation) || 500;
        finalLocation = customLocation.trim() || 'South Korea';
      } else {
        if (!selectedKoreaMountain) {
          setErrorMsg('Please select a mountain.');
          return;
        }
        finalMountainName = selectedKoreaMountain.name;
        finalKoreanName = selectedKoreaMountain.koreanName;
        finalPeakName = selectedKoreaMountain.peakName;
        finalElevation = selectedKoreaMountain.elevationM;
        finalLocation = selectedKoreaMountain.regionDetail;
        finalCoordinates = selectedKoreaMountain.coordinates;
        summitNum = nextSummitNumber;
      }

      const newSummit: SummitLog = {
        id: `summit-${Date.now()}`,
        activityType: 'summit',
        mountainId: isCustomMountain
          ? finalMountainName.toLowerCase().replace(/\s+/g, '-')
          : selectedMountainId,
        mountainName: finalMountainName,
        koreanName: finalKoreanName,
        peakName: finalPeakName,
        elevationM: finalElevation,
        summitNumber: summitNum,
        date,
        startTime,
        durationMinutes: Number(durationMinutes) || 120,
        distanceKm: Number(distanceKm) || 5,
        elevationGainM: Number(elevationGainM) || 400,
        weather,
        companions,
        trailTaken: trailTaken.trim() || 'Scenic Ridge Trail',
        location: finalLocation,
        coordinates: finalCoordinates,
        notes: notes.trim(),
        photos: uploadedPhotos,
      };

      onSave(newSummit);
      onClose();
    } else {
      if (!runTitle.trim()) {
        setErrorMsg('Please enter a running route or session title.');
        return;
      }

      const calculatedPace = formatPace(Number(durationMinutes), Number(distanceKm));

      const newRun: RunningLog = {
        id: `run-${Date.now()}`,
        activityType: 'running',
        title: runTitle.trim(),
        date,
        startTime,
        durationMinutes: Number(durationMinutes) || 45,
        distanceKm: Number(distanceKm) || 8,
        elevationGainM: Number(elevationGainM) || 30,
        paceMinPerKm: calculatedPace,
        locationName: runLocation.trim() || 'Seoul, South Korea',
        routeType: runRouteType,
        shoes: runShoes.trim(),
        coordinates: { lat: 37.528, lng: 126.932 },
        notes: notes.trim(),
        photos: uploadedPhotos,
      };

      onSave(newRun);
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
            <h2 className="text-xl sm:text-2xl font-bold text-stone-100">
              Log Outdoor Activity
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Record a new mountain summit or endurance run with date, elevation, and photos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white bg-stone-900 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Activity Type Toggle */}
          <div>
            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-2">
              Activity Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActivityType('summit')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-colors ${
                  activityType === 'summit'
                    ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-950/60 text-stone-300 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <Mountain className="w-4 h-4" />
                <span>Mountain Summit</span>
              </button>
              <button
                type="button"
                onClick={() => setActivityType('running')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-colors ${
                  activityType === 'running'
                    ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-950/60 text-stone-300 border-stone-800 hover:bg-stone-800'
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>Endurance Run</span>
              </button>
            </div>
          </div>

          {/* Mountain Specific Options */}
          {activityType === 'summit' && (
            <div className="space-y-4 p-4 rounded-xl bg-stone-950/60 border border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300">Choose Mountain</span>
                <button
                  type="button"
                  onClick={() => setIsCustomMountain(!isCustomMountain)}
                  className="text-xs text-amber-400 hover:underline"
                >
                  {isCustomMountain ? '← Pick Existing Peak' : '+ Add New Mountain'}
                </button>
              </div>

              {!isCustomMountain ? (
                <div className="space-y-2.5">
                  {/* Province quick filter */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
                    {['all', 'Seoul', 'Gyeonggi', 'Gangwon', 'Chungcheong', 'Jeolla', 'Gyeongsang', 'Jeju'].map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => setSelectedProvince(prov)}
                        className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                          selectedProvince === prov
                            ? 'bg-amber-400 text-stone-950 font-bold'
                            : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {prov === 'all' ? 'All Korea' : prov}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search mountain name or peak..."
                      value={mountainSearchQuery}
                      onChange={(e) => setMountainSearchQuery(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <select
                    value={selectedMountainId}
                    onChange={(e) => setSelectedMountainId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400 font-sans"
                    aria-label="Select mountain to log"
                  >
                    {filteredKoreaMountains.map((m) => {
                      const hist = mountains.find((h) => h.mountainId === m.id || h.mountainName.toLowerCase() === m.name.toLowerCase());
                      const nextCount = hist ? hist.totalSummits + 1 : 1;
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} · {m.peakName} · {m.elevationM}m ({m.province}) — {hist ? `Summit #${nextCount} (${hist.totalSummits}× previous)` : 'Summit #1 (First Ascent)'}
                        </option>
                      );
                    })}
                  </select>

                  {selectedKoreaMountain && (
                    <div className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="font-mono text-amber-300">
                        Recording as: <strong className="text-amber-400 font-bold">Summit #{nextSummitNumber}</strong> on {selectedKoreaMountain.name}
                      </div>
                      <div className="text-stone-400 font-mono text-[11px]">
                        {selectedKoreaMountain.regionDetail} · {selectedKoreaMountain.elevationM}m
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Mountain Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sobaeksan"
                      value={customMountainName}
                      onChange={(e) => setCustomMountainName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Korean Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 소백산"
                      value={customKoreanName}
                      onChange={(e) => setCustomKoreanName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Peak Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Birobong"
                      value={customPeakName}
                      onChange={(e) => setCustomPeakName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Elevation (Meters)</label>
                    <input
                      type="number"
                      value={customElevation}
                      onChange={(e) => setCustomElevation(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Trail / Route Taken</label>
                <input
                  type="text"
                  placeholder="e.g. Fortress course, West Ridge trail"
                  value={trailTaken}
                  onChange={(e) => setTrailTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Weather Conditions</label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as SummitLog['weather'])}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                  >
                    <option value="Clear / Sunny">Clear / Sunny</option>
                    <option value="Crisp Sunrise">Crisp Sunrise</option>
                    <option value="Autumn Foliage">Autumn Foliage</option>
                    <option value="Winter Snow / Ice">Winter Snow / Ice</option>
                    <option value="Misty / Foggy">Misty / Foggy</option>
                    <option value="Sunset Golden Hour">Sunset Golden Hour</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Companions</label>
                  <select
                    value={companions}
                    onChange={(e) => setCompanions(e.target.value as SummitLog['companions'])}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                  >
                    <option value="Solo">Solo</option>
                    <option value="Hiking Club">Hiking Club</option>
                    <option value="Friends">Friends</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Running Specific Options */}
          {activityType === 'running' && (
            <div className="space-y-4 p-4 rounded-xl bg-stone-950/60 border border-stone-800">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Run Title / Route Name</label>
                <input
                  type="text"
                  placeholder="e.g. Han River Banpo to Yeouido 12K"
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Route Surface Type</label>
                  <select
                    value={runRouteType}
                    onChange={(e) => setRunRouteType(e.target.value as RunningLog['routeType'])}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                  >
                    <option value="Riverfront">Riverfront Path</option>
                    <option value="Mountain Trail">Mountain Trail</option>
                    <option value="City Loop">City Loop / Pavement</option>
                    <option value="Track / Park">Track / Park</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Location / District</label>
                  <input
                    type="text"
                    value={runLocation}
                    onChange={(e) => setRunLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Shoes Worn (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Nike Pegasus Trail, Hoka Speedgoat"
                  value={runShoes}
                  onChange={(e) => setRunShoes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100"
                />
              </div>
            </div>
          )}

          {/* Date, Time & Core Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Vertical Gain (m)</label>
              <input
                type="number"
                value={elevationGainM}
                onChange={(e) => setElevationGainM(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 font-mono"
              />
            </div>
            {activityType === 'running' && (
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Calculated Pace</label>
                <div className="px-3 py-2 bg-stone-950 border border-stone-850 rounded-xl text-xs font-mono text-amber-400">
                  {formatPace(durationMinutes, distanceKm)} /km
                </div>
              </div>
            )}
          </div>

          {/* Photo Upload Section */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Upload Summit / Route Photos</span>
              </label>
              <span className="text-[11px] text-stone-500 font-mono">
                {uploadedPhotos.length} attached
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className={`flex-1 cursor-pointer py-3 px-4 rounded-xl border border-dashed transition-colors text-center ${
                  isCompressingPhotos
                    ? 'border-amber-400/80 bg-amber-950/20 animate-pulse'
                    : 'border-stone-750 hover:border-amber-400 bg-stone-900/50 hover:bg-stone-900'
                }`}>
                  <Upload className={`w-5 h-5 mx-auto mb-1 ${isCompressingPhotos ? 'text-amber-400 animate-bounce' : 'text-stone-400'}`} />
                  <span className="text-xs text-stone-200 font-medium block">
                    {isCompressingPhotos ? 'Optimizing & compressing photo...' : 'Choose photo files (JPEG, PNG, WebP)'}
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    {isCompressingPhotos ? 'Resizing to optimal web resolution' : 'Images compressed & stored securely in browser'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isCompressingPhotos}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Photo Caption Preview */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {uploadedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-stone-800 bg-stone-900"
                    >
                      <img
                        src={photo.url}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-stone-950/80 hover:bg-rose-900 text-stone-300 hover:text-white rounded-md transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">
              Personal Notes & Experience Story
            </label>
            <textarea
              rows={3}
              placeholder="How was the scramble? Weather at the summit stone? Trail condition? ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm"
            >
              {activityType === 'summit' ? 'Save Summit Ascent' : 'Save Run Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MapPin, Mountain, ArrowUpRight, Navigation, Layers, Compass } from 'lucide-react';
import { MountainSummary } from '../types/activity';

interface InteractiveKoreaMapProps {
  mountains: MountainSummary[];
  onSelectMountain: (mountainId: string) => void;
}

export const InteractiveKoreaMap: React.FC<InteractiveKoreaMapProps> = ({
  mountains,
  onSelectMountain,
}) => {
  const [selectedPin, setSelectedPin] = useState<MountainSummary | null>(mountains[0] || null);

  // Geographic coordinates projection to SVG (South Korea bounding box approx lat: 33.0 - 38.5, lng: 126.0 - 129.5)
  // Let's project lat/lng onto an SVG box (width: 700, height: 750)
  const projectCoords = (lat: number, lng: number) => {
    const minLat = 33.0;
    const maxLat = 38.6;
    const minLng = 125.8;
    const maxLng = 129.8;

    const x = ((lng - minLng) / (maxLng - minLng)) * 600 + 50;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 650 + 50;

    return { x, y };
  };

  return (
    <section className="py-12 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Geographic Activity Map</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              South Korea Summit & Trail Map
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Visual map of peaks conquered across the Korean peninsula and Jeju Island. Pins highlight repeat ascent counts. Click any pin to inspect logs.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            <span>Projection: WGS84 Korean Peninsula</span>
          </div>
        </div>

        {/* Map & Preview Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Interactive SVG Map Container */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
              <span className="font-mono">South Korea Territory & Coastal Ridges</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span>10+ Summits Club</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>Summited Peak</span>
                </span>
              </div>
            </div>

            <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-850 flex items-center justify-center">
              <svg
                viewBox="0 0 700 750"
                className="w-full h-full select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Subtle Korean Peninsula Landmass Outline */}
                  <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#141416" />
                    <stop offset="100%" stopColor="#0a0a0c" />
                  </radialGradient>
                </defs>

                <rect width="700" height="750" fill="url(#oceanGlow)" />

                {/* Stylized Korea Landmass path */}
                <path
                  d="M180,60 L280,50 L420,80 L520,130 L550,220 L580,310 L560,420 L530,500 L440,550 L340,560 L240,530 L160,460 L140,360 L130,260 L140,160 Z"
                  fill="#0f172a"
                  stroke="#1e293b"
                  strokeWidth="2"
                />

                {/* Jeju Island outline */}
                <path
                  d="M130,670 C160,655 210,655 240,670 C245,685 220,705 180,710 C140,705 120,685 130,670 Z"
                  fill="#0f172a"
                  stroke="#1e293b"
                  strokeWidth="2"
                />

                {/* Major mountain range ridge lines (Baekdudaegan) */}
                <path
                  d="M480,120 Q440,240 430,340 T380,480"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Seoul Han River stylized bend */}
                <path
                  d="M210,180 Q235,188 260,182 T290,190"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3"
                  opacity="0.6"
                />

                {/* Nakdong River stylized bend leading into Busan */}
                <path
                  d="M440,320 Q480,400 500,470"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  opacity="0.5"
                />

                {/* Regional Labels */}
                <text x="210" y="165" fill="#94a3b8" fontSize="12" fontFamily="sans-serif" fontWeight="600">
                  Seoul Capital Area
                </text>
                <text x="460" y="180" fill="#94a3b8" fontSize="12" fontFamily="sans-serif">
                  Gangwon-do Ridges
                </text>
                <text x="470" y="475" fill="var(--color-accent, #6366f1)" fontSize="12" fontFamily="sans-serif" fontWeight="600">
                  Busan Coastal Peaks (부산)
                </text>
                <text x="160" y="730" fill="#94a3b8" fontSize="12" fontFamily="sans-serif">
                  Jeju Island
                </text>
                <text x="540" y="270" fill="#64748b" fontSize="11" fontFamily="sans-serif">
                  East Sea
                </text>
                <text x="60" y="320" fill="#64748b" fontSize="11" fontFamily="sans-serif">
                  Yellow Sea
                </text>

                {/* Mountain Pins */}
                {mountains.map((mountain) => {
                  const { x, y } = projectCoords(mountain.coordinates.lat, mountain.coordinates.lng);
                  const isSelected = selectedPin?.mountainId === mountain.mountainId;
                  const isDoubleDigit = mountain.totalSummits >= 10;

                  return (
                    <g
                      key={mountain.mountainId}
                      className="cursor-pointer transition-transform hover:scale-110"
                      onClick={() => setSelectedPin(mountain)}
                    >
                      {/* Outer pulse circle for top repeated peak */}
                      {isDoubleDigit && (
                        <circle
                          cx={x}
                          cy={y}
                          r="18"
                          fill="none"
                          stroke="var(--color-accent, #6366f1)"
                          strokeWidth="1.5"
                          opacity="0.4"
                        />
                      )}

                      {/* Pin Circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '12' : '9'}
                        fill={isDoubleDigit ? 'var(--color-accent, #6366f1)' : '#64748b'}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />

                      {/* Repeat count text inside pin */}
                      <text
                        x={x}
                        y={y + 3.5}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize={isDoubleDigit ? '9' : '8'}
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {mountain.totalSummits}
                      </text>

                      {/* Mountain Name Label on Map */}
                      <text
                        x={x + 14}
                        y={y + 4}
                        fill={isSelected ? 'var(--color-accent, #6366f1)' : '#e2e8f0'}
                        fontSize="11"
                        fontFamily="sans-serif"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {mountain.mountainName} ({mountain.totalSummits}x)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Selected Peak Sidebar Card */}
          <div className="lg:col-span-4 flex flex-col">
            {selectedPin ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between text-xs text-accent font-mono mb-2">
                  <span>Selected Pin</span>
                  <span>{selectedPin.totalSummits} Total Summits</span>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-slate-100">
                    {selectedPin.mountainName}
                  </h3>
                  {selectedPin.koreanName && (
                    <span className="text-slate-400 font-medium">
                      {selectedPin.koreanName}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 mb-4">
                  {selectedPin.peakName} · {selectedPin.elevationM}m · {selectedPin.region}
                </div>

                {/* Photo preview */}
                {selectedPin.coverPhoto && (
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 mb-4 bg-slate-950">
                    <img
                      src={selectedPin.coverPhoto}
                      alt={selectedPin.mountainName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300">
                      {selectedPin.photoCount} photos available
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 text-xs font-mono text-slate-300 mb-6">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500 font-sans">Latest Ascent</span>
                    <span>{selectedPin.latestSummitDate}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500 font-sans">First Ascent</span>
                    <span>{selectedPin.firstSummitDate}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500 font-sans">Total Vertical Climbed</span>
                    <span className="font-bold text-accent">+{selectedPin.totalElevationGainedM.toLocaleString()}m</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500 font-sans">Cumulative Distance</span>
                    <span>{selectedPin.totalDistanceKm} km</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectMountain(selectedPin.mountainId)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-accent hover:bg-accent-hover transition-colors inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Open Full {selectedPin.mountainName} Summit Logs</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
                Click any mountain pin on the map to inspect its summit history.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

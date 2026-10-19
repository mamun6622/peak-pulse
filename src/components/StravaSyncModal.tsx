import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Upload,
  Footprints,
  Calendar,
  Clock,
  TrendingUp,
  Flame,
  Check,
  Shield,
  FileText,
  Key,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Activity, RunningLog } from '../types/activity';
import {
  StravaAuthPayload,
  StravaActivitySummary,
  getStoredStravaAuth,
  clearStoredStravaAuth,
  saveStoredStravaAuth,
  getStravaConfig,
  openStravaOAuthPopup,
  fetchStravaActivities,
  refreshStravaToken,
  SAMPLE_STRAVA_ACTIVITIES,
  convertStravaActivityToRunningLog,
  parseStravaCsv,
  parseGpxFile,
} from '../services/stravaService';

interface StravaSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  existingActivities: Activity[];
  onImportActivities: (importedRuns: RunningLog[]) => Promise<void> | void;
}

export const StravaSyncModal: React.FC<StravaSyncModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  existingActivities,
  onImportActivities,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'token' | 'file'>('oauth');
  const [authData, setAuthData] = useState<StravaAuthPayload | null>(null);
  const [config, setConfig] = useState<{
    configured: boolean;
    clientId: string;
    appUrl: string;
    redirectUri: string;
  } | null>(null);

  // Manual Token & Custom Credentials State
  const [manualToken, setManualToken] = useState<string>('');
  const [customClientId, setCustomClientId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('peakpulse_custom_strava_client_id') || '';
    }
    return '';
  });
  const [customClientSecret, setCustomClientSecret] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('peakpulse_custom_strava_client_secret') || '';
    }
    return '';
  });

  // Status & Data
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [fetchedActivities, setFetchedActivities] = useState<RunningLog[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load config & stored auth on open
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredStravaAuth();
      if (stored) {
        setAuthData(stored);
        if (stored.access_token || stored.refresh_token) {
          loadRunsFromStrava(stored.access_token, stored.refresh_token);
        }
      }
      getStravaConfig().then((cfg) => {
        setConfig(cfg);
        if (cfg.clientId && !customClientId) {
          setCustomClientId(cfg.clientId);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Set of existing activity identifiers for duplicate detection
  const existingKeys = new Set(
    existingActivities.map((a) => {
      if (a.activityType === 'running') {
        return `${a.date}_${Number(a.distanceKm).toFixed(1)}`;
      }
      return `${a.date}_${a.elevationM}`;
    })
  );

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Connect via Strava OAuth Popup
  const handleConnectOAuth = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await openStravaOAuthPopup(customClientId || config?.clientId);
      setAuthData(result);

      if (result.canReadActivities === false) {
        setStatusMessage({
          type: 'info',
          text: `Connected to Strava successfully${
            result.athlete?.firstname ? ` as ${result.athlete.firstname} ${result.athlete.lastname}` : ''
          }! Note: Strava development mode limits API access to the registered developer. You can upload your Strava archive/GPX tracks, enter custom API credentials, or load sample demo runs.`,
        });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: `Connected to Strava successfully${
          result.athlete?.firstname ? ` as ${result.athlete.firstname} ${result.athlete.lastname}` : ''
        }! Fetching your recent activities...`,
      });
      // Fetch runs immediately with both access token and refresh token
      await loadRunsFromStrava(result.access_token, result.refresh_token);
    } catch (err: any) {
      console.warn('OAuth Connect Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to authenticate with Strava. Check callback settings or use the File Upload tab.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch activities using access token and optional refresh token fallback
  const loadRunsFromStrava = async (token?: string, refreshToken?: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const currentAuth = getStoredStravaAuth();
      const tokenToUse = token || currentAuth?.access_token || authData?.access_token || '';
      const refreshToUse = refreshToken || currentAuth?.refresh_token || authData?.refresh_token || '';

      if (!tokenToUse && !refreshToUse) {
        throw new Error('No active Strava session. Please click "Connect with Strava" or paste a token.');
      }

      const rawList = await fetchStravaActivities(
        tokenToUse,
        refreshToUse,
        1,
        100,
        customClientId || undefined,
        customClientSecret || undefined
      );

      // Re-read stored auth if the backend refreshed it
      const updatedAuth = getStoredStravaAuth();
      if (updatedAuth) {
        setAuthData(updatedAuth);
      }

      if (rawList.length === 0) {
        setFetchedActivities([]);
        setSelectedIds(new Set());
        setStatusMessage({
          type: 'info',
          text: 'Connected to Strava successfully, but 0 activities were found. If your activities are private on Strava, ensure the permission allows viewing followers/private activities, or use the Sample Demo Runs below.',
        });
        return;
      }

      const converted = rawList.map(convertStravaActivityToRunningLog);
      setFetchedActivities(converted);

      // Pre-select non-duplicate runs
      const newIds = new Set<string>();
      converted.forEach((run) => {
        const key = `${run.date}_${Number(run.distanceKm).toFixed(1)}`;
        if (!existingKeys.has(key)) {
          newIds.add(run.id);
        }
      });
      setSelectedIds(newIds);

      if (newIds.size === 0) {
        setStatusMessage({
          type: 'info',
          text: `Retrieved ${converted.length} Strava activities. All of them are already logged in your PeakPulse journal!`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Retrieved ${converted.length} Strava activities (${newIds.size} new runs ready to import)!`,
        });
      }
    } catch (err: any) {
      console.error('Fetch activities error:', err);
      let errorText = err.message || 'Could not fetch activities from Strava.';

      if (
        err.isDeveloperAppLimit ||
        err.message?.includes('developer mode') ||
        err.message?.includes('Restriction')
      ) {
        errorText =
          'Strava API Restriction: In Strava developer mode, only the registered developer account can access activities via API. You can import all your runs immediately via the File Upload tab (.csv or .gpx), enter your personal Strava credentials, or load sample runs.';
      } else if (err.needsActivityPermission || err.status === 403) {
        errorText =
          'Strava activity permission missing. When the Strava popup opens, please check the box: ☑ "View data about your activities". If you already checked it, import your runs directly via the Strava Archive Upload tab (.csv or .gpx)!';
      }

      setStatusMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Token tab manual sync
  const handleManualTokenSync = async () => {
    if (!manualToken.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Strava Access Token.' });
      return;
    }
    const cleanToken = manualToken
      .trim()
      .replace(/^Bearer\s+/i, '')
      .replace(/^["']|["']$/g, '');

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Connecting to Strava and validating token...' });

    try {
      // 1. Try directly fetching activities with this token (both as access_token and refresh fallback)
      const rawList = await fetchStravaActivities(cleanToken, cleanToken);
      const converted = rawList.map(convertStravaActivityToRunningLog);

      const mockAuth: StravaAuthPayload = {
        access_token: cleanToken,
        refresh_token: cleanToken,
        expires_at: Math.floor(Date.now() / 1000) + 21600,
      };
      saveStoredStravaAuth(mockAuth);
      setAuthData(mockAuth);
      setFetchedActivities(converted);

      const newIds = new Set<string>();
      converted.forEach((run) => {
        const key = `${run.date}_${Number(run.distanceKm).toFixed(1)}`;
        if (!existingKeys.has(key)) {
          newIds.add(run.id);
        }
      });
      setSelectedIds(newIds);

      setStatusMessage({
        type: 'success',
        text: `Connected! Retrieved ${converted.length} Strava activities (${newIds.size} new runs ready to import)!`,
      });
    } catch (err: any) {
      console.warn('Direct token fetch failed, testing if token is a Strava refresh token:', err);

      // 2. If direct fetch failed with authorization error, test if user entered their Refresh Token
      try {
        const refreshed = await refreshStravaToken(cleanToken);
        setAuthData(refreshed);
        const rawList = await fetchStravaActivities(refreshed.access_token, refreshed.refresh_token);
        const converted = rawList.map(convertStravaActivityToRunningLog);
        setFetchedActivities(converted);

        const newIds = new Set<string>();
        converted.forEach((run) => {
          const key = `${run.date}_${Number(run.distanceKm).toFixed(1)}`;
          if (!existingKeys.has(key)) {
            newIds.add(run.id);
          }
        });
        setSelectedIds(newIds);

        setStatusMessage({
          type: 'success',
          text: `Connected via Refresh Token! Retrieved ${converted.length} activities (${newIds.size} ready to import)!`,
        });
        return;
      } catch (refreshErr) {
        console.error('Refresh token test also failed:', refreshErr);
      }

      setStatusMessage({
        type: 'error',
        text: err.message || 'Strava token rejected. Please check your token or use the 1-Click Connect (OAuth) tab.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample demo Strava activities for instant testing
  const handleLoadSampleRuns = () => {
    const converted = SAMPLE_STRAVA_ACTIVITIES.map(convertStravaActivityToRunningLog);
    setFetchedActivities(converted);

    const newIds = new Set<string>();
    converted.forEach((run) => {
      const key = `${run.date}_${Number(run.distanceKm).toFixed(1)}`;
      if (!existingKeys.has(key)) {
        newIds.add(run.id);
      }
    });
    setSelectedIds(newIds);

    setStatusMessage({
      type: 'success',
      text: `Loaded ${converted.length} sample Strava Korea activities (${newIds.size} ready to import)!`,
    });
  };

  // Handle CSV upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let runs: RunningLog[] = [];

        if (file.name.toLowerCase().endsWith('.gpx')) {
          runs = [parseGpxFile(content, file.name)];
        } else {
          runs = parseStravaCsv(content);
        }

        if (runs.length === 0) {
          setStatusMessage({
            type: 'error',
            text: 'No running activities found in this file. Ensure it is a Strava activities.csv or valid .gpx file.',
          });
          return;
        }

        setFetchedActivities(runs);

        const newIds = new Set<string>();
        runs.forEach((r) => {
          const key = `${r.date}_${Number(r.distanceKm).toFixed(1)}`;
          if (!existingKeys.has(key)) {
            newIds.add(r.id);
          }
        });
        setSelectedIds(newIds);

        setStatusMessage({
          type: 'success',
          text: `Parsed ${runs.length} activities from ${file.name} (${newIds.size} ready to import)!`,
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Error parsing file.',
        });
      }
    };
    reader.readAsText(file);
  };

  // Disconnect Strava
  const handleDisconnect = () => {
    clearStoredStravaAuth();
    setAuthData(null);
    setFetchedActivities([]);
    setSelectedIds(new Set());
    setStatusMessage({ type: 'info', text: 'Strava account disconnected.' });
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(fetchedActivities.map((a) => a.id));
    setSelectedIds(all);
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  // Import selected activities
  const handlePerformImport = async () => {
    const toImport = fetchedActivities.filter((a) => selectedIds.has(a.id));
    if (toImport.length === 0) {
      setStatusMessage({ type: 'error', text: 'Select at least one activity to import.' });
      return;
    }

    setIsLoading(true);
    try {
      await onImportActivities(toImport);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${toImport.length} running logs into PeakPulse!`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to import activities.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Runtime Callback & Domain URLs from guidelines
  const devCallbackUrl = config?.redirectUri || 'https://ais-dev-bsfc4ebqtvvi2c3ds547fl-119704032071.asia-northeast1.run.app/auth/callback';
  const sharedCallbackUrl = 'https://ais-pre-bsfc4ebqtvvi2c3ds547fl-119704032071.asia-northeast1.run.app/auth/callback';
  const callbackDomain = 'ais-dev-bsfc4ebqtvvi2c3ds547fl-119704032071.asia-northeast1.run.app';

  if (!isAdmin) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 w-full max-w-full"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Admin Authorization Required
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            Strava OAuth authorization and workout synchronization are restricted to the verified journal owner in Admin mode. Viewer mode is strictly read-only.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Return to Public View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 w-full max-w-full"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] w-full max-w-full">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fc4c02]/15 border border-[#fc4c02]/30 flex items-center justify-center text-[#fc4c02]">
              <span className="font-extrabold text-lg">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                  Strava Running Sync &amp; Import
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fc4c02]/15 text-[#fc4c02] border border-[#fc4c02]/30">
                  STRAVA API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Import all your runs, trail runs, and walks from Strava into PeakPulse Korea.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Strava Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'bg-accent text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡ 1-Click Connect (OAuth)</span>
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'token'
                ? 'bg-accent text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Personal Access Token</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'bg-accent text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Strava Archive / GPX Upload</span>
          </button>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div
            className={`p-3 text-xs mx-5 mt-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-accent-subtle border border-accent-border text-accent'
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span>{statusMessage.text}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {statusMessage.type === 'error' && (
                <>
                  <button
                    onClick={handleConnectOAuth}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-lg bg-[#fc4c02] text-white font-bold text-[11px] inline-flex items-center gap-1 hover:bg-[#e34402] cursor-pointer"
                  >
                    <span>⚡ Reconnect & Check Box</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('file')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-accent" />
                    <span>Upload CSV / GPX</span>
                  </button>
                  <button
                    onClick={handleLoadSampleRuns}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>Demo Runs</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setStatusMessage(null)}
                className="p-1 hover:opacity-75 cursor-pointer text-slate-400"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Live OAuth Connect */}
          {activeTab === 'oauth' && (
            <div className="space-y-5">
              {/* Important Strava Permission Guidance */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <span className="text-base leading-none shrink-0 mt-0.5">💡</span>
                <div className="flex-1 leading-relaxed">
                  <strong className="text-amber-300 font-semibold">Important Strava Permission Step:</strong> When Strava&apos;s authorization window opens, make sure the checkbox{' '}
                  <span className="inline-block bg-slate-900 border border-amber-500/40 text-amber-300 font-mono text-[11px] px-1.5 py-0.5 rounded mx-1">
                    ☑ View data about your activities
                  </span>{' '}
                  is checked. Strava will not allow PeakPulse to import your runs if this box is unchecked.
                </div>
              </div>

              {/* Account Connection Status */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      authData?.athlete
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {authData?.athlete?.profile ? (
                      <img
                        src={authData.athlete.profile}
                        alt="Strava Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '🏃'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">
                        {authData?.athlete
                          ? `${authData.athlete.firstname} ${authData.athlete.lastname}`
                          : 'Strava Account: Not Connected'}
                      </span>
                      {authData && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            authData.expires_at &&
                            Math.floor(Date.now() / 1000) > authData.expires_at &&
                            !authData.refresh_token
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {authData.expires_at &&
                          Math.floor(Date.now() / 1000) > authData.expires_at &&
                          !authData.refresh_token
                            ? 'Needs Renewal'
                            : 'Active Sync'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {authData?.athlete?.city
                        ? `Athlete in ${authData.athlete.city}, ${authData.athlete.country || ''}`
                        : 'Connect with Strava to automatically retrieve your runs'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {authData ? (
                    <>
                      <button
                        onClick={() => loadRunsFromStrava(authData.access_token, authData.refresh_token)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-accent text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Runs</span>
                      </button>
                      <button
                        onClick={handleLoadSampleRuns}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                        title="Load realistic sample Strava runs for instant testing"
                      >
                        <Sparkles className="w-3 h-3 text-accent" />
                        <span>Sample Runs</span>
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleConnectOAuth}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-[#fc4c02] hover:bg-[#e34402] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-[#fc4c02]/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-base">⚡</span>
                        <span>{isLoading ? 'Opening Strava...' : 'Connect with Strava'}</span>
                      </button>
                      <button
                        onClick={handleLoadSampleRuns}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span>Demo Runs</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick alternatives bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <span className="font-medium text-slate-300">Fast Alternatives:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('file')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3 h-3 text-accent" />
                    <span>Upload Strava Archive (.csv / .gpx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleRuns}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>Load Demo Runs</span>
                  </button>
                </div>
              </div>

              {/* Developer / Provider Setup Card with Required URLs */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span>Strava API Dashboard Configuration</span>
                  </span>
                  <a
                    href="https://www.strava.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#fc4c02] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Open Strava Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To connect via Strava OAuth, create a free API app at{' '}
                  <strong className="text-slate-200">strava.com/settings/api</strong> and register these
                  required callback URLs:
                </p>

                {/* Exact Callback URLs */}
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Authorization Callback Domain:</span>
                      <button
                        onClick={() => copyToClipboard(callbackDomain, 'domain')}
                        className="text-accent hover:underline inline-flex items-center gap-1"
                      >
                        {copiedField === 'domain' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'domain' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 select-all truncate text-[11px]">
                      {callbackDomain}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Development Callback URL:</span>
                      <button
                        onClick={() => copyToClipboard(devCallbackUrl, 'dev')}
                        className="text-accent hover:underline inline-flex items-center gap-1"
                      >
                        {copiedField === 'dev' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'dev' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 select-all truncate text-[11px]">
                      {devCallbackUrl}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Shared / Deployed Callback URL:</span>
                      <button
                        onClick={() => copyToClipboard(sharedCallbackUrl, 'shared')}
                        className="text-accent hover:underline inline-flex items-center gap-1"
                      >
                        {copiedField === 'shared' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'shared' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 select-all truncate text-[11px]">
                      {sharedCallbackUrl}
                    </div>
                  </div>
                </div>

                {/* Optional Strava Client ID & Secret input */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Personal Strava Developer App Credentials (Optional):
                    </span>
                    {(customClientId || customClientSecret) && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('peakpulse_custom_strava_client_id', customClientId);
                          localStorage.setItem('peakpulse_custom_strava_client_secret', customClientSecret);
                          setStatusMessage({ type: 'success', text: 'Saved custom Strava API credentials to browser storage!' });
                        }}
                        className="text-[10px] text-accent font-semibold hover:underline cursor-pointer"
                      >
                        Save Credentials
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Client ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 103779"
                        value={customClientId}
                        onChange={(e) => {
                          setCustomClientId(e.target.value);
                          localStorage.setItem('peakpulse_custom_strava_client_id', e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Client Secret</label>
                      <input
                        type="password"
                        placeholder="Your 40-char client secret"
                        value={customClientSecret}
                        onChange={(e) => {
                          setCustomClientSecret(e.target.value);
                          localStorage.setItem('peakpulse_custom_strava_client_secret', e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Personal Access Token */}
          {activeTab === 'token' && (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Key className="w-4 h-4 text-accent" />
                    <span>Instant Sync via Personal Access Token</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Every Strava user has a personal &quot;Your Access Token&quot; on their Strava API
                    page. Paste it here to fetch your activities.
                  </p>
                </div>
                <a
                  href="https://www.strava.com/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs text-[#fc4c02] bg-[#fc4c02]/10 border border-[#fc4c02]/30 rounded-lg hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Get Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <span>💡 Note on Strava API Default Permissions:</span>
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The default &quot;Your Access Token&quot; shown on Strava&apos;s developer page has <code className="text-amber-300 font-mono">read</code> scope only. To access activities, Strava requires <code className="text-accent font-mono">activity:read_all</code>. If you get a 403 Forbidden error with a personal token, use the <strong className="text-slate-200">Strava Archive / GPX Upload</strong> tab (no developer limits) or OAuth tab!
                </p>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
                  Strava Access Token
                </label>
                <input
                  type="password"
                  placeholder="Paste your 40-character Strava token (e.g. 7c91a0...)"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-accent"
                />
              </div>

              <button
                onClick={handleManualTokenSync}
                disabled={isLoading || !manualToken.trim()}
                className="w-full py-2.5 rounded-xl bg-accent text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Fetching Activities...' : 'Fetch Strava Activities'}</span>
              </button>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Import Strava archive (.csv / .gpx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleRuns}
                  className="text-accent font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample Korea Runs</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Strava File Upload */}
          {activeTab === 'file' && (
            <div className="p-6 rounded-xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-accent-border text-accent mx-auto flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Import Strava Archive or GPX File
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Export your bulk archive from{' '}
                  <strong className="text-slate-200">Strava &gt; Settings &gt; Download My Data</strong> and
                  drop your <code className="text-accent font-mono text-[11px]">activities.csv</code> or any{' '}
                  <code className="text-accent font-mono text-[11px]">.gpx</code> track here.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-accent" />
                <span>Select activities.csv or .gpx</span>
                <input
                  type="file"
                  accept=".csv,.gpx"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* RETRIEVED ACTIVITIES PREVIEW & IMPORT LIST */}
          {fetchedActivities.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-accent" />
                    <span>Retrieved Strava Activities ({fetchedActivities.length})</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Select activities you wish to import into PeakPulse Korea.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={selectAll}
                    className="text-accent hover:underline cursor-pointer font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    onClick={selectNone}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {fetchedActivities.map((run) => {
                  const key = `${run.date}_${Number(run.distanceKm).toFixed(1)}`;
                  const isAlreadyLogged = existingKeys.has(key);
                  const isChecked = selectedIds.has(run.id);

                  return (
                    <div
                      key={run.id}
                      onClick={() => toggleSelect(run.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-slate-950 border-accent/60 shadow-sm'
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-accent focus:ring-accent cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-100">
                              {run.title}
                            </span>
                            {isAlreadyLogged && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Already in PeakPulse
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-subtle text-accent border border-accent-border">
                              {run.routeType}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{run.date}</span>
                            </span>
                            <span>{run.distanceKm} km</span>
                            <span>{run.durationMinutes} min</span>
                            <span>{run.paceMinPerKm} /km</span>
                            {run.elevationGainM > 0 && <span>+{run.elevationGainM}m</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-accent">
                          {run.distanceKm} km
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Import Action Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-300">
                  Ready to import <strong className="text-accent">{selectedIds.size}</strong> of{' '}
                  {fetchedActivities.length} activities
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePerformImport}
                    disabled={isLoading || selectedIds.size === 0}
                    className="px-5 py-2 rounded-xl bg-accent text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Import {selectedIds.size} Runs to PeakPulse</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  Video,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  Radio,
  FileSpreadsheet,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { MeetingRecord } from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  listConferenceRecords,
  processConferenceRecord,
  createMeetingSpace,
} from './services/meetApi';
import {
  getSavedMeetings,
  upsertMeeting,
  deleteMeeting as removeMeetingFromStorage,
  saveMeetings,
  getDefaultSampleMeetings,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { MeetingListCard } from './components/MeetingListCard';
import { MeetingDetailsView } from './components/MeetingDetailsView';
import { LiveTrackerModal } from './components/LiveTrackerModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ExportModal } from './components/ExportModal';
import { generateCsvAttendance, downloadFile } from './utils/formatters';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Meetings state
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & UI states
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);
  const [liveTrackerCode, setLiveTrackerCode] = useState('');
  const [liveTrackerTitle, setLiveTrackerTitle] = useState('');
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [isFetchingRecords, setIsFetchingRecords] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Destructive delete confirmation
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingRecord | null>(null);

  // Export modal state
  const [exportMeeting, setExportMeeting] = useState<MeetingRecord | null>(null);

  // Load saved meetings on initial mount
  useEffect(() => {
    const saved = getSavedMeetings();
    setMeetings(saved);
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setApiNotice(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setBannerSuccess(`Successfully signed in as ${result.user.displayName || result.user.email}!`);
        setTimeout(() => setBannerSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setBannerSuccess('Signed out of Google account.');
    setTimeout(() => setBannerSuccess(null), 3000);
  };

  // Fetch past/ongoing conference records from Google Meet API
  const handleFetchMeetRecords = useCallback(async () => {
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      setAuthError('Please connect your Google account to fetch Google Meet records.');
      return;
    }

    setIsFetchingRecords(true);
    setApiNotice(null);
    setAuthError(null);

    try {
      const { conferenceRecords } = await listConferenceRecords(token, 15);

      if (!conferenceRecords || conferenceRecords.length === 0) {
        setApiNotice(
          'No recent Google Meet conference records found for your account, or attendance tracking is limited by your Google Workspace edition. You can create a new meeting or use the Live Tracker to log attendance in real-time!'
        );
        return;
      }

      // Process each conference record
      const processedMeetings: MeetingRecord[] = [];
      for (const conf of conferenceRecords) {
        try {
          const rec = await processConferenceRecord(token, conf);
          processedMeetings.push(rec);
          upsertMeeting(rec);
        } catch (procErr) {
          console.warn('Failed to process conference record:', conf.name, procErr);
        }
      }

      if (processedMeetings.length > 0) {
        setMeetings(getSavedMeetings());
        setBannerSuccess(`Successfully imported ${processedMeetings.length} Google Meet conference records!`);
        setTimeout(() => setBannerSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('Meet API error:', err);
      // Give a helpful, user-friendly explanation
      if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
        setApiNotice(
          'Google Meet REST Conference Records API requires a Google Workspace edition (Business, Enterprise, or Education). You can still create instant Google Meets and use our Live Attendance Tracker to track attendee duration and export full reports!'
        );
      } else {
        setApiNotice(`Google Meet API Notice: ${err.message}`);
      }
    } finally {
      setIsFetchingRecords(false);
    }
  }, [accessToken]);

  // Create an instant Google Meet Space via Google Meet API
  const handleCreateInstantMeet = async () => {
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      handleSignIn();
      return;
    }

    setIsCreatingMeet(true);
    try {
      const space = await createMeetingSpace(token);
      // Space created successfully!
      const meetCode = space.meetingCode || space.name.replace('spaces/', '');
      setLiveTrackerCode(meetCode);
      setLiveTrackerTitle(`Meet Session: ${meetCode}`);
      setIsLiveTrackerOpen(true);
      setBannerSuccess(`Created Google Meet: meet.google.com/${meetCode}`);
      setTimeout(() => setBannerSuccess(null), 5000);
    } catch (err: any) {
      console.error('Create Meet error:', err);
      // Fallback: prompt for code or launch live tracker
      setLiveTrackerCode('');
      setLiveTrackerTitle('New Google Meet Session');
      setIsLiveTrackerOpen(true);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  // Save a newly finished or updated meeting record
  const handleSaveMeeting = (newMeeting: MeetingRecord) => {
    upsertMeeting(newMeeting);
    const updated = getSavedMeetings();
    setMeetings(updated);
    setSelectedMeetingId(newMeeting.id);
    setBannerSuccess(`Attendance log saved for "${newMeeting.title}" with ${newMeeting.attendees.length} attendees.`);
    setTimeout(() => setBannerSuccess(null), 4000);
  };

  // Confirm and execute destructive meeting deletion
  const handleConfirmDelete = () => {
    if (!meetingToDelete) return;
    removeMeetingFromStorage(meetingToDelete.id);
    setMeetings(getSavedMeetings());
    if (selectedMeetingId === meetingToDelete.id) {
      setSelectedMeetingId(null);
    }
    setBannerSuccess(`Deleted attendance log for "${meetingToDelete.title}".`);
    setTimeout(() => setBannerSuccess(null), 3000);
    setMeetingToDelete(null);
  };

  // Reset to sample meetings for demo/exploration
  const handleResetSampleData = () => {
    const samples = getDefaultSampleMeetings();
    saveMeetings(samples);
    setMeetings(samples);
    setBannerSuccess('Loaded sample Google Meet conference attendance logs.');
    setTimeout(() => setBannerSuccess(null), 3000);
  };

  // Filter meetings by search query
  const filteredMeetings = meetings.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      (m.meetingCode && m.meetingCode.toLowerCase().includes(q)) ||
      m.attendees.some((a) => a.displayName.toLowerCase().includes(q))
    );
  });

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || null;

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        isLoadingAuth={isLoadingAuth}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenLiveTracker={() => {
          setLiveTrackerCode('');
          setLiveTrackerTitle('Live Google Meet Session');
          setIsLiveTrackerOpen(true);
        }}
        onCreateInstantMeet={handleCreateInstantMeet}
        isCreatingMeet={isCreatingMeet}
        onRefreshRecords={handleFetchMeetRecords}
        isRefreshing={isFetchingRecords}
      />

      {/* Notification Toast / Banner */}
      {bannerSuccess && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 text-center flex items-center justify-center space-x-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedMeeting ? (
          /* Detailed View for a Single Meeting */
          <MeetingDetailsView
            meeting={selectedMeeting}
            onBack={() => setSelectedMeetingId(null)}
            onDeleteMeeting={(id) => {
              const m = meetings.find((item) => item.id === id);
              if (m) setMeetingToDelete(m);
            }}
          />
        ) : (
          /* Dashboard Home View */
          <div className="space-y-8">
            {/* Hero / Action Header */}
            <div className="bg-linear-to-r from-gray-900 via-indigo-950 to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-40 -top-10 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-3 border border-white/10">
                  <Video className="w-3.5 h-3.5" />
                  <span>Google Meet Attendance Intelligence</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Track Meet Attendees & Duration Logs
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-300 leading-relaxed">
                  Monitor who joined each call, analyze attendee presence durations, identify late arrivals, and generate comprehensive roster reports.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setLiveTrackerCode('');
                      setLiveTrackerTitle('Live Google Meet Session');
                      setIsLiveTrackerOpen(true);
                    }}
                    className="px-5 py-2.5 text-sm font-bold text-gray-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-emerald-950 animate-pulse" />
                    <span>Start Live Attendance Tracker</span>
                  </button>

                  {user ? (
                    <button
                      onClick={handleFetchMeetRecords}
                      disabled={isFetchingRecords}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetchingRecords ? 'animate-spin' : ''}`} />
                      <span>{isFetchingRecords ? 'Syncing Records...' : 'Sync Meet Records'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center space-x-2 transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-emerald-400" />
                      <span>Connect Google Account</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* API Notices / Guidance */}
            {authError && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{authError}</p>
                </div>
              </div>
            )}

            {apiNotice && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{apiNotice}</p>
                </div>
              </div>
            )}

            {/* Aggregate Stats Overview */}
            <section aria-labelledby="stats-heading">
              <h2 id="stats-heading" className="sr-only">
                Attendance Statistics Overview
              </h2>
              <StatsOverview meetings={meetings} />
            </section>

            {/* Meeting Conferences Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Tracked Conferences & Sessions ({meetings.length})
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Click any meeting card to inspect full participant duration intervals and export rosters.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search meetings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleResetSampleData}
                    title="Reload sample meetings with rich multi-session attendance data"
                    className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center space-x-1 cursor-pointer flex-shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Load Sample Data</span>
                  </button>
                </div>
              </div>

              {/* Meetings Grid */}
              {filteredMeetings.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs">
                  <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-base font-bold text-gray-800">No meeting conferences found</h3>
                  <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No meetings match your search query.'
                      : 'Get started by tracking a live Google Meet or syncing your Google Workspace account.'}
                  </p>
                  <div className="mt-5 flex justify-center space-x-3">
                    <button
                      onClick={() => setIsLiveTrackerOpen(true)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                    >
                      Track First Meeting
                    </button>
                    <button
                      onClick={handleResetSampleData}
                      className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                    >
                      Load Sample Data
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredMeetings.map((meeting) => (
                    <MeetingListCard
                      key={meeting.id}
                      meeting={meeting}
                      onSelect={(m) => setSelectedMeetingId(m.id)}
                      onExport={(m) => setExportMeeting(m)}
                      onDelete={(m) => setMeetingToDelete(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Live Stopwatch & Participant Attendance Tracker Modal */}
      <LiveTrackerModal
        isOpen={isLiveTrackerOpen}
        onClose={() => setIsLiveTrackerOpen(false)}
        onSaveMeeting={handleSaveMeeting}
        initialMeetingCode={liveTrackerCode}
        initialTitle={liveTrackerTitle}
      />

      {/* Safe Destructive Delete Confirmation Modal (required by Workspace skill) */}
      <ConfirmModal
        isOpen={!!meetingToDelete}
        title="Delete Attendance Log?"
        message={`Are you sure you want to permanently delete the attendance record for "${meetingToDelete?.title}" (${meetingToDelete?.attendees.length} attendees)? This action cannot be undone.`}
        confirmLabel="Delete Record"
        cancelLabel="Keep Record"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMeetingToDelete(null)}
      />

      {/* Quick Export Modal */}
      {exportMeeting && (
        <ExportModal
          isOpen={!!exportMeeting}
          meeting={exportMeeting}
          onClose={() => setExportMeeting(null)}
        />
      )}
    </div>
  );
}

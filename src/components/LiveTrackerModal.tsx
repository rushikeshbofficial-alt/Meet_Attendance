import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  UserPlus,
  Clock,
  CheckCircle,
  LogOut,
  LogIn,
  Trash2,
  Users,
  Video,
  ExternalLink,
} from 'lucide-react';
import { MeetingRecord, AttendeeAttendanceRecord, SessionInterval } from '../types';
import { formatDuration } from '../utils/formatters';

interface LiveTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeeting: (meeting: MeetingRecord) => void;
  initialMeetingCode?: string;
  initialTitle?: string;
}

export const LiveTrackerModal: React.FC<LiveTrackerModalProps> = ({
  isOpen,
  onClose,
  onSaveMeeting,
  initialMeetingCode = '',
  initialTitle = 'Live Team Standup & Sync',
}) => {
  const [meetingTitle, setMeetingTitle] = useState(initialTitle);
  const [meetingCode, setMeetingCode] = useState(initialMeetingCode);
  const [startTime] = useState<string>(new Date().toISOString());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [attendees, setAttendees] = useState<AttendeeAttendanceRecord[]>([]);

  // Add attendee form
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Tick elapsed time every second
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const startMs = Date.parse(startTime);
  const elapsedMeetingSec = Math.max(1, Math.floor((currentTime - startMs) / 1000));

  // Compute live duration for each attendee
  const getLiveDurationSeconds = (attendee: AttendeeAttendanceRecord): number => {
    let sum = 0;
    attendee.sessions.forEach((s) => {
      const sStart = Date.parse(s.startTime);
      if (s.endTime) {
        sum += Math.max(0, Math.floor((Date.parse(s.endTime) - sStart) / 1000));
      } else {
        // active ongoing session
        sum += Math.max(0, Math.floor((currentTime - sStart) / 1000));
      }
    });
    return sum;
  };

  const handleAddAttendee = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAttendeeName.trim()) return;

    const nowIso = new Date().toISOString();
    const newAttendee: AttendeeAttendanceRecord = {
      id: `live-att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      displayName: newAttendeeName.trim(),
      email: newAttendeeEmail.trim() || undefined,
      userType: 'signedin',
      firstJoinTime: nowIso,
      sessions: [
        {
          id: `s-${Date.now()}`,
          startTime: nowIso,
          durationSeconds: 0,
        },
      ],
      totalDurationSeconds: 0,
      attendancePercentage: 100,
      isCurrentlyPresent: true,
      status: 'on_time',
    };

    setAttendees((prev) => [newAttendee, ...prev]);
    setNewAttendeeName('');
    setNewAttendeeEmail('');
  };

  const handleBulkAdd = () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const nowIso = new Date().toISOString();
    const newItems: AttendeeAttendanceRecord[] = lines.map((line, idx) => {
      // Check if line contains an email in parentheses or brackets: e.g. "John Doe (john@example.com)"
      const emailMatch = line.match(/<([^>]+)>|\(([^)]+)\)/);
      const email = emailMatch ? emailMatch[1] || emailMatch[2] : undefined;
      const displayName = line.replace(/<([^>]+)>|\(([^)]+)\)/, '').trim() || line;

      return {
        id: `bulk-att-${Date.now()}-${idx}`,
        displayName,
        email,
        userType: 'signedin',
        firstJoinTime: nowIso,
        sessions: [
          {
            id: `s-${Date.now()}-${idx}`,
            startTime: nowIso,
            durationSeconds: 0,
          },
        ],
        totalDurationSeconds: 0,
        attendancePercentage: 100,
        isCurrentlyPresent: true,
        status: 'on_time',
      };
    });

    setAttendees((prev) => [...newItems, ...prev]);
    setBulkInput('');
    setShowBulkInput(false);
  };

  const handleTogglePresence = (attendeeId: string) => {
    const nowIso = new Date().toISOString();
    setAttendees((prev) =>
      prev.map((att) => {
        if (att.id !== attendeeId) return att;

        if (att.isCurrentlyPresent) {
          // Marking as Left: close the current active session
          const updatedSessions = att.sessions.map((s, idx) => {
            if (idx === att.sessions.length - 1 && !s.endTime) {
              const dur = Math.max(0, Math.floor((Date.now() - Date.parse(s.startTime)) / 1000));
              return { ...s, endTime: nowIso, durationSeconds: dur };
            }
            return s;
          });

          return {
            ...att,
            isCurrentlyPresent: false,
            lastLeaveTime: nowIso,
            sessions: updatedSessions,
          };
        } else {
          // Re-joining: start a new session
          const newSession: SessionInterval = {
            id: `s-${Date.now()}`,
            startTime: nowIso,
            durationSeconds: 0,
          };

          return {
            ...att,
            isCurrentlyPresent: true,
            sessions: [...att.sessions, newSession],
          };
        }
      })
    );
  };

  const handleRemoveAttendee = (attendeeId: string) => {
    setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
  };

  const handleFinishAndSave = () => {
    const endIso = new Date().toISOString();
    const finalMeetingDuration = elapsedMeetingSec;

    // Finalize all attendee sessions
    const finalizedAttendees: AttendeeAttendanceRecord[] = attendees.map((att) => {
      const liveDuration = getLiveDurationSeconds(att);
      const percentage = Math.min(100, Math.round((liveDuration / finalMeetingDuration) * 100));

      const updatedSessions = att.sessions.map((s) => {
        if (!s.endTime) {
          const dur = Math.max(0, Math.floor((Date.parse(endIso) - Date.parse(s.startTime)) / 1000));
          return { ...s, endTime: endIso, durationSeconds: dur };
        }
        return s;
      });

      const firstJoinOffsetSec = (Date.parse(att.firstJoinTime) - startMs) / 1000;
      let status: AttendeeAttendanceRecord['status'] = 'present_throughout';

      if (percentage >= 85) {
        status = 'present_throughout';
      } else if (firstJoinOffsetSec > 300) {
        status = 'late';
      } else if (!att.isCurrentlyPresent) {
        status = 'left_early';
      } else {
        status = 'partial';
      }

      return {
        ...att,
        sessions: updatedSessions,
        totalDurationSeconds: liveDuration,
        attendancePercentage: percentage,
        isCurrentlyPresent: false,
        lastLeaveTime: att.isCurrentlyPresent ? endIso : att.lastLeaveTime || endIso,
        status,
      };
    });

    const finalMeeting: MeetingRecord = {
      id: `live-record-${Date.now()}`,
      title: meetingTitle || 'Live Google Meet Session',
      meetingCode: meetingCode || undefined,
      meetingUri: meetingCode ? `https://meet.google.com/${meetingCode}` : undefined,
      startTime,
      endTime: endIso,
      totalDurationSeconds: finalMeetingDuration,
      attendees: finalizedAttendees,
      createdAt: startTime,
      notes: `Tracked live with ${finalizedAttendees.length} attendees.`,
    };

    onSaveMeeting(finalMeeting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-linear-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/30" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">Live Meet Attendance Tracker</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  RECORDING DURATION
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Elapsed Meeting Time:{' '}
                <span className="font-mono font-bold text-white text-sm">
                  {formatDuration(elapsedMeetingSec)}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meeting Info Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="e.g. Daily Engineering Standup"
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Google Meet Code / Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                placeholder="e.g. abc-defg-hij"
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              {meetingCode && (
                <a
                  href={
                    meetingCode.startsWith('http')
                      ? meetingCode
                      : `https://meet.google.com/${meetingCode}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center space-x-1 border border-emerald-200"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Attendees Section */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Add attendee form */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Log Attendee Arrival</span>
              </span>
              <button
                type="button"
                onClick={() => setShowBulkInput(!showBulkInput)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
              >
                {showBulkInput ? '← Single Entry' : '+ Bulk Import Names'}
              </button>
            </div>

            {showBulkInput ? (
              <div className="space-y-3">
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Paste roster or chat names (one per line):&#10;Rushikesh Birajdar (rushikesh@example.com)&#10;Sarah Jenkins&#10;Alex Chen"
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowBulkInput(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    Add All Participants
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddAttendee} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newAttendeeName}
                  onChange={(e) => setNewAttendeeName(e.target.value)}
                  placeholder="Participant Full Name *"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  value={newAttendeeEmail}
                  onChange={(e) => setNewAttendeeEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full sm:w-56 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newAttendeeName.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Mark Joined</span>
                </button>
              </form>
            )}
          </div>

          {/* Attendee Live Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-gray-100/70 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
              <span className="text-xs font-bold text-gray-700">
                Active Participants ({attendees.filter((a) => a.isCurrentlyPresent).length} /{' '}
                {attendees.length} in call)
              </span>
              <span className="text-xs text-gray-600">
                Live Duration updates continuously
              </span>
            </div>

            {attendees.length === 0 ? (
              <div className="p-8 text-center bg-white text-gray-600">
                <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-700">No attendees logged yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Type a name above or click "Bulk Import" to log participants as they join your
                  Google Meet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 bg-white">
                {attendees.map((attendee) => {
                  const liveSec = getLiveDurationSeconds(attendee);
                  const currentPct = Math.min(100, Math.round((liveSec / elapsedMeetingSec) * 100));

                  return (
                    <div
                      key={attendee.id}
                      className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            attendee.isCurrentlyPresent
                              ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20'
                              : 'bg-gray-300'
                          }`}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-900">
                              {attendee.displayName}
                            </span>
                            {attendee.sessions.length > 1 && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-md font-medium">
                                {attendee.sessions.length} sessions
                              </span>
                            )}
                          </div>
                          {attendee.email && (
                            <span className="text-xs text-gray-600">{attendee.email}</span>
                          )}
                        </div>
                      </div>

                      {/* Live Duration and Actions */}
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-1.5 justify-end">
                            <Clock
                              className={`w-3.5 h-3.5 ${
                                attendee.isCurrentlyPresent
                                  ? 'text-emerald-600 animate-spin-slow'
                                  : 'text-gray-600'
                              }`}
                            />
                            <span
                              className={`font-mono text-sm font-bold ${
                                attendee.isCurrentlyPresent
                                  ? 'text-emerald-700'
                                  : 'text-gray-600'
                              }`}
                            >
                              {formatDuration(liveSec)}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-600">
                            {currentPct}% of meeting
                          </span>
                        </div>

                        {/* Toggle button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePresence(attendee.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors ${
                            attendee.isCurrentlyPresent
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {attendee.isCurrentlyPresent ? (
                            <>
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Mark Left</span>
                            </>
                          ) : (
                            <>
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Re-join</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(attendee.id)}
                          className="p-1.5 text-gray-600 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Remove attendee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Total Logged Duration: <strong className="text-gray-900">{formatDuration(elapsedMeetingSec)}</strong>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleFinishAndSave}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>End & Save Attendance Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

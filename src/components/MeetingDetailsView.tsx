import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Search,
  Download,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Video,
  Timer,
  Info,
} from 'lucide-react';
import { MeetingRecord, AttendeeAttendanceRecord, AttendanceFilter } from '../types';
import {
  formatDuration,
  formatDateTime,
  formatTime,
} from '../utils/formatters';
import { AttendeeTimeline } from './AttendeeTimeline';
import { ExportModal } from './ExportModal';

interface MeetingDetailsViewProps {
  meeting: MeetingRecord;
  onBack: () => void;
  onDeleteMeeting?: (id: string) => void;
}

export const MeetingDetailsView: React.FC<MeetingDetailsViewProps> = ({
  meeting,
  onBack,
}) => {
  const [filter, setFilter] = useState<AttendanceFilter>({
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'duration_desc',
  });
  const [expandedAttendeeId, setExpandedAttendeeId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const startMs = Date.parse(meeting.startTime);
  const endMs = meeting.endTime ? Date.parse(meeting.endTime) : Date.now();

  // Filter and sort attendees
  const filteredAttendees = meeting.attendees
    .filter((att) => {
      const q = filter.searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        att.displayName.toLowerCase().includes(q) ||
        (att.email && att.email.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filter.statusFilter === 'all') return true;
      if (filter.statusFilter === 'on_time')
        return att.status === 'on_time' || att.status === 'present_throughout';
      if (filter.statusFilter === 'late') return att.status === 'late';
      if (filter.statusFilter === 'present_throughout')
        return att.status === 'present_throughout';
      if (filter.statusFilter === 'partial')
        return att.status === 'partial' || att.status === 'left_early';
      return true;
    })
    .sort((a, b) => {
      if (filter.sortBy === 'duration_desc') return b.totalDurationSeconds - a.totalDurationSeconds;
      if (filter.sortBy === 'duration_asc') return a.totalDurationSeconds - b.totalDurationSeconds;
      if (filter.sortBy === 'percentage_desc')
        return b.attendancePercentage - a.attendancePercentage;
      if (filter.sortBy === 'join_time_asc')
        return Date.parse(a.firstJoinTime) - Date.parse(b.firstJoinTime);
      if (filter.sortBy === 'name_asc') return a.displayName.localeCompare(b.displayName);
      return 0;
    });

  // Calculate meeting stats
  const totalAttendees = meeting.attendees.length;
  const avgDuration =
    totalAttendees > 0
      ? Math.round(
          meeting.attendees.reduce((acc, a) => acc + a.totalDurationSeconds, 0) / totalAttendees
        )
      : 0;

  const fullAttendanceCount = meeting.attendees.filter(
    (a) => a.attendancePercentage >= 90
  ).length;
  const lateCount = meeting.attendees.filter((a) => a.status === 'late').length;
  const leftEarlyCount = meeting.attendees.filter((a) => a.status === 'left_early').length;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Meetings</span>
        </button>

        <div className="flex items-center space-x-3">
          {meeting.meetingUri && (
            <a
              href={meeting.meetingUri}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Open in Google Meet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster & Duration Logs</span>
          </button>
        </div>
      </div>

      {/* Meeting Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center space-x-1">
                <Video className="w-3 h-3" />
                <span>
                  {meeting.isGoogleMeetApiRecord ? 'Google Meet Conference Record' : 'Tracked Meet Session'}
                </span>
              </span>
              {meeting.meetingCode && (
                <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  Code: {meeting.meetingCode}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{meeting.title}</h1>
            {meeting.notes && <p className="text-sm text-gray-600 mt-1">{meeting.notes}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span>{formatDateTime(meeting.startTime)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-gray-600" />
                <span>Total Length: <strong className="text-gray-800">{formatDuration(meeting.totalDurationSeconds)}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-gray-600" />
                <span>{totalAttendees} Attendees Logged</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/80 p-4 rounded-xl border border-gray-200/60">
            <div className="text-center px-2">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                Avg Duration
              </span>
              <span className="text-lg font-bold text-gray-900 mt-0.5 block">
                {formatDuration(avgDuration)}
              </span>
            </div>
            <div className="text-center px-2 border-l border-gray-200">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                Full Presence
              </span>
              <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
                {fullAttendanceCount}
              </span>
            </div>
            <div className="text-center px-2 border-l border-gray-200">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                Late Joins
              </span>
              <span className="text-lg font-bold text-amber-600 mt-0.5 block">
                {lateCount}
              </span>
            </div>
            <div className="text-center px-2 border-l border-gray-200">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                Left Early
              </span>
              <span className="text-lg font-bold text-rose-600 mt-0.5 block">
                {leftEarlyCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search attendee by name or email..."
            value={filter.searchQuery}
            onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={filter.statusFilter}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  statusFilter: e.target.value as AttendanceFilter['statusFilter'],
                })
              }
              aria-label="Filter attendee status"
              className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Attendees ({meeting.attendees.length})</option>
              <option value="present_throughout">Full Presence (≥90%)</option>
              <option value="on_time">On Time</option>
              <option value="late">Late Arrival</option>
              <option value="partial">Partial / Left Early</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <Timer className="w-4 h-4 text-gray-600" />
            <select
              value={filter.sortBy}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  sortBy: e.target.value as AttendanceFilter['sortBy'],
                })
              }
              aria-label="Sort attendees"
              className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="duration_desc">Sort: Longest Duration</option>
              <option value="duration_asc">Sort: Shortest Duration</option>
              <option value="percentage_desc">Sort: Highest %</option>
              <option value="join_time_asc">Sort: Earliest Join Time</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendee Attendance Duration Table / Roster */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Attendance & Duration Logs ({filteredAttendees.length})
          </h2>
          <span className="text-xs text-gray-600">
            Click any row to inspect individual disconnects & session intervals
          </span>
        </div>

        {filteredAttendees.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">No attendees match your filter</p>
            <p className="text-xs text-gray-600 mt-1">Try resetting the search query or status filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAttendees.map((attendee) => {
              const isExpanded = expandedAttendeeId === attendee.id;

              return (
                <div key={attendee.id} className="transition-colors hover:bg-gray-50/70">
                  <div
                    onClick={() => setExpandedAttendeeId(isExpanded ? null : attendee.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  >
                    {/* Attendee Info */}
                    <div className="flex items-start space-x-3.5 min-w-[220px]">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                        {attendee.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors">
                            {attendee.displayName}
                          </span>
                          {attendee.userType === 'anonymous' && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded font-medium">
                              Guest
                            </span>
                          )}
                          {attendee.userType === 'phone' && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-medium">
                              Phone
                            </span>
                          )}
                        </div>
                        {attendee.email ? (
                          <p className="text-xs text-gray-600">{attendee.email}</p>
                        ) : (
                          <p className="text-xs text-gray-600">First joined: {formatTime(attendee.firstJoinTime)}</p>
                        )}
                      </div>
                    </div>

                    {/* Timeline visualization column */}
                    <div className="flex-1 max-w-md px-2">
                      <div className="mb-1 flex justify-between items-center text-xs">
                        <span className="text-gray-600 text-[11px]">Timeline presence</span>
                        <span className="font-semibold text-gray-700 text-[11px]">
                          {attendee.attendancePercentage}% attended
                        </span>
                      </div>
                      <AttendeeTimeline
                        meetingStartMs={startMs}
                        meetingEndMs={endMs}
                        sessions={attendee.sessions}
                      />
                    </div>

                    {/* Duration & Attendance Metrics */}
                    <div className="flex items-center space-x-5 justify-between md:justify-end">
                      <div className="text-right">
                        <span className="block text-xs font-semibold text-gray-600 uppercase">
                          Duration
                        </span>
                        <span className="font-mono text-base font-bold text-gray-900">
                          {formatDuration(attendee.totalDurationSeconds)}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="w-28 text-right">
                        {attendee.status === 'present_throughout' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Full</span>
                          </span>
                        )}
                        {attendee.status === 'on_time' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>On Time</span>
                          </span>
                        )}
                        {attendee.status === 'late' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Late Join</span>
                          </span>
                        )}
                        {attendee.status === 'left_early' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Left Early</span>
                          </span>
                        )}
                        {attendee.status === 'partial' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <Clock className="w-3 h-3" />
                            <span>Partial</span>
                          </span>
                        )}
                      </div>

                      <div className="text-gray-600">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Session Intervals Inspector */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Recorded Join / Leave Session Intervals ({attendee.sessions.length})</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {attendee.sessions.map((sess, sIdx) => (
                          <div
                            key={sess.id || sIdx}
                            className="bg-white p-3 rounded-lg border border-gray-200 text-xs shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-gray-600 mb-1">
                              <span className="font-semibold text-gray-700">Interval #{sIdx + 1}</span>
                              <span className="font-mono font-bold text-emerald-600">
                                {formatDuration(sess.durationSeconds)}
                              </span>
                            </div>
                            <div className="space-y-0.5 text-gray-600 text-[11px]">
                              <div>Joined: <strong className="text-gray-800">{formatTime(sess.startTime)}</strong></div>
                              <div>
                                Left: <strong className="text-gray-800">{sess.endTime ? formatTime(sess.endTime) : 'Still present'}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        meeting={meeting}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

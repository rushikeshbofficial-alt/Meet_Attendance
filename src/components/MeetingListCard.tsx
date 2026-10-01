import React from 'react';
import {
  Calendar,
  Clock,
  Users,
  Video,
  ExternalLink,
  ChevronRight,
  Download,
  Trash2,
} from 'lucide-react';
import { MeetingRecord } from '../types';
import { formatDuration, formatDateTime } from '../utils/formatters';

interface MeetingListCardProps {
  meeting: MeetingRecord;
  onSelect: (meeting: MeetingRecord) => void;
  onExport: (meeting: MeetingRecord) => void;
  onDelete: (meeting: MeetingRecord) => void;
}

export const MeetingListCard: React.FC<MeetingListCardProps> = ({
  meeting,
  onSelect,
  onExport,
  onDelete,
}) => {
  const totalAttendees = meeting.attendees.length;
  const avgAttendance =
    totalAttendees > 0
      ? Math.round(
          meeting.attendees.reduce((acc, a) => acc + a.attendancePercentage, 0) / totalAttendees
        )
      : 0;

  const onTimeCount = meeting.attendees.filter(
    (a) => a.status === 'on_time' || a.status === 'present_throughout'
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="p-5 sm:p-6">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center space-x-1">
              <Video className="w-3 h-3" />
              <span>{meeting.isGoogleMeetApiRecord ? 'Google Meet Conference' : 'Tracked Session'}</span>
            </span>
            {meeting.meetingCode && (
              <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                {meeting.meetingCode}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(meeting);
              }}
              title="Quick Export CSV"
              className="p-1.5 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(meeting);
              }}
              title="Delete attendance log"
              className="p-1.5 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title and Notes */}
        <h3
          onClick={() => onSelect(meeting)}
          className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
        >
          {meeting.title}
        </h3>
        {meeting.notes && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{meeting.notes}</p>
        )}

        {/* Meta row */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-gray-100 text-xs">
          <div>
            <span className="text-gray-600 block text-[11px]">Date & Time</span>
            <div className="font-semibold text-gray-800 flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-gray-600" />
              <span className="truncate">{formatDateTime(meeting.startTime)}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-600 block text-[11px]">Total Meeting Time</span>
            <div className="font-semibold text-gray-800 flex items-center space-x-1 mt-0.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-gray-600" />
              <span>{formatDuration(meeting.totalDurationSeconds)}</span>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-gray-600 block text-[11px]">Attendees</span>
            <div className="font-semibold text-gray-800 flex items-center space-x-1 mt-0.5">
              <Users className="w-3.5 h-3.5 text-gray-600" />
              <span>{totalAttendees} participants</span>
            </div>
          </div>
        </div>

        {/* Attendance stats preview */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-600 block">Avg Attendance</span>
              <span className="text-sm font-bold text-emerald-600">{avgAttendance}%</span>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <span className="text-[10px] uppercase font-bold text-gray-600 block">On-Time Joins</span>
              <span className="text-sm font-bold text-blue-600">{onTimeCount} / {totalAttendees}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {meeting.meetingUri && (
              <a
                href={meeting.meetingUri}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-colors"
                title="Open Google Meet"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => onSelect(meeting)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gray-900 group-hover:bg-indigo-600 rounded-xl flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
            >
              <span>View Roster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

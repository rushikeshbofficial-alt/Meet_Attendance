import React from 'react';
import { Users, Clock, Video, CheckCircle2, TrendingUp } from 'lucide-react';
import { MeetingRecord } from '../types';
import { formatShortDuration } from '../utils/formatters';

interface StatsOverviewProps {
  meetings: MeetingRecord[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ meetings }) => {
  const totalMeetings = meetings.length;

  let totalAttendeesCount = 0;
  let totalDurationSec = 0;
  let totalAttendancePercentageSum = 0;
  let totalOnTimeCount = 0;
  const uniqueNames = new Set<string>();

  meetings.forEach((m) => {
    totalAttendeesCount += m.attendees.length;
    m.attendees.forEach((a) => {
      uniqueNames.add(a.displayName.toLowerCase().trim());
      totalDurationSec += a.totalDurationSeconds;
      totalAttendancePercentageSum += a.attendancePercentage;
      if (a.status === 'on_time' || a.status === 'present_throughout') {
        totalOnTimeCount++;
      }
    });
  });

  const avgAttendancePct =
    totalAttendeesCount > 0 ? Math.round(totalAttendancePercentageSum / totalAttendeesCount) : 0;

  const onTimePct =
    totalAttendeesCount > 0 ? Math.round((totalOnTimeCount / totalAttendeesCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Meetings Card */}
      <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Conferences
          </span>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Video className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">{totalMeetings}</span>
          <span className="text-xs text-gray-600">logged</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">Google Meet calls tracked</p>
      </div>

      {/* Attendees Card */}
      <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Attendees
          </span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">{uniqueNames.size}</span>
          <span className="text-xs text-gray-600">({totalAttendeesCount} participations)</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">Unique participants recorded</p>
      </div>

      {/* Duration Logged Card */}
      <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Duration Logged
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">{formatShortDuration(totalDurationSec)}</span>
          <span className="text-xs text-gray-600">time</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">Cumulative attendee presence</p>
      </div>

      {/* Average Attendance % */}
      <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Avg Attendance
          </span>
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">{avgAttendancePct}%</span>
          <span className="text-xs text-emerald-600 font-medium">overall rate</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">Avg meeting retention rate</p>
      </div>

      {/* Punctuality Card */}
      <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Punctuality
          </span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">{onTimePct}%</span>
          <span className="text-xs text-gray-600">on-time</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">Joined within 5 min mark</p>
      </div>
    </div>
  );
};

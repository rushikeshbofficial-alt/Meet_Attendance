import React from 'react';
import { SessionInterval } from '../types';
import { formatTime, formatDuration } from '../utils/formatters';

interface AttendeeTimelineProps {
  meetingStartMs: number;
  meetingEndMs: number;
  sessions: SessionInterval[];
  isLive?: boolean;
}

export const AttendeeTimeline: React.FC<AttendeeTimelineProps> = ({
  meetingStartMs,
  meetingEndMs,
  sessions,
  isLive = false,
}) => {
  const totalMeetingDurationMs = Math.max(1000, meetingEndMs - meetingStartMs);

  return (
    <div className="w-full">
      {/* Visual Timeline Bar */}
      <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        {sessions.map((s, idx) => {
          const sStartMs = Date.parse(s.startTime);
          const sEndMs = s.endTime ? Date.parse(s.endTime) : (isLive ? Date.now() : meetingEndMs);

          const leftPercent = Math.max(
            0,
            Math.min(100, ((sStartMs - meetingStartMs) / totalMeetingDurationMs) * 100)
          );
          const rawWidthPercent = ((sEndMs - sStartMs) / totalMeetingDurationMs) * 100;
          const widthPercent = Math.max(1.5, Math.min(100 - leftPercent, rawWidthPercent));

          return (
            <div
              key={s.id || idx}
              title={`Session ${idx + 1}: ${formatTime(s.startTime)} - ${s.endTime ? formatTime(s.endTime) : 'Present'} (${formatDuration(s.durationSeconds)})`}
              className="absolute top-0 bottom-0 bg-emerald-500 hover:bg-emerald-600 transition-all rounded-xs cursor-pointer group"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
            />
          );
        })}
      </div>

      {/* Mini session markers */}
      <div className="flex justify-between items-center text-[10px] text-gray-600 mt-1 font-mono">
        <span>{formatTime(new Date(meetingStartMs).toISOString())}</span>
        <span>
          {sessions.length > 1
            ? `${sessions.length} sessions (re-joined)`
            : sessions.length === 1
            ? '1 continuous session'
            : 'No sessions'}
        </span>
        <span>{formatTime(new Date(meetingEndMs).toISOString())}</span>
      </div>
    </div>
  );
};

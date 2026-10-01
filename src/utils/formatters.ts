import { MeetingRecord } from '../types';

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export function formatShortDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return 'Unknown date';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
}

export function generateCsvAttendance(meeting: MeetingRecord): string {
  const headers = [
    'Meeting Title',
    'Meeting Code',
    'Meeting Start',
    'Meeting End',
    'Meeting Total Duration (Seconds)',
    'Attendee Name',
    'Email',
    'User Type',
    'First Joined At',
    'Last Left At',
    'Number of Sessions',
    'Total Attended Duration (Seconds)',
    'Total Attended Duration (Formatted)',
    'Attendance Rate (%)',
    'Status',
  ];

  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = meeting.attendees.map((a) => [
    escapeCsv(meeting.title),
    escapeCsv(meeting.meetingCode || ''),
    escapeCsv(formatDateTime(meeting.startTime)),
    escapeCsv(meeting.endTime ? formatDateTime(meeting.endTime) : 'In Progress'),
    escapeCsv(meeting.totalDurationSeconds),
    escapeCsv(a.displayName),
    escapeCsv(a.email || 'N/A'),
    escapeCsv(a.userType),
    escapeCsv(formatDateTime(a.firstJoinTime)),
    escapeCsv(a.lastLeaveTime ? formatDateTime(a.lastLeaveTime) : 'Still in Meet'),
    escapeCsv(a.sessions.length),
    escapeCsv(a.totalDurationSeconds),
    escapeCsv(formatDuration(a.totalDurationSeconds)),
    escapeCsv(`${a.attendancePercentage}%`),
    escapeCsv(a.status),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Data structures for Google Meet Conference Records and Attendance Tracking
 */

export interface GoogleMeetUser {
  displayName?: string;
  user?: string; // e.g. "users/123456"
}

export interface GoogleMeetAnonymousUser {
  displayName?: string;
}

export interface GoogleMeetPhoneUser {
  displayName?: string;
}

export interface GoogleMeetParticipantSession {
  name?: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
}

export interface GoogleMeetParticipant {
  name: string; // "conferenceRecords/{confId}/participants/{partId}"
  signedinUser?: GoogleMeetUser;
  anonymousUser?: GoogleMeetAnonymousUser;
  phoneUser?: GoogleMeetPhoneUser;
  earliestStartTime?: string;
  latestEndTime?: string;
}

export interface GoogleMeetConferenceRecord {
  name: string; // "conferenceRecords/{conferenceRecord}"
  startTime: string;
  endTime?: string;
  expireTime?: string;
  space?: string; // "spaces/{spaceId}"
}

export interface SessionInterval {
  id: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
}

export interface AttendeeAttendanceRecord {
  id: string;
  displayName: string;
  email?: string;
  userType: 'signedin' | 'anonymous' | 'phone';
  firstJoinTime: string;
  lastLeaveTime?: string;
  sessions: SessionInterval[];
  totalDurationSeconds: number;
  attendancePercentage: number;
  isCurrentlyPresent: boolean;
  status: 'on_time' | 'late' | 'partial' | 'left_early' | 'present_throughout';
}

export interface MeetingRecord {
  id: string; // Conference record name or generated ID
  title: string;
  meetingCode?: string;
  meetingUri?: string;
  startTime: string;
  endTime?: string;
  totalDurationSeconds: number;
  attendees: AttendeeAttendanceRecord[];
  isLive?: boolean;
  isGoogleMeetApiRecord?: boolean;
  notes?: string;
  createdAt: string;
}

export interface AttendanceFilter {
  searchQuery: string;
  statusFilter: 'all' | 'on_time' | 'late' | 'partial' | 'present_throughout';
  sortBy: 'duration_desc' | 'duration_asc' | 'name_asc' | 'join_time_asc' | 'percentage_desc';
}

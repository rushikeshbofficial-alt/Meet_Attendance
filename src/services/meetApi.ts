import {
  GoogleMeetConferenceRecord,
  GoogleMeetParticipant,
  GoogleMeetParticipantSession,
  MeetingRecord,
  AttendeeAttendanceRecord,
  SessionInterval,
} from '../types';

const MEET_API_BASE = 'https://meet.googleapis.com/v2';

/**
 * List conference records from Google Meet API
 */
export async function listConferenceRecords(
  accessToken: string,
  pageSize = 25,
  pageToken?: string
): Promise<{ conferenceRecords: GoogleMeetConferenceRecord[]; nextPageToken?: string }> {
  const url = new URL(`${MEET_API_BASE}/conferenceRecords`);
  url.searchParams.set('pageSize', pageSize.toString());
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  const data = await res.json();
  return {
    conferenceRecords: data.conferenceRecords || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * List participants for a specific conference record
 */
export async function listParticipants(
  accessToken: string,
  conferenceRecordName: string,
  pageSize = 100
): Promise<GoogleMeetParticipant[]> {
  const url = new URL(`${MEET_API_BASE}/${conferenceRecordName}/participants`);
  url.searchParams.set('pageSize', pageSize.toString());

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch participants (${res.status})`);
  }

  const data = await res.json();
  return data.participants || [];
}

/**
 * List sessions for a participant
 */
export async function listParticipantSessions(
  accessToken: string,
  participantName: string
): Promise<GoogleMeetParticipantSession[]> {
  const url = `${MEET_API_BASE}/${participantName}/participantSessions`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch sessions (${res.status})`);
  }

  const data = await res.json();
  return data.participantSessions || [];
}

/**
 * Create a new Google Meet space
 */
export async function createMeetingSpace(accessToken: string): Promise<{
  name: string;
  meetingUri: string;
  meetingCode: string;
}> {
  const res = await fetch(`${MEET_API_BASE}/spaces`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to create Meet space (${res.status})`);
  }

  return await res.json();
}

/**
 * Transforms a Google Meet Conference Record + Participants + Sessions into a full MeetingRecord
 */
export async function processConferenceRecord(
  accessToken: string,
  conference: GoogleMeetConferenceRecord
): Promise<MeetingRecord> {
  const startMs = Date.parse(conference.startTime);
  const endMs = conference.endTime ? Date.parse(conference.endTime) : Date.now();
  const totalMeetingSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

  let participants: GoogleMeetParticipant[] = [];
  try {
    participants = await listParticipants(accessToken, conference.name);
  } catch (err) {
    console.warn(`Could not fetch participants for ${conference.name}:`, err);
  }

  // Fetch participant sessions in parallel (batching limit to avoid rate limits)
  const attendees: AttendeeAttendanceRecord[] = await Promise.all(
    participants.map(async (p, idx) => {
      let sessionsData: GoogleMeetParticipantSession[] = [];
      try {
        sessionsData = await listParticipantSessions(accessToken, p.name);
      } catch (err) {
        console.warn(`Could not fetch sessions for participant ${p.name}:`, err);
      }

      // If no sessions returned from API, fallback to participant's earliestStartTime and latestEndTime
      if (sessionsData.length === 0 && p.earliestStartTime) {
        sessionsData = [
          {
            startTime: p.earliestStartTime,
            endTime: p.latestEndTime || conference.endTime || new Date().toISOString(),
          },
        ];
      }

      const sessions: SessionInterval[] = sessionsData.map((s, sIdx) => {
        const sStart = Date.parse(s.startTime);
        const sEnd = s.endTime ? Date.parse(s.endTime) : endMs;
        const dur = Math.max(0, Math.round((sEnd - sStart) / 1000));
        return {
          id: `session-${idx}-${sIdx}`,
          startTime: s.startTime,
          endTime: s.endTime,
          durationSeconds: dur,
        };
      });

      const totalDurationSeconds = sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
      const percentage = Math.min(100, Math.round((totalDurationSeconds / totalMeetingSeconds) * 100));

      const firstJoinTime = p.earliestStartTime || sessions[0]?.startTime || conference.startTime;
      const lastLeaveTime = p.latestEndTime || sessions[sessions.length - 1]?.endTime;

      // Calculate status
      const joinOffsetSeconds = (Date.parse(firstJoinTime) - startMs) / 1000;
      let status: AttendeeAttendanceRecord['status'] = 'present_throughout';

      if (percentage >= 85) {
        status = 'present_throughout';
      } else if (joinOffsetSeconds > 300) {
        status = 'late';
      } else if (lastLeaveTime && endMs - Date.parse(lastLeaveTime) > 300) {
        status = 'left_early';
      } else {
        status = 'partial';
      }

      let userType: AttendeeAttendanceRecord['userType'] = 'signedin';
      let displayName = 'Unknown Attendee';
      let email: string | undefined = undefined;

      if (p.signedinUser) {
        userType = 'signedin';
        displayName = p.signedinUser.displayName || 'Google Meet User';
      } else if (p.anonymousUser) {
        userType = 'anonymous';
        displayName = p.anonymousUser.displayName || 'Guest User';
      } else if (p.phoneUser) {
        userType = 'phone';
        displayName = p.phoneUser.displayName || 'Dial-in Caller';
      }

      return {
        id: p.name || `attendee-${idx}`,
        displayName,
        email,
        userType,
        firstJoinTime,
        lastLeaveTime,
        sessions,
        totalDurationSeconds,
        attendancePercentage: percentage,
        isCurrentlyPresent: !conference.endTime && (!lastLeaveTime || Date.now() - Date.parse(lastLeaveTime) < 60000),
        status,
      };
    })
  );

  const confId = conference.name.replace('conferenceRecords/', '');

  return {
    id: conference.name,
    title: `Google Meet Session (${confId.substring(0, 10)})`,
    meetingCode: confId,
    startTime: conference.startTime,
    endTime: conference.endTime,
    totalDurationSeconds: totalMeetingSeconds,
    attendees,
    isGoogleMeetApiRecord: true,
    createdAt: conference.startTime,
  };
}

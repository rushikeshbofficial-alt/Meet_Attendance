import { MeetingRecord } from '../types';

const STORAGE_KEY = 'meet_attendance_records_v1';

export function getSavedMeetings(): MeetingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSampleMeetings();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultSampleMeetings();
  } catch (e) {
    console.error('Failed to load meetings from storage', e);
    return getDefaultSampleMeetings();
  }
}

export function saveMeetings(meetings: MeetingRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  } catch (e) {
    console.error('Failed to save meetings to storage', e);
  }
}

export function upsertMeeting(meeting: MeetingRecord): void {
  const list = getSavedMeetings();
  const existingIdx = list.findIndex((m) => m.id === meeting.id);
  if (existingIdx >= 0) {
    list[existingIdx] = meeting;
  } else {
    list.unshift(meeting);
  }
  saveMeetings(list);
}

export function deleteMeeting(id: string): void {
  const list = getSavedMeetings().filter((m) => m.id !== id);
  saveMeetings(list);
}

/**
 * Returns realistic initial sample Google Meet attendance records
 * so the dashboard is immediately vibrant, interactive, and demonstrates
 * all durations, session gaps, and metrics.
 */
export function getDefaultSampleMeetings(): MeetingRecord[] {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayEnd = new Date(yesterday.getTime() + 50 * 60 * 1000);

  const meeting1Start = twoHoursAgo.toISOString();
  const meeting1End = oneHourAgo.toISOString();
  const meeting1Dur = 3600; // 60 minutes

  return [
    {
      id: 'conf-rec-eng-sync-2026',
      title: 'Weekly Engineering All-Hands',
      meetingCode: 'eng-sync-prod',
      meetingUri: 'https://meet.google.com/eng-sync-prod',
      startTime: meeting1Start,
      endTime: meeting1End,
      totalDurationSeconds: meeting1Dur,
      isGoogleMeetApiRecord: true,
      createdAt: meeting1Start,
      notes: 'Weekly architecture review, roadmap sync, and sprint retrospectives.',
      attendees: [
        {
          id: 'user-rushikesh',
          displayName: 'Rushikesh Birajdar (Host)',
          email: 'rushikeshb.official@gmail.com',
          userType: 'signedin',
          firstJoinTime: new Date(twoHoursAgo.getTime() + 10 * 1000).toISOString(),
          lastLeaveTime: meeting1End,
          totalDurationSeconds: 3590,
          attendancePercentage: 100,
          isCurrentlyPresent: false,
          status: 'present_throughout',
          sessions: [
            {
              id: 's-r-1',
              startTime: new Date(twoHoursAgo.getTime() + 10 * 1000).toISOString(),
              endTime: meeting1End,
              durationSeconds: 3590,
            },
          ],
        },
        {
          id: 'user-priya-sharma',
          displayName: 'Priya Sharma',
          email: 'priya.sharma@techcorp.io',
          userType: 'signedin',
          firstJoinTime: new Date(twoHoursAgo.getTime() + 1 * 60 * 1000).toISOString(),
          lastLeaveTime: new Date(oneHourAgo.getTime() - 2 * 60 * 1000).toISOString(),
          totalDurationSeconds: 3420,
          attendancePercentage: 95,
          isCurrentlyPresent: false,
          status: 'present_throughout',
          sessions: [
            {
              id: 's-p-1',
              startTime: new Date(twoHoursAgo.getTime() + 1 * 60 * 1000).toISOString(),
              endTime: new Date(oneHourAgo.getTime() - 2 * 60 * 1000).toISOString(),
              durationSeconds: 3420,
            },
          ],
        },
        {
          id: 'user-alex-chen',
          displayName: 'Alex Chen',
          email: 'alex.chen@cloudsystems.net',
          userType: 'signedin',
          firstJoinTime: new Date(twoHoursAgo.getTime() + 12 * 60 * 1000).toISOString(), // late
          lastLeaveTime: meeting1End,
          totalDurationSeconds: 2880,
          attendancePercentage: 80,
          isCurrentlyPresent: false,
          status: 'late',
          sessions: [
            {
              id: 's-a-1',
              startTime: new Date(twoHoursAgo.getTime() + 12 * 60 * 1000).toISOString(),
              endTime: meeting1End,
              durationSeconds: 2880,
            },
          ],
        },
        {
          id: 'user-marcus-ross',
          displayName: 'Marcus Ross',
          email: 'm.ross@analytics.co',
          userType: 'signedin',
          firstJoinTime: new Date(twoHoursAgo.getTime() + 2 * 60 * 1000).toISOString(),
          lastLeaveTime: new Date(twoHoursAgo.getTime() + 35 * 60 * 1000).toISOString(), // left early
          totalDurationSeconds: 1980,
          attendancePercentage: 55,
          isCurrentlyPresent: false,
          status: 'left_early',
          sessions: [
            {
              id: 's-m-1',
              startTime: new Date(twoHoursAgo.getTime() + 2 * 60 * 1000).toISOString(),
              endTime: new Date(twoHoursAgo.getTime() + 35 * 60 * 1000).toISOString(),
              durationSeconds: 1980,
            },
          ],
        },
        {
          id: 'user-sarah-jenkins',
          displayName: 'Sarah Jenkins',
          email: 'sarah.j@uxdesign.studio',
          userType: 'signedin',
          firstJoinTime: new Date(twoHoursAgo.getTime() + 45 * 1000).toISOString(),
          lastLeaveTime: meeting1End,
          totalDurationSeconds: 3200,
          attendancePercentage: 89,
          isCurrentlyPresent: false,
          status: 'present_throughout',
          sessions: [
            // disconnected & rejoined
            {
              id: 's-sj-1',
              startTime: new Date(twoHoursAgo.getTime() + 45 * 1000).toISOString(),
              endTime: new Date(twoHoursAgo.getTime() + 22 * 60 * 1000).toISOString(),
              durationSeconds: 1275,
            },
            {
              id: 's-sj-2',
              startTime: new Date(twoHoursAgo.getTime() + 28 * 60 * 1000).toISOString(),
              endTime: meeting1End,
              durationSeconds: 1925,
            },
          ],
        },
        {
          id: 'user-guest-client',
          displayName: 'Guest Partner (Client Ops)',
          userType: 'anonymous',
          firstJoinTime: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000).toISOString(),
          lastLeaveTime: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString(),
          totalDurationSeconds: 1800,
          attendancePercentage: 50,
          isCurrentlyPresent: false,
          status: 'partial',
          sessions: [
            {
              id: 's-g-1',
              startTime: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000).toISOString(),
              endTime: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString(),
              durationSeconds: 1800,
            },
          ],
        },
      ],
    },
    {
      id: 'conf-rec-product-demo-yesterday',
      title: 'Quarterly Product Demo & Stakeholder Review',
      meetingCode: 'prd-demo-2026',
      meetingUri: 'https://meet.google.com/prd-demo-2026',
      startTime: yesterday.toISOString(),
      endTime: yesterdayEnd.toISOString(),
      totalDurationSeconds: 3000, // 50 mins
      isGoogleMeetApiRecord: true,
      createdAt: yesterday.toISOString(),
      notes: 'Customer feedback session and Q4 launch checklist review.',
      attendees: [
        {
          id: 'user-rushikesh-2',
          displayName: 'Rushikesh Birajdar',
          email: 'rushikeshb.official@gmail.com',
          userType: 'signedin',
          firstJoinTime: yesterday.toISOString(),
          lastLeaveTime: yesterdayEnd.toISOString(),
          totalDurationSeconds: 3000,
          attendancePercentage: 100,
          isCurrentlyPresent: false,
          status: 'present_throughout',
          sessions: [
            {
              id: 's-r2-1',
              startTime: yesterday.toISOString(),
              endTime: yesterdayEnd.toISOString(),
              durationSeconds: 3000,
            },
          ],
        },
        {
          id: 'user-elena-v',
          displayName: 'Elena Rostova',
          email: 'elena@enterprise.org',
          userType: 'signedin',
          firstJoinTime: new Date(yesterday.getTime() + 30 * 1000).toISOString(),
          lastLeaveTime: yesterdayEnd.toISOString(),
          totalDurationSeconds: 2970,
          attendancePercentage: 99,
          isCurrentlyPresent: false,
          status: 'present_throughout',
          sessions: [
            {
              id: 's-el-1',
              startTime: new Date(yesterday.getTime() + 30 * 1000).toISOString(),
              endTime: yesterdayEnd.toISOString(),
              durationSeconds: 2970,
            },
          ],
        },
        {
          id: 'user-dialin-mobile',
          displayName: 'Dial-in Caller (+1 415-***-8821)',
          userType: 'phone',
          firstJoinTime: new Date(yesterday.getTime() + 5 * 60 * 1000).toISOString(),
          lastLeaveTime: new Date(yesterday.getTime() + 32 * 60 * 1000).toISOString(),
          totalDurationSeconds: 1620,
          attendancePercentage: 54,
          isCurrentlyPresent: false,
          status: 'left_early',
          sessions: [
            {
              id: 's-phone-1',
              startTime: new Date(yesterday.getTime() + 5 * 60 * 1000).toISOString(),
              endTime: new Date(yesterday.getTime() + 32 * 60 * 1000).toISOString(),
              durationSeconds: 1620,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Meeting Provider API Adapter Interfaces & Mocks
 * Supports: Microsoft Teams, Google Meet, Zoom, Phone, In-Person
 */
import { MEETING_PROVIDERS, INTERVIEW_TYPE } from '../interviewTypes';

export const meetingProviderAdapter = {
  /**
   * Generates a virtual meeting link or location string based on provider
   */
  createMeeting: async ({ provider, title, startTime, endTime, attendees = [] }) => {
    // Simulate slight async network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const meetingId = `MTG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    switch (provider) {
      case MEETING_PROVIDERS.TEAMS:
        return {
          provider: MEETING_PROVIDERS.TEAMS,
          meetingId,
          meetingUrl: `https://teams.microsoft.com/l/meetup-join/${meetingId}`,
          conferenceId: Math.floor(100000000 + Math.random() * 900000000).toString(),
          passcode: Math.floor(1000 + Math.random() * 9000).toString(),
          status: 'Created'
        };

      case MEETING_PROVIDERS.GOOGLE_MEET: {
        const code = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
        return {
          provider: MEETING_PROVIDERS.GOOGLE_MEET,
          meetingId: code,
          meetingUrl: `https://meet.google.com/${code}`,
          conferenceId: code,
          status: 'Created'
        };
      }

      case MEETING_PROVIDERS.ZOOM: {
        const zoomId = Math.floor(10000000000 + Math.random() * 90000000000).toString();
        return {
          provider: MEETING_PROVIDERS.ZOOM,
          meetingId: zoomId,
          meetingUrl: `https://zoom.us/j/${zoomId}?pwd=${Math.random().toString(36).substring(2, 8)}`,
          conferenceId: zoomId,
          passcode: Math.floor(100000 + Math.random() * 900000).toString(),
          status: 'Created'
        };
      }

      default:
        return {
          provider: provider || MEETING_PROVIDERS.NONE,
          meetingId,
          meetingUrl: null,
          status: 'Custom / Physical Location'
        };
    }
  },

  updateMeeting: async (meetingId, updateData) => {
    return {
      meetingId,
      ...updateData,
      status: 'Updated',
      updatedAt: new Date().toISOString()
    };
  },

  cancelMeeting: async (meetingId, reason) => {
    return {
      meetingId,
      status: 'Cancelled',
      reason,
      cancelledAt: new Date().toISOString()
    };
  }
};

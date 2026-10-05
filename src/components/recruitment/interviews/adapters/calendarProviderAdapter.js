/**
 * Calendar Provider API Adapter Interfaces & Mocks
 * Supports: Google Calendar, Microsoft Outlook, and standard .ics format
 */

export const calendarProviderAdapter = {
  syncEvent: async ({ eventId, title, description, startTime, endTime, attendees = [], meetingUrl, location }) => {
    return {
      success: true,
      providerEventId: `CAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      syncedWith: ['Google Calendar', 'Microsoft Outlook'],
      timestamp: new Date().toISOString()
    };
  },

  deleteEvent: async (providerEventId) => {
    return {
      success: true,
      providerEventId,
      status: 'Deleted',
      timestamp: new Date().toISOString()
    };
  },

  generateIcsDownload: ({ title, description, startTime, endTime, location, meetingUrl }) => {
    // Generate valid iCalendar (.ics) string for direct download
    const dtStart = new Date(startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtEnd = new Date(endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PeopleWorks SaaS//ATS Interview Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${Math.random().toString(36).substring(2, 10)}@peopleworks.internal`,
      `DTSTAMP:${dtStart}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description || ''}\\nMeeting URL: ${meetingUrl || 'N/A'}`,
      `LOCATION:${location || meetingUrl || 'Remote / Video Call'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

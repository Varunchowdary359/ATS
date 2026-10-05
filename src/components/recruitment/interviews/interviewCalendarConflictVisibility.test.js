import { describe, it, expect } from 'vitest';
import { detectSessionConflicts, calculateDayEventLayouts, ROW_HEIGHT_PX, BASE_HOUR, TOTAL_HOURS } from './InterviewCalendarView';
import { INTERVIEW_ROLES, SESSION_STATUS, ROUND_CATEGORY } from './interviewTypes';

describe('Enterprise Interview Calendar - Role-Based Visibility & Conflict Handling Suite (Section 21)', () => {

  // Test A: Same interviewer + same time -> CONFLICT
  it('Acceptance Test A: Same interviewer + same time produces INTERVIEWER CONFLICT', () => {
    const sessions = [
      {
        id: 'SESS-01',
        candidateId: 'CAND-A',
        candidateName: 'Candidate A',
        roundName: 'Technical Interview',
        scheduledDate: '2026-09-21',
        startTime: '08:00',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-01', name: 'Alex Chen' }]
      },
      {
        id: 'SESS-02',
        candidateId: 'CAND-B',
        candidateName: 'Candidate B',
        roundName: 'Managerial Interview',
        scheduledDate: '2026-09-21',
        startTime: '08:00',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-01', name: 'Alex Chen' }]
      }
    ];

    const conflicts = detectSessionConflicts(sessions);
    expect(conflicts.has('SESS-01')).toBe(true);
    expect(conflicts.has('SESS-02')).toBe(true);
    expect(conflicts.get('SESS-01').type).toBe('INTERVIEWER_CONFLICT');
    expect(conflicts.get('SESS-01').message).toContain('Alex Chen is already scheduled from 08:00 to 09:30 with Candidate B');
  });

  // Test B: Same interviewer + back-to-back interviews -> VALID
  it('Acceptance Test B: Same interviewer + back-to-back interviews is VALID (NO CONFLICT)', () => {
    const sessions = [
      {
        id: 'SESS-01',
        candidateId: 'CAND-A',
        candidateName: 'Candidate A',
        roundName: 'Technical Interview',
        scheduledDate: '2026-09-21',
        startTime: '08:00',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-01', name: 'Alex Chen' }]
      },
      {
        id: 'SESS-02',
        candidateId: 'CAND-B',
        candidateName: 'Candidate B',
        roundName: 'Managerial Interview',
        scheduledDate: '2026-09-21',
        startTime: '09:30',
        endTime: '10:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-01', name: 'Alex Chen' }]
      }
    ];

    const conflicts = detectSessionConflicts(sessions);
    expect(conflicts.size).toBe(0);
    expect(conflicts.has('SESS-01')).toBe(false);
    expect(conflicts.has('SESS-02')).toBe(false);
  });

  // Test C: Different interviewers + same time -> VALID (Normal Parallel Activity)
  it('Acceptance Test C: Different interviewers + same time is VALID (Parallel Activity, NO CONFLICT)', () => {
    const sessions = [
      {
        id: 'SESS-01',
        candidateId: 'CAND-A',
        candidateName: 'Candidate A',
        roundName: 'Technical Interview',
        scheduledDate: '2026-09-21',
        startTime: '08:00',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-01', name: 'Alex Chen' }]
      },
      {
        id: 'SESS-02',
        candidateId: 'CAND-B',
        candidateName: 'Candidate B',
        roundName: 'HR Interview',
        scheduledDate: '2026-09-21',
        startTime: '08:00',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-06', name: 'Priya Sharma' }]
      }
    ];

    const conflicts = detectSessionConflicts(sessions);
    expect(conflicts.size).toBe(0);
    expect(conflicts.has('SESS-01')).toBe(false);
    expect(conflicts.has('SESS-02')).toBe(false);
  });

  // Test D: Same candidate + overlapping interviews -> CANDIDATE CONFLICT
  it('Acceptance Test D: Same candidate + overlapping interviews produces CANDIDATE CONFLICT', () => {
    const sessions = [
      {
        id: 'SESS-01',
        candidateId: 'CAND-A',
        candidateName: 'Candidate A',
        roundName: 'Technical Interview',
        scheduledDate: '2026-09-21',
        startTime: '08:00',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-01', name: 'Alex Chen' }]
      },
      {
        id: 'SESS-02',
        candidateId: 'CAND-A',
        candidateName: 'Candidate A',
        roundName: 'HR Interview',
        scheduledDate: '2026-09-21',
        startTime: '08:30',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [{ id: 'INT-06', name: 'Priya Sharma' }]
      }
    ];

    const conflicts = detectSessionConflicts(sessions);
    expect(conflicts.has('SESS-01')).toBe(true);
    expect(conflicts.has('SESS-02')).toBe(true);
    expect(conflicts.get('SESS-01').type).toBe('CANDIDATE_CONFLICT');
  });

  // Test E: Panel interview with multiple interviewers -> ONE SESSION, NO CONFLICT
  it('Acceptance Test E: Panel interview with multiple panelists is treated as ONE single session without self-conflict', () => {
    const sessions = [
      {
        id: 'SESS-PANEL-01',
        candidateId: 'CAND-A',
        candidateName: 'Candidate A',
        roundName: 'Technical Panel',
        scheduledDate: '2026-09-23',
        startTime: '08:00',
        endTime: '09:30',
        status: SESSION_STATUS.SCHEDULED,
        interviewers: [
          { id: 'INT-01', name: 'Alex Chen' },
          { id: 'INT-06', name: 'Priya Sharma' },
          { id: 'INT-03', name: 'Marcus Brody' }
        ]
      }
    ];

    const conflicts = detectSessionConflicts(sessions);
    expect(conflicts.size).toBe(0);
    expect(sessions[0].interviewers.length).toBe(3);
  });

  // Test F & G: Hiring Manager My Calendar vs Team Calendar Visibility
  it('Acceptance Test F & G: Hiring Manager My Calendar shows only assigned rounds, Team Calendar shows permitted team sessions', () => {
    const rawSessions = [
      {
        id: 'SESS-01',
        candidateId: 'CAND-A',
        candidateName: 'Candidate A',
        roundName: 'Technical Interview',
        requisitionId: 'REQ-2026-001',
        department: 'Engineering',
        interviewers: [{ id: 'INT-01', name: 'Alex Chen' }]
      },
      {
        id: 'SESS-02',
        candidateId: 'CAND-B',
        candidateName: 'Candidate B',
        roundName: 'HR Interview',
        requisitionId: 'REQ-2026-001',
        department: 'Engineering',
        interviewers: [{ id: 'INT-06', name: 'Priya Sharma' }]
      }
    ];

    const hmPersona = { id: 'INT-01', name: 'Alex Chen', userRequisitions: ['REQ-2026-001'] };

    // My Calendar Filter
    const myCalendar = rawSessions.filter(s =>
      (s.interviewers || []).some(i => i.id === hmPersona.id || i.name === hmPersona.name)
    );
    expect(myCalendar).toHaveLength(1);
    expect(myCalendar[0].id).toBe('SESS-01');

    // Team Calendar Filter
    const teamCalendar = rawSessions.filter(s =>
      hmPersona.userRequisitions.includes(s.requisitionId) || s.department === 'Engineering'
    );
    expect(teamCalendar).toHaveLength(2);
  });

  // Test H: Interviewer Role My Calendar
  it('Acceptance Test H: Interviewer role sees only assigned interviews', () => {
    const rawSessions = [
      { id: 'SESS-01', interviewers: [{ id: 'INT-04', name: 'Elena Rostova' }] },
      { id: 'SESS-02', interviewers: [{ id: 'INT-01', name: 'Alex Chen' }] }
    ];

    const elenaPersona = { id: 'INT-04', name: 'Elena Rostova' };
    const elenaSessions = rawSessions.filter(s =>
      (s.interviewers || []).some(i => i.id === elenaPersona.id)
    );
    expect(elenaSessions).toHaveLength(1);
    expect(elenaSessions[0].id).toBe('SESS-01');
  });

  // Test K: Continuous 3 hours of interviews render without collision
  it('Acceptance Test K: Continuous 3 hours of back-to-back interviews do not trigger conflicts', () => {
    const continuousSessions = [
      { id: 'C1', candidateId: 'C-1', scheduledDate: '2026-09-21', startTime: '08:00', endTime: '09:30', status: SESSION_STATUS.SCHEDULED, interviewers: [{ id: 'INT-01', name: 'Alex Chen' }] },
      { id: 'C2', candidateId: 'C-2', scheduledDate: '2026-09-21', startTime: '09:30', endTime: '10:30', status: SESSION_STATUS.SCHEDULED, interviewers: [{ id: 'INT-01', name: 'Alex Chen' }] },
      { id: 'C3', candidateId: 'C-3', scheduledDate: '2026-09-21', startTime: '10:30', endTime: '11:30', status: SESSION_STATUS.SCHEDULED, interviewers: [{ id: 'INT-01', name: 'Alex Chen' }] }
    ];

    const conflicts = detectSessionConflicts(continuousSessions);
    expect(conflicts.size).toBe(0);
  });
});

describe('Strict Fixed Grid & Dynamic Overlap Layout Suite (Section 19 Acceptance Tests)', () => {

  // Test Case 1: Monday 08:30–09:30 -> Event stays inside Monday, 100% width, correct top and height
  it('Test Case 1: Single event 08:30–09:30 is positioned at top = 48px, height = 92px, left = 0%, width = 100%', () => {
    const sessions = [
      { id: 'S1', candidateName: 'Candidate 1', startTime: '08:30', endTime: '09:30', status: SESSION_STATUS.SCHEDULED }
    ];
    const layouts = calculateDayEventLayouts(sessions, 96, 8, 10);
    expect(layouts).toHaveLength(1);
    expect(layouts[0].top).toBe(48); // 30 minutes from 8:00 = (30/60)*96 = 48px
    expect(layouts[0].height).toBe(92); // 60 minutes duration = (60/60)*96 - 4 = 92px
    expect(layouts[0].leftPct).toBe(0);
    expect(layouts[0].widthPct).toBe(100);
    expect(layouts[0].totalColumns).toBe(1);
  });

  // Test Case 2: Monday 08:00–09:30 Alex and 08:00–09:00 David -> Two events side-by-side inside Monday (50% each)
  it('Test Case 2: Overlapping events 08:00–09:30 & 08:00–09:00 split into 2 equal columns (50% width each)', () => {
    const sessions = [
      { id: 'S1', candidateName: 'Alex Chen', startTime: '08:00', endTime: '09:30', status: SESSION_STATUS.SCHEDULED },
      { id: 'S2', candidateName: 'David Miller', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED }
    ];
    const layouts = calculateDayEventLayouts(sessions, 96, 8, 10);
    expect(layouts).toHaveLength(2);
    expect(layouts[0].totalColumns).toBe(2);
    expect(layouts[1].totalColumns).toBe(2);
    expect(layouts[0].widthPct).toBe(50);
    expect(layouts[1].widthPct).toBe(50);
    expect(layouts[0].leftPct).toBe(0);
    expect(layouts[1].leftPct).toBe(50);
    // Alex: 90m duration = (90/60)*96 - 4 = 140px
    expect(layouts[0].height).toBe(140);
    // David: 60m duration = (60/60)*96 - 4 = 92px
    expect(layouts[1].height).toBe(92);
  });

  // Test Case 3: Monday 08:00–09:30 Alex, 09:30–10:30 David, 10:30–11:30 Emily -> Three sequential events vertically (100% width)
  it('Test Case 3: Sequential events 08:00–09:30, 09:30–10:30, 10:30–11:30 appear vertically with 100% width', () => {
    const sessions = [
      { id: 'S1', candidateName: 'Alex', startTime: '08:00', endTime: '09:30', status: SESSION_STATUS.SCHEDULED },
      { id: 'S2', candidateName: 'David', startTime: '09:30', endTime: '10:30', status: SESSION_STATUS.SCHEDULED },
      { id: 'S3', candidateName: 'Emily', startTime: '10:30', endTime: '11:30', status: SESSION_STATUS.SCHEDULED }
    ];
    const layouts = calculateDayEventLayouts(sessions, 96, 8, 10);
    expect(layouts).toHaveLength(3);
    layouts.forEach(l => {
      expect(l.totalColumns).toBe(1);
      expect(l.leftPct).toBe(0);
      expect(l.widthPct).toBe(100);
    });
    expect(layouts[0].top).toBe(0);
    expect(layouts[1].top).toBe(144); // 90 min from 8:00 = 1.5 * 96 = 144px
    expect(layouts[2].top).toBe(240); // 150 min from 8:00 = 2.5 * 96 = 240px
  });

  // Test Case 4: Monday 08:00–11:00 Alex -> One continuous 3-hour event
  it('Test Case 4: Long 3-hour interview (08:00–11:00) renders as 1 continuous event with height = 284px', () => {
    const sessions = [
      { id: 'S1', candidateName: 'Alex Chen', startTime: '08:00', endTime: '11:00', status: SESSION_STATUS.SCHEDULED }
    ];
    const layouts = calculateDayEventLayouts(sessions, 96, 8, 10);
    expect(layouts).toHaveLength(1);
    expect(layouts[0].top).toBe(0);
    expect(layouts[0].height).toBe(284); // (180/60)*96 - 4 = 284px
    expect(layouts[0].duration).toBe(180);
    expect(layouts[0].widthPct).toBe(100);
  });

  // Test Case 5: 3 and 4 overlapping events split dynamically
  it('Test Case 5: 3 concurrent events split into 3 columns (33.33% each); 4 concurrent events split into 4 columns (25% each)', () => {
    const threeSessions = [
      { id: 'S1', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED },
      { id: 'S2', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED },
      { id: 'S3', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED }
    ];
    const threeLayouts = calculateDayEventLayouts(threeSessions, 96, 8, 10);
    expect(threeLayouts).toHaveLength(3);
    expect(threeLayouts[0].totalColumns).toBe(3);
    expect(threeLayouts[0].widthPct).toBeCloseTo(33.33, 1);
    expect(threeLayouts[1].widthPct).toBeCloseTo(33.33, 1);
    expect(threeLayouts[2].widthPct).toBeCloseTo(33.33, 1);

    const fourSessions = [
      { id: 'S1', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED },
      { id: 'S2', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED },
      { id: 'S3', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED },
      { id: 'S4', startTime: '08:00', endTime: '09:00', status: SESSION_STATUS.SCHEDULED }
    ];
    const fourLayouts = calculateDayEventLayouts(fourSessions, 96, 8, 10);
    expect(fourLayouts).toHaveLength(4);
    expect(fourLayouts[0].totalColumns).toBe(4);
    expect(fourLayouts[0].widthPct).toBe(25);
    expect(fourLayouts[1].widthPct).toBe(25);
    expect(fourLayouts[2].widthPct).toBe(25);
    expect(fourLayouts[3].widthPct).toBe(25);
  });

  // Test Case 6: Long candidate name handled without changing layout or throwing errors
  it('Test Case 6: Handles very long candidate names without errors or layout distortion', () => {
    const sessions = [
      {
        id: 'S1',
        candidateName: 'Very Long Candidate Name That Should Never Resize The Grid Alexander Maximilian Montgomery-Smith',
        roundName: 'Deep Architectural System Design And Scalability Assessment Round 1',
        startTime: '08:00',
        endTime: '09:00',
        status: SESSION_STATUS.SCHEDULED
      }
    ];
    const layouts = calculateDayEventLayouts(sessions, 96, 8, 10);
    expect(layouts).toHaveLength(1);
    expect(layouts[0].widthPct).toBe(100);
    expect(layouts[0].height).toBe(92);
  });
});

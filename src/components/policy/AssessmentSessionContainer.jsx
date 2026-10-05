import React, { useState, useEffect, useContext } from 'react';
import { 
  ShieldCheck, Clock, Camera, Mic, Maximize, AlertTriangle, 
  CheckCircle2, XCircle, AlertOctagon, Send, FileText, ChevronRight, Lock, Eye,
  Sun, Moon
} from 'lucide-react';
import { ThemeContext } from '../../ThemeContext';
import { PolicyService, VIOLATION_TYPES, VIOLATION_ACTIONS } from '../../services/policy/PolicyService';

export const AssessmentSessionContainer = ({
  policy,
  sessionInfo = {
    title: 'Senior Frontend Engineer Technical Interview',
    candidateName: 'Alex Morgan',
    candidateEmail: 'alex.morgan@example.com'
  },
  onComplete,
  onExit
}) => {
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const effectivePolicy = policy || PolicyService.getPolicies()[0];
  const rules = effectivePolicy.rules || {};
  const maxViolations = rules.violationHandling?.maxViolations || 3;
  const thresholdAction = rules.violationHandling?.actionOnThreshold || VIOLATION_ACTIONS.AUTO_SUBMIT;

  // Session time calculation (minutes -> seconds)
  const initialSeconds = (rules.timeLimit?.durationMinutes || 45) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [sessionStatus, setSessionStatus] = useState('in_progress'); // 'in_progress', 'paused', 'completed', 'terminated'
  const [violations, setViolations] = useState([]);
  const [activeWarning, setActiveWarning] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Mock Questions for demonstration
  const mockQuestions = [
    {
      id: 1,
      type: 'code',
      title: 'Question 1: Implement an LRU Cache in JavaScript',
      description: 'Create a Least Recently Used (LRU) cache with get(key) and put(key, value) operations running in O(1) time complexity.',
      starterCode: 'class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n\n  get(key) {\n    // Implement get\n  }\n\n  put(key, value) {\n    // Implement put\n  }\n}'
    },
    {
      id: 2,
      type: 'mcq',
      title: 'Question 2: React 19 Server Components & Actions',
      description: 'Which hook in React 19 is primarily designed to manage pending states and optimism in asynchronous form transitions?',
      options: ['useOptimistic', 'useActionState', 'useFormStatus', 'useDeferredValue'],
      correctAnswer: 1
    },
    {
      id: 3,
      type: 'text',
      title: 'Question 3: Web Security & Defense-in-Depth',
      description: 'Explain the difference between Content Security Policy (CSP) and Cross-Origin Resource Sharing (CORS). How do they complement each other in modern enterprise web security?'
    }
  ];

  // Record a violation event and check threshold
  const triggerViolation = (type, message, severity = 'medium') => {
    if (sessionStatus !== 'in_progress') return;

    const newCount = violations.length + 1;
    const violationRecord = PolicyService.createViolationRecord({
      type,
      message,
      severity,
      currentCount: newCount,
      maxThreshold: maxViolations,
      actionTaken: newCount >= maxViolations ? thresholdAction : VIOLATION_ACTIONS.WARNING
    });

    setViolations(prev => [...prev, violationRecord]);

    if (newCount >= maxViolations) {
      if (thresholdAction === VIOLATION_ACTIONS.AUTO_SUBMIT || thresholdAction === VIOLATION_ACTIONS.END) {
        setSessionStatus('terminated');
        setActiveWarning({
          title: 'Assessment Auto-Submitted Due to Policy Violations',
          message: `Maximum allowed policy flags (${maxViolations}) exceeded: ${message}. Your answers have been automatically collected for review.`,
          severity: 'high',
          isFinal: true
        });
      } else if (thresholdAction === VIOLATION_ACTIONS.PAUSE) {
        setSessionStatus('paused');
        setActiveWarning({
          title: 'Session Paused by Proctor Policy',
          message: `Multiple policy violations detected (${newCount}/${maxViolations}). Please contact your proctor to resume.`,
          severity: 'high',
          isFinal: false
        });
      }
    } else {
      setActiveWarning({
        title: `Policy Warning (${newCount}/${maxViolations})`,
        message,
        severity: 'medium',
        isFinal: false
      });
    }
  };

  // 1. Timer countdown & auto-submit on expiry
  useEffect(() => {
    if (sessionStatus !== 'in_progress') return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSessionStatus('completed');
          triggerViolation(VIOLATION_TYPES.TIME_EXPIRED, 'Assessment time limit has expired.', 'high');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStatus]);

  // 2. Tab Switch & Visibility Change Detection
  useEffect(() => {
    if (!rules.tabSwitch?.detection || sessionStatus !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(
          VIOLATION_TYPES.TAB_SWITCH,
          'Leaving or switching away from the assessment window is restricted by policy.'
        );
      }
    };

    const handleWindowBlur = () => {
      triggerViolation(
        VIOLATION_TYPES.WINDOW_BLUR,
        'Assessment window lost focus. Please remain focused on the exam screen.'
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [rules.tabSwitch, sessionStatus, violations.length]);

  // 3. Fullscreen Exit Detection
  useEffect(() => {
    if (!rules.fullscreen?.required || sessionStatus !== 'in_progress') return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation(
          VIOLATION_TYPES.FULLSCREEN_EXITED,
          'Full-screen mode was exited. The assessment policy requires full-screen focus.'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [rules.fullscreen, sessionStatus, violations.length]);

  // 4. Clipboard & Right-Click Security
  useEffect(() => {
    if (sessionStatus !== 'in_progress') return;

    const handleCopy = (e) => {
      if (rules.clipboard?.preventCopy) {
        e.preventDefault();
        triggerViolation(VIOLATION_TYPES.COPY_ATTEMPT, 'Copying question content is prohibited by policy.');
      }
    };

    const handlePaste = (e) => {
      if (rules.clipboard?.preventPaste) {
        e.preventDefault();
        triggerViolation(VIOLATION_TYPES.PASTE_ATTEMPT, 'Pasting external content into the exam is prohibited.');
      }
    };

    const handleContextMenu = (e) => {
      if (rules.clipboard?.preventContextMenu) {
        e.preventDefault();
        triggerViolation(VIOLATION_TYPES.RIGHT_CLICK_ATTEMPT, 'Right-click context menu is disabled.');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [rules.clipboard, sessionStatus, violations.length]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAssessment = () => {
    setSessionStatus('completed');
    if (onComplete) {
      onComplete({
        policyId: effectivePolicy.id,
        policyVersion: effectivePolicy.version,
        timeSpentSeconds: initialSeconds - secondsRemaining,
        violationsCount: violations.length,
        violationsList: violations,
        answers
      });
    }
  };

  return (
    <div className="w-full min-h-[550px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Top Proctoring HUD Bar */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span className="text-slate-800 dark:text-slate-200">{effectivePolicy.name}</span>
            <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.2 rounded border border-brand/20 font-bold">
              {effectivePolicy.version}
            </span>
          </div>

          {rules.recording?.enabled && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              RECORDING
            </div>
          )}
        </div>

        {/* Live Device Status Indicators & Controls */}
        <div className="flex items-center gap-3 text-xs font-medium flex-wrap">
          {rules.camera?.required && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
              <Camera className="w-3.5 h-3.5" />
              <span>Cam: ON</span>
            </div>
          )}

          {rules.microphone?.required && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
              <Mic className="w-3.5 h-3.5" />
              <span>Mic: ON</span>
            </div>
          )}

          {/* Violations Flag Counter */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${violations.length > 0 ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Violations: {violations.length} / {maxViolations}</span>
          </div>

          {/* Countdown Clock */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border ${secondsRemaining < 300 ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'}`}>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* Quick Theme Switcher (Light / Dark) */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            type="button"
            onClick={handleSubmitAssessment}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Send className="w-3 h-3" />
            Submit
          </button>
        </div>
      </header>

      {/* Main Assessment Body or Completion View */}
      {sessionStatus === 'completed' || sessionStatus === 'terminated' ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-xl">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${sessionStatus === 'terminated' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'}`}>
              {sessionStatus === 'terminated' ? <AlertOctagon className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {sessionStatus === 'terminated' ? 'Assessment Submitted with Flags' : 'Assessment Completed Successfully'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Candidate: <span className="text-slate-900 dark:text-white font-semibold">{sessionInfo.candidateName}</span> | Policy: {effectivePolicy.name} ({effectivePolicy.version})
              </p>
            </div>

            {/* Evidence & Violation Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between font-semibold border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Total Flags Logged:</span>
                <span className={violations.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {violations.length} of max {maxViolations}
                </span>
              </div>
              
              {violations.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamped Violation Events:</div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {violations.map((v, i) => (
                      <div key={i} className="text-[11px] p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-rose-600 dark:text-rose-400 font-medium">{v.message}</span>
                        <span className="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-emerald-600 dark:text-emerald-400 text-center py-1 font-semibold">
                  ✓ Clean session: Zero policy violations detected.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onExit}
              className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Return to Policy Center
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Question View */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {mockQuestions.length}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  Type: {mockQuestions[currentQuestionIndex].type}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {mockQuestions[currentQuestionIndex].title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {mockQuestions[currentQuestionIndex].description}
              </p>

              {/* Multiple Choice Options */}
              {mockQuestions[currentQuestionIndex].type === 'mcq' && (
                <div className="space-y-2.5 pt-2">
                  {mockQuestions[currentQuestionIndex].options.map((opt, i) => (
                    <label 
                      key={i} 
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        answers[mockQuestions[currentQuestionIndex].id] === i 
                          ? 'bg-brand/10 border-brand text-brand dark:text-white font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${mockQuestions[currentQuestionIndex].id}`}
                        checked={answers[mockQuestions[currentQuestionIndex].id] === i}
                        onChange={() => setAnswers(prev => ({ ...prev, [mockQuestions[currentQuestionIndex].id]: i }))}
                        className="text-brand focus:ring-brand"
                      />
                      <span className="text-xs">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Code Editor or Text Response */}
              {(mockQuestions[currentQuestionIndex].type === 'code' || mockQuestions[currentQuestionIndex].type === 'text') && (
                <div className="pt-2">
                  <textarea
                    rows={10}
                    value={answers[mockQuestions[currentQuestionIndex].id] ?? (mockQuestions[currentQuestionIndex].starterCode || '')}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [mockQuestions[currentQuestionIndex].id]: e.target.value }))}
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-brand outline-none"
                    placeholder="Write your response here..."
                  />
                </div>
              )}

              {/* Question Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentQuestionIndex === mockQuestions.length - 1}
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover disabled:opacity-40 text-white cursor-pointer shadow-sm"
                >
                  Next Question
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Real-time Violation Alert Toast Modal */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-950 border border-amber-400 dark:border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 mx-auto flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeWarning.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{activeWarning.message}</p>

            <button
              type="button"
              onClick={() => setActiveWarning(null)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
            >
              {activeWarning.isFinal ? 'View Summary' : 'I Understand & Return to Exam'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

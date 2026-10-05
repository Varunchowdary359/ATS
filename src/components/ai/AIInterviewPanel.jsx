import React, { useState, useEffect } from 'react';
import { Bot, User, Play, Clock, CheckCircle2, Award, RotateCcw, X, Mic, Send } from 'lucide-react';
import { AIService } from '../../services/ai/AIService.js';

export default function AIInterviewPanel({ candidateName = 'Rahul Kumar', roleTitle = 'Senior Java Developer', onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [candidateResponse, setCandidateResponse] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const QUESTIONS = [
    {
      id: 1,
      category: 'Technical Architecture & Concurrency',
      question: `Can you explain how you handle high-throughput distributed transaction management in Java microservices using Spring Boot and Kafka?`,
      criteria: 'Distributed tracing, Saga pattern, idempotent consumer'
    },
    {
      id: 2,
      category: 'System Performance Optimization',
      question: `Walk me through a specific memory leak or JVM garbage collection pause you debugged in a production environment. What tools and metrics did you rely on?`,
      criteria: 'JProfiler/VisualVM, heap dump analysis, GC tuning'
    },
    {
      id: 3,
      category: 'Collaboration & Engineering Leadership',
      question: `Describe a situation where a critical feature had to be shipped under aggressive deadlines. How did you balance architectural debt versus delivery velocity?`,
      criteria: 'Prioritization, technical debt ledger, stakeholder communication'
    }
  ];

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStartInterview = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setTranscript([
      {
        speaker: 'AI Interviewer',
        text: `Hello ${candidateName}. Welcome to your PeopleWorks AI Technical Assessment for the ${roleTitle} position. I will ask you 3 structured questions. Let's begin.`
      },
      {
        speaker: 'AI Interviewer',
        text: `Question 1 (${QUESTIONS[0].category}): ${QUESTIONS[0].question}`
      }
    ]);
  };

  const handleSendCandidateAnswer = () => {
    if (!candidateResponse.trim()) return;

    const answer = candidateResponse.trim();
    const newTranscript = [
      ...transcript,
      { speaker: candidateName, text: answer }
    ];

    setCandidateResponse('');

    if (currentStep < QUESTIONS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      newTranscript.push({
        speaker: 'AI Interviewer',
        text: `Thank you. Question ${nextStep + 1} (${QUESTIONS[nextStep].category}): ${QUESTIONS[nextStep].question}`
      });
      setTranscript(newTranscript);
    } else {
      // Completed all questions
      setIsRunning(false);
      setIsCompleted(true);
      newTranscript.push({
        speaker: 'AI Interviewer',
        text: `Thank you for your responses. The interview session is now complete and your evaluation has been recorded.`
      });
      setTranscript(newTranscript);

      setEvaluation({
        overallRating: 4.5,
        recommendation: 'Strong Yes',
        competencyScores: [
          { name: 'System Architecture', score: 90 },
          { name: 'JVM Performance & Debugging', score: 85 },
          { name: 'Engineering Leadership & Communication', score: 92 }
        ],
        strengths: 'Clear explanation of distributed Saga pattern, solid grasp of JVM profiler telemetry, and pragmatic trade-offs.',
        evidenceNotes: 'Candidate demonstrated authoritative production hands-on depth with Spring Boot and Kafka.'
      });
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans text-start">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand dark:text-sky-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">PeopleWorks AI Interview Room</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Simulation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Candidate: <span className="font-semibold text-slate-800 dark:text-slate-200">{candidateName}</span> · Role: <span className="font-semibold text-slate-800 dark:text-slate-200">{roleTitle}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(timerSeconds)}</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {!isRunning && !isCompleted && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Simulated AI Technical Interview</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
              Conduct an interactive AI-driven technical screening with real-time Q&A progression, timed transcript capture, and structured competency evaluation.
            </p>
            <button
              onClick={handleStartInterview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Start AI Interview Session</span>
            </button>
          </div>
        )}

        {(isRunning || isCompleted) && (
          <div className="flex flex-col gap-2.5 flex-1">
            {transcript.map((item, idx) => {
              const isAI = item.speaker === 'AI Interviewer';
              return (
                <div key={idx} className={`flex gap-2 text-xs ${isAI ? 'justify-start' : 'justify-end'}`}>
                  {isAI && (
                    <div className="w-6 h-6 rounded-lg bg-brand text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                      AI
                    </div>
                  )}
                  <div className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    isAI
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60'
                      : 'bg-brand/10 text-brand dark:bg-sky-950/40 dark:text-sky-200 border border-brand/20 dark:border-sky-800/40'
                  }`}>
                    <span className="text-[10px] font-bold block text-slate-400 mb-0.5">{item.speaker}</span>
                    <p>{item.text}</p>
                  </div>
                </div>
              );
            })}

            {isCompleted && evaluation && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>AI Interview Evaluation Scorecard</span>
                  </span>
                  <span className="px-2 py-0.5 text-xs font-black rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {evaluation.recommendation} ({evaluation.overallRating}/5.0)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {evaluation.competencyScores.map((c, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900">
                      <span className="text-[10px] text-slate-500 block truncate">{c.name}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{c.score}%</span>
                    </div>
                  ))}
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-1">
                  <span className="font-bold">Strengths:</span> {evaluation.strengths}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  <span className="font-bold">Evidence:</span> {evaluation.evidenceNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      {isRunning && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCandidateAnswer();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={candidateResponse}
              onChange={(e) => setCandidateResponse(e.target.value)}
              placeholder={`Type or simulate ${candidateName}'s response...`}
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={!candidateResponse.trim()}
              className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

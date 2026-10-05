import React from 'react';
import { Award, Check, X, User, Briefcase, Calendar, Star, HelpCircle, ArrowRight, UploadCloud, AlertTriangle, FileText, ExternalLink, Sparkles } from 'lucide-react';

export default function AIResultCard({ card, onActionClick }) {
  if (!card) return null;

  // Screening Report Card
  if (card.type === 'screening_result') {
    const isHigh = card.score >= 75;
    const isMedium = card.score >= 50 && card.score < 75;

    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title}</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
              isHigh ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
              isMedium ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
              'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
            }`}>
              {card.score}% Match
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2.5 leading-relaxed">{card.summary}</p>

        {card.matchedSkills && card.matchedSkills.length > 0 && (
          <div className="mb-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Matched Skills:</span>
            <div className="flex flex-wrap gap-1">
              {card.matchedSkills.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.missingSkills && card.missingSkills.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Missing / Gap Skills:</span>
            <div className="flex flex-wrap gap-1">
              {card.missingSkills.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <X className="w-3 h-3 text-rose-600" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.actions && card.actions.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick(act)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand hover:bg-brand-hover text-white transition-all cursor-pointer shadow-xs"
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Candidate List Card
  if (card.type === 'candidate_list' && card.candidates) {
    return (
      <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">{card.title}</span>
        <div className="flex flex-col gap-1.5">
          {card.candidates.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{c.candidateName}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{c.appliedRole || c.currentTitle} · {c.totalExperience || 'N/A'}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {c.currentStage || 'Applied'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Interview Questions Kit Card
  if (card.type === 'questions_list' && card.questions) {
    return (
      <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">{card.title}</span>
        <div className="flex flex-col gap-2">
          {card.questions.map((q, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
              <span className="text-[10px] font-bold text-brand dark:text-sky-400 uppercase tracking-wide block mb-0.5">{q.category}</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{q.question}</p>
              {q.followUp && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">Follow-up: {q.followUp}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Operational Metrics Summary Card
  if (card.type === 'metrics_summary' && card.metrics) {
    return (
      <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">{card.title}</span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {card.metrics.map((m, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">{m.label}</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Job Posting Review Card
  if (card.type === 'posting_review') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title}</span>
          </div>
          {card.badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
              {card.badge}
            </span>
          )}
        </div>

        {card.details && (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            {card.details.map((d, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {card.actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                  act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  act.color === 'blue' ? 'bg-brand hover:bg-brand-hover text-white' :
                  act.color === 'rose' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Publication Live Result Card
  if (card.type === 'publication_result') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            {card.badge || 'Published'}
          </span>
        </div>

        {card.details && (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            {card.details.map((d, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {card.results && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Distribution Channels:</span>
            {card.results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{r.channelName}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{r.method} · {r.reach}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Live 🟢
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Channel Selector Widget
  if (card.type === 'channel_selector' && card.channels) {
    return (
      <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">{card.title}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2.5">{card.subtitle}</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2.5">
          {card.channels.map((ch, i) => (
            <div
              key={i}
              onClick={() => onActionClick && onActionClick({ actionIntent: 'select_channel', text: ch.name })}
              className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                ch.selected
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <span className="font-bold block">{ch.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{ch.method}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                ch.selected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                {ch.selected ? '✓' : '+'}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={() => onActionClick && onActionClick({ actionIntent: 'send_text', text: 'All channels' })}
            className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-brand hover:bg-brand-hover text-white transition-all shadow-xs"
          >
            Select All Channels
          </button>
        </div>
      </div>
    );
  }

  // JD Selector Widget
  if (card.type === 'jd_selector' && card.items) {
    return (
      <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">{card.title}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2.5">{card.subtitle}</span>
        <div className="flex flex-col gap-1.5">
          {card.items.map((item, i) => (
            <div
              key={i}
              onClick={() => onActionClick && onActionClick({ actionIntent: 'send_text', text: item.id })}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:border-brand transition-all flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{item.title}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.id} · {item.department} · {item.experience}</span>
              </div>
              <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                {item.actionText || 'Select'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Resume Upload Card (Step 1)
  if (card.type === 'resume_upload_card') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
          <UploadCloud className="w-4 h-4 text-brand dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title || 'Step 1 of 7 — Resume Upload'}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{card.subtitle || 'Upload candidate resume (PDF, DOCX, or TXT format) to parse details.'}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onActionClick && onActionClick({ actionIntent: 'trigger_file_upload' })}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand hover:bg-brand-hover text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Choose Resume File</span>
          </button>
        </div>
      </div>
    );
  }

  // Candidate Extraction Review Card (Step 3)
  if (card.type === 'candidate_extraction_card') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title || 'Extracted Candidate Details'}</span>
          {card.badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              card.badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
              'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
            }`}>
              {card.badge}
            </span>
          )}
        </div>

        {/* Structured Sections (Personal, Professional, Experience, Education, Skills, Certifications, Links) */}
        {card.sections ? (
          <div className="space-y-2.5 mb-3">
            {card.sections.map((sec, sIdx) => (
              <div key={sIdx} className="p-2 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-brand dark:text-sky-400 uppercase tracking-wide block mb-1.5">{sec.title}</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {sec.fields.map((f, fIdx) => (
                    <div key={fIdx} className="flex flex-col p-1 rounded bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">{f.label}</span>
                        <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                          f.status === 'Extracted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          f.status === 'Needs Review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {f.status || 'Extracted'}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{f.value || 'Not Found'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : card.fields ? (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            {card.fields.map((f, i) => (
              <div key={i} className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{f.label}</span>
                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                    f.status === 'Extracted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                    f.status === 'Needs Review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {f.status || 'Extracted'}
                  </span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{f.value || 'Not Found'}</span>
              </div>
            ))}
          </div>
        ) : null}

        {card.skills && card.skills.length > 0 && !card.sections && (
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Identified Skills:</span>
            <div className="flex flex-wrap gap-1">
              {card.skills.map((s, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                  act.color === 'blue' ? 'bg-brand hover:bg-brand-hover text-white' :
                  act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Duplicate Candidate Match Card (Step 4)
  if (card.type === 'duplicate_candidate_card') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 shadow-sm text-start font-sans">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-200/60 dark:border-amber-800/40">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{card.title || 'Duplicate Match Detected'}</span>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-300 mb-2 leading-relaxed">{card.reason || 'Candidate details match an existing record.'}</p>
        
        {card.candidate && (
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200/60 dark:border-amber-900/60 mb-3 text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">{card.candidate.name}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{card.candidate.id} · {card.candidate.email} · {card.candidate.phone || 'No Phone'}</span>
          </div>
        )}

        {card.actions && (
          <div className="flex flex-wrap items-center gap-2">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                  act.color === 'blue' ? 'bg-brand hover:bg-brand-hover text-white' :
                  act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Requisition Selector Card (Step 5)
  if (card.type === 'requisition_selector_card' && card.requisitions) {
    return (
      <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">{card.title}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2.5">Select an open requisition to link this candidate application:</span>
        <div className="flex flex-col gap-1.5 mb-2">
          {card.requisitions.map((req, i) => (
            <div
              key={i}
              onClick={() => onActionClick && onActionClick({ actionIntent: 'select_requisition', action: 'select_requisition', text: req.id })}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:border-brand transition-all flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{req.title}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{req.id} · {req.department} · {req.location}</span>
              </div>
              <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-brand text-white">
                Select
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onActionClick && onActionClick({ actionIntent: 'skip_requisition', action: 'skip_requisition', text: 'Skip' })}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline font-medium cursor-pointer"
        >
          Skip (Add to general talent pool)
        </button>
      </div>
    );
  }

  // Resume Preview Card (Step 2)
  if (card.type === 'resume_preview_card') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand dark:text-sky-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title || 'Step 2 of 7 — Resume Parsed & Document Preview'}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
            {card.badge || 'Parsed Successfully'}
          </span>
        </div>

        {/* File Metadata Pill */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] mb-2.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300">📄 {card.fileName || 'Resume.pdf'}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{card.fileType || 'PDF Document'}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{card.fileSize || '1.2 MB'}</span>
        </div>

        {/* Highlighted Profile Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Candidate Name</span>
            <span className="font-bold text-slate-900 dark:text-white truncate">{card.candidateName || 'N/A'}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Current Role</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.currentRole || card.currentTitle || 'Professional'}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Company & Experience</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.currentCompany || 'N/A'} · {card.experience || card.totalExperience || '0 yrs'}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Location</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.location || 'Remote / Unspecified'}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Email</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.email || 'Not Found'}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Phone</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.phone || 'Not Found'}</span>
          </div>
        </div>

        {/* Skills Preview */}
        {card.skills && card.skills.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Key Extracted Skills:</span>
            <div className="flex flex-wrap gap-1">
              {card.skills.slice(0, 8).map((s, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={() => onActionClick && onActionClick({ actionIntent: 'view_resume', fileName: card.fileName, rawText: card.rawText })}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Resume</span>
          </button>
          {card.actions && card.actions.map((act, i) => (
            <button
              key={i}
              onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action })}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                act.color === 'blue' ? 'bg-brand hover:bg-brand-hover text-white' :
                act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Resume Match Score Card
  if (card.type === 'resume_match_score_card' || card.type === 'jd_match_score_card') {
    const isHigh = card.overallScore >= 75;
    const isMedium = card.overallScore >= 50 && card.overallScore < 75;

    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">{card.title || 'Resume Match Score'}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Target JD: <strong className="text-slate-700 dark:text-slate-200">{card.jdTitle || 'Approved JD'}</strong> ({card.jdId || 'REQ Role'})</span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-base font-black px-2.5 py-0.5 rounded-xl ${
              isHigh ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              isMedium ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}>
              {card.overallScore} / 100
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Overall Alignment</span>
          </div>
        </div>

        {/* 4-Axis Score Breakdown */}
        {card.breakdown && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Skill Match</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{card.breakdown.skillMatch}%</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Experience</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{card.breakdown.experienceMatch}%</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Role Fit</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{card.breakdown.roleMatch}%</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Education</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{card.breakdown.educationMatch}%</span>
            </div>
          </div>
        )}

        {/* Matched Requirements */}
        {card.matchedRequirements && card.matchedRequirements.length > 0 && (
          <div className="mb-2">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">✓ Matched Requirements:</span>
            <ul className="space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
              {card.matchedRequirements.map((req, i) => (
                <li key={i} className="flex items-center gap-1">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Requirements */}
        {card.missingMandatoryRequirements && card.missingMandatoryRequirements.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-1">⚠️ Missing Mandatory Requirements:</span>
            <ul className="space-y-0.5 text-[11px] text-rose-700 dark:text-rose-300">
              {card.missingMandatoryRequirements.map((req, i) => (
                <li key={i} className="flex items-center gap-1">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {card.actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                  act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  act.color === 'blue' ? 'bg-brand hover:bg-brand-hover text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Application Draft Linkage Card (Step 5)
  if (card.type === 'application_draft_card') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand dark:text-sky-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title || 'Step 5 of 7 — Application Linkage Draft'}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
            {card.status || 'Draft Ready'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Candidate</span>
            <span className="font-bold text-slate-900 dark:text-white truncate">{card.candidateName}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Applying For</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.jobTitle || card.jdTitle || 'Open Role'}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Target Requisition</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.requisitionId || 'Unassigned'}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Match Score</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate">{card.matchScore || '82/100'}</span>
          </div>
        </div>

        {card.actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                  act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  act.color === 'blue' ? 'bg-brand hover:bg-brand-hover text-white' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Candidate Final Review Card (Step 6)
  if (card.type === 'candidate_review_card') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title}</span>
          {card.badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              card.badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
              'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
            }`}>
              {card.badge}
            </span>
          )}
        </div>

        {card.details && (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            {card.details.map((d, i) => (
              <div key={i} className="flex flex-col p-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{d.label}</span>
                  {d.source && (
                    <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {d.source}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {card.actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                  act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  act.color === 'blue' ? 'bg-brand hover:bg-brand-hover text-white' :
                  act.color === 'rose' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100' :
                  'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Candidate Created Result Card (Step 7)
  if (card.type === 'candidate_created_card') {
    return (
      <div className="my-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-start font-sans">
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <span className="text-xs font-bold text-slate-900 dark:text-white">{card.title}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
            {card.badge || 'Created'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Candidate ID</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{card.candidateId}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Email</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{card.email}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Experience</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{card.experience || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Requisition Link</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{card.requisitionId || 'Talent Pool'}</span>
          </div>
        </div>

        {card.actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            {card.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => onActionClick && onActionClick({ actionIntent: act.action, action: act.action, candidateId: card.candidateId, requisitionId: card.requisitionId })}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand hover:bg-brand-hover text-white transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>{act.label}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

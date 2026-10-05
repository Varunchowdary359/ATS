import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, Send, ShieldCheck, 
  RotateCcw, Award, ExternalLink, Layers, MapPin
} from 'lucide-react';
import { OFFER_STATUS } from '../offerTypes';

export const OfferHeader = ({
  offer,
  onBack,
  brandColor = 'var(--pw-brand)',
  isPendingMyApproval = false,
  actionLoading = false,
  badgeStyle = {},
  onOpenCandidatePortal = () => {},
  onOpenApprovalModal = () => {},
  onGenerateLetter = () => {},
  onSendOffer = () => {},
  onOpenCounterModal = () => {},
  onOpenPreboardingHandoff = () => {},
  onOpenWithdrawModal = () => {}
}) => {
  if (!offer) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-gradient-to-br from-blue-50/50 via-white/80 to-slate-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/30 backdrop-blur-xl border border-blue-100/80 dark:border-blue-900/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(26,86,219,0.05)] relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        
        {/* Left: Back Arrow + Candidate Avatar + Title Strip */}
        <div className="flex items-center gap-4 min-w-0">
          
          {/* Back Button with Hover Animation */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-2xs transition-all cursor-pointer shrink-0"
            title="Back to Offer Pipeline"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </motion.button>

          {/* Candidate Avatar with Glassmorphic Accent Border */}
          <div 
            className="w-13 h-13 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-brand/20 shrink-0 border border-white/30"
            style={{ backgroundColor: brandColor }}
          >
            {offer.candidateName ? offer.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
          </div>

          {/* Title & Metadata */}
          <div className="min-w-0">
            {/* Top Row: Name + Code + Status */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                {offer.candidateName}
              </h1>
              
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {offer.offerCode} <span className="text-slate-400 font-normal ml-1">· v{offer.version}</span>
              </span>
              
              {/* Modern Status Badge */}
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} flex items-center gap-1.5 shadow-2xs`}>
                <span className={`w-2 h-2 rounded-full ${badgeStyle.dot} animate-pulse`} />
                <span>{badgeStyle.label}</span>
              </span>
            </div>

            {/* Sub-meta Information with clean bullet alignment */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap font-medium leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {offer.jobTitle}
              </span>
              
              {offer.department && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 font-bold select-none">•</span>
                  <span>{offer.department}</span>
                </>
              )}

              {offer.requisitionId && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 font-bold select-none">•</span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-mono">
                    <Layers size={13} className="text-slate-400 shrink-0" />
                    <span>{offer.requisitionId}</span>
                  </span>
                </>
              )}
              
              {(offer.workLocation || offer.workArrangement) && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 font-bold select-none">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>{offer.workLocation || 'Bengaluru'}</span>
                    {offer.workArrangement && (
                      <span className="text-slate-400 dark:text-slate-500">({offer.workArrangement})</span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: SaaS Glassmorphic Action Button Cluster */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* Candidate Simulator Portal */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenCandidatePortal(offer)}
            className="h-9.5 px-3.5 border border-slate-200/80 dark:border-slate-700 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ExternalLink size={14} className="text-slate-500 dark:text-slate-400" />
            <span>Candidate Portal</span>
          </motion.button>

          {/* Approver Sign-off Action */}
          {isPendingMyApproval && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenApprovalModal}
              className="h-9.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={15} />
              <span>Review & Sign Off</span>
            </motion.button>
          )}

          {/* Approved -> Generate Letter */}
          {offer.status === OFFER_STATUS.APPROVED && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGenerateLetter}
              disabled={actionLoading}
              style={{ backgroundColor: brandColor }}
              className="h-9.5 px-4 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText size={15} />
              <span>Generate Offer Letter</span>
            </motion.button>
          )}

          {/* Generated -> Send to Candidate */}
          {offer.status === OFFER_STATUS.GENERATED && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSendOffer}
              disabled={actionLoading}
              style={{ backgroundColor: brandColor }}
              className="h-9.5 px-4 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send size={15} />
              <span>Send to Candidate</span>
            </motion.button>
          )}

          {/* In Negotiation -> Review & Counter */}
          {offer.status === OFFER_STATUS.NEGOTIATION && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenCounterModal}
              style={{ backgroundColor: brandColor }}
              className="h-9.5 px-4 text-white text-xs font-bold rounded-xl hover:brightness-110 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Respond to Counter</span>
            </motion.button>
          )}

          {/* Accepted -> Move to Preboarding */}
          {offer.status === OFFER_STATUS.ACCEPTED && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenPreboardingHandoff(offer)}
              style={{ backgroundColor: brandColor }}
              className="h-9.5 px-4 text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Award size={15} />
              <span>Move to Preboarding</span>
            </motion.button>
          )}

          {/* Withdraw Button */}
          {![OFFER_STATUS.COMPLETED, OFFER_STATUS.WITHDRAWN, OFFER_STATUS.DECLINED].includes(offer.status) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenWithdrawModal}
              className="h-9.5 px-3.5 text-xs font-bold text-slate-500 hover:text-rose-600 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
            >
              Withdraw
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

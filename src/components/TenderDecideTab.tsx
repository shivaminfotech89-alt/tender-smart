import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';
import type { TenderRecord } from '../types';
import { motion } from 'motion/react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function TenderDecideTab({ tender }: { tender: TenderRecord }) {
  const t = tender.analysis;
  if (!t) return null;
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] transition-shadow">
         <div className="absolute top-0 right-0 bg-blue-900/30 text-blue-400 border-b border-l border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-bl shadow-[0_0_10px_rgba(59,130,246,0.3)]">ELIGIBILITY CHECK</div>
         <h4 className="text-sm text-slate-500 uppercase tracking-wider mb-2 mt-2 font-bold">Match Score</h4>
         <p className="text-4xl font-mono font-black text-blue-400 mb-6 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">{t.matchScore || 85}%</p>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Turnover</p>
               <p className="text-sm text-slate-300 font-medium">{t.matchRationale?.turnover}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Experience</p>
               <p className="text-sm text-slate-300 font-medium">{t.matchRationale?.experience}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Certifications</p>
               <p className="text-sm text-slate-300 font-medium">{t.matchRationale?.certifications}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Location</p>
               <p className="text-sm text-slate-300 font-medium">{t.matchRationale?.location}</p>
            </div>
         </div>
      </motion.div>

      <motion.div variants={item} className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] transition-shadow">
         <div className="absolute top-0 right-0 bg-amber-900/30 text-amber-400 border-b border-l border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-bl shadow-[0_0_10px_rgba(245,158,11,0.3)]">BID DECISION</div>
         <h4 className="text-sm text-slate-500 uppercase tracking-wider mb-2 mt-2 font-bold">AI Recommendation</h4>
         <div className={`inline-block px-4 py-2 rounded-xl text-sm font-black mb-4 border ${t.recommendationDecision === 'Avoid' ? 'bg-red-900/30 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : t.recommendationDecision === 'Participate' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-900/30 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`}>
           {t.recommendationDecision || 'Participate'}
         </div>
         <p className="text-sm text-slate-300 font-medium leading-relaxed">{t.recommendationReason}</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={item} className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)] transition-shadow">
             <h4 className="text-sm text-slate-500 uppercase tracking-wider mb-2 font-bold">Risk Level</h4>
             <p className={`text-3xl font-black ${t.riskLevel === 'Low' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : t.riskLevel === 'High' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]'}`}>{t.riskLevel || 'Medium'}</p>
             <ul className="mt-6 space-y-3">
               {t.riskFactors?.map((r: any, i: number) => <li key={i} className="text-sm font-medium text-slate-300 flex items-start"><AlertTriangle className="w-4 h-4 mr-2 text-amber-500 shrink-0 mt-0.5 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]"/> <span>{r}</span></li>)}
             </ul>
          </motion.div>
          <motion.div variants={item} className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)] transition-shadow">
             <h4 className="text-sm text-slate-500 uppercase tracking-wider mb-2 font-bold">Pros & Cons</h4>
             <div className="space-y-4 mt-6">
                <div>
                  <h5 className="text-xs font-bold text-emerald-400 uppercase mb-2 tracking-wider">Pros</h5>
                  <ul className="space-y-2">
                    {t.prosCons?.pros?.map((p: any, i: number) => <li key={i} className="text-sm text-slate-300 font-medium">- {p}</li>)}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-red-400 uppercase mb-2 tracking-wider">Cons</h5>
                  <ul className="space-y-2">
                    {t.prosCons?.cons?.map((p: any, i: number) => <li key={i} className="text-sm text-slate-300 font-medium">- {p}</li>)}
                  </ul>
                </div>
             </div>
          </motion.div>
      </div>
    </motion.div>
  );
}

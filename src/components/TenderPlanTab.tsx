import React from 'react';
import { Calendar, Target, Settings, Map } from 'lucide-react';
import type { TenderRecord } from '../types';

export default function TenderPlanTab({ tender }: { tender: TenderRecord }) {
  const t = tender.analysis;
  if (!t) return null;
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-600" />
          Scope & Logistics
        </h4>
        <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
          {t.scopeSummary || 'No scope summary available.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Critical Dates
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Pre-Bid Meeting</p>
             <p className="font-mono font-bold text-slate-900">{t.criticalDates?.preBidMeeting || 'N/A'}</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Query Deadline</p>
             <p className="font-mono font-bold text-slate-900">{t.criticalDates?.queryDeadline || 'N/A'}</p>
           </div>
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
             <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Submission Deadline</p>
             <p className="font-mono font-black text-blue-900">{t.criticalDates?.submissionDeadline || 'N/A'}</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Execution Duration</p>
             <p className="font-mono font-bold text-slate-900">{t.criticalDates?.executionDuration || 'N/A'}</p>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Roadmap & Strategy
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div>
             <h5 className="text-xs font-bold text-blue-600 uppercase mb-4 tracking-wider">Winning Strategy</h5>
             <ul className="space-y-3">
               {t.winningStrategy?.map((w: any, i: number) => (
                 <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                   <span>{w}</span>
                 </li>
               ))}
             </ul>
           </div>
           <div>
             <h5 className="text-xs font-bold text-blue-600 uppercase mb-4 tracking-wider">Immediate Next Steps</h5>
             <div className="space-y-4">
               {t.roadmap?.map((r: any, i: number) => (
                 <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                     {i + 1}
                   </div>
                   <p className="text-sm font-medium text-slate-700">{r}</p>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

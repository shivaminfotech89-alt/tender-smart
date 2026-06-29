import React, { useState } from 'react';
import { FileText, Loader2, Copy, Download, CheckCircle2 } from 'lucide-react';
import type { TenderRecord, RequiredForm } from '../types';

export default function TenderFormsTab({ tender, profile }: { tender: TenderRecord; profile: any }) {
  const forms = tender.analysis?.requiredForms || [];
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<{ [code: string]: string }>({});
  
  const handleGenerate = async (formCode: string) => {
    setGeneratingFor(formCode);
    try {
      const res = await fetch('/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfile: profile?.profileText || '',
          tenderContext: JSON.stringify(tender.analysis),
          targetBidValue: tender.calculator?.finalBidValue || 0,
          requiredDocs: [formCode]
        })
      });
      const data = await res.json();
      if (data[formCode]) {
        setDrafts({ ...drafts, [formCode]: data[formCode] });
      }
    } catch (e) {
      console.error(e);
    }
    setGeneratingFor(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-sm text-slate-700 items-start shadow-sm">
        <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 block mb-1">Required Forms Auto-Fill</span>
          <p>These forms were automatically detected in the tender documents. You can generate drafts here, but remember: government tender portals require manual submission and digital signing. This tool cannot auto-submit anything on your behalf.</p>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No specific named forms or annexures were detected in this tender.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map(form => (
            <div key={form.code} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-5 border-b border-slate-100 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{form.code}</span>
                  {drafts[form.code] && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{form.name}</h4>
                <p className="text-sm text-slate-500">{form.description}</p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                 {!drafts[form.code] ? (
                   <button 
                     onClick={() => handleGenerate(form.code)} 
                     disabled={generatingFor === form.code}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                   >
                     {generatingFor === form.code ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                     {generatingFor === form.code ? 'Generating...' : 'Auto-fill draft'}
                   </button>
                 ) : (
                   <div className="w-full">
                     <textarea 
                       value={drafts[form.code]} 
                       onChange={e => setDrafts({...drafts, [form.code]: e.target.value})}
                       className="w-full h-48 bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 custom-scrollbar focus:border-blue-500 outline-none mb-3"
                     />
                     <div className="flex justify-end gap-2">
                       <button onClick={() => navigator.clipboard.writeText(drafts[form.code])} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1">
                         <Copy className="w-3 h-3" /> Copy
                       </button>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

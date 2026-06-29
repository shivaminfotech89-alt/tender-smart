import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, FileText, Loader2, Search, AlertTriangle, Settings, FileArchive } from 'lucide-react';
import { db, doc, setDoc, getDoc, collection } from '../lib/firebase';
import type { TenderRecord, CostCalculator } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  user: any;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function NewTenderModal({ user, onClose, onCreated }: Props) {
  const [tab, setTab] = useState<'upload' | 'paste' | 'url'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setError('');
    
    let textContent = text;
    if (tab === 'url' && url) {
       setLoading(true);
       try {
         const res = await fetch(url);
         if (!res.ok) throw new Error('Could not fetch URL. It might be blocked or require login.');
         textContent = await res.text();
       } catch (err: any) {
         setError(err.message || 'Blocked URL. Please paste text or use PDF instead.');
         setLoading(false);
         return;
       }
    } else if (tab === 'paste' && !textContent.trim()) {
       setError('Please paste tender text');
       return;
    } else if (tab === 'upload' && !file) {
       setError('Please upload a PDF or ZIP file');
       return;
    }

    setLoading(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 1500);

    try {
      const profSnap = await getDoc(doc(db, "users", user.uid));
      const profile = profSnap.data();

      const formData = new FormData();
      formData.append('businessProfile', JSON.stringify(profile));
      if (tab === 'upload' && file) {
        formData.append('tenderFile', file);
      } else {
        formData.append('textContent', textContent);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze');
      }

      const analysis = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      // Create new record
      const newRef = doc(collection(db, "tenders"));
      
      const defaultCalc: CostCalculator = {
        material: Math.floor((analysis.baseValueEstimated || 0) * 0.4),
        labour: Math.floor((analysis.baseValueEstimated || 0) * 0.2),
        transport: 0,
        siteExpenses: 0,
        consultancy: 0,
        profitPercent: 15,
        gstPercent: 18,
        tdsPercent: 2,
        contingencyPercent: 5
      };

      const record: TenderRecord = {
        id: newRef.id,
        userId: user.uid,
        projectName: analysis.projectName || "New Project",
        originalTitle: analysis.originalTitle || "Unknown Title",
        authority: analysis.authority || "Unknown Authority",
        tenderNumber: analysis.tenderNumber || "TND-XX",
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analysis,
        calculator: defaultCalc,
        checkedMandatory: {},
        checkedOptional: {},
        generatedDocs: {}
      };

      await setDoc(newRef, record);
      setTimeout(() => onCreated(newRef.id), 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'An error occurred during analysis.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-slate-900">New Project Analysis</h3>
          <button onClick={onClose} disabled={loading} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 rounded-lg hover:bg-slate-50">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6 relative">
          
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center"
              >
                 <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Documents...</h3>
                 <p className="text-slate-500 mb-8 max-w-xs text-sm">Please wait while our AI engine extracts deliverables, risks, and compliance checklists.</p>
                 
                 <div className="w-full max-w-xs bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border border-slate-200">
                   <div 
                     className="bg-blue-600 h-full transition-all duration-300 ease-out"
                     style={{ width: `${progress}%` }}
                   />
                 </div>
                 <span className="text-sm font-bold text-blue-700">{Math.round(progress)}% Complete</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="flex space-x-2 border-b border-slate-200 mb-6 overflow-x-auto custom-scrollbar">
              <button onClick={() => setTab('upload')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${tab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                <Upload className="w-4 h-4 mr-2"/> Upload Files
              </button>
              <button onClick={() => setTab('paste')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${tab === 'paste' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                <FileText className="w-4 h-4 mr-2"/> Paste Text
              </button>
              <button onClick={() => setTab('url')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${tab === 'url' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                <LinkIcon className="w-4 h-4 mr-2"/> From URL
              </button>
            </div>

            <div className="min-h-[250px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 'upload' && (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 md:p-10 text-center hover:bg-slate-50 transition-colors bg-white">
                       <input type="file" accept=".pdf,.zip" className="hidden" id="file-upload" onChange={e => setFile(e.target.files?.[0] || null)} />
                       <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                         {file && file.name.endsWith('.zip') ? (
                           <FileArchive className="w-12 h-12 text-slate-400 mb-4" />
                         ) : (
                           <Upload className="w-12 h-12 text-slate-400 mb-4" />
                         )}
                         <span className="text-slate-700 font-medium mb-1">{file ? file.name : 'Select PDF or ZIP Document'}</span>
                         <span className="text-slate-500 text-sm">{file ? 'Click to change' : 'Upload tender docs (Max size: 20MB)'}</span>
                       </label>
                    </div>
                  )}
                  
                  {tab === 'paste' && (
                    <textarea 
                      value={text} onChange={e => setText(e.target.value)}
                      placeholder="Paste full tender document details here..."
                      className="w-full h-64 bg-white border border-slate-300 rounded-xl p-4 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none shadow-sm"
                    />
                  )}

                  {tab === 'url' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Tender Document URL</label>
                      <div className="relative shadow-sm rounded-lg">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon className="h-5 w-5 text-slate-400"/>
                        </div>
                        <input
                          type="url" value={url} onChange={e => setUrl(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none"
                          placeholder="https://eprocure.gov.in/..."
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Note: Many government portals block automated fetching. Use PDF/ZIP if this fails.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full md:w-56 lg:w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 shrink-0 h-fit shadow-sm">
             <div className="text-[10px] font-bold text-blue-600 tracking-wider mb-2 flex items-center"><span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse mr-2"></span>AI PREVIEW</div>
             <p className="text-slate-900 font-medium text-sm mb-4">What will be extracted?</p>
             <ul className="space-y-4">
               <li className="flex gap-3">
                 <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs shadow-sm shadow-blue-500/10"><FileText className="w-3 h-3"/></div>
                 <div>
                    <p className="text-sm font-medium text-slate-800">Checklists</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Every document you need.</p>
                 </div>
               </li>
               <li className="flex gap-3">
                 <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs shadow-sm shadow-indigo-500/10"><Search className="w-3 h-3"/></div>
                 <div>
                    <p className="text-sm font-medium text-slate-800">Eligibility</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Know if you qualify.</p>
                 </div>
               </li>
               <li className="flex gap-3">
                 <div className="shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs shadow-sm shadow-amber-500/10"><AlertTriangle className="w-3 h-3"/></div>
                 <div>
                    <p className="text-sm font-medium text-slate-800">Risk Flags</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Spot compliance gaps early.</p>
                 </div>
               </li>
             </ul>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-slate-200 shrink-0 flex flex-col md:flex-row justify-end space-y-3 md:space-y-0">
          <button onClick={onClose} disabled={loading} className="w-full md:w-auto px-5 py-3 md:py-2.5 text-slate-500 hover:text-slate-700 md:mr-4 font-medium transition-colors bg-slate-50 md:bg-transparent rounded-lg border border-slate-200 md:border-transparent">Cancel</button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze} disabled={loading}
            className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-75 focus:outline-none"
          >
            <span>Save & Analyze</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}


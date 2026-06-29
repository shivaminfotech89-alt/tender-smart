import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle, RefreshCcw, Plus, Download, Loader2, File } from 'lucide-react';
import type { TenderRecord, AdditionalDocument } from '../types';
import { storage, ref, uploadBytes, getDownloadURL } from '../lib/firebase';

export default function TenderReanalyzeTab({ tender, updateTender, profile }: { tender: TenderRecord; updateTender: (data: any) => Promise<void>; profile: any }) {
  const docs = tender.additionalDocuments || [];
  const [isAdding, setIsAdding] = useState(false);
  const [docType, setDocType] = useState<AdditionalDocument['type']>('Corrigendum');
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unappliedCount = docs.filter(d => !d.applied).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocFile(e.target.files[0]);
      if (!docName) {
        setDocName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAdd = async () => {
    if (!docName || (!docContent && !docFile)) return;
    setIsUploading(true);
    let fileUrl = '';
    
    try {
      if (docFile) {
        const fileRef = ref(storage, `tenders/${tender.id}/additionalDocs/${Date.now()}_${docFile.name}`);
        await uploadBytes(fileRef, docFile);
        fileUrl = await getDownloadURL(fileRef);
      }
      
      const newDoc: AdditionalDocument = {
        id: Date.now().toString(),
        name: docName,
        type: docType,
        content: docContent,
        fileUrl,
        dateAdded: new Date().toISOString(),
        applied: false
      };
      
      await updateTender({ additionalDocuments: [...docs, newDoc] });
      setIsAdding(false);
      setDocName('');
      setDocContent('');
      setDocFile(null);
    } catch (e) {
      console.error("Failed to upload document", e);
      setError("Failed to upload document");
    }
    setIsUploading(false);
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/re-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfile: profile?.profileText || '',
          originalAnalysis: JSON.stringify(tender.analysis),
          additionalDocs: JSON.stringify(docs.filter(d => !d.applied))
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Create change log
      const log = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        trigger: `Applied ${unappliedCount} new documents`,
        summary: data.changeSummary
      };

      // Mark all docs as applied
      const updatedDocs = docs.map(d => ({ ...d, applied: true }));

      await updateTender({
        analysis: data.updatedAnalysis,
        additionalDocuments: updatedDocs,
        changeLogs: [...(tender.changeLogs || []), log]
      });

    } catch (err: any) {
      setError(err.message || 'Failed to re-analyze');
    }
    setIsReanalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Additional Documents</h3>
          <p className="text-sm text-slate-500 mt-1">Upload Corrigendums, BOQ revisions, or clarifications to update your tender analysis.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4">Add New Document</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Document Name</label>
                <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. BOQ Rev 2" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-blue-500 outline-none">
                  <option>Corrigendum</option>
                  <option>BOQ Revision</option>
                  <option>Clarification</option>
                  <option>Vendor Quote</option>
                  <option>Extension Letter</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">File Attachment (Optional)</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.zip" />
              <div className="flex gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700">
                  <UploadCloud className="w-4 h-4" />
                  {docFile ? 'Change File' : 'Upload File'}
                </button>
                {docFile && (
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                    <File className="w-4 h-4" />
                    {docFile.name}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Content / Text (If no file attached)</label>
              <textarea value={docContent} onChange={e => setDocContent(e.target.value)} placeholder="Paste document text here or type notes..." className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-blue-500 outline-none custom-scrollbar" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={handleAdd} disabled={!docName || (!docContent && !docFile) || isUploading} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploading ? 'Saving...' : 'Save Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {docs.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f7f8f9] border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-5 py-4">Document</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Date Added</th>
                <th className="px-5 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      {doc.name}
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1 rounded hover:bg-blue-100 transition-colors" title="View Document">
                          <File className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-semibold">{doc.type}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{new Date(doc.dateAdded).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-center">
                    {doc.applied ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" /> Applied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded">
                        <AlertCircle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No additional documents added yet.</p>
        </div>
      )}

      {unappliedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h4 className="font-black text-blue-900 text-lg mb-1 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Re-analysis Required
            </h4>
            <p className="text-sm text-blue-800 font-medium">You have {unappliedCount} unapplied document{unappliedCount > 1 ? 's' : ''}. Run analysis to update your match score, bid strategies, and critical dates.</p>
          </div>
          <button 
            onClick={handleReanalyze} disabled={isReanalyzing}
            className="relative z-10 shrink-0 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isReanalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
            {isReanalyzing ? 'Analyzing...' : 'Re-Run Analysis'}
          </button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {tender.changeLogs && tender.changeLogs.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Analysis Change Log</h3>
          <div className="space-y-4">
            {tender.changeLogs.map(log => (
              <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Update</div>
                  <span className="text-slate-500 text-xs font-medium">{new Date(log.date).toLocaleString()}</span>
                  <span className="text-slate-400 text-xs">— {log.trigger}</span>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed">{log.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

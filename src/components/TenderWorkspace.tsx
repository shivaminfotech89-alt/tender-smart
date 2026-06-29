import React, { useState, useEffect } from 'react';
import { db, doc, onSnapshot, updateDoc } from '../lib/firebase';
import type { TenderRecord, CompanyProfile, ChatMessage } from '../types';
import { ArrowLeft, Target, FileText, CheckSquare, MessageSquare, Download, Clock, Calculator, Map, ListTodo, PlusSquare, Copy } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';

import CalculatorTab from './CalculatorTab';
import TenderDecideTab from './TenderDecideTab';
import TenderPlanTab from './TenderPlanTab';
import TenderFormsTab from './TenderFormsTab';
import TenderReanalyzeTab from './TenderReanalyzeTab';

interface Props {
  user: any;
  profile: CompanyProfile;
  tenderId: string;
  onBack: () => void;
}

export default function TenderWorkspace({ user, profile, tenderId, onBack }: Props) {
  const [tender, setTender] = useState<TenderRecord | null>(null);
  const [activeTab, setActiveTab] = useState('match');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "tenders", tenderId), (docSnap) => {
      if (docSnap.exists()) {
        setTender({ id: docSnap.id, ...docSnap.data() } as TenderRecord);
      }
    });
    return unsub;
  }, [tenderId]);

  if (!tender) return <div className="text-slate-900 p-10">Loading workspace...</div>;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdate = async (updates: Partial<TenderRecord>) => {
    try {
       await updateDoc(doc(db, "tenders", tenderId), { ...updates, updatedAt: new Date().toISOString() });
       showToast('Changes saved successfully');
    } catch(err) { console.error('Failed to update', err); }
  };

  const handleGeneratePDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${tender.projectName}_Report.pdf`);
    } catch (e) {
      alert("Error generating PDF");
    }
  };

  const unappliedCount = (tender.additionalDocuments || []).filter(d => !d.applied).length;

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-full bg-transparent min-h-screen">
      {/* Header */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 sticky top-0 z-20">
         <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors shadow-sm">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="min-w-0 flex-1">
               <h2 className="text-xl font-bold text-white mb-1 w-full flex drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                 <input 
                   value={tender.projectName} 
                   onChange={(e) => handleUpdate({ projectName: e.target.value })} 
                   className="bg-transparent outline-none border-b border-transparent hover:border-blue-500/50 focus:border-blue-500 transition-colors w-full min-w-0" 
                 />
               </h2>
               <div className="flex items-center space-x-3 text-sm">
                 <span className="text-blue-400 truncate max-w-[200px] font-mono drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{tender.tenderNumber}</span>
                 <span className="text-slate-600">•</span>
                 <select value={tender.status} onChange={(e) => handleUpdate({ status: e.target.value as any })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-slate-300 outline-none text-xs font-bold shadow-sm cursor-pointer hover:bg-white/10 transition-colors appearance-none">
                    <option value="Analyzing" className="bg-slate-900 text-white">ANALYZING</option>
                    <option value="Active" className="bg-slate-900 text-white">ACTIVE</option>
                    <option value="Submitted" className="bg-slate-900 text-white">SUBMITTED</option>
                    <option value="Won" className="bg-slate-900 text-white">WON</option>
                    <option value="Lost" className="bg-slate-900 text-white">LOST</option>
                    <option value="Archived" className="bg-slate-900 text-white">ARCHIVED</option>
                 </select>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-72 bg-[#0a0a0a]/60 backdrop-blur-xl border-r border-white/10 overflow-y-auto shrink-0 custom-scrollbar p-4 space-y-6 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <SidebarGroup title="Decide">
             <SidebarItem id="match" label="Match Analysis" desc="Do you qualify?" active={activeTab === 'match'} onClick={() => setActiveTab('match')} icon={<Target/>} />
          </SidebarGroup>

          <SidebarGroup title="Plan">
             <SidebarItem id="calculator" label="Expense & Profit" desc="Build your cost estimate" active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} icon={<Calculator/>} />
             <SidebarItem id="plan" label="Scope & Logistics" desc="Critical dates and roadmap" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} icon={<Map/>} />
          </SidebarGroup>

          <SidebarGroup title="Prepare">
             <SidebarItem id="checklist" label="Document Checklist" desc="Track required files" active={activeTab === 'checklist'} onClick={() => setActiveTab('checklist')} icon={<CheckSquare/>} />
             <SidebarItem id="forms" label="Required Forms" desc="Auto-fill detected forms" active={activeTab === 'forms'} onClick={() => setActiveTab('forms')} icon={<ListTodo/>} />
             <SidebarItem id="docs" label="Generate Documents" desc="Draft cover letters & bids" active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<FileText/>} />
          </SidebarGroup>

          <SidebarGroup title="Manage">
             <SidebarItem id="reanalyze" label="Additional Documents" desc="Corrigendums & Re-analyze" active={activeTab === 'reanalyze'} onClick={() => setActiveTab('reanalyze')} icon={<PlusSquare/>} hasDot={unappliedCount > 0} />
             <SidebarItem id="chat" label="Chatbot" desc="Ask questions about tender" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare/>} />
             <SidebarItem id="report" label="Final Report" desc="Download PDF summary" active={activeTab === 'report'} onClick={() => { setActiveTab('report'); handleGeneratePDF(); }} icon={<Download/>} />
          </SidebarGroup>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0" id="report-content">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'match' && <TenderDecideTab tender={tender} />}
                {activeTab === 'calculator' && <CalculatorTab tender={tender} updateTender={handleUpdate} profile={profile} />}
                {activeTab === 'plan' && <TenderPlanTab tender={tender} />}
                {activeTab === 'checklist' && <ChecklistTab tender={tender} updateTender={handleUpdate} />}
                {activeTab === 'forms' && <TenderFormsTab tender={tender} profile={profile} />}
                {activeTab === 'docs' && <DocsTab tender={tender} profile={profile} updateTender={handleUpdate} />}
                {activeTab === 'chat' && <ChatTab tender={tender} profile={profile} />}
                {activeTab === 'reanalyze' && <TenderReanalyzeTab tender={tender} updateTender={handleUpdate} profile={profile} />}
                {activeTab === 'report' && (
                  <div className="bg-[#111]/80 backdrop-blur-md p-12 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center">
                    <div className="w-16 h-16 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      <Download className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Generating Report...</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto">Your PDF is downloading. It contains a snapshot of the current view.</p>
                    <button onClick={() => setActiveTab('match')} className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/50">Return to Match Analysis</button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-white/10 text-white px-5 py-3.5 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] font-bold text-sm flex items-center gap-3 z-50"
          >
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-3">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({ id, label, desc, active, onClick, icon, hasDot }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full text-left flex items-start p-3 rounded-xl transition-all relative group ${active ? 'bg-blue-600/10 border border-blue-500/30 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' : 'hover:bg-white/5 border border-transparent'}`}
    >
      <div className={`mt-0.5 mr-3 shrink-0 transition-transform ${active ? 'text-blue-400 scale-110 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' : 'text-slate-500 group-hover:scale-110 group-hover:text-slate-400'}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <div className="flex-1 pr-4">
        <h5 className={`font-bold text-sm mb-0.5 transition-colors ${active ? 'text-white' : 'text-slate-300'}`}>{label}</h5>
        <p className={`text-[11px] font-medium transition-colors ${active ? 'text-blue-300' : 'text-slate-500'}`}>{desc}</p>
      </div>
      {hasDot && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm ring-2 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
      )}
    </button>
  );
}

function ChecklistTab({ tender, updateTender }: any) {
  const toggleDoc = (type: 'mandatory' | 'optional', name: string) => {
    const field = type === 'mandatory' ? 'checkedMandatory' : 'checkedOptional';
    const current = tender[field] || {};
    updateTender({ [field]: { ...current, [name]: !current[name] } });
  };

  const m = tender.analysis?.checklists?.mandatory || [];
  const o = tender.analysis?.checklists?.optional || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
           <CheckSquare className="w-5 h-5 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
           Mandatory Documents
        </h4>
        <div className="space-y-3">
          {m.map((doc: any, i: number) => {
            const isChecked = tender.checkedMandatory?.[doc.name];
            return (
              <label key={i} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-emerald-900/20 border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'}`}>
                <input type="checkbox" checked={isChecked || false} onChange={() => toggleDoc('mandatory', doc.name)} className="mt-1 w-4 h-4 text-emerald-500 rounded border-white/20 bg-white/5 cursor-pointer accent-emerald-500" />
                <div className="ml-3">
                   <span className={`block font-bold text-sm ${isChecked ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>{doc.name}</span>
                   <span className="block text-xs text-slate-500 mt-1 font-medium">{doc.reason}</span>
                </div>
              </label>
            );
          })}
          {m.length === 0 && <p className="text-sm text-slate-500">None detected.</p>}
        </div>
      </div>
      <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
           <FileText className="w-5 h-5 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
           Optional / Supporting
        </h4>
        <div className="space-y-3">
          {o.map((doc: any, i: number) => {
            const isChecked = tender.checkedOptional?.[doc.name];
            return (
              <label key={i} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-emerald-900/20 border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'}`}>
                <input type="checkbox" checked={isChecked || false} onChange={() => toggleDoc('optional', doc.name)} className="mt-1 w-4 h-4 text-emerald-500 rounded border-white/20 bg-white/5 cursor-pointer accent-emerald-500" />
                <div className="ml-3">
                   <span className={`block font-bold text-sm ${isChecked ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>{doc.name}</span>
                   <span className="block text-xs text-slate-500 mt-1 font-medium">{doc.reason}</span>
                </div>
              </label>
            );
          })}
          {o.length === 0 && <p className="text-sm text-slate-500">None detected.</p>}
        </div>
      </div>
    </div>
  );
}

function DocsTab({ tender, profile, updateTender }: any) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  
  const availableDocs = [
    "Cover Letter", "Financial Bid Letter", "Declaration of Non-Blacklisting", "Power of Attorney Format", "No Deviation Certificate", "Local Content Declaration (Make in India)"
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfile: profile?.profileText || '',
          tenderContext: JSON.stringify(tender.analysis),
          targetBidValue: tender.calculator?.finalBidValue || 0,
          requiredDocs: selectedDocs
        })
      });
      const data = await res.json();
      updateTender({ generatedDocs: { ...tender.generatedDocs, ...data } });
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const generated = tender.generatedDocs || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       <div className="md:col-span-1 bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] h-fit sticky top-6">
          <h4 className="font-bold text-white mb-4">Select Documents to Draft</h4>
          <div className="space-y-2 mb-6">
            {availableDocs.map(doc => (
              <label key={doc} className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer border border-transparent hover:border-white/10 transition-colors">
                <input type="checkbox" checked={selectedDocs.includes(doc)} onChange={(e) => {
                  if(e.target.checked) setSelectedDocs([...selectedDocs, doc]);
                  else setSelectedDocs(selectedDocs.filter(d => d !== doc));
                }} className="w-4 h-4 text-blue-500 rounded border-white/20 bg-white/5 accent-blue-500" />
                <span className="text-sm font-medium text-slate-300">{doc}</span>
              </label>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={isGenerating || selectedDocs.length === 0} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/50">
            {isGenerating ? 'Drafting...' : 'Auto-Draft Selected'}
          </button>
       </div>
       <div className="md:col-span-2 space-y-6">
          {Object.entries(generated).length === 0 && !isGenerating && (
            <div className="text-center p-12 bg-[#111]/50 border border-white/10 border-dashed rounded-2xl">
               <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
               <p className="text-slate-400 font-medium">No documents drafted yet.</p>
            </div>
          )}
          {Object.entries(generated).map(([docName, content]: [string, any]) => (
            <div key={docName} className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col">
               <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                 <h4 className="font-bold text-white">{docName}</h4>
                 <button onClick={() => navigator.clipboard.writeText(content)} className="text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 bg-white/5 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors">
                   <Copy className="w-3 h-3"/> Copy
                 </button>
               </div>
               <textarea value={content} onChange={(e) => updateTender({ generatedDocs: { ...generated, [docName]: e.target.value } })} className="w-full h-80 bg-transparent p-6 text-sm font-mono text-slate-300 outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500/50 custom-scrollbar leading-relaxed" />
            </div>
          ))}
       </div>
    </div>
  );
}

function ChatTab({ tender, profile }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim()) return;

    const userMsg = input;
    setInput('');
    const newMsgs = [...messages, { id: Date.now().toString(), role: 'user', content: userMsg, timestamp: new Date().toISOString() }];
    setMessages(newMsgs as any);
    setIsTyping(true);

    try {
      const res = await fetch('/api/tender-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfile: profile?.profileText || '',
          tenderContext: JSON.stringify(tender.analysis),
          chatHistory: newMsgs.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      setMessages([...newMsgs, { id: Date.now().toString(), role: 'assistant', content: data.reply, timestamp: new Date().toISOString() }] as any);
    } catch (e) {
      console.error(e);
    }
    setIsTyping(false);
  };

  return (
    <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col h-[700px] max-h-[80vh]">
      <div className="p-5 border-b border-white/10 bg-white/5 rounded-t-2xl">
         <h4 className="font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" /> AI Tender Assistant</h4>
         <p className="text-sm font-medium text-slate-400 mt-1">Ask anything about the scope, payment terms, or compliance requirements.</p>
      </div>
      <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-transparent">
         {messages.length === 0 && (
           <div className="text-center mt-12">
             <div className="w-16 h-16 bg-blue-900/30 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400"><MessageSquare className="w-8 h-8"/></div>
             <p className="text-slate-300 font-bold text-lg mb-1">How can I help?</p>
             <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">I've analyzed the tender documents. Select a suggestion or type your own question.</p>
             <div className="mt-8 flex flex-col items-center gap-3">
               <button onClick={() => setInput("What are the payment terms?")} className="text-sm bg-white/5 border border-white/10 shadow-sm px-5 py-2.5 rounded-xl hover:border-blue-500/50 hover:text-blue-300 text-slate-300 font-bold transition-all">What are the payment terms?</button>
               <button onClick={() => setInput("Is there a penalty for delay?")} className="text-sm bg-white/5 border border-white/10 shadow-sm px-5 py-2.5 rounded-xl hover:border-blue-500/50 hover:text-blue-300 text-slate-300 font-bold transition-all">Is there a penalty for delay?</button>
             </div>
           </div>
         )}
         {messages.map((m, i) => (
           <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-medium leading-relaxed shadow-[0_4px_15px_rgba(0,0,0,0.2)] ${m.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm' : 'bg-white/10 border border-white/10 text-slate-200 rounded-tl-sm'}`}>
                 {m.content}
              </div>
           </div>
         ))}
         {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm p-5 flex gap-1.5 items-center shadow-sm">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
             </div>
           </div>
         )}
      </div>
      <div className="p-4 border-t border-white/10 bg-white/5 rounded-b-2xl">
         <form onSubmit={sendMessage} className="flex gap-3">
           <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your question..." className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none text-white font-medium shadow-inner" />
           <button type="submit" disabled={!input.trim() || isTyping} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">Send</button>
         </form>
      </div>
    </div>
  );
}

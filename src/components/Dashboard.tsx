import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot } from '../lib/firebase';
import type { TenderRecord } from '../types';
import { Search, Plus, FileText, ExternalLink } from 'lucide-react';
import NewTenderModal from './NewTenderModal';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  user: any;
  onOpenTender: (id: string) => void;
}

export default function Dashboard({ user, onOpenTender }: Props) {
  const [tenders, setTenders] = useState<TenderRecord[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, "tenders"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: TenderRecord[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as TenderRecord));
      // Sort by updatedAt descending
      data.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setTenders(data);
    });
    return unsubscribe;
  }, [user.uid]);

  const filteredTenders = tenders.filter(t => 
    t.projectName.toLowerCase().includes(search.toLowerCase()) || 
    t.tenderNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.authority.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-10 text-slate-300">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">Project Dashboard</h2>
          <p className="text-slate-400 font-medium mt-1 text-sm md:text-base">Browse, search and manage matched tenders from various authorities.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-blue-400" />
            </div>
            <input
              type="text"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0a]/80 backdrop-blur-md shadow-inner border border-blue-500/30 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              placeholder="Search by tender no, authority..."
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] shrink-0 transition-all border border-blue-400/50"
          >
            <Plus className="w-5 h-5 -ml-1" />
            <span>Add Tender</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="hidden xl:block bg-[#0a0a0a]/60 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#111] border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-5 py-4 w-16 text-center">No.</th>
                <th className="px-5 py-4 w-32">Ref / ID</th>
                <th className="px-5 py-4 min-w-[200px]">Project Details</th>
                <th className="px-5 py-4 w-48">Authority</th>
                <th className="px-5 py-4 text-right w-32">Value (INR)</th>
                <th className="px-5 py-4 text-right w-32">Ai Match</th>
                <th className="px-5 py-4 w-32 text-center">Closing</th>
                <th className="px-5 py-4 w-24 text-center">Status</th>
                <th className="px-5 py-4 w-24 text-center">Workspace</th>
              </tr>
            </thead>
            <motion.tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredTenders.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-blue-500/50" />
                      <p className="font-bold text-white text-lg mb-2">No tenders here yet</p>
                      <p className="font-medium text-slate-400 max-w-sm mx-auto mb-6">Upload a tender document or paste a link to get an instant AI analysis of your chances to win.</p>
                      <button onClick={() => setIsNewModalOpen(true)} className="px-6 py-3 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 text-blue-300 font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                        Analyze your first tender
                      </button>
                    </td>
                  </motion.tr>
                ) : (
                  filteredTenders.map((tender, index) => {
                    const val = tender.analysis?.baseValueEstimated ?? 0;
                    const match = tender.analysis?.matchScore ?? 0;
                    return (
                      <motion.tr 
                        key={tender.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)", scale: 1.002 }}
                        className="transition-colors group hover:shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]"
                      >
                        <td className="px-5 py-4 text-center text-slate-500 font-medium">{index + 1}</td>
                        <td className="px-5 py-4 text-blue-400 font-mono text-xs font-semibold drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{tender.tenderNumber}</td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-white line-clamp-1 mb-1" title={tender.projectName}>
                            {tender.projectName}
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 line-clamp-1 max-w-sm" title={tender.originalTitle}>
                            {tender.originalTitle}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300 text-xs font-semibold">{tender.authority}</td>
                        <td className="px-5 py-4 text-right font-bold text-slate-200">
                          {val ? `₹${val.toLocaleString('en-IN')}` : '--'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide border ${match >= 80 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : match >= 50 ? 'bg-amber-900/30 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-red-900/30 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                            {match}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center text-red-400 text-xs font-bold drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
                          {tender.analysis?.criticalDates?.submissionDeadline || 'N/A'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 inline-flex text-[10px] tracking-wider font-black rounded-md uppercase border ${
                            tender.status === 'Won' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                            tender.status === 'Lost' ? 'bg-red-900/30 text-red-400 border-red-500/30' :
                            tender.status === 'Archived' ? 'bg-slate-800/50 text-slate-400 border-slate-500/30' : 
                            'bg-blue-900/30 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                          }`}>
                            {tender.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => onOpenTender(tender.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-transparent hover:bg-blue-600/20 border border-slate-600 hover:border-blue-400 text-slate-300 hover:text-blue-300 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] group-hover:border-blue-500/50"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      <div className="xl:hidden flex flex-col space-y-4">
        <AnimatePresence>
          {filteredTenders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-blue-500/20 rounded-2xl px-4 py-12 text-center text-slate-400 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <FileText className="w-12 h-12 mx-auto mb-4 text-blue-500/50" />
              <p className="font-bold text-white text-lg mb-2">No tenders here yet</p>
              <p className="font-medium text-slate-400 text-sm max-w-xs mx-auto mb-6">Upload a tender document or paste a link to get an instant AI analysis.</p>
              <button onClick={() => setIsNewModalOpen(true)} className="px-5 py-2.5 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 text-blue-300 font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                Analyze your first tender
              </button>
            </motion.div>
          ) : (
            filteredTenders.map((tender, index) => {
              const val = tender.analysis?.baseValueEstimated ?? 0;
              const match = tender.analysis?.matchScore ?? 0;
              return (
                <motion.div 
                  key={tender.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-blue-500/20 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-3 hover:shadow-[0_8px_32px_rgba(59,130,246,0.2)] transition-shadow"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight mb-1">{tender.projectName}</h3>
                      <p className="text-xs text-blue-400 font-mono drop-shadow-[0_0_3px_rgba(96,165,250,0.5)]">{tender.tenderNumber}</p>
                    </div>
                    <span className={`shrink-0 px-2 flex py-0.5 text-[10px] items-center font-bold rounded uppercase border ${
                      tender.status === 'Won' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                      tender.status === 'Lost' ? 'bg-red-900/30 text-red-400 border-red-500/30' :
                      tender.status === 'Archived' ? 'bg-slate-800/50 text-slate-400 border-slate-500/30' : 
                      'bg-blue-900/30 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    }`}>
                      {tender.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                    <div>
                      <span className="block text-slate-500 mb-0.5">Authority</span>
                      <span className="font-semibold text-slate-300 line-clamp-1" title={tender.authority}>{tender.authority}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Tender Value</span>
                      <span className="font-semibold text-slate-200">{val ? `₹${val.toLocaleString('en-IN')}` : '--'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Match Score</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${match >= 80 ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : match >= 50 ? 'bg-amber-900/30 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-red-900/30 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                        {match}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Closing Date</span>
                      <span className="font-semibold text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]">{tender.analysis?.criticalDates?.submissionDeadline || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="pt-2 mt-1 border-t border-white/10">
                    <button
                      onClick={() => onOpenTender(tender.id)}
                      className="w-full flex justify-center items-center gap-1.5 px-4 py-2.5 bg-blue-900/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-semibold transition-colors shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                      <span>View Workspace</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {isNewModalOpen && (
        <NewTenderModal user={user} onClose={() => setIsNewModalOpen(false)} onCreated={onOpenTender} />
      )}
    </div>
  );
}


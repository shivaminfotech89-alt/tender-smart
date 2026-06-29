/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc } from './lib/firebase';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TenderWorkspace from './components/TenderWorkspace';
import UserProfile from './components/UserProfile';
import type { CompanyProfile, TenderRecord } from './types';
import { Menu, Target, UserCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | `tender_${string}`>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        // Fetch profile
        try {
          const profileSnap = await getDoc(doc(db, "users", currUser.uid));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as CompanyProfile);
          } else {
            setProfile(null);
            setCurrentView('profile'); // Force setup profile
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
          // Default to profile view if load fails to prevent stuck UI, or dashboard?
          // Since profile is null, it'll show user profile view which might let them save again.
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  // Determine what to render based on `currentView`
  let content = null;

  if (currentView === 'profile' || !profile) {
    content = (
      <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
        <UserProfile user={user} profile={profile} onSaved={(p) => { setProfile(p); setCurrentView('dashboard'); }} />
      </motion.div>
    );
  } else if (currentView === 'dashboard') {
    content = (
      <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
        <Dashboard user={user} onOpenTender={(id) => setCurrentView(`tender_${id}`)} />
      </motion.div>
    );
  } else if (currentView.startsWith('tender_')) {
    const tenderId = currentView.split('_')[1];
    content = (
      <motion.div key={`tender_${tenderId}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
        <TenderWorkspace user={user} profile={profile} tenderId={tenderId} onBack={() => setCurrentView('dashboard')} />
      </motion.div>
    );
  }

  return (
    <div className="flex h-screen bg-[#030712] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Futuristic Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/10 via-transparent to-indigo-900/10 pointer-events-none"></div>
      
      {profile && (
        <div className="hidden lg:block z-20">
          <Sidebar 
            currentView={currentView} 
            onNavigate={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
            onLogout={() => auth.signOut()} 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      )}
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 pb-16 lg:pb-0 backdrop-blur-3xl">
        {/* Mobile Header */}
        {profile && (
          <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 shrink-0 sticky top-0 z-20">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">TenderMaster</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-10 min-h-full">
            <AnimatePresence mode="wait">
              {content}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        {profile && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 py-2 pb-safe z-30 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${currentView === 'dashboard' || currentView.startsWith('tender_') ? 'text-blue-400 font-bold scale-105' : 'text-slate-500 font-medium hover:text-slate-300'}`}
            >
              <Target className={`w-5 h-5 mb-1 ${currentView === 'dashboard' || currentView.startsWith('tender_') ? 'text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : ''}`} />
              <span className="text-[10px]">Tenders</span>
            </button>
            <button 
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${currentView === 'profile' ? 'text-blue-400 font-bold scale-105' : 'text-slate-500 font-medium hover:text-slate-300'}`}
            >
              <UserCircle className={`w-5 h-5 mb-1 ${currentView === 'profile' ? 'text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : ''}`} />
              <span className="text-[10px]">Profile</span>
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="flex flex-col items-center justify-center w-16 h-12 rounded-xl text-slate-500 font-medium hover:text-red-400 transition-all"
            >
              <LogOut className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Logout</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

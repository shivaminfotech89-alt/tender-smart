import React from 'react';
import { Target, LayoutDashboard, UserCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  currentView: string;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentView, onNavigate, onLogout }: Props) {
  return (
    <div className="w-[280px] bg-[#0a0a0a] text-white flex flex-col h-full shrink-0 relative z-20 border-r border-white/10 shadow-2xl">
      <div className="p-6 flex items-center space-x-3 cursor-pointer mt-4" onClick={() => onNavigate('dashboard')}>
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/20">
          <Target className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">TenderMaster</span>
      </div>

      <div className="px-6 py-4">
         <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar mt-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Navigations</p>
        <NavButton 
          icon={<LayoutDashboard />} 
          label="Tender Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => onNavigate('dashboard')} 
        />
        <NavButton 
          icon={<UserCircle />} 
          label="Company Profile" 
          active={currentView === 'profile'} 
          onClick={() => onNavigate('profile')} 
        />
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5 rounded-2xl p-4 mb-6 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
           <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all"></div>
           <p className="text-xs font-bold text-white mb-1">PRO Analytics</p>
           <p className="text-[10px] text-slate-400 mb-3">Unlimited AI evaluations.</p>
        </div>

        <motion.button 
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={onLogout}
           className="flex items-center space-x-3 w-full px-5 py-3.5 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent rounded-xl transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
          <span className="font-semibold text-sm">Sign Out</span>
        </motion.button>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center space-x-4 w-full px-5 py-3.5 rounded-xl transition-all group relative overflow-hidden ${
        active 
          ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.02)]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 font-medium border border-transparent'
      }`}
    >
      {active && (
         <motion.div layoutId="activeNavIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-500 rounded-r-md"></motion.div>
      )}
      <div className={`transition-transform duration-200 ${active ? 'scale-110 text-blue-400' : 'group-hover:scale-110 group-hover:text-slate-200'}`}>
         {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <span className="text-sm">{label}</span>
    </motion.button>
  );
}

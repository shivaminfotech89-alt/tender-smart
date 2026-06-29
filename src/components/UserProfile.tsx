import React, { useState } from 'react';
import { Save, UserCircle, Briefcase, MapPin, Award } from 'lucide-react';
import type { CompanyProfile } from '../types';
import { db, doc, setDoc } from '../lib/firebase';

interface Props {
  user: any;
  profile: CompanyProfile | null;
  onSaved: (p: CompanyProfile) => void;
}

export default function UserProfile({ user, profile, onSaved }: Props) {
  const [formData, setFormData] = useState<CompanyProfile>(profile || {
    name: '',
    turnoverCr: '',
    experienceYears: 0,
    capacityUtilization: 0,
    officeLocations: [],
    certifications: [],
    pastProjects: ''
  });
  
  const [newLoc, setNewLoc] = useState('');
  const [newCert, setNewCert] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const p = { ...formData, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, "users", user.uid), p);
      onSaved(p);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    }
    setSaving(false);
  };

  const addLoc = () => { if (newLoc) { setFormData({...formData, officeLocations: [...formData.officeLocations, newLoc]}); setNewLoc(''); } };
  const addCert = () => { if (newCert) { setFormData({...formData, certifications: [...formData.certifications, newCert]}); setNewCert(''); } };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-8">
        {!profile ? (
          <>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome! Let's set up your profile</h2>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">This takes about a minute. We use these details to analyze tenders against your actual capabilities, so you get realistic match scores and bid advice.</p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Company Profile</h2>
            <p className="text-slate-500 font-medium">Your profile is used by TenderMaster AI to determine your eligibility and winning probability for every tender you analyze.</p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircle className="h-5 w-5 text-slate-400"/>
              </div>
              <input
                type="text" required
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none bg-white"
                placeholder="Acme Engineering Pvt Ltd"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Annual Turnover (₹ Crores)</label>
            <input
              type="number" step="0.01" required
              value={formData.turnoverCr} onChange={(e) => setFormData({...formData, turnoverCr: e.target.value})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none bg-white"
              placeholder="e.g. 50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
            <input
              type="number" required min="0"
              value={formData.experienceYears} onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value) || 0})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Workload / Capacity (%)</label>
            <input
              type="number" required min="0" max="100"
              value={formData.capacityUtilization} onChange={(e) => setFormData({...formData, capacityUtilization: parseInt(e.target.value) || 0})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Office Locations</label>
             <div className="flex space-x-2 mb-3">
               <input 
                 value={newLoc} onChange={e => setNewLoc(e.target.value)} 
                 onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLoc())}
                 className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none bg-white" placeholder="e.g. Delhi" 
               />
               <button type="button" onClick={addLoc} className="px-4 py-2 bg-slate-800 rounded-lg text-white font-medium hover:bg-slate-700">Add</button>
             </div>
             <div className="flex flex-wrap gap-2">
               {formData.officeLocations.map((loc, i) => (
                 <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full flex items-center border border-blue-200">
                   {loc}
                   <button type="button" onClick={() => setFormData({...formData, officeLocations: formData.officeLocations.filter((_, idx) => idx !== i)})} className="ml-2 text-blue-500 hover:text-blue-700">×</button>
                 </span>
               ))}
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Certifications & Licenses</label>
             <div className="flex space-x-2 mb-3">
               <input 
                 value={newCert} onChange={e => setNewCert(e.target.value)} 
                 onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())}
                 className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none bg-white" placeholder="e.g. ISO 9001:2015" 
               />
               <button type="button" onClick={addCert} className="px-4 py-2 bg-slate-800 rounded-lg text-white font-medium hover:bg-slate-700">Add</button>
             </div>
             <div className="flex flex-wrap gap-2">
               {formData.certifications.map((cert, i) => (
                 <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full flex items-center border border-emerald-200">
                   {cert}
                   <button type="button" onClick={() => setFormData({...formData, certifications: formData.certifications.filter((_, idx) => idx !== i)})} className="ml-2 text-emerald-500 hover:text-emerald-700">×</button>
                 </span>
               ))}
             </div>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-700 mb-2">Past Projects Experience</label>
           <p className="text-xs text-slate-500 mb-3">List relevant past projects (name, client, value, year). AI uses this to match technical eligibility clauses.</p>
           <textarea
            value={formData.pastProjects}
            onChange={(e) => setFormData({...formData, pastProjects: e.target.value})}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none min-h-[120px] bg-white"
            placeholder="1. Solar Installation at RBI Govt Office - ₹1.2 Cr - 2023&#10;2. Substation upgrade for UGVCL - ₹5 Cr - 2024"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit" disabled={saving}
            className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

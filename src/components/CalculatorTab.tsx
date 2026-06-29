import React, { useState } from 'react';
import { Save, Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TenderRecord, BidLineItem, BidStrategy, CostCalculator } from '../types';

export default function CalculatorTab({ tender, updateTender, profile }: { tender: TenderRecord; updateTender: (data: any) => Promise<void>; profile: any }) {
  const c = tender.calculator;
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      const res = await fetch('/api/predict-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderContext: {
            projectName: tender.projectName,
            authority: tender.authority,
            scope: tender.analysis?.scopeSummary,
            baseValue: tender.analysis?.baseValueEstimated,
          },
          businessProfile: profile?.profileText || '',
        })
      });
      const data = await res.json();
      if (data.lineItems) {
        updateTender({
          calculator: {
            ...c,
            lineItems: data.lineItems,
            strategies: data.strategies,
            benchmarkingNote: data.benchmarkingNote,
            selectedStrategy: 'recommended',
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
    setIsPredicting(false);
  };

  const updateLineItem = (id: string, field: keyof BidLineItem, value: any) => {
    if (!c.lineItems) return;
    const items = c.lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitRate') {
          updated.total = updated.quantity * updated.unitRate;
        }
        return updated;
      }
      return item;
    });
    updateTender({ calculator: { ...c, lineItems: items } });
  };

  const updateCalc = (k: keyof CostCalculator, v: any) => {
    updateTender({ calculator: { ...c, [k]: v } });
  };

  const totalBaseCost = c.lineItems ? c.lineItems.reduce((acc, curr) => acc + curr.total, 0) : (c.material + c.labour + c.transport + c.siteExpenses + c.consultancy);
  const contingency = totalBaseCost * (c.contingencyPercent / 100);
  const estimatedTotalCost = totalBaseCost + contingency;
  const profitAmount = estimatedTotalCost * (c.profitPercent / 100);
  const bidBeforeTax = estimatedTotalCost + profitAmount;
  const taxImpact = bidBeforeTax * (c.gstPercent / 100);
  const finalBidValue = bidBeforeTax + taxImpact;
  
  // Win probability estimation based on selected strategy
  const currentMargin = c.profitPercent;
  let estimatedWinProb = 50;
  if (c.strategies) {
     if (currentMargin <= c.strategies.aggressive.marginPercent) estimatedWinProb = c.strategies.aggressive.winProbability;
     else if (currentMargin >= c.strategies.conservative.marginPercent) estimatedWinProb = c.strategies.conservative.winProbability;
     else estimatedWinProb = c.strategies.recommended.winProbability;
  }

  const handleSave = async () => {
    setIsSaving(true);
    await updateTender({ calculator: { ...c, finalBidValue } });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const applyStrategy = (type: 'conservative' | 'recommended' | 'aggressive') => {
    if (!c.strategies) return;
    const strat = c.strategies[type];
    updateTender({ calculator: { ...c, profitPercent: strat.marginPercent, selectedStrategy: type } });
  };

  const marginTooThin = currentMargin < 5; // Simplified risk check

  return (
    <div className="space-y-6">
      {!c.lineItems && (
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 tracking-tight">AI Bid Predictor</h3>
            <p className="text-blue-100 max-w-xl text-sm md:text-base font-medium leading-relaxed">
              Let AI generate a complete cost breakdown, pricing strategies, and win-probability analysis based on the tender's scope and your company profile.
            </p>
          </div>
          <button 
            onClick={handlePredict} disabled={isPredicting}
            className="relative z-10 shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-xl shadow-lg shadow-white/10 transition-all disabled:opacity-50"
          >
            {isPredicting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>{isPredicting ? 'Analyzing Scope...' : 'Auto-Predict Costs'}</span>
          </button>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full"></div>
        </div>
      )}

      {c.lineItems && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm overflow-hidden">
              <h4 className="text-lg font-bold text-slate-900 mb-4">Interactive Cost Builder</h4>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#f7f8f9] border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold w-24">Qty</th>
                      <th className="px-4 py-3 font-semibold w-32">Rate (₹)</th>
                      <th className="px-4 py-3 font-semibold text-right w-32">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {c.lineItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{item.category}</span>
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-700 text-sm py-1" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-700 font-mono text-sm py-1" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" value={item.unitRate} onChange={e => updateLineItem(item.id, 'unitRate', Number(e.target.value))} className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-700 font-mono text-sm py-1" />
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-slate-700">
                          {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end px-4">
                 <span className="text-sm font-bold text-slate-500 mr-4">Total Base Cost:</span>
                 <span className="text-lg font-black font-mono text-slate-900">₹{totalBaseCost.toLocaleString()}</span>
              </div>
            </div>

            {c.benchmarkingNote && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-sm text-slate-700">
                <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Market Benchmarking</span>
                  <p>{c.benchmarkingNote}</p>
                </div>
              </div>
            )}

            {c.strategies && (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-slate-900">AI Bid Strategies</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StrategyCard type="conservative" strat={c.strategies.conservative} active={c.selectedStrategy === 'conservative'} onSelect={() => applyStrategy('conservative')} />
                  <StrategyCard type="recommended" strat={c.strategies.recommended} active={c.selectedStrategy === 'recommended'} onSelect={() => applyStrategy('recommended')} />
                  <StrategyCard type="aggressive" strat={c.strategies.aggressive} active={c.selectedStrategy === 'aggressive'} onSelect={() => applyStrategy('aggressive')} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm h-fit sticky top-6">
            <h4 className="text-lg font-bold text-slate-900 mb-6">Bid Customization</h4>
            
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between items-end mb-2">
                     <label className="block text-sm font-bold text-slate-700">Profit Margin</label>
                     <span className="font-mono text-blue-600 font-bold">{c.profitPercent}%</span>
                  </div>
                  <input type="range" min="0" max="50" step="0.5" value={c.profitPercent} onChange={e => updateCalc('profitPercent', Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
               </div>

               <div>
                  <div className="flex justify-between items-end mb-2">
                     <label className="block text-sm font-bold text-slate-700">Contingency</label>
                     <span className="font-mono text-slate-600 font-bold">{c.contingencyPercent}%</span>
                  </div>
                  <input type="range" min="0" max="20" step="1" value={c.contingencyPercent} onChange={e => updateCalc('contingencyPercent', Number(e.target.value))} className="w-full accent-slate-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">GST %</label>
                   <input type="number" value={c.gstPercent} onChange={e => updateCalc('gstPercent', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:border-blue-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">TDS %</label>
                   <input type="number" value={c.tdsPercent} onChange={e => updateCalc('tdsPercent', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:border-blue-500 outline-none" />
                 </div>
               </div>

               {marginTooThin && (
                 <div className="bg-red-50 text-red-700 p-3 rounded-lg flex gap-2 items-start border border-red-100">
                   <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                   <p className="text-xs font-medium">Warning: This margin looks too thin to be financially safe given standard project risks.</p>
                 </div>
               )}

               <div className="border-t border-slate-100 pt-5 mt-5">
                 <div className="flex justify-between items-center bg-[#f7f8f9] p-4 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">Final Bid Value</span>
                    <span className="font-mono text-xl font-black text-blue-700">₹{finalBidValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                 </div>
                 
                 <div className="mt-4 flex items-center justify-between px-2">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Win Probability</span>
                   <div className="flex items-center gap-2">
                     <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${estimatedWinProb > 60 ? 'bg-emerald-500' : estimatedWinProb > 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${estimatedWinProb}%`}}></div>
                     </div>
                     <span className="text-sm font-black font-mono text-slate-700">{estimatedWinProb}%</span>
                   </div>
                 </div>

                 <button onClick={handleSave} disabled={isSaving} className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                   <CheckCircle2 className="w-5 h-5" />
                   {isSaving ? 'Locked In!' : 'Lock in my bid'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StrategyCard({ type, strat, active, onSelect }: { type: string, strat: BidStrategy, active: boolean, onSelect: () => void }) {
  const colors = {
    conservative: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-800',
    recommended: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-800',
    aggressive: 'from-amber-50 to-amber-100/50 border-amber-200 text-amber-800'
  }[type] || '';
  
  return (
    <div onClick={onSelect} className={`cursor-pointer rounded-xl border p-4 transition-all relative overflow-hidden ${active ? `bg-gradient-to-br ring-2 ring-blue-500 shadow-md ${colors}` : 'bg-white border-slate-200 hover:border-blue-300'}`}>
       {active && <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 flex items-center justify-center rounded-bl-xl"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
       <h5 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-2">{type}</h5>
       <div className="font-mono text-lg font-black mb-1">₹{strat.bidAmount.toLocaleString()}</div>
       <div className="flex items-center gap-2 text-xs font-medium mb-3">
         <span>Margin: {strat.marginPercent}%</span>
         <span className="text-slate-300">|</span>
         <span className={strat.winProbability > 60 ? 'text-emerald-600' : 'text-amber-600'}>Win: {strat.winProbability}%</span>
       </div>
       <p className="text-[10px] text-slate-600 leading-tight">{strat.rationale}</p>
    </div>
  )
}

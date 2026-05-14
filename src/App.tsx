import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sparkles, 
  BarChart3, 
  Send, 
  Plus, 
  Inbox, 
  LogOut, 
  Settings,
  ChevronRight,
  Zap
} from 'lucide-react';
import LeadUpload from './components/LeadUpload';
import LeadList from './components/LeadList';
import EmailPreview from './components/EmailPreview';
import { Lead } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const leadsRef = React.useRef<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [view, setView] = useState<'upload' | 'dashboard' | 'analytics' | 'archives'>('upload');
  
  // Sync ref with state
  React.useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = React.useRef(false);
  const isAutomating = React.useRef(false);
  
  // Load leads from DB on mount
  useEffect(() => {
    fetch("/api/leads")
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        if (data.length > 0) setView('dashboard');
      })
      .catch(err => console.error("Failed to fetch leads:", err));
  }, []);

  const handleLeadsLoaded = async (newLeads: Lead[]) => {
    try {
      await fetch("/api/leads/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: newLeads }),
      });
      setLeads(prev => [...prev, ...newLeads]);
      setView('dashboard');
    } catch (err) {
      console.error("Failed to save leads:", err);
      // Still show them in UI even if DB fails
      setLeads(prev => [...prev, ...newLeads]);
      setView('dashboard');
    }
  };

  const handleGenerate = async (leadToProcess: Lead | string) => {
    // Accept either a Lead object (from list actions) or an id string (from EmailPreview regenerate)
    const id = typeof leadToProcess === 'string' ? leadToProcess : leadToProcess.id;
    const lead = typeof leadToProcess === 'string' ? leadsRef.current.find(l => l.id === leadToProcess) : leadToProcess;
    if (!lead) {
      console.error(`handleGenerate: Lead with id ${id} not found in local state`);
      // Surface a user-friendly alert and avoid calling the server with a missing id
      alert('Lead not found locally. Please refresh the app and try again.');
      return false;
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'generating' } : l));
    
    try {
  const res = await fetch(`/api/generate/${id}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

  setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
      return true;
    } catch (error: any) {
      console.error("Critical Generation Error:", error);
      alert(`AI Generation Failed: ${error.message}`);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'pending' } : l));
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const handleResetAll = async () => {
    if (!confirm("Are you sure you want to clear ALL leads and drafts? This cannot be undone.")) return;
    try {
      await fetch("/api/leads/all", { method: "DELETE" });
      setLeads([]);
      setView('upload');
    } catch (err) {
      console.error("Failed to reset leads:", err);
    }
  };

  const handleUpdateDraft = async (id: string, subject: string, body: string) => {
    try {
      const updates = { draftSubject: subject, draftBody: body, status: 'sent' };
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      setSelectedLead(null);
    } catch (err) {
      console.error("Failed to update draft:", err);
    }
  };

  const handleRunAutomation = async () => {
    if (isAutomating.current) return;
    isAutomating.current = true;
    isPausedRef.current = false;
    setIsPaused(false);

    // Reset any "stuck" leads from previous failed runs
    setLeads(prev => prev.map(l => l.status === 'generating' ? { ...l, status: 'pending' } : l));

    // Get the fresh list of pending leads from the synchronous Ref
    const pendingLeads = leadsRef.current.filter(l => l.status === 'pending' || l.status === 'generating');

    if (pendingLeads.length === 0) {
      console.log("🏁 No pending leads to process in leadsRef.", { total: leadsRef.current.length });
      isAutomating.current = false;
      return;
    }

    // Process strictly row-by-row to avoid server load
    let count = 1;
    for (const lead of pendingLeads) {
      // Check if paused during the loop using ref for immediate response
      if (isPausedRef.current) {
        console.log("⏸️ Automation paused by user.");
        break;
      }
      
      console.log(`🚀 Processing Lead ${count}/${pendingLeads.length}: ${lead.name} (${lead.company})`);
      
      // Wait for the current lead to be fully drafted before moving to the next
      const success = await handleGenerate(lead);
      
      if (success) {
        console.log(`✅ Finished Lead ${count}: ${lead.name}`);
      } else {
        console.log(`❌ Failed Lead ${count}: ${lead.name}`);
      }
      
      count++;

      // Small artificial delay to prevent UI locking and give Ollama breathing room
      await new Promise(r => setTimeout(r, 1000));
    }
    
    isAutomating.current = false;
  };

  const togglePause = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    isPausedRef.current = newState;
    
    // If we unpause, try to run automation again
    if (!newState) {
      handleRunAutomation();
    }
  };

  useEffect(() => {
    // If we unpause and were automating, we don't automatically resume 
    // but the user can click "Run Engine" again.
  }, [isPaused]);

  const stats = {
    total: leads.length,
    drafted: leads.filter(l => l.status === 'drafted').length,
    pending: leads.filter(l => l.status === 'pending').length,
    sent: leads.filter(l => l.status === 'sent').length,
  };

  return (
    <div className="min-h-screen bg-bg flex text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-border flex flex-col fixed inset-y-0 z-40">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-accent text-black p-2 rounded-sm shadow-lg shadow-accent/20">
              <Zap className="w-6 h-6 fill-black" />
            </div>
            <h1 className="font-semibold tracking-tight text-lg">Outreach.<span className="text-accent">AI</span></h1>
          </div>

          <nav className="space-y-1">
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#555] font-bold">Campaigns</div>
            <SidebarItem 
              icon={<Inbox className="w-4 h-4" />} 
              label="Active Pipeline" 
              active={view === 'dashboard'} 
              onClick={() => setView('dashboard')} 
            />
            <SidebarItem 
              icon={<Plus className="w-4 h-4" />} 
              label="Import Leads" 
              active={view === 'upload'} 
              onClick={() => setView('upload')} 
            />
            <SidebarItem 
              icon={<BarChart3 className="w-4 h-4" />} 
              label="Analytics" 
              active={view === 'analytics'}
              onClick={() => setView('analytics')}
            />
            <SidebarItem 
              icon={<Settings className="w-4 h-4" />} 
              label="Lead Archives" 
              active={view === 'archives'}
              onClick={() => setView('archives')}
            />
          </nav>
        </div>

        <div className="mt-auto p-6 flex flex-col gap-4">
          <div className="glass rounded-xl p-4 transition-all hover:border-[#333]">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-3 font-bold">System Status</div>
            <div className="space-y-2">
              <StatusIndicator label="OpenAI GPT-4o" active />
              <StatusIndicator label="Gmail API Linked" active />
              <StatusIndicator label="AIS Gemini Engine" active />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 pt-4 border-t border-border">
            <div className="w-8 h-8 bg-accent/20 border border-accent/30 rounded-full flex items-center justify-center text-accent text-xs font-bold">
              YO
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Yos Omran</span>
              <span className="text-[10px] text-text-muted uppercase tracking-widest">AI Engineer</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 bg-bg min-h-screen">
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-medium tracking-tight">
              {view === 'upload' && 'Import Outreach Pipeline'}
              {view === 'dashboard' && <span className="flex items-center gap-2">Campaign: <span className="text-accent">CTO Cold Outreach</span></span>}
              {view === 'analytics' && 'Campaign Analytics'}
              {view === 'archives' && 'Sent Lead Archives'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-surface border border-border px-2 py-0.5 rounded text-text-muted font-mono uppercase tracking-wider">
                {leads.length} Leads in CSV
              </span>
              <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded animate-pulse">Running Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {leads.length > 0 && (
              <button 
                onClick={handleResetAll}
                className="px-4 py-2 text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
              >
                Reset Project
              </button>
            )}
            <button 
              onClick={togglePause}
              className={`px-4 py-2 text-xs border border-border rounded-lg transition-all ${isPaused ? 'bg-red-500/10 text-red-500 border-red-500/50' : 'text-text-muted hover:bg-surface hover:text-white'}`}
            >
              {isPaused ? 'Resume Automation' : 'Pause Automation'}
            </button>
            <button 
              onClick={view === 'upload' ? undefined : handleRunAutomation}
              className={`px-6 py-2 bg-accent text-black font-semibold rounded-lg accent-glow hover:brightness-110 transition-all text-xs ${view === 'upload' || isAutomating.current ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAutomating.current ? 'Engine Running...' : 'Run Engine'}
            </button>
          </div>
        </header>

        {view === 'upload' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-20"
          >
            <LeadUpload onLeadsLoaded={handleLeadsLoaded} />
          </motion.div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-6">
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Leads" value={stats.total} />
              <StatCard icon={<Sparkles className="w-5 h-5" />} label="AI Drafted" value={stats.drafted} />
              <StatCard icon={<Inbox className="w-5 h-5" />} label="Pending" value={stats.pending} />
              <StatCard icon={<Send className="w-5 h-5" />} label="Sent" value={stats.sent} />
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-border">
              <div className="p-4 bg-surface border-b border-border flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-[#555] font-bold">Pipeline Status</span>
                <span className="text-[10px] text-accent font-mono">{stats.pending} Lead{stats.pending !== 1 && 's'} Pending Review</span>
              </div>
              <LeadList 
                leads={leads.filter(l => l.status !== 'sent')} 
                onGenerate={(id) => {
                  const lead = leads.find(l => l.id === id);
                  if (lead) handleGenerate(lead);
                }} 
                onPreview={setSelectedLead} 
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-3 gap-6">
              <div className="glass p-6 rounded-2xl border border-border">
                <h3 className="text-xs font-mono text-[#555] font-bold uppercase tracking-widest mb-4">Conversion Rate</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">12.4%</span>
                  <span className="text-green-500 text-xs font-medium mb-1">↑ 2.1%</span>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl border border-border">
                <h3 className="text-xs font-mono text-[#555] font-bold uppercase tracking-widest mb-4">Response Time</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">1.4h</span>
                  <span className="text-accent text-xs font-medium mb-1">Optimal</span>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl border border-border">
                <h3 className="text-xs font-mono text-[#555] font-bold uppercase tracking-widest mb-4">Sentiment Score</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">94/100</span>
                  <span className="text-accent text-xs font-medium mb-1">Positive</span>
                </div>
              </div>
            </div>
            <div className="glass p-8 rounded-2xl border border-border h-64 flex items-center justify-center">
              <span className="text-text-muted text-sm italic font-mono uppercase tracking-widest">Growth Analytics Visualization Hooked</span>
            </div>
          </motion.div>
        )}

        {view === 'archives' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="glass rounded-2xl overflow-hidden border border-border"
          >
            <div className="p-4 bg-surface border-b border-border">
              <span className="text-xs uppercase tracking-widest text-[#555] font-bold">Sent Outreach History</span>
            </div>
            <LeadList 
              leads={leads.filter(l => l.status === 'sent' || l.status === 'drafted')} 
              onGenerate={handleGenerate} 
              onPreview={setSelectedLead} 
              onDelete={handleDelete}
            />
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selectedLead && (
          <EmailPreview 
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onSave={handleUpdateDraft}
            onRegenerate={handleGenerate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusIndicator({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-1 text-[11px] text-white/70">
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      <span>{label}</span>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
        active 
          ? 'bg-surface text-white accent-glow' 
          : 'text-text-muted hover:text-white hover:bg-surface/50'
      }`}
    >
      <span className={`opacity-${active ? '100' : '50'}`}>{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="glass p-6 rounded-2xl transition-all hover:border-accent/30 group">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono text-[#555] font-bold uppercase tracking-widest">{label}</p>
        <div className="p-2 bg-surface rounded-lg text-accent border border-border group-hover:accent-glow transition-all">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

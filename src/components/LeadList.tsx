import React from 'react';
import { Mail, Globe, Send, Trash2, Rocket, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LeadListProps {
  leads: Lead[];
  onGenerate: (id: string) => void;
  onPreview: (lead: Lead) => void;
  onDelete: (id: string) => void;
}

export default function LeadList({ leads, onGenerate, onPreview, onDelete }: LeadListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(100);

  const filteredLeads = React.useMemo(() => {
    if (!searchTerm) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.company.toLowerCase().includes(term) ||
      l.status.toLowerCase().includes(term)
    );
  }, [leads, searchTerm]);

  const visibleLeads = filteredLeads.slice(0, visibleCount);

  return (
    <div className="w-full bg-transparent overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 bg-surface/50 border-b border-border flex items-center gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search leads by name, company, or status..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(100); // Reset count on search
            }}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-xs focus:border-accent outline-none transition-all pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
          Found: <span className="text-accent">{filteredLeads.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-bg">
            <tr className="bg-white/5 border-b border-border shadow-sm">
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-[#555] font-bold">Contact</th>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-[#555] font-bold">Company</th>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-[#555] font-bold">Status</th>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-[#555] font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {visibleLeads.map((lead) => (
                <motion.tr 
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{lead.name}</span>
                      <span className="text-[11px] text-text-muted">{lead.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-white/90">{lead.company}</span>
                      {lead.website && (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-accent hover:underline opacity-70 hover:opacity-100"
                        >
                          <Globe className="w-2.5 h-2.5" />
                          {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {lead.status === 'pending' && (
                        <button 
                          onClick={() => onGenerate(lead.id)}
                          className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-all flex items-center gap-2 group/btn"
                        >
                          <Rocket className="w-4 h-4" />
                        </button>
                      )}
                      
                      {(lead.status === 'drafted' || lead.status === 'sent') && (
                        <button 
                          onClick={() => onPreview(lead)}
                          className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-all flex items-center gap-2 group/btn"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}

                      {lead.status === 'generating' && (
                        <div className="p-2 text-accent animate-spin">
                          <Loader2 className="w-4 h-4" />
                        </div>
                      )}

                      <button 
                        onClick={() => onDelete(lead.id)}
                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-muted italic text-sm">
                  {searchTerm ? `No results found for "${searchTerm}"` : 'No active leads in pipeline.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination / Load More */}
      {visibleCount < filteredLeads.length && (
        <div className="p-4 border-t border-border flex justify-center bg-surface/30">
          <button 
            onClick={() => setVisibleCount(prev => prev + 200)}
            className="px-6 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
          >
            Load More Leads ({filteredLeads.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const configs = {
    pending: { color: 'text-[#555] bg-[#1A1A1B]', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
    generating: { color: 'text-blue-400 bg-blue-400/10 animate-pulse', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Researching...' },
    drafted: { color: 'text-green-400 bg-green-400/10', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Drafted' },
    sent: { color: 'text-accent bg-accent/10', icon: <Send className="w-3 h-3" />, label: 'Sent' },
  };

  const config = configs[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${config.color}`}>
      {config.label}
    </div>
  );
}

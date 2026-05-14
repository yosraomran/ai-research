import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Mail, Send, Sparkles, RefreshCw } from 'lucide-react';
import { Lead } from '../types';
import { motion } from 'motion/react';

interface EmailPreviewProps {
  lead: Lead;
  onClose: () => void;
  onSave: (id: string, subject: string, body: string) => void;
  onRegenerate: (lead: Lead) => void;
}

export default function EmailPreview({ lead, onClose, onSave, onRegenerate }: EmailPreviewProps) {
  const [subject, setSubject] = useState(lead.draftSubject || '');
  const [body, setBody] = useState(lead.draftBody || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] accent-glow"
      >
        {/* Left Panel: Lead Context */}
        <div className="w-full md:w-80 bg-surface border-r border-border p-8 flex flex-col">
          <div className="mb-10">
            <h3 className="text-[10px] font-mono text-[#555] uppercase tracking-widest font-bold mb-6">Target Context</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] text-accent uppercase font-bold tracking-tighter mb-1 select-none">Contact Name</p>
                <p className="text-base font-semibold text-white">{lead.name}</p>
              </div>
              <div>
                <p className="text-[9px] text-accent uppercase font-bold tracking-tighter mb-1 select-none">Email Address</p>
                <p className="text-sm font-medium text-text-muted">{lead.email}</p>
              </div>
              <div>
                <p className="text-[9px] text-accent uppercase font-bold tracking-tighter mb-1 select-none">Position / Role</p>
                <p className="text-sm font-medium text-text-muted">{lead.role}</p>
              </div>
              <div>
                <p className="text-[9px] text-accent uppercase font-bold tracking-tighter mb-1 select-none">Organization</p>
                <p className="text-base font-semibold text-white">{lead.company}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
             <h3 className="text-[10px] font-mono text-[#555] uppercase tracking-widest font-bold mb-4">AI Research Synthesis</h3>
             <div className="text-xs text-text-muted bg-white/5 border border-border p-5 rounded-xl italic leading-relaxed">
               {lead.companySummary || "Synthesizing market data and company milestones..."}
             </div>
          </div>

          <button 
            onClick={() => onRegenerate(lead)}
            className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-border text-white rounded-xl hover:bg-white/10 text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate Draft
          </button>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 flex flex-col bg-bg relative">
          <div className="flex items-center justify-between px-8 py-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 border border-accent/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Hyper-Personalized Draft</h2>
                <p className="text-[10px] mono uppercase tracking-widest">Model: Gemini-3-Flash-Augmented</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted uppercase text-[9px] font-bold tracking-widest flex items-center gap-2">
              ESC <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10">
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-accent uppercase tracking-widest font-bold">Subject Line</label>
              <input 
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-2xl font-semibold text-white border-none focus:ring-0 p-0 placeholder-white/20"
                placeholder="Campaign Subject"
              />
              <div className="h-px bg-border w-full" />
            </div>

            <div className="space-y-4 h-full flex flex-col">
              <label className="text-[9px] font-mono text-accent uppercase tracking-widest font-bold">Email Content</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 w-full text-base leading-relaxed text-[#D1D1D1] border-none focus:ring-0 p-0 resize-none placeholder-white/10 font-sans"
                placeholder="Generated outreach content..."
              />
            </div>
          </div>

          <div className="px-10 py-8 border-t border-border bg-surface/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCopy}
                className="text-text-muted text-xs hover:text-white transition-colors"
              >
                {copied ? 'Copied to Clipboard' : 'Copy Content'}
              </button>
              <button 
                className="text-text-muted text-xs hover:text-white transition-colors"
              >
                Reset Draft
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href={mailtoUrl}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-border text-white rounded-xl hover:bg-white/10 text-xs font-bold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                Preview in Client
              </a>
              <button 
                onClick={() => onSave(lead.id, subject, body)}
                className="flex items-center gap-2 px-8 py-3 bg-accent text-black rounded-xl hover:brightness-110 text-xs font-black shadow-2xl transition-all accent-glow"
              >
                APPROVE & SAVE
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

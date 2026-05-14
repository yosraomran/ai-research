import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, X, ShieldAlert } from 'lucide-react';
import { Lead, LeadCSVRow } from '../types';

interface LeadUploadProps {
  onLeadsLoaded: (leads: Lead[]) => void;
}

export default function LeadUpload({ onLeadsLoaded }: LeadUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    Papa.parse<LeadCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const leads: Lead[] = results.data
          .filter(row => row['First Name'] && row.Company && row.Email)
          .map((row, index) => ({
            id: `lead-${Date.now()}-${index}`,
            name: `${row['First Name']} ${row['Last Name']}`.trim(),
            role: row.Title || 'Decision Maker',
            company: row.Company,
            website: '', // Website not in current CSV format
            email: row.Email,
            status: 'pending',
          }));

        if (leads.length === 0) {
          setError('No valid leads found. Required: First Name, Company, Email.');
        } else {
          onLeadsLoaded(leads);
          setError(null);
        }
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      }
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all ${
          isDragging ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-accent/50'
        }`}
      >
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 accent-glow">
          <Upload className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Initialize Campaign Pipeline</h3>
        <p className="text-text-muted text-center mb-8 text-sm max-w-sm leading-relaxed">
          Upload your target leads in CSV format to fuel the AI outreach engine.<br />
          <span className="text-[10px] font-mono text-accent/70 mt-2 block uppercase tracking-widest">Required: First Name, Company, Email</span>
        </p>
        
        <label className="bg-accent text-black px-8 py-3 rounded-lg font-bold cursor-pointer hover:brightness-110 transition-all text-xs uppercase tracking-wider accent-glow">
          Select Source File
          <input type="file" className="hidden" accept=".csv" onChange={onFileChange} />
        </label>

        {error && (
          <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-[11px] border border-red-400/20">
            <ShieldAlert className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-8 glass rounded-xl p-6">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#555] mb-4">Pipeline Schema Reference</h4>
        <div className="grid grid-cols-6 gap-3 text-[11px] font-mono">
          {['First Name', 'Last Name', 'Title', 'Company', 'Email', 'Country'].map((header) => (
            <div key={header} className="bg-white/5 border border-border p-2 text-center text-text-muted rounded">
              {header}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

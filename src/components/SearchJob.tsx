import { useState } from 'react';
import { JobAnalysis } from '../types';
import { Briefcase, Loader2, Search, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { apiFetchJson } from '../lib/api';

interface Props {
  onNext: (analysis: JobAnalysis) => void;
  onBack: () => void;
}

export function SearchJob({ onNext, onBack }: Props) {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const data = await apiFetchJson<JobAnalysis>('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription }),
      });

      onNext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resume
      </button>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-zinc-50 mb-4 tracking-tight">
          Find Your Target Job
        </h1>
        <p className="text-zinc-400 text-lg">
          Paste the job description or URL below. We'll analyze what the employer is looking for.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none placeholder:text-zinc-600"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-zinc-500">
            {jobDescription.length} characters
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!jobDescription.trim() || isAnalyzing}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-50 px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Role...
              </>
            ) : (
              <>
                <Briefcase className="w-5 h-5" />
                Analyze Job
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

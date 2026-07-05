import { useState } from 'react';
import { JobAnalysis, Resume, AtsAnalysis } from '../types';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Loader2, Target, Zap } from 'lucide-react';
import { apiFetchJson } from '../lib/api';

interface Props {
  masterResume: Resume;
  jobAnalysis: JobAnalysis;
  onNext: (tailoredResume: Resume, atsAnalysis: AtsAnalysis) => void;
  onBack: () => void;
}

export function JobAnalysisView({ masterResume, jobAnalysis, onNext, onBack }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await apiFetchJson<{ tailoredResume: Resume; atsAnalysis: AtsAnalysis }>('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterResume, jobAnalysis }),
      });

      onNext(data.tailoredResume, data.atsAnalysis);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  // Basic mock keyword calculation for the initial view (the real ATS analysis happens on generate)
  const allJobSkills = [...(jobAnalysis.requiredSkills || []), ...(jobAnalysis.preferredSkills || [])].map(s => s.toLowerCase());
  const mySkills = (masterResume.skills || []).map(s => s.toLowerCase());
  
  const foundKeywords = allJobSkills.filter(s => mySkills.some(ms => ms.includes(s) || s.includes(ms)));
  const missingKeywords = allJobSkills.filter(s => !foundKeywords.includes(s));

  return (
    <div className="max-w-5xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-zinc-50 mb-2">Job Analysis</h1>
          <h2 className="text-xl text-orange-500 font-medium mb-6">
            {jobAnalysis.jobTitle} @ {jobAnalysis.companyName}
          </h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            We've analyzed the job description. Here are the key requirements and how your current profile aligns with them.
          </p>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-50 px-8 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Tailoring your resume...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Tailored Resume
              </>
            )}
          </button>
        </div>

        <div className="w-full md:w-1/3 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-zinc-200">Role Details</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-zinc-500 block mb-1">Experience</span>
              <span className="text-zinc-200 font-medium">{jobAnalysis.experienceRequired || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-1">Location</span>
              <span className="text-zinc-200 font-medium">{jobAnalysis.location || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-1">Employment Type</span>
              <span className="text-zinc-200 font-medium">{jobAnalysis.employmentType || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <h3 className="text-xl font-semibold text-zinc-200">Matched Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {foundKeywords.length > 0 ? foundKeywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm capitalize">
                {kw}
              </span>
            )) : (
              <span className="text-zinc-500 text-sm">No direct matches found.</span>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <XCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-semibold text-zinc-200">Missing Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.length > 0 ? missingKeywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm capitalize">
                {kw}
              </span>
            )) : (
              <span className="text-zinc-500 text-sm">Great job! You hit all key skills.</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-6">
            * The AI will automatically integrate these naturally where possible based on your experience.
          </p>
        </div>
      </div>
    </div>
  );
}

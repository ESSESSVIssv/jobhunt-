import { Resume, AtsAnalysis } from '../types';
import { ArrowLeft, ArrowRight, Check, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  original: Resume;
  tailored: Resume;
  ats: AtsAnalysis;
  onNext: () => void;
  onBack: () => void;
}

export function ResumeComparison({ original, tailored, ats, onNext, onBack }: Props) {
  
  const StatCard = ({ label, score }: { label: string, score: number }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
      <div className="relative w-16 h-16 flex items-center justify-center mb-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-zinc-800"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className={score > 80 ? "text-emerald-500" : score > 60 ? "text-orange-500" : "text-red-500"}
            strokeDasharray={`${score}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
        <span className="absolute text-lg font-bold text-zinc-200">{score}</span>
      </div>
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Analysis
        </button>
        <button
          onClick={onNext}
          className="bg-orange-500 hover:bg-orange-600 text-zinc-50 px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2"
        >
          Choose Template <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-50 mb-4 tracking-tight">Optimization Results</h1>
        <p className="text-zinc-400 text-lg max-w-3xl">
          Your resume has been tailored. We've optimized keywords, improved bullet points, and aligned your experience with the job requirements.
        </p>
      </div>

      {/* ATS Scores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <StatCard label="ATS Match" score={ats.atsCompatibilityScore} />
        <StatCard label="Strength" score={ats.resumeStrengthScore} />
        <StatCard label="Keywords" score={ats.keywordCoverage} />
        <StatCard label="Readability" score={ats.recruiterReadability} />
        <StatCard label="Readiness" score={ats.resumeReadinessScore} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Summary */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-300">Original Resume Snippet</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[500px] text-sm text-zinc-400 space-y-6">
            <div>
              <h4 className="text-zinc-500 font-bold mb-2 uppercase tracking-wider text-xs">Summary</h4>
              <p className="leading-relaxed">{original.summary}</p>
            </div>
            <div>
              <h4 className="text-zinc-500 font-bold mb-2 uppercase tracking-wider text-xs">Recent Experience</h4>
              {original.experience?.[0] && (
                <div>
                  <p className="font-semibold text-zinc-300">{original.experience[0].title}</p>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    {original.experience[0].description?.slice(0,3).map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optimized Summary */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl overflow-hidden flex flex-col relative">
          <div className="absolute top-4 right-4 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Optimized
          </div>
          <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-100">Tailored Resume Snippet</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[500px] text-sm text-zinc-300 space-y-6">
            <div>
              <h4 className="text-orange-500 font-bold mb-2 uppercase tracking-wider text-xs flex justify-between">
                Summary
              </h4>
              <p className="leading-relaxed bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 text-zinc-200">
                {tailored.summary}
              </p>
            </div>
            <div>
              <h4 className="text-orange-500 font-bold mb-2 uppercase tracking-wider text-xs">Recent Experience</h4>
              {tailored.experience?.[0] && (
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <p className="font-semibold text-zinc-100">{tailored.experience[0].title}</p>
                  <ul className="list-none mt-3 space-y-3">
                    {tailored.experience[0].description?.slice(0,3).map((desc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Changes Breakdown */}
      <div className="mt-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-zinc-200 mb-6">What We Changed & Why</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-emerald-500 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> Keywords Added
            </h4>
            <div className="flex flex-wrap gap-2">
              {ats.addedKeywords.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded text-xs">{kw}</span>
              ))}
            </div>
          </div>
          <div className="space-y-4">
             <h4 className="text-orange-500 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Explanation
            </h4>
            <p className="text-sm text-zinc-400 leading-relaxed bg-zinc-900 p-4 rounded-xl">
              {ats.explanations?.resumeStrengthScore || "We aligned your experience with the core responsibilities outlined in the job description, ensuring maximum ATS visibility."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

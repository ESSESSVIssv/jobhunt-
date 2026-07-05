import React, { useState, useEffect } from 'react';
import { Resume, JobMatch } from '../types';
import { Loader2, ArrowLeft, Download, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetchJson } from '../lib/api';

interface Props {
  resume: Resume;
  job: JobMatch;
  onBack: () => void;
  onUpdateSkills?: (skills: string[]) => void;
}

export function ApplicationView({ resume, job, onBack, onUpdateSkills }: Props) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [tailoredResume, setTailoredResume] = useState<Resume | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [skillsAnalysis, setSkillsAnalysis] = useState<{matched: string[], missing: string[]} | null>(null);
  const [error, setError] = useState('');

  // Local state for live editable skills tuning
  const [userSkills, setUserSkills] = useState<string[]>(resume.skills || []);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Sync state if resume changes from outside
  useEffect(() => {
    if (resume.skills) {
      setUserSkills(resume.skills);
    }
  }, [resume.skills]);

  useEffect(() => {
    async function generate() {
      try {
        const data = await apiFetchJson<{
          tailoredResume: Resume;
          coverLetter: string;
          skillsAnalysis: { matched: string[]; missing: string[] };
        }>('/api/generate-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ masterResume: resume, job })
        });
        
        setTailoredResume(data.tailoredResume);
        setCoverLetter(data.coverLetter);
        setSkillsAnalysis(data.skillsAnalysis);

        // Populate required skills from the analysis combined with job tags
        const allReqs = Array.from(new Set([
          ...(data.skillsAnalysis?.matched || []),
          ...(data.skillsAnalysis?.missing || []),
          ...(job.tags || [])
        ])).filter(Boolean) as string[];
        setRequiredSkills(allReqs);
      } catch (err: any) {
        setError(err.message);
        // Fallback required skills from job tags if the API is rate-limited
        setRequiredSkills(job.tags || ["React", "TypeScript", "Node.js"]);
      } finally {
        setIsGenerating(false);
      }
    }

    generate();
  }, [resume, job]);

  const handleDownloadCoverLetter = () => {
    const element = document.createElement("a");
    const file = new Blob([coverLetter], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${job.company.replace(/\s+/g, '_')}_Cover_Letter.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadResume = () => {
    if (!tailoredResume) return;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(tailoredResume, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${job.company.replace(/\s+/g, '_')}_Tailored_Resume.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = userSkills.filter(s => s !== skillToRemove);
    setUserSkills(updated);
    if (onUpdateSkills) {
      onUpdateSkills(updated);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const cleanSkill = newSkillInput.trim();
    if (!userSkills.some(s => s.toLowerCase() === cleanSkill.toLowerCase())) {
      const updated = [...userSkills, cleanSkill];
      setUserSkills(updated);
      if (onUpdateSkills) {
        onUpdateSkills(updated);
      }
    }
    setNewSkillInput('');
  };

  const handleAddSkillDirectly = (skill: string) => {
    if (!userSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      const updated = [...userSkills, skill];
      setUserSkills(updated);
      if (onUpdateSkills) {
        onUpdateSkills(updated);
      }
    }
  };

  const isSkillMatched = (required: string) => {
    const normReq = required.toLowerCase().trim();
    return userSkills.some(skill => {
      const normUser = skill.toLowerCase().trim();
      return normUser === normReq || normUser.includes(normReq) || normReq.includes(normUser);
    });
  };

  const matchedList = requiredSkills.filter(isSkillMatched);
  const missingList = requiredSkills.filter(req => !isSkillMatched(req));

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6 z-10 relative">
      
      {/* Back to dashboard button */}
      <div className="self-start">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-xs text-brand-muted hover:text-brand-ink hover:underline transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-brand-accent" />
          BACK_TO_DASHBOARD
        </button>
      </div>

      {/* Target Job Info Card */}
      <div className="bg-brand-card border border-brand-faint p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="font-mono text-[10px] text-brand-accent uppercase tracking-widest block mb-1">Target Role</span>
          <h1 className="font-serif font-light text-3xl tracking-tight text-brand-ink uppercase">{job.title}</h1>
          <p className="text-xs text-brand-muted font-mono uppercase tracking-wider mt-1">{job.company} • {job.location || 'India'} • {job.type}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' jobs')}&ibp=htl;jobs`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-mono text-[11px] uppercase bg-brand-accent hover:opacity-90 text-white px-5 py-3 transition-all text-center rounded-sm font-bold shadow-sm flex items-center justify-center gap-1.5"
          >
            Apply via Google Jobs ↗
          </a>
        </div>
      </div>

      {/* Live Market Verification Panel */}
      <div className="bg-brand-card border border-brand-accent/20 bg-brand-accent/[0.02] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="font-mono text-[10px] text-brand-accent uppercase tracking-widest block mb-1">[ DUAL-SOURCE MARKET VERIFICATION ]</span>
            <h2 className="font-serif font-medium text-lg text-brand-ink">Verify Active Real-World Listings</h2>
            <p className="text-xs text-brand-muted mt-1">
              Verify this opportunity's live status across the job market. Tap below to search the active Indian job market across multiple engines.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 self-start md:self-auto">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono text-[9px] uppercase text-emerald-600 font-bold tracking-wider">Verification Links Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' jobs')}&ibp=htl;jobs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-brand-bg border border-brand-faint hover:border-brand-accent/30 hover:bg-brand-accent/5 p-3.5 transition-all text-center rounded-sm font-mono text-xs text-brand-ink hover:text-brand-accent font-semibold"
          >
            🌐 Google Jobs Search ↗
          </a>
          <a
            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-brand-bg border border-brand-faint hover:border-brand-accent/30 hover:bg-brand-accent/5 p-3.5 transition-all text-center rounded-sm font-mono text-xs text-brand-ink hover:text-brand-accent font-semibold"
          >
            💼 LinkedIn Jobs ↗
          </a>
          <a
            href={`https://in.indeed.com/jobs?q=${encodeURIComponent(job.title + ' ' + job.company)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-brand-bg border border-brand-faint hover:border-brand-accent/30 hover:bg-brand-accent/5 p-3.5 transition-all text-center rounded-sm font-mono text-xs text-brand-ink hover:text-brand-accent font-semibold"
          >
            🔍 Indeed India Search ↗
          </a>
        </div>
      </div>

      {/* Live Skill-Set Customizer */}
      {!isGenerating && (
        <div className="bg-brand-card border border-brand-faint p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-faint">
            <div>
              <span className="font-mono text-[10px] text-brand-accent uppercase tracking-widest block mb-1">[ SKILLS_ENGINE_TUNING ]</span>
              <h2 className="font-serif font-medium text-lg text-brand-ink">Custom & Verified Skills Profile</h2>
              <p className="text-xs text-brand-muted mt-1">
                Verify, edit, or append your skills below. The ATS compatibility score and matching metrics will recalculate dynamically.
              </p>
            </div>
            
            {/* Real-time Interactive ATS Compatibility Score */}
            <div className="flex items-center gap-4 bg-brand-bg border border-brand-faint p-4 rounded-sm">
              <div className="text-center">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-muted block">Live Match Score</span>
                <span className={`text-2xl font-bold font-mono ${
                  requiredSkills.length === 0 ? 'text-emerald-500' : 
                  (matchedList.length / requiredSkills.length * 100) >= 80 ? 'text-emerald-500' :
                  (matchedList.length / requiredSkills.length * 100) >= 50 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {requiredSkills.length === 0 ? '100%' : `${Math.round((matchedList.length / requiredSkills.length) * 100)}%`}
                </span>
              </div>
              <div className="text-xs font-mono text-brand-muted">
                <div>Matched: {matchedList.length}</div>
                <div>Required: {requiredSkills.length}</div>
              </div>
            </div>
          </div>

          {/* Section: Your Active Skills (Editable Tag List) */}
          <div>
            <h3 className="font-mono text-[10px] font-bold text-brand-ink uppercase tracking-widest mb-3">Your Current Skills ({userSkills.length})</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {userSkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-accent/5 border border-brand-accent/20 text-brand-ink hover:border-brand-accent/40 rounded-full text-[11px] font-sans transition-all duration-150"
                >
                  {skill}
                  <button 
                    onClick={() => handleRemoveSkill(skill)}
                    className="w-3.5 h-3.5 bg-brand-accent/10 hover:bg-brand-accent hover:text-white rounded-full flex items-center justify-center text-[10px] font-bold text-brand-accent transition-colors cursor-pointer"
                    title={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {userSkills.length === 0 && (
                <span className="text-[10px] font-mono text-brand-muted uppercase">NO_ACTIVE_SKILLS_ADDED_YET</span>
              )}
            </div>

            {/* Input field to add custom skills */}
            <form onSubmit={handleAddCustomSkill} className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Enter a skill you have (e.g. Docker, Python)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 bg-brand-bg border border-brand-faint text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-brand-accent/60 placeholder:text-brand-muted text-brand-ink"
              />
              <button
                type="submit"
                className="bg-brand-ink text-brand-bg font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-2 hover:opacity-95 transition-all rounded-sm cursor-pointer shrink-0"
              >
                Add Skill
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Skills Match compliance logs */}
      {!isGenerating && requiredSkills.length > 0 && (
        <div className="bg-brand-card border border-brand-faint p-6">
           <span className="font-mono text-[10px] text-brand-accent uppercase tracking-widest block mb-4">[ COMPLIANCE_ANALYSIS ]</span>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-mono text-[10px] font-semibold text-brand-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                  Matched Requirements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchedList.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-brand-bg border border-brand-faint text-brand-ink rounded-full text-[11px] font-sans">
                      {skill}
                    </span>
                  ))}
                  {matchedList.length === 0 && (
                    <span className="text-[10px] font-mono text-brand-muted uppercase">NO_EXPLICIT_SKILL_MATCHES_IDENTIFIED</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-mono text-[10px] font-semibold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Missing Requirements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {missingList.map((skill, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleAddSkillDirectly(skill)}
                      className="px-3 py-1 bg-red-50/50 border border-red-200/60 text-red-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 rounded-full text-[11px] font-sans transition-all text-left flex items-center gap-1.5 group cursor-pointer"
                      title="Click to add to your skills"
                    >
                      {skill}
                      <span className="text-[9px] text-red-400 group-hover:text-emerald-600 font-bold transition-colors">+ Add</span>
                    </button>
                  ))}
                  {missingList.length === 0 && (
                    <span className="text-[10px] font-mono text-brand-accent uppercase font-bold">[ SYSTEM_COMPLIANT_100%_MET ]</span>
                  )}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Main workspace */}
      {isGenerating ? (
        <div className="flex-1 bg-brand-card border border-brand-faint p-16 flex flex-col items-center justify-center gap-4">
           <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
           <div className="text-center font-mono uppercase tracking-wider text-brand-ink">
             <h2 className="text-sm font-bold">TAILORING_APPLICATION_RECORDS</h2>
             <p className="text-[10px] text-brand-muted mt-2 max-w-md">Syncing parameters for {job.company} & synthesizing targeted narrative index...</p>
           </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded text-red-800">
          <p className="font-mono text-xs text-red-700 block mb-1 font-bold">SYNTHESIS_PIPELINE_ERROR:</p>
          <p className="font-mono text-xs">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Cover Letter Panel */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <h2 className="font-mono text-[11px] uppercase tracking-widest text-brand-accent font-semibold">[ COVER_LETTER ]</h2>
               <button 
                 onClick={handleDownloadCoverLetter}
                 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest bg-brand-ink text-brand-bg hover:opacity-90 px-4 py-2 transition-all cursor-pointer font-semibold shadow-sm"
               >
                 <Download className="w-3.5 h-3.5" /> TXT_DOWNLOAD
               </button>
            </div>
            <div className="bg-brand-card border border-brand-faint p-6 whitespace-pre-wrap font-mono text-xs leading-relaxed text-brand-ink min-h-[500px]">
              {coverLetter}
            </div>
          </div>

          {/* Tailored Resume JSON Panel */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <h2 className="font-mono text-[11px] uppercase tracking-widest text-brand-accent font-semibold">[ OPTIMIZED_RESUME ]</h2>
               <button 
                 onClick={handleDownloadResume}
                 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest bg-brand-ink text-brand-bg hover:opacity-90 px-4 py-2 transition-all cursor-pointer font-semibold shadow-sm"
               >
                 <Download className="w-3.5 h-3.5" /> JSON_DOWNLOAD
               </button>
            </div>
            <div className="bg-brand-card border border-brand-faint p-6 overflow-auto min-h-[500px] text-xs font-mono">
              {tailoredResume && (
                 <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-semibold font-serif text-brand-ink uppercase">{tailoredResume.personalInfo?.name}</h1>
                      <p className="text-[10px] text-brand-muted mt-1 uppercase tracking-wider font-semibold">{tailoredResume.personalInfo?.email} // {tailoredResume.personalInfo?.phone}</p>
                    </div>
                    
                    {tailoredResume.summary && (
                      <div className="pt-4 border-t border-brand-faint">
                         <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-2">SUMMARY_SYNTHESIS</h3>
                         <p className="text-xs text-brand-ink leading-relaxed">{tailoredResume.summary}</p>
                      </div>
                    )}

                    {tailoredResume.skills && (
                      <div className="pt-4 border-t border-brand-faint">
                         <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-2">TARGET_SKILLS_INDEX</h3>
                         <div className="flex flex-wrap gap-1.5">
                           {tailoredResume.skills.map((skill, i) => (
                             <span key={i} className="px-2.5 py-1 bg-brand-bg border border-brand-faint text-brand-ink text-[11px] rounded-full font-sans">
                               {skill}
                             </span>
                           ))}
                         </div>
                      </div>
                    )}

                    {tailoredResume.experience && tailoredResume.experience.length > 0 && (
                      <div className="pt-4 border-t border-brand-faint">
                         <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-3">PROFESSIONAL_RECORDS</h3>
                         <div className="space-y-4">
                           {tailoredResume.experience.map((exp, i) => (
                             <div key={i} className="bg-brand-bg p-4 border border-brand-faint">
                                <div className="flex justify-between font-bold text-xs text-brand-ink">
                                  <span>{exp.title}</span>
                                  <span className="text-brand-accent font-mono">{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <p className="text-[10px] text-brand-muted mt-0.5 uppercase tracking-wider">{exp.company} // {exp.location}</p>
                                <ul className="list-disc pl-4 space-y-1 mt-2 text-xs text-brand-ink/90">
                                  {exp.description?.map((desc, j) => (
                                    <li key={j}>{desc}</li>
                                  ))}
                                </ul>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

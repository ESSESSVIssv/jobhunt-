import React, { useState, useEffect } from 'react';
import { Resume, JobMatch, SavedResumeItem } from '../types';
import { Search, Loader2, File, Trash2, ArrowRight, Zap, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { apiFetchJson } from '../lib/api';

interface Props {
  resume: Resume;
  jobs: JobMatch[];
  onReset: () => void;
  onSelectJob: (job: JobMatch) => void;
  resumesLibrary: SavedResumeItem[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
  onDeleteResume: (id: string) => void;
  onUpdateSkills?: (skills: string[]) => void;
}

export function Dashboard({ 
  resume, 
  jobs: initialJobs, 
  onReset, 
  onSelectJob,
  resumesLibrary,
  activeResumeId,
  onSelectResume,
  onDeleteResume,
  onUpdateSkills
}: Props) {
  const [jobs, setJobs] = useState<JobMatch[]>(initialJobs);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleCategory, setRoleCategory] = useState<'All' | 'Coding' | 'Non-Coding'>('All');
  const [jobType, setJobType] = useState<'All' | 'Full-time' | 'Internship'>('All');
  const [isSearching, setIsSearching] = useState(false);
  const [alertInput, setAlertInput] = useState('');
  const [jobAlerts, setJobAlerts] = useState<string[]>(['Frontend Engineer', 'Fullstack Developer']);
  const [isBackgroundScanning, setIsBackgroundScanning] = useState(false);
  const [newDashboardSkillInput, setNewDashboardSkillInput] = useState('');

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!onUpdateSkills || !resume) return;
    const updated = (resume.skills || []).filter(s => s !== skillToRemove);
    onUpdateSkills(updated);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSkills || !resume || !newDashboardSkillInput.trim()) return;
    const clean = newDashboardSkillInput.trim();
    const current = resume.skills || [];
    if (!current.some(s => s.toLowerCase() === clean.toLowerCase())) {
      onUpdateSkills([...current, clean]);
    }
    setNewDashboardSkillInput('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const jobsData = await apiFetchJson<{ jobs: JobMatch[] }>('/api/find-jobs', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ resume, searchQuery, roleCategory, jobType })
      });

      setJobs(jobsData.jobs || []);
      localStorage.setItem('saved_jobs', JSON.stringify(jobsData.jobs || []));
    } catch (err) {
       console.error(err);
    } finally {
       setIsSearching(false);
    }
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (alertInput.trim() && !jobAlerts.includes(alertInput.trim())) {
      const newAlert = alertInput.trim();
      setJobAlerts([...jobAlerts, newAlert]);
      setAlertInput('');
      triggerBackgroundSearch(newAlert);
    }
  };

  const triggerBackgroundSearch = async (newAlert: string) => {
    setIsBackgroundScanning(true);

    try {
      const jobsData = await apiFetchJson<{ jobs: JobMatch[] }>('/api/find-jobs', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ resume, searchQuery: newAlert, roleCategory, jobType })
      });

      const fetchedJobs = jobsData.jobs || [];
      setJobs(prev => {
         const newJobs = [...fetchedJobs, ...prev];
         const uniqueJobs = Array.from(new Map(newJobs.map(item => [item.title + item.company, item])).values());
         localStorage.setItem('saved_jobs', JSON.stringify(uniqueJobs));
         return uniqueJobs;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackgroundScanning(false);
    }
  };

  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ME';
  
  const getScoreBorder = (score: number) => {
    if (score >= 95) return 'border-l-brand-accent';
    if (score >= 90) return 'border-l-sky-400';
    return 'border-l-amber-400';
  };
  
  const getScoreBadgeStyle = (score: number) => {
    if (score >= 95) return 'text-brand-accent border border-brand-accent/40 bg-brand-accent/5';
    if (score >= 90) return 'text-sky-600 border border-sky-500/30 bg-sky-50';
    return 'text-amber-600 border border-amber-500/30 bg-amber-50';
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8 z-10 relative">
      
      {/* Search Console Filter Bar */}
      <form onSubmit={handleSearch} className="bg-brand-card border border-brand-faint p-5 flex flex-col sm:flex-row gap-4 relative">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search for roles, skills, or companies (e.g., Frontend, Python, Razorpay)..."
            className="w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-faint text-brand-ink text-sm outline-none focus:border-brand-accent font-mono transition-colors placeholder:text-brand-muted/45"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </div>
        </div>

        <button 
          type="submit" 
          className="bg-brand-ink text-brand-bg font-mono text-xs uppercase tracking-widest font-semibold px-8 py-3.5 hover:opacity-90 transition-all cursor-pointer shadow-sm shrink-0"
        >
          Search Live
        </button>
      </form>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile Card & Alerts console */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Active Profile */}
          <div className="bg-brand-card border border-brand-faint p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-brand-faint">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brand-muted">Candidate Core</span>
              <button onClick={onReset} className="font-mono text-[10px] uppercase tracking-widest text-brand-accent hover:underline">+ Upload New</button>
            </div>
            
            <div className="p-4 bg-brand-bg border border-brand-faint flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-accent/10 border border-brand-accent/20 rounded-full flex items-center justify-center text-brand-accent font-bold text-sm shrink-0">
                {getInitials(resume.personalInfo?.name)}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold truncate text-brand-ink">{resume.personalInfo?.name || 'Candidate'}</p>
                <p className="text-[10px] text-brand-muted font-mono truncate">{resume.personalInfo?.email || 'OFFLINE_PERSISTED'}</p>
              </div>
            </div>

            {/* Profile library quick switch */}
            {resumesLibrary.length > 1 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-brand-faint">
                <label className="font-mono text-[10px] text-brand-accent uppercase tracking-widest">Switch Profile Library</label>
                <select 
                  className="w-full bg-brand-bg border border-brand-faint rounded p-2 text-xs font-semibold text-brand-ink outline-none cursor-pointer focus:border-brand-accent"
                  value={activeResumeId || ''}
                  onChange={(e) => onSelectResume(e.target.value)}
                >
                  {resumesLibrary.map(r => (
                    <option key={r.id} value={r.id} className="bg-brand-bg text-brand-ink">{r.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="space-y-4 mt-2">
              <div>
                <p className="font-mono text-[10px] text-brand-accent uppercase tracking-widest mb-2">[ EXTRACTED_SKILLS ]</p>
                <div className="flex flex-wrap gap-1.5 mb-3 max-h-[160px] overflow-y-auto p-1.5 bg-brand-bg border border-brand-faint rounded-sm scrollbar-thin">
                  {(resume.skills || []).map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-bg border border-brand-faint text-brand-ink rounded-full text-[10px] font-sans hover:border-brand-accent/40 transition-colors">
                      {skill}
                      <button 
                        onClick={() => handleRemoveSkill(skill)}
                        className="w-3.5 h-3.5 bg-brand-accent/10 hover:bg-brand-accent hover:text-white rounded-full flex items-center justify-center text-[10px] font-bold text-brand-accent transition-colors cursor-pointer ml-1"
                        title={`Delete ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(resume.skills || []).length === 0 && (
                    <span className="text-[10px] font-mono text-brand-muted uppercase">No skills added yet.</span>
                  )}
                </div>

                {/* Add Skill form in sidebar */}
                <form onSubmit={handleAddSkill} className="flex gap-1.5">
                  <input 
                    type="text"
                    placeholder="Add missing skill..."
                    value={newDashboardSkillInput}
                    onChange={(e) => setNewDashboardSkillInput(e.target.value)}
                    className="flex-1 bg-brand-bg border border-brand-faint text-[10px] px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/40 font-mono text-brand-ink"
                  />
                  <button 
                    type="submit"
                    className="bg-brand-ink text-brand-bg font-mono text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 hover:opacity-90 rounded-sm cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </form>
              </div>

              {resume.education && resume.education.length > 0 && (
                 <div className="pt-2 border-t border-brand-faint">
                   <p className="font-mono text-[10px] text-brand-accent uppercase tracking-widest mb-1.5">[ ACADEMIC_CREDENTIALS ]</p>
                   <p className="text-sm font-bold text-brand-ink">{resume.education[0].degree}</p>
                   <p className="text-[10px] text-brand-muted font-mono mt-0.5 uppercase tracking-wide">{resume.education[0].school}</p>
                 </div>
              )}
            </div>
          </div>

          {/* Auto-Scanner Console */}
          <div className="bg-brand-card border border-brand-faint p-6 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse"></span>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-brand-ink flex items-center gap-2">
                  PORTAL_MONITOR_ACTIVE
                  {isBackgroundScanning && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-accent" />}
                </h4>
              </div>
              <p className="text-brand-muted text-[10px] font-mono leading-relaxed mt-1.5">CONTINUOUS_BACKGROUND_SCRAPE_STABLE // PORTAL_ALERT_SYNC</p>
            </div>
            
            <form onSubmit={handleAddAlert} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Target job, eg: Frontend Dev"
                className="flex-1 bg-brand-bg border border-brand-faint rounded px-3 py-2 text-xs text-brand-ink font-mono placeholder:text-brand-muted/30 focus:outline-none focus:border-brand-accent transition-colors"
                value={alertInput}
                onChange={(e) => setAlertInput(e.target.value)}
              />
              <button type="submit" className="bg-brand-ink text-brand-bg hover:opacity-90 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest transition-all cursor-pointer">
                ADD
              </button>
            </form>

            {jobAlerts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand-faint">
                {jobAlerts.map((alert, i) => (
                  <span key={i} className="px-2 py-1 bg-brand-bg border border-brand-faint rounded-full text-[10px] font-mono text-brand-ink flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-brand-accent animate-ping"></span>
                    {alert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Top Matches Results Feed */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Feed Header */}
          <div className="flex justify-between items-end pb-3 border-b border-brand-faint shrink-0">
            <div>
              <h2 className="font-serif font-light text-3xl tracking-tight text-brand-ink uppercase">Top Matches</h2>
              <p className="text-brand-muted font-mono text-[10px] uppercase mt-0.5">Scanned Live Opportunities across Major Job Boards // India</p>
            </div>
            <div className="flex items-center gap-2 bg-brand-accent/5 border border-brand-accent/20 px-3 py-1 text-[10px] font-mono font-bold text-brand-accent uppercase tracking-widest rounded-sm">
              <Zap className="w-3 h-3 text-brand-accent animate-pulse" />
              LIVE_DATA_SYNCED
            </div>
          </div>

          {/* Job Listing Grid */}
          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div 
                key={job.id || idx} 
                className={`bg-brand-card border-l-4 ${getScoreBorder(job.matchPercentage)} border border-brand-faint p-5 sm:p-6 flex flex-col gap-4 relative transition-all duration-300 hover:border-brand-accent/20 group`}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                  <div className="flex gap-4 items-start min-w-0">
                    <div className="w-10 h-10 border border-brand-faint bg-brand-bg rounded-full flex items-center justify-center font-mono font-bold text-xs text-brand-accent shrink-0 group-hover:border-brand-accent/30 transition-all">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif font-semibold text-xl text-brand-ink truncate group-hover:text-brand-accent transition-colors" title={job.title}>
                        {job.title}
                      </h4>
                      <p className="text-xs text-brand-muted font-mono uppercase tracking-wider mt-1">
                        {job.company} • {job.location || 'India'} • {job.type}
                      </p>
                      
                      {job.platform && (
                        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded bg-brand-bg border border-brand-faint">
                          <span className="text-[9px] font-mono text-brand-muted uppercase">Portal</span>
                          <span className="text-[10px] font-mono font-semibold text-brand-accent">{job.platform}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${getScoreBadgeStyle(job.matchPercentage)}`}>
                          [ {job.matchPercentage}% MATCH ]
                        </span>
                        {job.salary && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-brand-bg border border-brand-faint text-brand-muted rounded-sm">
                            {job.salary}
                          </span>
                        )}
                        {job.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-brand-bg border border-brand-faint text-brand-muted rounded-sm hidden sm:inline-block">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onSelectJob(job)} 
                    className="font-mono text-xs uppercase tracking-widest font-bold bg-brand-ink text-brand-bg hover:opacity-90 px-6 py-3.5 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0 self-stretch sm:self-auto border border-brand-ink"
                  >
                    APPLY & TAILOR
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {job.descriptionSnippet && (
                   <div className="text-xs leading-relaxed text-brand-muted font-mono bg-brand-bg/60 p-4 border border-brand-faint select-all italic relative before:content-['[_SUMMARY_]'] before:absolute before:-top-2 before:right-4 before:bg-brand-card before:px-1 before:text-[8px] before:text-brand-accent before:tracking-widest">
                     "{job.descriptionSnippet}"
                   </div>
                )}
              </div>
            ))}
            
            {jobs.length === 0 && !isSearching && (
               <div className="bg-brand-card border border-brand-faint p-12 text-center text-brand-muted font-mono text-xs uppercase tracking-wider">
                 NO_MATCHING_ROLES_FOUND_IN_SYSTEM_INDEX
               </div>
            )}
            
            {isSearching && (
               <div className="bg-brand-card border border-brand-faint p-16 text-center text-brand-muted flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
                 <span className="font-mono text-xs uppercase tracking-widest text-brand-ink">Querying major job portals for active Indian job records...</span>
               </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

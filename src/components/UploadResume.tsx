import React, { useState, useRef } from 'react';
import { Resume, JobMatch, SavedResumeItem } from '../types';
import { File, Loader2, AlertCircle, Trash2, ChevronRight, ArrowLeft, UploadCloud } from 'lucide-react';
import { apiFetchJson } from '../lib/api';

interface Props {
  onNext: (resume: Resume, jobs: JobMatch[], fileName?: string) => void;
  resumesLibrary: SavedResumeItem[];
  onSelectResume: (id: string) => void;
  onDeleteResume: (id: string) => void;
  onCancelUpload?: () => void;
  onOpenSettings?: () => void;
}

export function UploadResume({ onNext, resumesLibrary, onSelectResume, onDeleteResume, onCancelUpload, onOpenSettings }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Wizard States
  const [extractedResume, setExtractedResume] = useState<Resume | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!extractedResume) return;
    const updatedSkills = (extractedResume.skills || []).filter(s => s !== skillToRemove);
    setExtractedResume({
      ...extractedResume,
      skills: updatedSkills
    });
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedResume || !newSkillInput.trim()) return;
    const clean = newSkillInput.trim();
    const current = extractedResume.skills || [];
    if (!current.some(s => s.toLowerCase() === clean.toLowerCase())) {
      setExtractedResume({
        ...extractedResume,
        skills: [...current, clean]
      });
    }
    setNewSkillInput('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf')) { 
      setError('Please upload a PDF file.');
      return;
    }

    setIsUploading(true);
    setStatusText('Extracting resume details...');
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const resumeData = await apiFetchJson<Resume>('/api/extract-resume', {
        method: 'POST',
        body: formData,
      });

      setExtractedResume(resumeData);
      setUploadedFileName(file.name);
      setIsUploading(false);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred during extraction');
      setIsUploading(false);
    }
  };

  const handleSelectOpportunityType = async (selectedType: 'Internship' | 'Full-time') => {
    setIsFetchingJobs(true);
    setError(null);
    try {
      const jobsData = await apiFetchJson<{ jobs: JobMatch[] }>('/api/find-jobs', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ resume: extractedResume, jobType: selectedType })
      });

      onNext(extractedResume!, jobsData.jobs || [], uploadedFileName);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred matching jobs');
      setExtractedResume(null);
    } finally {
      setIsFetchingJobs(false);
    }
  };

  // If a resume is extracted, display the Opportunity Type selection Wizard screen
  if (extractedResume) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-16 px-6 sm:px-8 max-w-4xl mx-auto w-full z-10 text-center animate-fade-in">
        <span className="font-mono text-[10px] uppercase tracking-widest text-brand-accent mb-3 block">[ CORE_TARGET_MODE ]</span>
        <h2 className="font-serif text-[clamp(2.2rem,4.5vw,3.6rem)] font-light leading-tight text-brand-ink mb-4">
          Hi, {extractedResume.personalInfo?.name || 'Candidate'}.<br />What type of opportunity are you seeking?
        </h2>
        <p className="text-brand-muted text-sm sm:text-base font-normal max-w-lg mb-12 leading-relaxed">
          Select your target career path. We will instantly align your profile and scan active tech portals in India for matches.
        </p>

        {/* Interactive Skills Parser Review */}
        <div className="bg-brand-card border border-brand-faint p-6 rounded-sm w-full max-w-2xl mb-10 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-brand-faint mb-4">
            <div>
              <span className="font-mono text-[9px] text-brand-accent uppercase tracking-widest block mb-0.5">[ PARSING_VERIFICATION ]</span>
              <h4 className="font-serif font-medium text-sm text-brand-ink">Verify Extracted Skill-Set</h4>
            </div>
            <span className="font-mono text-[10px] text-brand-muted uppercase bg-brand-bg px-2 py-0.5 border border-brand-faint">
              {extractedResume.skills?.length || 0} Skills Extracted
            </span>
          </div>

          <p className="text-[11px] text-brand-muted mb-4 leading-relaxed">
            Please verify or edit your skills below. Delete incorrect terms by clicking <strong className="text-brand-ink">×</strong>, or append missing ones using the input field. This ensures maximum ATS compatibility scores.
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4 max-h-[140px] overflow-y-auto p-1 bg-brand-bg/50 border border-brand-faint rounded-sm">
            {(extractedResume.skills || []).map((skill, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-bg border border-brand-faint text-brand-ink hover:border-brand-accent/30 rounded-full text-[10px] font-sans transition-all"
              >
                {skill}
                <button 
                  onClick={() => handleRemoveSkill(skill)}
                  className="w-3.5 h-3.5 bg-brand-accent/10 hover:bg-brand-accent hover:text-white rounded-full flex items-center justify-center text-[10px] font-bold text-brand-accent transition-colors cursor-pointer"
                  title={`Delete ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
            {(extractedResume.skills || []).length === 0 && (
              <span className="text-[10px] font-mono text-brand-muted uppercase p-1">No skills extracted yet. Add some below!</span>
            )}
          </div>

          <form onSubmit={handleAddSkill} className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="Add missing skill (e.g. Docker, Redux)..."
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              className="flex-1 bg-brand-bg border border-brand-faint text-[11px] px-3 py-1.5 rounded-sm focus:outline-none focus:border-brand-accent/60 placeholder:text-brand-muted/45 text-brand-ink font-mono"
            />
            <button
              type="submit"
              className="bg-brand-ink text-brand-bg font-mono text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 hover:opacity-95 transition-all rounded-sm cursor-pointer shrink-0"
            >
              + Append
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mb-12">
          {/* Internship Option */}
          <button
            onClick={() => handleSelectOpportunityType('Internship')}
            disabled={isFetchingJobs}
            className="bg-brand-card hover:bg-brand-card/90 border border-brand-faint hover:border-brand-accent/40 p-8 text-left transition-all group flex flex-col justify-between min-h-[190px] cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="absolute right-4 top-4 font-mono text-[10px] text-brand-muted/30 uppercase tracking-widest group-hover:text-brand-accent transition-colors">01 // IND</div>
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-widest text-brand-accent mb-2">Practical Training</span>
              <h3 className="font-serif font-medium text-2xl text-brand-ink group-hover:text-brand-accent transition-colors">Internship / Co-op</h3>
            </div>
            <p className="text-[11px] text-brand-muted mt-4 font-mono leading-relaxed">
              Ideal for students and recent grads seeking hands-on, high-growth technical apprenticeships.
            </p>
          </button>

          {/* Full-time Option */}
          <button
            onClick={() => handleSelectOpportunityType('Full-time')}
            disabled={isFetchingJobs}
            className="bg-brand-card hover:bg-brand-card/90 border border-brand-faint hover:border-brand-accent/40 p-8 text-left transition-all group flex flex-col justify-between min-h-[190px] cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="absolute right-4 top-4 font-mono text-[10px] text-brand-muted/30 uppercase tracking-widest group-hover:text-brand-accent transition-colors">02 // IND</div>
            <div>
              <span className="block font-mono text-[9px] uppercase tracking-widest text-brand-accent mb-2">Permanent Career</span>
              <h3 className="font-serif font-medium text-2xl text-brand-ink group-hover:text-brand-accent transition-colors">Full-Time Position</h3>
            </div>
            <p className="text-[11px] text-brand-muted mt-4 font-mono leading-relaxed">
              Ideal for professionals seeking permanent positions, dedicated roles, and long-term career growth.
            </p>
          </button>
        </div>

        {isFetchingJobs && (
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-brand-accent animate-pulse bg-brand-accent/5 px-4 py-2 border border-brand-accent/20">
            <Loader2 className="w-4 h-4 animate-spin" />
            SCANNING_LIVE_INDIAN_JOB_BOARDS...
          </div>
        )}

        {!isFetchingJobs && (
          <button
            onClick={() => {
              setExtractedResume(null);
              setUploadedFileName('');
            }}
            className="font-mono text-[11px] uppercase tracking-wider text-brand-muted hover:text-brand-ink hover:underline transition-colors mt-4"
          >
            ← Back to Upload Screen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 max-w-7xl mx-auto w-full z-10">
      
      {/* Top bar with back button */}
      {onCancelUpload && (
        <div className="mb-6 self-start">
          <button
            onClick={onCancelUpload}
            className="flex items-center gap-2 font-mono text-xs text-brand-muted hover:text-brand-ink hover:underline transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-accent" />
            BACK_TO_DASHBOARD
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-stretch mt-4">
        
        {/* Left Column: Hero Intro & Saved Resumes */}
        <div className="lg:col-span-7 flex flex-col justify-center py-4">
          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.8rem)] font-light leading-[0.9] tracking-tight text-brand-ink mb-6">
            Stop searching.<br />Start matching.
          </h1>
          <p className="text-brand-muted text-base sm:text-lg font-normal max-w-xl mb-10 leading-relaxed">
            Upload your resume or pick a previously saved profile to instantly find and tailor high-probability matching opportunities in India.
          </p>

          {/* Saved Resume Library list within column */}
          {!isUploading && resumesLibrary.length > 0 && (
            <div className="mt-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-brand-accent mb-4 flex items-center gap-2">
                <span>[ CURRENT_RESUMES_LIBRARY ]</span>
                <span className="px-1.5 py-0.5 bg-brand-accent/20 text-brand-accent border border-brand-accent/35 text-[10px] font-bold rounded-sm">
                  {resumesLibrary.length}
                </span>
              </h3>
              
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-faint">
                {resumesLibrary.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-brand-card border border-brand-faint p-4 flex items-center justify-between group hover:border-brand-accent/30 transition-all duration-200"
                  >
                    <div 
                      onClick={() => {
                        setExtractedResume(item.data);
                        setUploadedFileName(item.name);
                      }}
                      className="flex-1 cursor-pointer pr-4 min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <File className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
                        <h4 className="font-bold text-brand-ink text-sm truncate" title={item.name}>
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-brand-muted font-mono uppercase tracking-wider">Sync: {item.uploadedAt}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setExtractedResume(item.data);
                          setUploadedFileName(item.name);
                        }}
                        className="font-mono text-[10px] uppercase bg-brand-accent hover:opacity-90 text-white font-bold px-3 py-1.5 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Match
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${item.name}" from your library?`)) {
                            onDeleteResume(item.id);
                          }
                        }}
                        className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Drop Zone */}
        <div className="lg:col-span-5 bg-brand-card p-6 sm:p-10 flex flex-col justify-center border border-brand-faint">
          <div 
            className={`bg-brand-bg border border-brand-faint p-8 sm:p-12 text-center relative transition-all duration-300 ${
              isDragging 
                ? 'border-brand-accent bg-brand-accent/5' 
                : 'hover:border-brand-accent/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <div className="mx-auto w-12 h-12 bg-brand-accent text-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>
            
            <h3 className="font-sans text-xs font-semibold text-brand-ink uppercase tracking-wider mb-2">
              {isUploading ? statusText : 'Drag & drop a new resume here'}
            </h3>
            
            {!isUploading && (
              <>
                <p className="text-brand-muted mb-6 text-[10px] leading-relaxed font-mono uppercase tracking-widest">SUPPORTS_PDF // MAX_SIZE: 5MB</p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf" 
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand-ink text-brand-bg font-mono text-xs uppercase tracking-widest font-semibold px-6 py-3 hover:opacity-95 transition-all cursor-pointer border border-transparent shadow-sm"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>

          {error && (
            <div className={`mt-6 p-4 border rounded flex flex-col gap-3 text-xs leading-relaxed font-mono ${
              error.includes('Quota Exceeded') || error.includes('QUOTA_EXCEEDED')
                ? 'bg-amber-50 border-amber-500/20 text-amber-900'
                : 'bg-red-50 border-red-500/20 text-red-800'
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-4.5 h-4.5 flex-shrink-0 mt-0.5 ${
                  error.includes('Quota Exceeded') || error.includes('QUOTA_EXCEEDED') ? 'text-amber-600' : 'text-red-600'
                }`} />
                <div>
                  <span className={`font-bold block mb-1 uppercase tracking-wider ${
                    error.includes('Quota Exceeded') || error.includes('QUOTA_EXCEEDED') ? 'text-amber-800' : 'text-red-700'
                  }`}>
                    {error.includes('Quota Exceeded') || error.includes('QUOTA_EXCEEDED') ? 'RATE_LIMIT_REACHED:' : 'EXTRACTION_ERROR:'}
                  </span>
                  <p>{error}</p>
                </div>
              </div>
              {onOpenSettings && (
                error.includes('Quota Exceeded') || 
                error.includes('QUOTA_EXCEEDED') || 
                error.includes('API Key') || 
                error.includes('API_KEY') || 
                error.includes('missing')
              ) && (
                <div className="pt-2 border-t border-brand-faint flex justify-end">
                  <button
                    onClick={onOpenSettings}
                    className="px-3 py-1.5 bg-brand-ink text-brand-bg font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-sm rounded-sm"
                  >
                    Provide Personal API Key
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Section Grid at Bottom */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 border-t border-brand-faint pt-12">
        <div className="border-l border-brand-faint pl-5 hover:border-brand-accent transition-colors duration-200">
          <div className="font-mono text-[10px] text-brand-accent uppercase tracking-widest mb-2">01</div>
          <h4 className="font-serif font-medium text-2xl text-brand-ink mb-2">Smart Extraction</h4>
          <p className="text-xs text-brand-muted leading-relaxed">Automatically pulls your skills, experience, and education directly from your PDF document.</p>
        </div>
        
        <div className="border-l border-brand-faint pl-5 hover:border-brand-accent transition-colors duration-200">
          <div className="font-mono text-[10px] text-brand-accent uppercase tracking-widest mb-2">02</div>
          <h4 className="font-serif font-medium text-2xl text-brand-ink mb-2">Instant Matching</h4>
          <p className="text-xs text-brand-muted leading-relaxed">We scan thousands of active job postings to find roles that require your exact skill set.</p>
        </div>
        
        <div className="border-l border-brand-faint pl-5 hover:border-brand-accent transition-colors duration-200">
          <div className="font-mono text-[10px] text-brand-accent uppercase tracking-widest mb-2">03</div>
          <h4 className="font-serif font-medium text-2xl text-brand-ink mb-2">Save Hours</h4>
          <p className="text-xs text-brand-muted leading-relaxed">Instead of searching for jobs, focus only on applying to high-probability matches.</p>
        </div>
      </section>
    </div>
  );
}

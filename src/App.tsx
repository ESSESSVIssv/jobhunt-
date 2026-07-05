/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Resume, JobMatch, SavedResumeItem } from './types';
import { UploadResume } from './components/UploadResume';
import { Dashboard } from './components/Dashboard';
import { ApplicationView } from './components/ApplicationView';
import { SettingsModal } from './components/SettingsModal';
import { Settings } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'upload' | 'dashboard' | 'application'>('upload');
  const [resume, setResume] = useState<Resume | null>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [resumesLibrary, setResumesLibrary] = useState<SavedResumeItem[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load and migrate resumes
  useEffect(() => {
    let library: SavedResumeItem[] = [];
    const savedLib = localStorage.getItem('saved_resumes_library');
    if (savedLib) {
      try {
        library = JSON.parse(savedLib);
      } catch (e) {
        console.error("Failed to parse saved resumes library", e);
      }
    }

    // Migrate old legacy single resume if library is empty
    const oldResume = localStorage.getItem('saved_resume');
    const oldJobs = localStorage.getItem('saved_jobs');
    if (library.length === 0 && oldResume) {
      try {
        const parsedResume = JSON.parse(oldResume);
        const parsedJobs = oldJobs ? JSON.parse(oldJobs) : [];
        if (parsedResume && Object.keys(parsedResume).length > 0) {
          const item: SavedResumeItem = {
            id: 'legacy-default',
            name: parsedResume.personalInfo?.name ? `${parsedResume.personalInfo.name}'s Resume` : 'My Resume',
            uploadedAt: new Date().toLocaleDateString(),
            data: parsedResume,
            jobs: parsedJobs
          };
          library = [item];
          localStorage.setItem('saved_resumes_library', JSON.stringify(library));
        }
      } catch (e) {
        console.error("Migration failed", e);
      }
    }

    setResumesLibrary(library);

    // Set active resume
    let activeId = localStorage.getItem('active_resume_id');
    if (!activeId && library.length > 0) {
      activeId = library[0].id;
    }

    if (activeId) {
      const activeItem = library.find(item => item.id === activeId);
      if (activeItem) {
        setActiveResumeId(activeId);
        setResume(activeItem.data);
        setJobs(activeItem.jobs);
        setView('dashboard');
      } else if (library.length > 0) {
        setActiveResumeId(library[0].id);
        setResume(library[0].data);
        setJobs(library[0].jobs);
        setView('dashboard');
      }
    }
  }, []);

  const handleNext = (res: Resume, jbs: JobMatch[], fileName?: string) => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : 'resume-' + Date.now();
    const newItem: SavedResumeItem = {
      id: newId,
      name: fileName || (res.personalInfo?.name ? `${res.personalInfo.name}'s Resume` : 'My Resume'),
      uploadedAt: new Date().toLocaleDateString(),
      data: res,
      jobs: jbs
    };
    const updatedLib = [newItem, ...resumesLibrary];
    setResumesLibrary(updatedLib);
    localStorage.setItem('saved_resumes_library', JSON.stringify(updatedLib));
    
    setActiveResumeId(newId);
    localStorage.setItem('active_resume_id', newId);
    setResume(res);
    setJobs(jbs);
    setView('dashboard');
  };

  const handleSelectResume = (id: string) => {
    const item = resumesLibrary.find(r => r.id === id);
    if (item) {
      setActiveResumeId(id);
      localStorage.setItem('active_resume_id', id);
      setResume(item.data);
      setJobs(item.jobs);
      setView('dashboard');
    }
  };

  const handleDeleteResume = (id: string) => {
    const updatedLib = resumesLibrary.filter(r => r.id !== id);
    setResumesLibrary(updatedLib);
    localStorage.setItem('saved_resumes_library', JSON.stringify(updatedLib));

    if (activeResumeId === id) {
      if (updatedLib.length > 0) {
        const nextItem = updatedLib[0];
        setActiveResumeId(nextItem.id);
        localStorage.setItem('active_resume_id', nextItem.id);
        setResume(nextItem.data);
        setJobs(nextItem.jobs);
      } else {
        setActiveResumeId(null);
        localStorage.removeItem('active_resume_id');
        setResume(null);
        setJobs([]);
        setView('upload');
      }
    }
  };

  const handleAddResumeRedirect = () => {
    setView('upload');
  };

  const handleUpdateResumeSkills = (updatedSkills: string[]) => {
    if (!resume || !activeResumeId) return;
    const updatedResume = { ...resume, skills: updatedSkills };
    setResume(updatedResume);

    const updatedLib = resumesLibrary.map(item => {
      if (item.id === activeResumeId) {
        return { ...item, data: updatedResume };
      }
      return item;
    });
    setResumesLibrary(updatedLib);
    localStorage.setItem('saved_resumes_library', JSON.stringify(updatedLib));
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink flex flex-col relative overflow-x-hidden">
      <div className="grid-bg"></div>

      {/* Header */}
      <header className="border-b border-brand-faint px-6 py-4 sm:px-8 flex justify-between items-center z-10 relative bg-brand-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-1.5 border-brand-ink shrink-0"></div>
          <span className="font-serif font-semibold text-2xl tracking-tight text-brand-ink">JobLence</span>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="font-mono text-[11px] uppercase tracking-widest bg-transparent border border-brand-faint text-brand-ink px-4 py-2 hover:bg-brand-card transition-all flex items-center gap-2 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-brand-accent" />
          System Settings
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 relative">
        {view === 'upload' && (
          <UploadResume 
            onNext={handleNext}
            resumesLibrary={resumesLibrary}
            onSelectResume={handleSelectResume}
            onDeleteResume={handleDeleteResume}
            onCancelUpload={resumesLibrary.length > 0 ? () => setView('dashboard') : undefined}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
        {view === 'dashboard' && resume && (
          <Dashboard 
            resume={resume} 
            jobs={jobs} 
            onReset={handleAddResumeRedirect}
            onSelectJob={(job) => {
              setSelectedJob(job);
              setView('application');
            }}
            resumesLibrary={resumesLibrary}
            activeResumeId={activeResumeId}
            onSelectResume={handleSelectResume}
            onDeleteResume={handleDeleteResume}
            onUpdateSkills={handleUpdateResumeSkills}
          />
        )}
        {view === 'application' && resume && selectedJob && (
           <ApplicationView
              resume={resume}
              job={selectedJob}
              onBack={() => setView('dashboard')}
              onUpdateSkills={handleUpdateResumeSkills}
           />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-faint px-6 py-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-[10px] text-brand-muted z-10 relative bg-brand-bg">
        <div>V 1.0.4 // PRECISION_MATCHING</div>
        <div>STABLE_CONNECTION // INDIA_DATABASE_SYNC</div>
      </footer>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );

}

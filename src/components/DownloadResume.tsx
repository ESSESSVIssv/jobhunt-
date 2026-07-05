import { Resume } from '../types';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useRef } from 'react';

interface Props {
  resume: Resume;
  template: string;
  onBack: () => void;
}

export function DownloadResume({ resume, template, onBack }: Props) {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8 no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </button>
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
          <button
            onClick={handlePrint}
            className="bg-orange-500 hover:bg-orange-600 text-zinc-50 px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="text-center mb-10 no-print">
        <h1 className="text-3xl font-bold text-zinc-50 mb-4 tracking-tight">Preview & Download</h1>
        <p className="text-zinc-400 text-lg">
          Review your optimized resume. Use the download button to save it as an ATS-friendly PDF.
        </p>
      </div>

      {/* A4 Paper Container */}
      <div className="w-full max-w-[850px] mx-auto bg-white rounded-lg shadow-2xl overflow-hidden print-container">
        {/* Render Resume Content based on generic minimal template */}
        <div className="text-zinc-950 p-12 font-sans min-h-[1100px]">
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-6 mb-6 text-center">
            <h1 className="text-4xl font-bold uppercase tracking-tight text-zinc-900 mb-2">
              {resume.personalInfo?.name || "Your Name"}
            </h1>
            <div className="text-sm text-zinc-600 flex flex-wrap justify-center gap-4">
              {resume.personalInfo?.email && <span>{resume.personalInfo.email}</span>}
              {resume.personalInfo?.phone && <span>{resume.personalInfo.phone}</span>}
              {resume.personalInfo?.location && <span>{resume.personalInfo.location}</span>}
            </div>
            {resume.personalInfo?.links && resume.personalInfo.links.length > 0 && (
              <div className="text-sm text-zinc-500 mt-2 flex flex-wrap justify-center gap-4">
                 {resume.personalInfo.links.map((link, i) => (
                    <span key={i}>{link}</span>
                 ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {resume.summary && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-2">Professional Summary</h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{resume.summary}</p>
            </div>
          )}

          {/* Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-3 border-b border-zinc-200 pb-1">Experience</h2>
              <div className="space-y-5">
                {resume.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-base font-bold text-zinc-900">{exp.title}</h3>
                      <span className="text-sm text-zinc-600 font-medium">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-semibold text-zinc-700">{exp.company}</span>
                      <span className="text-sm text-zinc-500">{exp.location}</span>
                    </div>
                    {exp.description && exp.description.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1 marker:text-zinc-400">
                        {exp.description.map((desc, i) => (
                          <li key={i}>{desc}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-3 border-b border-zinc-200 pb-1">Skills</h2>
              <div className="text-sm text-zinc-700 leading-relaxed">
                {resume.skills.join(" • ")}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-3 border-b border-zinc-200 pb-1">Education</h2>
              <div className="space-y-4">
                {resume.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-base font-bold text-zinc-900">{edu.degree}</h3>
                      <span className="text-sm text-zinc-600 font-medium">
                        {edu.startDate} - {edu.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-zinc-700">{edu.school}</span>
                      <span className="text-sm text-zinc-500">{edu.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

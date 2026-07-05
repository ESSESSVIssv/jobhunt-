import { ArrowLeft, ArrowRight, LayoutTemplate } from 'lucide-react';

interface Props {
  selectedTemplate: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ResumeTemplates({ selectedTemplate, onSelect, onNext, onBack }: Props) {
  const templates = [
    { id: 'modern', name: 'Modern Minimal', desc: 'Clean, structured, highly readable. Great for tech and design.' },
    { id: 'executive', name: 'Executive', desc: 'Traditional layout optimized for management and senior roles.' },
    { id: 'startup', name: 'Startup Bold', desc: 'Slightly creative with strong typography for modern companies.' },
    { id: 'ats', name: 'ATS Classic', desc: '100% machine readable. Simple, linear structure. Best for standard portals.' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Comparison
        </button>
        <button
          onClick={onNext}
          className="bg-orange-500 hover:bg-orange-600 text-zinc-50 px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          Preview & Download <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-zinc-50 mb-4 tracking-tight">Select a Design</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Choose a layout for your tailored resume. All our templates are ATS-friendly and designed by hiring managers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((t) => (
          <div 
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col ${
              selectedTemplate === t.id 
                ? 'border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.02]' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className={`h-48 flex items-center justify-center border-b ${selectedTemplate === t.id ? 'bg-orange-500/5 border-orange-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
               <LayoutTemplate className={`w-16 h-16 ${selectedTemplate === t.id ? 'text-orange-500' : 'text-zinc-700'}`} />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className={`text-lg font-bold mb-2 ${selectedTemplate === t.id ? 'text-zinc-100' : 'text-zinc-300'}`}>
                {t.name}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed flex-1">
                {t.desc}
              </p>
              {selectedTemplate === t.id && (
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  Selected
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

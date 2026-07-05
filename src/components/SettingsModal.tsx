import { useState, useEffect } from 'react';
import { X, Key, Info, Check, Eye, EyeOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('user_gemini_api_key') || '';
      setApiKey(savedKey);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('user_gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('user_gemini_api_key');
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('user_gemini_api_key');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-brand-bg border border-brand-faint w-full max-w-md shadow-xl overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="p-6 border-b border-brand-faint flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-accent" />
            <h3 className="font-serif font-semibold text-brand-ink text-lg uppercase tracking-wider">Configuration</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-brand-muted hover:text-brand-ink p-1.5 hover:bg-brand-card transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 space-y-5">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-brand-accent mb-2">
              [ CUSTOM_GEMINI_API_KEY ]
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-brand-card border border-brand-faint text-brand-ink px-4 py-3 text-sm pr-12 focus:outline-none focus:border-brand-accent font-mono transition-all placeholder:text-brand-muted/30"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-brand-muted hover:text-brand-accent p-1 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] font-mono text-brand-muted mt-2 leading-relaxed uppercase tracking-wider">
              If the default free-tier API tokens are rate-limited, supply your own personal Gemini API key to run queries autonomously.
            </p>
          </div>

          <div className="bg-brand-card border border-brand-faint p-4 flex gap-3 text-xs leading-relaxed text-brand-ink">
            <Info className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
            <div className="font-mono">
              <p className="font-bold text-brand-accent uppercase tracking-wider mb-1.5">How to get an API Key:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-brand-muted">
                <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-brand-accent hover:text-brand-ink">Google AI Studio</a></li>
                <li>Click <strong>Get API Key</strong></li>
                <li>Create a key and paste it above</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-brand-card border-t border-brand-faint flex justify-end gap-3">
          {apiKey && (
            <button
              onClick={handleClear}
              className="px-4 py-2 font-mono text-[10px] uppercase font-bold text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              REMOVE_KEY
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`px-5 py-2 font-mono text-[11px] uppercase tracking-widest font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              saved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-brand-ink text-brand-bg hover:opacity-95'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                APPLIED_OK
              </>
            ) : (
              'SAVE_&_APPLY'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

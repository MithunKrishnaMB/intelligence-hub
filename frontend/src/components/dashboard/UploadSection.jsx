import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, Loader2, BrainCircuit } from 'lucide-react';

const PROCESSING_STEPS = [
  "Analysing transcript audio and text...",
  "Identifying key decisions and rationale...",
  "Extracting action items and assignees...",
  "Running sentiment analysis model...",
  "Finalizing meeting context..."
];

export default function UploadSection() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const handleUpload = () => {
    setIsProcessing(true);
    setStepIndex(0);
  };

  useEffect(() => {
    if (isProcessing) {
      if (stepIndex < PROCESSING_STEPS.length) {
        const timer = setTimeout(() => {
          setStepIndex(prev => prev + 1);
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        // Redirect upon complete
        navigate('/meeting/new');
      }
    }
  }, [isProcessing, stepIndex, navigate]);

  if (isProcessing) {
    return (
      <section className="mb-16">
        <div className="bg-surface-container-lowest rounded-xl p-1 w-full shadow-sm">
          <div className="bg-surface-container-low/50 border-2 border-outline-variant/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 transition-colors">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
               <BrainCircuit className="text-primary animate-pulse relative z-10 w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-4">Processing Intelligence</h2>
            
            <div className="w-full max-w-md space-y-3">
              {PROCESSING_STEPS.map((step, idx) => {
                const isPast = idx < stepIndex;
                const isCurrent = idx === stepIndex;
                
                return (
                  <div key={idx} className={`flex items-center gap-3 ${isPast ? 'text-emerald-600' : isCurrent ? 'text-primary' : 'text-slate-400 opacity-50'}`}>
                    {isPast ? <CheckCircle2 size={20} /> : isCurrent ? <Loader2 size={20} className="animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                    <span className="text-sm font-medium">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="bg-surface-container-lowest rounded-xl p-1 w-full shadow-sm">
        <div className="bg-surface-container-low/50 border-2 border-dashed border-outline-variant/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 transition-colors hover:bg-surface-container-low cursor-pointer" onClick={handleUpload}>
          <div className="bg-primary/5 p-4 rounded-full mb-6">
            <UploadCloud size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Upload Transcripts</h2>
          <p className="text-on-surface-variant mb-8 text-center max-w-md">Drag and drop your audio transcripts here or click to browse local files.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-lg shadow-lg shadow-primary/10 active:scale-95 transition-all">
                Browse Files
            </button>
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Supported: .TXT, .VTT</span>
          </div>
        </div>
      </div>
    </section>
  );
}

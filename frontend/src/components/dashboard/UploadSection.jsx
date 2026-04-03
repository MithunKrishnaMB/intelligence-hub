import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, Loader2, BrainCircuit, FileText, X } from 'lucide-react';

const PROCESSING_STEPS = [
  "Analysing transcript audio and text...",
  "Identifying key decisions and rationale...",
  "Extracting action items and assignees...",
  "Running sentiment analysis model...",
  "Finalizing meeting context..."
];

export default function UploadSection({ onUploadComplete }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    // Filter only supported files
    const validFiles = files.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.vtt'));
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // --- File Selection Handlers ---
  const handleFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- API Upload Logic ---
  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setStepIndex(0);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append("files", file);
    });

    try {
      // 1. Upload files
      setStepIndex(1);
      const uploadRes = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      
      // 2. Process all uploaded transcripts sequentially
      setStepIndex(2);
      if (uploadData.summaries && uploadData.summaries.length > 0) {
        for (const summary of uploadData.summaries) {
            setStepIndex(3);
            await fetch(`http://127.0.0.1:8000/transcripts/${summary.transcript_id}/process`, {
                method: "POST",
            });
        }
        
        setStepIndex(4); 
        
        // Refresh Dashboard and clear selection
        if (onUploadComplete) onUploadComplete();
        setSelectedFiles([]);
      }
      
    } catch (error) {
      console.error("Pipeline Error:", error);
      alert("Something went wrong during upload or processing.");
    } finally {
      setIsProcessing(false);
      setStepIndex(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- Processing UI ---
  if (isProcessing) {
    return (
      <section className="mb-16">
        <div className="bg-surface-container-lowest rounded-xl p-1 w-full shadow-sm">
          <div className="bg-surface-container-low/50 border-2 border-outline-variant/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 transition-colors">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
               <BrainCircuit className="text-primary animate-pulse relative z-10 w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-4">Processing {selectedFiles.length} File(s)</h2>
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

  // --- Upload UI ---
  return (
    <section className="mb-16">
      <input 
        type="file" 
        multiple 
        accept=".txt,.vtt" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />
      
      <div className="bg-surface-container-lowest rounded-xl p-1 w-full shadow-sm">
        {/* Dropzone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-12 px-8 transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:bg-surface-container-low bg-surface-container-low/50'}`}
        >
          <div className="bg-primary/5 p-4 rounded-full mb-4">
            <UploadCloud size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-1">Drag & Drop Transcripts</h2>
          <p className="text-on-surface-variant mb-4 text-center text-sm max-w-md">or click here to browse local files.</p>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">Supported: .TXT, .VTT</span>
        </div>

        {/* Staged Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Ready to Process ({selectedFiles.length})</h3>
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="text-blue-500 flex-shrink-0" size={18} />
                    <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Action Button */}
            <div className="flex justify-end">
              <button 
                onClick={handleProcessFiles}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <BrainCircuit size={18} />
                Process {selectedFiles.length} {selectedFiles.length === 1 ? 'Transcript' : 'Transcripts'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
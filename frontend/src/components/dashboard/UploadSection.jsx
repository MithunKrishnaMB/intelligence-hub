import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, BrainCircuit, FileText, X, AlertTriangle, RefreshCw } from 'lucide-react';

export default function UploadSection({ onUploadComplete }) {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // NEW: State to track errors
  const [errorMessage, setErrorMessage] = useState("");

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.vtt'));
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

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
    setErrorMessage(""); // Clear past errors
    const token = localStorage.getItem("token");

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append("files", file);
    });

    try {
      // 1. Upload files
      const uploadRes = await fetch(`${API_URL}/upload/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      
      if (!uploadRes.ok) throw new Error("Failed to upload files to the server.");
      const uploadData = await uploadRes.json();
      
      // 2. Process all uploaded transcripts sequentially
      if (uploadData.summaries && uploadData.summaries.length > 0) {
        for (const summary of uploadData.summaries) {
            const processRes = await fetch(`${API_URL}/transcripts/${summary.transcript_id}/process`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            // If processing fails, throw an error to stop the loop!
            if (!processRes.ok) {
                const errorData = await processRes.json();
                throw new Error(errorData.detail || "AI processing failed. Please retry.");
            }
        }
        
        // Refresh Dashboard and clear selection ONLY on complete success
        if (onUploadComplete) onUploadComplete();
        setSelectedFiles([]);
      }
      
    } catch (error) {
      console.error("Pipeline Error:", error);
      setErrorMessage(error.message); // Set the error so the UI shows the Retry button
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- NEW UI: Error State with Retry Button ---
  if (errorMessage) {
    return (
      <section className="mb-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 w-full shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600 flex-shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-red-900 mb-1">Processing Interrupted</h3>
              <p className="text-red-700 text-sm mb-6">{errorMessage}</p>

              <div className="flex gap-3">
                <button 
                  onClick={handleProcessFiles} // Just run the function again!
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm active:scale-95"
                >
                  <RefreshCw size={18} />
                  Retry {selectedFiles.length} File(s)
                </button>
                <button 
                  onClick={() => { setErrorMessage(""); setSelectedFiles([]); }} // Clear everything
                  className="px-6 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 font-bold rounded-lg transition-colors active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- UI: Processing State (Simultaneous Loading) ---
  if (isProcessing) {
    return (
      <section className="mb-16">
        <div className="bg-surface-container-lowest rounded-xl p-1 w-full shadow-sm">
          <div className="bg-surface-container-low/50 border-2 border-outline-variant/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 transition-colors">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
               <BrainCircuit className="text-primary animate-pulse relative z-10 w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-8">Processing {selectedFiles.length} File(s)</h2>
            
            <div className="w-full max-w-md space-y-4">
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm">
                <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <span className="text-sm font-medium text-on-surface-variant">
                  Extracting decisions and action items...
                </span>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm">
                <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <span className="text-sm font-medium text-on-surface-variant">
                  Performing sentiment analysis...
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-8">
                <div className="h-full bg-primary rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- UI: Upload State ---
  return (
    <section className="mb-16">
      <input type="file" multiple accept=".txt,.vtt" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      
      <div className="bg-surface-container-lowest rounded-xl p-1 w-full shadow-sm">
        <div 
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-12 px-8 transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:bg-surface-container-low bg-surface-container-low/50'}`}
        >
          <div className="bg-primary/5 p-4 rounded-full mb-4">
            <UploadCloud size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-1">Drag & Drop Transcripts</h2>
          <p className="text-on-surface-variant mb-4 text-center text-sm max-w-md">or click here to browse local files.</p>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">Supported: .TXT, .VTT</span>
        </div>

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
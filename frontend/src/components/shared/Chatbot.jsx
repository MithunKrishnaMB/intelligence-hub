import { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 z-[100] flex flex-col right-8 items-end">
      {/* Chat Window */}
      <div className={`${isOpen ? 'flex' : 'hidden'} mb-4 w-80 h-96 bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-outline-variant/20 flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-surface-container flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2">
            <Bot className="text-primary w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">AI Assistant</span>
          </div>
          <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>
        {/* Chat History */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4 hide-scrollbar">
          <div className="bg-surface-container-low p-3 rounded-lg rounded-tl-none text-xs w-fit max-w-[85%] text-on-surface-variant">
            Hello! How can I help you analyze this meeting transcript today?
          </div>
        </div>
        {/* Input Area */}
        <div className="p-3 border-t border-surface-container">
          <div className="relative flex items-center gap-2">
            <input className="w-full bg-surface-container-high/50 border-none rounded-lg py-2 pl-3 pr-10 text-xs focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Ask a question..." type="text" />
            <button className="absolute right-2 text-primary hover:scale-110 transition-transform">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Floating Toggle Button */}
      <button 
        className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>
    </div>
  );
}

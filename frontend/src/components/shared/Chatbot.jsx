import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Loader2 } from 'lucide-react';

export default function Chatbot({ transcriptId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize with a welcome message
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! How can I help you analyze this meeting transcript today?", sources: [] }
  ]);

  // Ref to automatically scroll to the bottom of the chat
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || !transcriptId) return;

    const userMessage = input.trim();
    setInput(""); // Clear input field
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: userMessage,
          transcript_id: transcriptId // Ensures we ONLY search this meeting
        })
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      
      const data = await response.json();

      // Add AI response to UI with citations
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer,
        sources: data.sources_used || []
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Sorry, I encountered an error trying to process your request." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Allow sending with the Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-8 z-[100] flex flex-col right-8 items-end">
      {/* Chat Window */}
      <div className={`${isOpen ? 'flex' : 'hidden'} mb-4 w-[350px] h-[500px] bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-outline-variant/20 flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right`}>
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-surface-container flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Bot className="text-primary w-5 h-5" />
            <span className="text-sm font-bold tracking-wide text-on-surface">Intelligence Assistant</span>
          </div>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-surface-container-lowest/50 hide-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              <div className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-on-primary rounded-br-sm' 
                  : 'bg-surface-container-low text-on-surface border border-outline-variant/10 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>

              {/* Render Citations if AI provided them */}
              {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-1 ml-1 flex flex-wrap gap-1">
                  {msg.sources.map((source, sIdx) => (
                    <span key={sIdx} className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                      Ref: {source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-surface-container-low p-3 rounded-2xl rounded-bl-sm flex items-center gap-2 border border-outline-variant/10">
                <Loader2 size={16} className="text-primary animate-spin" />
                <span className="text-xs text-on-surface-variant">Searching transcript...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-surface-container-lowest border-t border-surface-container">
          <div className="relative flex items-center">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !transcriptId}
              className="w-full bg-surface-container-high/30 border border-outline-variant/20 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all disabled:opacity-50" 
              placeholder={transcriptId ? "Ask a question..." : "Loading meeting..."} 
              type="text" 
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim() || !transcriptId}
              className="absolute right-2 p-2 text-white bg-primary rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Floating Toggle Button */}
      <button 
        className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Bot size={28} />}
      </button>
    </div>
  );
}
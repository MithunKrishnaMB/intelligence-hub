import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

export default function MeetingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [meeting, setMeeting] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const defaultChat = [{ role: 'ai', text: "Hi! I've analyzed this meeting. You can ask me anything about the transcript, decisions or action items." }];
    const [chatMessages, setChatMessages] = useState(defaultChat);
    const [chatInput, setChatInput] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);
    const chatScrollRef = useRef(null);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    useEffect(() => {
        if (user && id) {
            fetchMeetingDetails();
            
            // Load chat history from session storage
            const cachedChat = sessionStorage.getItem(`chat_history_${id}`);
            if (cachedChat) {
                setChatMessages(JSON.parse(cachedChat));
            } else {
                setChatMessages(defaultChat);
            }
        }
    }, [user, id]);

    useEffect(() => {
        if (id && chatMessages.length > 1) {
            sessionStorage.setItem(`chat_history_${id}`, JSON.stringify(chatMessages));
        }
    }, [chatMessages, id]);

    const fetchMeetingDetails = async () => {
        setIsLoading(true);
        
        // Check cache first for instant loading
        const cacheKey = `meeting_detail_${id}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            setMeeting(JSON.parse(cachedData));
            setIsLoading(false);
            return; // Exit early if cached
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/transcripts/${id}/details`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMeeting(data);
                // Save to cache for future visits
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
            }
        } catch (err) {
            console.error("Failed to fetch meeting details", err);
        } finally {
            setIsLoading(false);
        }
    };

    const executeDelete = async () => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/transcripts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                navigate('/meetings');
            }
        } catch (err) {
            console.error("Failed to delete meeting", err);
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/transcripts/${id}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error("Export failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = meeting.filename ? `${meeting.filename.replace(/[^a-zA-Z0-9-_\s]/g, '')}.pdf` : `meeting_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to export PDF", err);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || isSendingChat) return;

        const question = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: question }]);
        setIsSendingChat(true);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question, transcript_id: parseInt(id) })
            });
            
            if (response.ok) {
                const data = await response.json();
                setChatMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error." }]);
            }
        } catch (err) {
            console.error("Failed to send chat", err);
            setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error." }]);
        } finally {
            setIsSendingChat(false);
        }
    };

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    if (isLoading) {
        return (
            <Layout>
                <main className="flex-grow py-xl px-margin-mobile md:px-margin-desktop w-full">
                    <div className="mb-3xl animate-pulse">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-lg mb-lg">
                            <div className="w-full max-w-3xl">
                                <div className="h-4 bg-surface-container-high rounded-md w-48 mb-sm"></div>
                                <div className="h-8 bg-surface-container-high rounded-md w-3/4 mb-md"></div>
                                <div className="h-4 bg-surface-container rounded-md w-full mb-2"></div>
                                <div className="h-4 bg-surface-container rounded-md w-5/6"></div>
                            </div>
                            <div className="flex gap-sm shrink-0">
                                <div className="h-9 w-20 bg-surface-container-high rounded-xl"></div>
                                <div className="h-9 w-28 bg-surface-container-high rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter animate-pulse">
                        <div className="lg:col-span-8 bg-surface-container-lowest rounded-[24px] p-xl border border-outline-variant/10 h-72 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
                        </div>
                        <div className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] p-lg border border-outline-variant/10 h-72"></div>
                        <div className="lg:col-span-12 mt-md bg-surface-container-lowest rounded-[24px] p-xl border border-outline-variant/10 h-48"></div>
                        <div className="lg:col-span-12 mt-md h-56 bg-surface-container-lowest rounded-[24px] p-lg border border-outline-variant/10"></div>
                    </div>
                </main>
            </Layout>
        );
    }

    if (!meeting) {
        return (
            <Layout>
                <main className="flex-grow py-xl px-margin-mobile md:px-margin-desktop w-full text-center flex flex-col items-center justify-center min-h-[400px]">
                    <span className="material-symbols-outlined text-outline mb-md" style={{ fontSize: "48px" }}>search_off</span>
                    <h2 className="font-headline-md text-on-surface mb-sm">Meeting not found</h2>
                    <Link to="/" className="text-primary font-body-sm font-semibold hover:underline underline-offset-4 decoration-primary/30">Return to Dashboard</Link>
                </main>
            </Layout>
        );
    }

    const formattedDate = meeting.meeting_date || (meeting.upload_date ? new Date(meeting.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date');

    return (
        <Layout>
            <main className="flex-grow py-xl px-margin-mobile md:px-margin-desktop w-full" id="sentiment-export-target">
                <div className="mb-3xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-lg mb-lg">
                        <div className="max-w-3xl">
                            <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold mb-md">{meeting.filename}</h1>
                            <div className="flex flex-wrap items-center gap-md mb-md text-secondary font-body-sm">
                                <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {formattedDate}</span>
                                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                {meeting.duration && (
                                    <>
                                        <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">schedule</span> {meeting.duration}</span>
                                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                    </>
                                )}
                                <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">description</span> {meeting.word_count || 0} words</span>
                            </div>
                            <p className="font-body-lg text-on-surface-variant" style={{ fontWeight: 300 }}>
                                {meeting.summary || "No summary available."}
                            </p>
                        </div>
                        <div className="flex items-center gap-sm shrink-0">
                            <button onClick={() => setIsDeleteModalOpen(true)} className="px-md py-sm rounded-xl border border-outline-variant/20 text-secondary font-body-sm flex items-center gap-sm hover:bg-error/5 hover:text-error hover:border-error/20 transition-all duration-300">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Delete
                            </button>
                            <button 
                                onClick={handleExportPdf}
                                disabled={isExporting}
                                className="px-lg py-sm rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-body-sm font-semibold flex items-center gap-sm shadow-[0_4px_14px_rgba(0,68,150,0.25)] hover:shadow-[0_6px_20px_rgba(0,68,150,0.35)] hover:-translate-y-[1px] transition-all duration-300 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0"
                            >
                                {isExporting ? (
                                    <>
                                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                        Export PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    <div className="lg:col-span-8 bg-surface-container-lowest rounded-[24px] p-lg md:p-xl soft-shadow card-hover border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-xl">
                            <h2 className="font-headline-md text-on-surface">Sentiment Overview</h2>
                            <div className="px-md py-xs rounded-full bg-surface-container flex items-center gap-sm">
                                <span className={`w-2 h-2 rounded-full ${meeting.overall_sentiment_score >= 70 ? 'bg-[#10B981]' : meeting.overall_sentiment_score >= 40 ? 'bg-yellow-500' : 'bg-[#EF4444]'}`}></span>
                                <span className="font-label-caps text-secondary uppercase">OVERALL SCORE ({meeting.overall_sentiment_score || 0}%)</span>
                            </div>
                        </div>

                        <div className="h-48 flex items-end justify-between gap-1 mb-md relative">
                            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-secondary font-label-caps text-[10px] opacity-40 -ml-2">
                                <span>+1.0</span>
                                <span>0.0</span>
                                <span>-1.0</span>
                            </div>

                            <div className="absolute left-6 right-0 top-1/2 h-px bg-outline-variant/15 -translate-y-1/2"></div>

                            <div className="ml-6 w-full flex items-end justify-between gap-[2px] h-full pt-4">
                                {/* Use real segments if they exist, otherwise placeholder for visual */}
                                {meeting.segments && meeting.segments.length > 0 ? (
                                    meeting.segments.map((seg, idx) => {
                                        const isPositive = seg.vibe === 'agreement' || seg.vibe === 'enthusiasm';
                                        const isNegative = seg.vibe === 'conflict' || seg.vibe === 'frustration';
                                        
                                        // Varied heights for visual interest even within the same vibe category
                                        const baseHeight = isPositive ? 70 : isNegative ? 40 : 50;
                                        // Just add a small pseudo-random variation based on index to make it look like a real chart
                                        const variation = (idx % 3) * 10 - 10; 
                                        const h = `${baseHeight + variation}%`;
                                        
                                        const bg = isPositive ? 'bg-[#10B981]/50' : isNegative ? 'bg-[#EF4444]/50' : 'bg-surface-variant';
                                        const transform = isNegative ? 'translate-y-full rounded-b-sm' : 'rounded-t-sm';
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`w-full ${bg} ${transform} transition-all duration-500`} 
                                                style={{ height: h }}
                                                title={`${seg.topic} (${seg.vibe})`}
                                            ></div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full text-center text-secondary self-center font-body-sm">No segment data</div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between text-secondary font-label-caps opacity-50 ml-6">
                            <span>Start</span>
                            <span>Mid</span>
                            <span>End</span>
                        </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-gutter">
                        <div className="flex-1 bg-surface-container-lowest rounded-[24px] p-lg soft-shadow flex flex-col justify-center items-center text-center border border-outline-variant/10">
                            {(() => {
                                const score = meeting.overall_sentiment_score || 0;
                                let color = "text-yellow-600";
                                let icon = "horizontal_rule";
                                if (score >= 70) {
                                    color = "text-[#10B981]";
                                    icon = "trending_up";
                                } else if (score < 40) {
                                    color = "text-[#EF4444]";
                                    icon = "trending_down";
                                }
                                return (
                                    <>
                                        <h3 className="font-label-caps text-secondary mb-lg tracking-widest uppercase">OVERALL SENTIMENT SCORE</h3>
                                        <div className={`flex items-center justify-center gap-sm ${color} mb-md`}>
                                            <div className="text-[64px] leading-none font-bold tracking-tighter flex items-baseline">
                                                {score}<span className="text-[28px] ml-1 font-medium">%</span>
                                            </div>
                                            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'wght' 600" }}>{icon}</span>
                                        </div>
                                        <p className="font-body-sm text-on-surface-variant max-w-[260px] leading-relaxed italic" style={{ fontWeight: 300 }}>
                                            "{meeting.sentiment_comment || 'General discussion.'}"
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="lg:col-span-12 mt-md bg-surface-container-lowest rounded-[24px] p-lg md:p-xl soft-shadow border border-outline-variant/10">
                        <h2 className="font-headline-md text-on-surface mb-xl">Decisions Made</h2>
                        <div className="flex flex-col gap-sm">
                            {meeting.decisions && meeting.decisions.length > 0 ? (
                                meeting.decisions.map((decision, idx) => (
                                    <React.Fragment key={decision.id}>
                                        <div className="flex items-start gap-md p-md rounded-xl hover:bg-surface-container-low transition-colors duration-200 group">
                                            <div className="w-9 h-9 rounded-full bg-primary/8 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                                                <span className="material-symbols-outlined text-[18px]">gavel</span>
                                            </div>
                                            <div>
                                                <h4 className="font-headline-sm text-on-surface mb-xs text-[16px]">Decision #{idx + 1}</h4>
                                                <p className="font-body-sm text-on-surface-variant">{decision.content}</p>
                                            </div>
                                        </div>
                                        {idx < meeting.decisions.length - 1 && <div className="w-full h-px bg-outline-variant/8"></div>}
                                    </React.Fragment>
                                ))
                            ) : (
                                <div className="text-secondary p-md font-body-sm">No decisions extracted.</div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-12 mt-md">
                        <h2 className="font-headline-md text-on-surface mb-lg">Action Items</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                            {meeting.action_items && meeting.action_items.length > 0 ? (
                                meeting.action_items.map((action) => (
                                    <div key={action.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 hover:border-primary/20 soft-shadow card-hover flex flex-col h-full group">
                                        <div className="flex justify-between items-start mb-md">
                                            <span className="px-sm py-xs rounded-md bg-surface-container text-secondary font-label-caps uppercase text-[10px]">Action Item</span>
                                            <button className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[16px]">more_horiz</span></button>
                                        </div>
                                        <p className="font-body-base text-on-surface mb-xl flex-grow">{action.task}</p>
                                        <div className="flex items-center gap-sm mt-auto pt-sm border-t border-outline-variant/8">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-label-caps text-[9px]">{getInitials(action.owner)}</div>
                                            <span className="font-body-sm text-secondary text-[12px]">{action.owner || 'Unknown'}</span>
                                            {action.due_date && action.due_date !== 'Not specified' && (
                                                <span className="font-body-sm text-secondary text-[12px] ml-auto">{action.due_date}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-secondary col-span-full font-body-sm">No action items extracted.</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-20 right-lg md:bottom-24 md:right-2xl z-50 flex flex-col items-end">
                <div
                    className={`mb-md w-[340px] md:w-[380px] h-[480px] glass-panel rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden origin-bottom-right transition-all duration-300 ${isChatOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-10 opacity-0 pointer-events-none hidden'}`}
                    id="ai-chat-modal"
                    style={{ display: isChatOpen ? 'flex' : 'none' }}
                >
                    <div className="p-md bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/8 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-sm">
                            <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                            <span className="font-headline-sm text-on-surface text-[16px]">Serene AI</span>
                        </div>
                        <button
                            className="text-secondary hover:text-on-surface transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                            onClick={toggleChat}
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>

                    <div className="flex-grow p-md overflow-y-auto chat-scroll flex flex-col gap-md bg-surface-container-lowest/50" ref={chatScrollRef}>
                        {chatMessages.map((msg, index) => (
                            <div key={index} className={`flex gap-sm ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {msg.role === 'ai' && (
                                    <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-1">
                                        <span className="material-symbols-outlined text-primary text-[14px]">auto_awesome</span>
                                    </div>
                                )}
                                <div className={`${msg.role === 'user' ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-low text-on-surface rounded-tl-none'} rounded-2xl p-sm px-md text-body-sm shadow-sm msg-enter max-w-[85%]`}>
                                    {msg.role === 'ai' ? (
                                        <div className="markdown-content">
                                            <ReactMarkdown>
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}
                        {isSendingChat && (
                            <div className="flex gap-sm">
                                <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-1">
                                    <span className="material-symbols-outlined text-primary text-[14px]">auto_awesome</span>
                                </div>
                                <div className="bg-surface-container-low rounded-2xl rounded-tl-none p-sm px-md text-body-sm text-on-surface msg-enter flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce" style={{animationDelay: '0.15s'}}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce" style={{animationDelay: '0.3s'}}></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form className="p-sm bg-surface-container-lowest border-t border-outline-variant/8 shrink-0" onSubmit={handleSendMessage}>
                        <div className="relative flex items-center">
                            <input 
                                className="w-full bg-surface-container-low rounded-xl py-sm pl-md pr-12 text-body-sm input-glow disabled:opacity-50" 
                                placeholder="Ask Serene AI..." 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                disabled={isSendingChat}
                            />
                            <button 
                                type="submit"
                                disabled={!chatInput.trim() || isSendingChat}
                                className="absolute right-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-container transition-colors disabled:opacity-40 disabled:hover:bg-primary"
                            >
                                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                            </button>
                        </div>
                    </form>
                </div>

                <button
                    className="w-12 h-12 rounded-full bg-primary shadow-[0_8px_30px_rgba(0,68,150,0.25)] flex items-center justify-center text-white hover:scale-105 hover:shadow-[0_12px_40px_rgba(0,68,150,0.35)] transition-all duration-300 ambient-glow group"
                    id="chat-fab"
                    onClick={toggleChat}
                >
                    <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${isChatOpen ? 'rotate-180' : 'group-hover:rotate-12'}`}>
                        {isChatOpen ? 'keyboard_arrow_down' : 'chat'}
                    </span>
                </button>
            </div>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
                    <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm p-xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-outline-variant/10 fade-in">
                        <div className="flex items-center gap-md mb-lg">
                            <div className="w-11 h-11 rounded-full bg-error/8 text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[22px]">warning</span>
                            </div>
                            <h2 className="font-headline-sm text-on-surface">Delete Meeting</h2>
                        </div>
                        <p className="font-body-base text-on-surface-variant mb-xl">
                            Are you sure you want to delete this meeting permanently? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-sm">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="px-lg py-sm rounded-xl border border-outline-variant/20 text-secondary font-body-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeDelete}
                                disabled={isDeleting}
                                className="px-lg py-sm rounded-xl bg-error text-white font-body-sm font-semibold flex items-center gap-sm hover:bg-[#a01616] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Permanently'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

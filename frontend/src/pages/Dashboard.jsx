import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [queuedFiles, setQueuedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [meetings, setMeetings] = useState(() => {
        const cached = sessionStorage.getItem('dashboard_meetings');
        return cached ? JSON.parse(cached) : [];
    });
    const [isLoadingMeetings, setIsLoadingMeetings] = useState(() => {
        return !sessionStorage.getItem('dashboard_meetings');
    });
    const fileInputRef = useRef(null);

    const fetchDashboard = async () => {
        if (!sessionStorage.getItem('dashboard_meetings')) {
            setIsLoadingMeetings(true);
        }
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://intelligence-hub.onrender.com'}/dashboard/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMeetings(data);
                sessionStorage.setItem('dashboard_meetings', JSON.stringify(data));
            }
        } catch (err) {
            console.error("Failed to fetch dashboard", err);
        } finally {
            setIsLoadingMeetings(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDashboard();
        }
    }, [user]);

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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files) => {
        const validExtensions = ['.txt', '.vtt'];
        const newFiles = Array.from(files).filter(file => {
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            return validExtensions.includes(ext) && !queuedFiles.some(f => f.name === file.name);
        });
        
        if (newFiles.length > 0) {
            setQueuedFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index) => {
        setQueuedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const processTranscripts = async () => {
        if (queuedFiles.length === 0) return;
        
        setIsProcessing(true);
        setProgressText("Uploading files...");
        setProgressPercent(20);
        
        try {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            queuedFiles.forEach(file => {
                formData.append('files', file);
            });
            
            const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://intelligence-hub.onrender.com'}/upload/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!uploadRes.ok) throw new Error('Upload failed');
            const uploadData = await uploadRes.json();
            
            setProgressText("Running analysis...");
            setProgressPercent(60);
            
            for (const summary of uploadData.summaries) {
                const processRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://intelligence-hub.onrender.com'}/transcripts/${summary.transcript_id}/process`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!processRes.ok) console.error("Process failed for", summary.transcript_id);
            }
            
            setProgressText("Updating dashboard...");
            setProgressPercent(90);
            
            await fetchDashboard();
            
            setProgressText("Complete");
            setProgressPercent(100);
            
            setTimeout(() => {
                setIsProcessing(false);
                setProgressPercent(0);
                setProgressText('');
                setQueuedFiles([]);
            }, 1000);
            
        } catch (err) {
            console.error("Failed to process transcripts", err);
            setProgressText('Error processing files.');
            setTimeout(() => {
                setIsProcessing(false);
                setProgressPercent(0);
                setProgressText('');
            }, 2000);
        }
    };

    return (
        <Layout>
            <main className="flex-grow py-xl px-margin-mobile md:px-margin-desktop w-full flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start h-full">
                    <div className="lg:col-span-5 flex flex-col gap-xl">
                        <section>
                            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-xs">Your Meetings</h1>
                            <p className="font-body-lg text-body-lg text-secondary">Upload transcripts or review recent AI-distilled insights to maintain actionable clarity.</p>
                        </section>
                        <div className="bg-surface-container-lowest rounded-xl p-lg md:p-xl soft-shadow border border-outline-variant/10">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">Upload Transcripts</h2>
                            
                            <div 
                                className={`border border-dashed rounded-xl p-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[180px] mb-lg relative ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-outline-variant/30 hover:border-outline hover:bg-surface-container-low'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input 
                                    accept=".txt,.vtt" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                    multiple 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileInputChange}
                                    disabled={isProcessing}
                                />
                                <span className="material-symbols-outlined text-outline mb-sm" style={{ fontSize: "28px" }}>cloud_upload</span>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">Drag & Drop files here</p>
                                <p className="font-body-sm text-body-sm text-outline mt-xs text-[12px]">Supports .txt and .vtt only</p>
                            </div>

                            <ul className={`flex flex-col gap-xs mb-lg max-h-[150px] overflow-y-auto pr-sm ${queuedFiles.length === 0 ? 'hidden' : ''}`}>
                                {queuedFiles.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between bg-surface-container-low p-sm px-md rounded-lg border border-outline-variant/10 text-body-sm font-body-sm group hover:bg-surface-container-high transition-colors">
                                        <div className="flex items-center gap-sm overflow-hidden">
                                            <span className="material-symbols-outlined text-secondary" style={{ fontSize: "16px" }}>description</span>
                                            <span className="text-on-surface truncate max-w-[150px]" title={file.name}>{file.name}</span>
                                            <span className="text-outline text-[10px] ml-1">({(file.size / 1024).toFixed(1)}kb)</span>
                                        </div>
                                        <button 
                                            className="text-outline hover:text-error transition-colors p-1 rounded-full hover:bg-error-container opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center" 
                                            onClick={() => removeFile(index)}
                                            disabled={isProcessing}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-md">
                                <button 
                                    className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-md px-lg rounded-xl font-body-sm text-body-sm font-semibold shadow-[0_4px_14px_rgba(0,68,150,0.25)] hover:shadow-[0_6px_20px_rgba(0,68,150,0.35)] hover:-translate-y-[1px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none flex justify-center items-center gap-sm" 
                                    disabled={queuedFiles.length === 0 || isProcessing}
                                    onClick={processTranscripts}
                                >
                                    Process Transcripts
                                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </button>

                                <div className={`flex-col gap-xs mt-sm ${isProcessing ? 'flex' : 'hidden'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">{progressText}</span>
                                        <span className="font-label-caps text-label-caps text-primary">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-500 ease-out rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col gap-md">
                        <div className="flex items-center justify-between mb-xs">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Activity</h2>
                        </div>

                        <div className="flex flex-col gap-md">
                            {isLoadingMeetings ? (
                                <>
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="pulse-skeleton bg-surface-container-lowest rounded-xl p-lg soft-shadow border border-outline-variant/10 flex flex-col gap-md" style={{ animationDelay: `${i * 0.15}s` }}>
                                            <div className="flex justify-between items-start">
                                                <div className={`h-5 bg-surface-container-high rounded-md ${i === 0 ? 'w-3/4' : i === 1 ? 'w-2/3' : 'w-4/5'}`}></div>
                                                <div className="h-4 bg-surface-container-high rounded-md w-16"></div>
                                            </div>
                                            <div className="flex gap-sm mt-xs">
                                                <div className="h-7 bg-surface-container rounded-md w-20"></div>
                                                <div className="h-7 bg-surface-container rounded-md w-24"></div>
                                                {i !== 1 && <div className="h-7 bg-surface-container rounded-md w-20"></div>}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                meetings.slice(0, 3).map(meeting => {
                                    let sentimentColor = "text-secondary";
                                    let sentimentIcon = "horizontal_rule";
                                    const score = meeting.sentiment || 0;
                                    
                                    if (score <= 50) {
                                        sentimentColor = "text-[#EF4444]";
                                        sentimentIcon = "trending_down";
                                    } else if (score <= 70) {
                                        sentimentColor = "text-yellow-600";
                                        sentimentIcon = "horizontal_rule";
                                    } else {
                                        sentimentColor = "text-[#10B981]";
                                        sentimentIcon = "trending_up";
                                    }
                                    
                                    const formattedDate = meeting.date 
                                        ? new Date(meeting.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                                        : "Unknown Date";

                                    return (
                                        <Link to={`/meeting/${meeting.id}`} key={meeting.id} className="bg-surface-container-lowest rounded-xl p-lg soft-shadow border border-outline-variant/10 card-hover flex flex-col gap-md group cursor-pointer block">
                                            <div className="flex justify-between items-start gap-md">
                                                <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2">{meeting.title}</h3>
                                                <span className="font-label-caps text-label-caps text-secondary whitespace-nowrap bg-surface-container px-sm py-xs rounded-md">{formattedDate}</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-sm mt-auto pt-sm border-t border-outline-variant/8">
                                                <div className="flex items-center gap-xs px-sm py-xs bg-surface-container-low rounded-md">
                                                    <span className="material-symbols-outlined text-[14px] text-secondary">description</span>
                                                    <span className="font-body-sm text-body-sm text-on-surface-variant">{meeting.transcripts}</span>
                                                </div>
                                                <div className="flex items-center gap-xs px-sm py-xs bg-surface-container-low rounded-md">
                                                    <span className="material-symbols-outlined text-[14px] text-tertiary-container">task_alt</span>
                                                    <span className="font-body-sm text-body-sm text-on-surface-variant">{meeting.actions} Actions</span>
                                                </div>
                                                <div className="flex items-center gap-xs px-sm py-xs bg-surface-container-low rounded-md">
                                                    <span className="material-symbols-outlined text-[14px] text-primary">lightbulb</span>
                                                    <span className="font-body-sm text-body-sm text-on-surface-variant">{meeting.decisions} Decisions</span>
                                                </div>
                                                <div className={`flex items-center gap-xs ml-auto font-bold tracking-tight ${sentimentColor}`}>
                                                    <span className="text-body-base font-bold">{score}%</span>
                                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 600" }}>{sentimentIcon}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                            
                            {!isLoadingMeetings && meetings.length === 0 && (
                                <div className="bg-surface-container-lowest rounded-xl p-2xl soft-shadow border border-outline-variant/10 text-center flex flex-col items-center justify-center min-h-[240px]">
                                    <span className="material-symbols-outlined text-outline mb-lg" style={{ fontSize: "48px" }}>inbox</span>
                                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">No transcripts uploaded.</h3>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">Your processed meeting insights will appear here once you upload a file.</p>
                                </div>
                            )}
                            
                            {!isLoadingMeetings && meetings.length > 0 && (
                                <div className="mt-xs flex justify-center">
                                    <Link to="/meetings" className="font-body-sm text-body-sm text-primary hover:underline underline-offset-4 decoration-primary/30 font-medium transition-colors">
                                        Show all
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
}

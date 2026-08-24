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
            const response = await fetch('http://localhost:8000/dashboard/', {
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
            
            const uploadRes = await fetch('http://localhost:8000/upload/', {
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
                const processRes = await fetch(`http://localhost:8000/transcripts/${summary.transcript_id}/process`, {
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
                            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-sm font-headline-lg">Your Meetings</h1>
                            <p className="font-body-lg text-body-lg text-secondary">Upload transcripts or review recent AI-distilled insights to maintain actionable clarity.</p>
                        </section>
                        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/10">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">Upload Transcripts</h2>
                            
                            <div 
                                className={`border border-dashed rounded-xl p-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[200px] mb-lg relative ${isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/50 hover:border-primary bg-surface-container-low'}`}
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
                                <span className="material-symbols-outlined text-secondary mb-sm" style={{ fontSize: "32px" }}>cloud_upload</span>
                                <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">Drag & Drop files here</p>
                                <p className="font-body-sm text-body-sm text-secondary mt-xs text-xs">Supports .txt and .vtt only</p>
                            </div>

                            <ul className={`flex flex-col gap-sm mb-lg max-h-[150px] overflow-y-auto pr-sm ${queuedFiles.length === 0 ? 'hidden' : ''}`}>
                                {queuedFiles.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between bg-surface p-sm rounded-lg border border-outline-variant/10 text-body-sm font-body-sm group hover:bg-surface-container-high transition-colors">
                                        <div className="flex items-center gap-sm overflow-hidden">
                                            <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>description</span>
                                            <span className="text-on-surface truncate max-w-[150px]" title={file.name}>{file.name}</span>
                                            <span className="text-secondary text-[10px] ml-1">({(file.size / 1024).toFixed(1)}kb)</span>
                                        </div>
                                        <button 
                                            className="text-secondary hover:text-error transition-colors p-1 rounded-full hover:bg-error-container opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center" 
                                            onClick={() => removeFile(index)}
                                            disabled={isProcessing}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-md">
                                <button 
                                    className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-md px-lg rounded-xl font-body-sm text-body-sm shadow-[0_4px_14px_0_rgba(0,91,196,0.39)] hover:shadow-[0_6px_20px_rgba(0,91,196,0.23)] hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none flex justify-center items-center gap-sm" 
                                    disabled={queuedFiles.length === 0 || isProcessing}
                                    onClick={processTranscripts}
                                >
                                    Process Transcripts
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </button>

                                <div className={`flex-col gap-xs mt-sm ${isProcessing ? 'flex' : 'hidden'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">{progressText}</span>
                                        <span className="font-label-caps text-label-caps text-primary">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-300 ease-out rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col gap-lg">
                        <div className="flex items-center justify-between mb-md">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Activity</h2>
                        </div>

                        <div className="flex flex-col gap-md">
                            {isLoadingMeetings ? (
                                <>
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="pulse-skeleton bg-surface-container-lowest rounded-xl p-lg shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/10 flex flex-col gap-md" style={{ animationDelay: `${i * 0.1}s` }}>
                                            <div className="flex justify-between items-start">
                                                <div className={`h-6 bg-surface-container-high rounded ${i === 0 ? 'w-3/4' : i === 1 ? 'w-2/3' : 'w-4/5'}`}></div>
                                                <div className="h-4 bg-surface-container-high rounded w-16"></div>
                                            </div>
                                            <div className="flex gap-md mt-sm">
                                                <div className="h-8 bg-surface-container-highest rounded w-20"></div>
                                                <div className="h-8 bg-surface-container-highest rounded w-24"></div>
                                                {i !== 1 && <div className="h-8 bg-surface-container-highest rounded w-20"></div>}
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
                                        sentimentColor = "text-red-700";
                                        sentimentIcon = "trending_down";
                                    } else if (score <= 70) {
                                        sentimentColor = "text-yellow-600";
                                        sentimentIcon = "horizontal_rule";
                                    } else {
                                        sentimentColor = "text-[#107050]";
                                        sentimentIcon = "trending_up";
                                    }
                                    
                                    const formattedDate = meeting.date 
                                        ? new Date(meeting.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                                        : "Unknown Date";

                                    return (
                                        <Link to={`/meeting/${meeting.id}`} key={meeting.id} className="bg-surface-container-lowest rounded-xl p-lg shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/10 hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col gap-md group cursor-pointer block">
                                            <div className="flex justify-between items-start gap-md">
                                                <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2">{meeting.title}</h3>
                                                <span className="font-label-caps text-label-caps text-secondary whitespace-nowrap bg-surface-container-high px-2 py-1 rounded">{formattedDate}</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-sm mt-auto pt-sm border-t border-outline-variant/10">
                                                <div className="flex items-center gap-xs px-2 py-1 bg-surface rounded-md border border-outline-variant/20">
                                                    <span className="material-symbols-outlined text-[16px] text-secondary">description</span>
                                                    <span className="font-body-sm text-body-sm text-on-surface-variant">{meeting.transcripts}</span>
                                                </div>
                                                <div className="flex items-center gap-xs px-2 py-1 bg-surface rounded-md border border-outline-variant/20">
                                                    <span className="material-symbols-outlined text-[16px] text-tertiary-container">task_alt</span>
                                                    <span className="font-body-sm text-body-sm text-on-surface-variant">{meeting.actions} Actions</span>
                                                </div>
                                                <div className="flex items-center gap-xs px-2 py-1 bg-surface rounded-md border border-outline-variant/20">
                                                    <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                                                    <span className="font-body-sm text-body-sm text-on-surface-variant">{meeting.decisions} Decisions</span>
                                                </div>
                                                <div className={`flex items-center gap-xs ml-auto font-bold tracking-tight ${sentimentColor}`}>
                                                    <span className="text-title-md">{score}%</span>
                                                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 700" }}>{sentimentIcon}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                            
                            {!isLoadingMeetings && meetings.length === 0 && (
                                <div className="bg-surface-container-lowest rounded-xl p-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/10 text-center flex flex-col items-center justify-center min-h-[200px]">
                                    <span className="material-symbols-outlined text-secondary mb-md" style={{ fontSize: "40px" }}>inbox</span>
                                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs font-bold">No transcripts uploaded.</h3>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[250px]">Your processed meeting insights will appear here once you upload a file.</p>
                                </div>
                            )}
                            
                            {!isLoadingMeetings && meetings.length > 0 && (
                                <div className="mt-sm flex justify-center">
                                    <Link to="/meetings" className="font-body-sm text-body-sm text-primary hover:underline underline-offset-4 decoration-primary/30 font-medium transition-colors hover:text-primary-container">
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

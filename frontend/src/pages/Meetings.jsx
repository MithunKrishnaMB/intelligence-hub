import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Meetings() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState(() => {
        const cached = sessionStorage.getItem('dashboard_meetings');
        return cached ? JSON.parse(cached) : [];
    });
    const [isLoadingMeetings, setIsLoadingMeetings] = useState(() => {
        return !sessionStorage.getItem('dashboard_meetings');
    });

    const fetchMeetings = async () => {
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
            console.error("Failed to fetch meetings", err);
        } finally {
            setIsLoadingMeetings(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMeetings();
        }
    }, [user]);

    return (
        <Layout>
            <main className="flex-grow py-xl px-margin-mobile md:px-margin-desktop w-full flex flex-col">
                <div className="mb-xl">
                    <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-xs">All Meetings</h1>
                    <p className="font-body-lg text-body-lg text-secondary">Review all your processed meeting transcripts and their insights.</p>
                </div>

                <div className="flex flex-col gap-md">
                    {isLoadingMeetings ? (
                        <>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="pulse-skeleton bg-surface-container-lowest rounded-xl p-lg soft-shadow border border-outline-variant/10 flex flex-col gap-md" style={{ animationDelay: `${i * 0.15}s` }}>
                                    <div className="flex justify-between items-start">
                                        <div className={`h-5 bg-surface-container-high rounded-md ${i === 0 ? 'w-1/2' : i === 1 ? 'w-2/3' : 'w-1/3'}`}></div>
                                        <div className="h-4 bg-surface-container-high rounded-md w-24"></div>
                                    </div>
                                    <div className="h-10 bg-surface-container rounded-md w-full mt-xs"></div>
                                    <div className="flex gap-sm mt-xs">
                                        <div className="h-7 bg-surface-container rounded-md w-20"></div>
                                        <div className="h-7 bg-surface-container rounded-md w-24"></div>
                                        {i !== 1 && <div className="h-7 bg-surface-container rounded-md w-20"></div>}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        meetings.length === 0 ? (
                            <div className="bg-surface-container-lowest rounded-xl p-2xl soft-shadow border border-outline-variant/10 text-center flex flex-col items-center justify-center min-h-[300px]">
                                <span className="material-symbols-outlined text-outline mb-lg" style={{ fontSize: "48px" }}>inbox</span>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">No transcripts uploaded.</h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px] mb-lg">Upload files in the dashboard to see them here.</p>
                                <Link to="/" className="px-xl py-sm rounded-xl bg-primary text-white font-body-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all">Go to Dashboard</Link>
                            </div>
                        ) : (
                            meetings.map(meeting => {
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
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-md">
                                            <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">{meeting.title}</h3>
                                            <span className="font-label-caps text-label-caps text-secondary whitespace-nowrap bg-surface-container px-sm py-xs rounded-md shrink-0">{formattedDate}</span>
                                        </div>
                                        
                                        {meeting.summary && (
                                            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 md:line-clamp-3" style={{ fontWeight: 300 }}>
                                                {meeting.summary}
                                            </p>
                                        )}
                                        
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
                        )
                    )}
                </div>
            </main>
        </Layout>
    );
}

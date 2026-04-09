import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import UploadSection from '../components/dashboard/UploadSection';
import MeetingRow from '../components/dashboard/MeetingRow';

export default function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from FastAPI
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/dashboard/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run once when the component mounts
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-surface text-on-surface">
      <Header />
      <main className="flex-grow pt-24 pb-12 px-6 md:px-8 w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Atmospheric Precision</h1>
          <p className="text-on-surface-variant text-lg">Curation of your organizational intelligence.</p>
        </div>
        
        {/* Pass the fetch function as a prop so we can refresh the list after a new upload */}
        <UploadSection onUploadComplete={fetchDashboardData} />
        
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Recent Meetings</h3>
            <button className="text-primary font-semibold text-sm hover:underline border-none bg-transparent">View Archive</button>
          </div>
          <div className="grid gap-4">
            {isLoading ? (
              <p className="text-slate-500">Loading intelligence...</p>
            ) : meetings.length === 0 ? (
              <p className="text-slate-500">No transcripts uploaded yet.</p>
            ) : (
              meetings.map(meeting => (
                <MeetingRow key={meeting.id} meeting={meeting} />
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
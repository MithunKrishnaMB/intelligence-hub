import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteMeeting({ transcriptId }) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // 1. Safety check to prevent accidental clicks
    const confirmed = window.confirm("Are you sure you want to delete this meeting? This action cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    const token = localStorage.getItem("token");

    try {
      // 2. Call our new backend DELETE route
      const response = await fetch(`http://127.0.0.1:8000/transcripts/${transcriptId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete the meeting");
      }

      // 3. Success! Redirect the user back to the dashboard
      // Note: Adjust "/dashboard" if your main route is just "/"
      navigate("/dashboard"); 

    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete the meeting. Please try again.");
      setIsDeleting(false); // Only stop loading if it failed (if it succeeds, we navigate away)
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg font-medium transition-colors border border-red-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      <span className="text-sm">{isDeleting ? "Deleting..." : "Delete Meeting"}</span>
    </button>
  );
}   
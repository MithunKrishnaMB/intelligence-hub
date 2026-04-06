import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, UserCircle, LogOut } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({ name: "Loading...", email: "" });

  const isAuthenticated = !!localStorage.getItem("token");

  // Fetch the current user's info when the Header loads
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch("http://127.0.0.1:8000/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser({ name: data.name, email: data.email }); // Save both!
        }
      } catch (error) {
        console.error("Failed to fetch user context", error);
      }
    };
    fetchUser();
  }, []);

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout Logic
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
      <div className="flex justify-between items-center h-16 px-6 md:px-8 w-full">
        
        {/* Left Side: Brand Logo */}
        <Link to="/" className="active:scale-95 cursor-pointer transition-transform text-lg font-bold text-on-surface tracking-tighter flex items-center gap-2 font-['Inter'] antialiased">
          <Activity className="text-primary w-6 h-6" />
          <span>INTELLIGENCE HUB</span>
        </Link>

        {/* Right Side: User Profile Menu */}
        {isAuthenticated && (
          <div className="relative" ref={dropdownRef}>
            {/* Avatar Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 border border-transparent hover:border-outline-variant/20"
            >
              <UserCircle className="text-slate-500 hover:text-primary transition-colors w-7 h-7" />
            </button>

            {/* Floating Dropdown */}
            {isOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-surface-container-lowest backdrop-blur-2xl rounded-2xl shadow-[0_30px_60px_-12px_rgba(44,52,55,0.15)] border border-outline-variant/20 flex flex-col overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                
                {/* Identity Section */}
                <div className="px-5 py-4 border-b border-surface-container bg-surface-container-low/30">
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-on-surface-variant/70 mb-1">
                    Active Session
                  </p>
                  <p className="text-base font-bold text-on-surface truncate">
                    {user.name} {/* Real Name! */}
                  </p>
                  <p className="text-xs font-medium text-on-surface-variant truncate mt-0.5">
                    {user.email} {/* Real Email! */}
                  </p>
                </div>

                {/* Action Section */}
                <div className="p-2">
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-error hover:bg-error-container/20 rounded-xl transition-colors w-full text-left"
                  >
                    <LogOut size={18} className="text-error" />
                    Initiate Logout
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
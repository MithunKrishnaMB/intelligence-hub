import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <header className="bg-surface/95 dark:bg-surface/95 backdrop-blur-xl font-body-base text-body-base shrink-0 w-full z-40 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative">
                <div className="flex items-center gap-xl border-none">
                    <Link to="/" className="font-headline-lg text-headline-lg font-extrabold text-primary dark:text-inverse-primary tracking-tighter">Intelligence Hub</Link>
                    <nav className="hidden md:flex items-center gap-lg h-full">
                        <Link
                            className={`transition-all duration-300 h-full flex items-center mt-[2px] ${location.pathname === '/' ? 'text-primary dark:text-inverse-primary border-b-2 border-primary dark:border-inverse-primary pb-1 font-bold' : 'text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary hover:bg-primary/5 dark:hover:bg-primary/10 px-md py-sm rounded-lg'}`}
                            to="/">Dashboard
                        </Link>
                        <Link
                            className={`transition-all duration-300 h-full flex items-center mt-[2px] ${location.pathname === '/meetings' ? 'text-primary dark:text-inverse-primary border-b-2 border-primary dark:border-inverse-primary pb-1 font-bold' : 'text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary hover:bg-primary/5 dark:hover:bg-primary/10 px-md py-sm rounded-lg'}`}
                            to="/meetings">Meetings
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-md relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/10"
                    >
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500", fontSize: '28px' }}>account_circle</span>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-16 right-0 mt-2 min-w-[18rem] bg-surface-container-lowest rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-outline-variant/10 overflow-hidden z-50">
                            <div className="p-lg pb-md break-words">
                                <p className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-md opacity-80">ACTIVE SESSION</p>
                                <p className="text-[22px] font-bold text-on-surface leading-tight mb-1">{user?.name || 'A1B2C3'}</p>
                                <p className="text-[14px] text-secondary">{user?.email || 'user@example.com'}</p>
                            </div>
                            <div className="w-full h-px bg-outline-variant/20 my-xs"></div>
                            <div className="px-md pb-md pt-sm">
                                <button 
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setIsLogoutModalOpen(true);
                                    }}
                                    className="w-full text-left py-md px-sm rounded-xl text-[#93000A] hover:bg-error/5 transition-colors font-body-base font-semibold flex items-center gap-md"
                                >
                                    <span className="material-symbols-outlined text-[24px]">logout</span>
                                    Initiate Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-xl shadow-lg border border-outline-variant/20">
                        <div className="flex items-center gap-md mb-md">
                            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">logout</span>
                            </div>
                            <h2 className="font-headline-sm text-on-surface">Log Out</h2>
                        </div>
                        <p className="font-body-base text-on-surface-variant mb-xl">
                            Are you sure you want to log out of your session?
                        </p>
                        <div className="flex justify-end gap-md">
                            <button 
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="px-lg py-sm rounded-lg border border-outline-variant/30 text-secondary font-body-sm hover:bg-surface-container transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="px-lg py-sm rounded-lg bg-error text-white font-body-sm font-semibold flex items-center gap-sm hover:bg-[#a01616] transition-colors shadow-sm"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

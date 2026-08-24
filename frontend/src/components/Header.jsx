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

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <header className="sticky top-0 bg-surface/90 backdrop-blur-xl font-body-base text-body-base shrink-0 w-full z-40 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 border-b border-outline-variant/10">
                <div className="flex items-center gap-xl">
                    <Link to="/" className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">Intelligence Hub</Link>
                    <nav className="hidden md:flex items-center gap-xs">
                        <Link
                            className={`px-md py-sm rounded-xl font-body-sm text-body-sm transition-all duration-300 ${isActive('/') ? 'bg-primary/8 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
                            to="/">Dashboard
                        </Link>
                        <Link
                            className={`px-md py-sm rounded-xl font-body-sm text-body-sm transition-all duration-300 ${isActive('/meetings') ? 'bg-primary/8 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
                            to="/meetings">Meetings
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-md relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/10"
                    >
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500", fontSize: '24px' }}>account_circle</span>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-14 right-0 min-w-[17rem] bg-surface-container-lowest rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-outline-variant/10 overflow-hidden z-50 fade-in">
                            <div className="p-lg pb-md break-words">
                                <p className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-sm opacity-70">ACTIVE SESSION</p>
                                <p className="text-[20px] font-bold text-on-surface leading-tight mb-1">{user?.name || 'A1B2C3'}</p>
                                <p className="text-[13px] text-secondary">{user?.email || 'user@example.com'}</p>
                            </div>
                            <div className="w-full h-px bg-outline-variant/15 mx-auto"></div>
                            <div className="px-md pb-md pt-sm">
                                <button 
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setIsLogoutModalOpen(true);
                                    }}
                                    className="w-full text-left py-sm px-md rounded-xl text-error hover:bg-error/5 transition-colors font-body-sm font-semibold flex items-center gap-md"
                                >
                                    <span className="material-symbols-outlined text-[20px]">logout</span>
                                    Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
                    <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm p-xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-outline-variant/10 fade-in">
                        <div className="flex items-center gap-md mb-lg">
                            <div className="w-11 h-11 rounded-full bg-error/8 text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[22px]">logout</span>
                            </div>
                            <h2 className="font-headline-sm text-on-surface">Log Out</h2>
                        </div>
                        <p className="font-body-base text-on-surface-variant mb-xl">
                            Are you sure you want to log out of your session?
                        </p>
                        <div className="flex justify-end gap-sm">
                            <button 
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="px-lg py-sm rounded-xl border border-outline-variant/20 text-secondary font-body-sm hover:bg-surface-container-high transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="px-lg py-sm rounded-xl bg-error text-white font-body-sm font-semibold flex items-center gap-sm hover:bg-[#a01616] transition-colors shadow-sm"
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

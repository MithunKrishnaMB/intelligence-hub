import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login, register, error: authError } = useAuth();

    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');

    const displayError = localError || authError;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setLocalError('');

        let success = false;
        if (isRegistering) {
            if (!name.trim()) {
                setLocalError('Name is required');
                setIsSubmitting(false);
                return;
            }
            success = await register(name, email, password);
        } else {
            success = await login(email, password);
        }

        if (success) {
            navigate('/');
        } else {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <header className="w-full px-margin-mobile md:px-margin-desktop py-lg absolute top-0 left-0 z-50 flex justify-between items-center">
                <div className="font-headline-lg text-headline-lg font-extrabold text-primary tracking-tighter">
                    Intelligence Hub
                </div>
            </header>

            <main className="flex-grow flex flex-col md:flex-row w-full overflow-hidden">
                <section className="hidden md:flex md:w-1/2 relative bg-surface-container-low items-center justify-center p-2xl h-full">
                    <div
                        className="absolute inset-0 w-full h-full"
                        data-alt="A sophisticated, clean and minimalist professional illustration of a smart AI agentic tool analyzing data."
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAGaEnaJ6zWr81xtO5ht_SJKuHLMATOGfacFrubZpjKJLfY-9hQVposRzHiz5NA2sAnMwyb5gQvt_YQ8ul8xdtWYPO-RQPOTUEKtMoEivKghOyRX7S7PVWXO6zIzngSgtp9HBArUylamP70QZ541YoCwMZHQriGNlnN9mBngkXJwsKJYlE7OXXRxbD9gmpaCUaFyn0rBetbEEO3UIfr6FClYn49_TMRYr0n0bcGhVuO6txddYMM_Yar')", backgroundSize: "cover", backgroundPosition: "center center" }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    <div className="relative z-10 max-w-lg mt-auto pb-3xl">
                        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-md">Clarity from Chaos.</h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant">Experience AI-powered meeting distillation designed for the modern professional.</p>
                    </div>
                </section>

                <section className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop pt-3xl md:pt-margin-desktop bg-surface overflow-y-auto h-full">
                    <div className="w-full max-w-md glass-panel rounded-[24px] p-xl md:p-2xl fade-in relative overflow-hidden" id="auth-container">

                        <div className="mb-xl text-center md:text-left">
                            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-xs">
                                {isRegistering ? 'Create your account' : 'Log in to your account'}
                            </h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                                {isRegistering ? 'Join Intelligence Hub today' : 'Welcome back to Intelligence Hub'}
                            </p>
                        </div>

                        <div
                            className={`mb-md p-md bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm border border-error/20 items-start gap-xs ${displayError ? 'flex' : 'hidden'}`}
                            id="error-message"
                        >
                            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: '"FILL" 1', fontSize: '20px' }}>error</span>
                            <span id="error-text">{displayError}</span>
                        </div>

                        <form className="space-y-lg" id="login-form" onSubmit={handleSubmit}>
                            {isRegistering && (
                                <div className="space-y-xs">
                                    <label className="block font-body-sm text-body-sm text-on-surface font-semibold" htmlFor="name">Full Name</label>
                                    <div className="relative">
                                        <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant" style={{ fontSize: "20px" }}>person</span>
                                        <input
                                            className="w-full pl-2xl pr-md py-md bg-[#F3F4F6] border-outline-variant/30 rounded-xl font-body-base text-body-base text-on-surface placeholder:text-outline transition-all duration-300 input-glow"
                                            id="name"
                                            name="name"
                                            placeholder="Name"
                                            required={isRegistering}
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-xs">
                                <label className="block font-body-sm text-body-sm text-on-surface font-semibold" htmlFor="email">Email Address</label>
                                <div className="relative">
                                    <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant" style={{ fontSize: "20px" }}>mail</span>
                                    <input
                                        className="w-full pl-2xl pr-md py-md bg-[#F3F4F6] border-outline-variant/30 rounded-xl font-body-base text-body-base text-on-surface placeholder:text-outline transition-all duration-300 input-glow"
                                        id="email"
                                        name="email"
                                        placeholder="Email ID"
                                        required
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-xs">
                                <div className="flex justify-between items-center">
                                    <label className="block font-body-sm text-body-sm text-on-surface font-semibold" htmlFor="password">Password</label>
                                    <a className="font-body-sm text-body-sm text-primary hover:text-primary-container transition-colors" href="#">Forgot password?</a>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant" style={{ fontSize: "20px" }}>lock</span>
                                    <input
                                        className="w-full pl-2xl pr-md py-md bg-[#F3F4F6] border-outline-variant/30 rounded-xl font-body-base text-body-base text-on-surface placeholder:text-outline transition-all duration-300 input-glow"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <button
                                className="w-full py-md px-lg bg-gradient-to-r from-primary to-[#005ac2] hover:from-primary-container hover:to-primary text-on-primary rounded-xl font-body-base text-body-base font-semibold shadow-[0_4px_14px_rgba(0,68,150,0.25)] hover:shadow-[0_6px_20px_rgba(0,68,150,0.35)] transition-all duration-300 hover:-translate-y-[1px] mt-xl flex justify-center items-center gap-xs disabled:opacity-50"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>{isRegistering ? 'Signing up...' : 'Logging in...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isRegistering ? 'Sign Up' : 'Log In'}</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-xl text-center">
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                                <button
                                    className="text-primary font-semibold hover:underline decoration-primary/30 underline-offset-4 transition-all ml-1 cursor-pointer"
                                    onClick={() => {
                                        setIsRegistering(!isRegistering);
                                        setLocalError('');
                                    }}
                                    type="button"
                                >
                                    {isRegistering ? 'Log in' : 'Register'}
                                </button>
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="w-full py-xl px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-md bg-surface border-t border-outline-variant/10 transition-opacity duration-300">
                <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    © 2026 Intelligence Hub. AI-Powered Clarity.
                </div>
            </footer>
        </div>
    );
}

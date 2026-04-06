import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invalid email or password");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      navigate("/");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // STRICT VIEWPORT LOCK: h-screen and overflow-hidden prevent the scrollbar
    <div className="h-screen w-full bg-surface font-body text-on-surface antialiased overflow-hidden flex flex-col">
      <Header />

      {/* Main content takes up remaining space between Header and Footer */}
      <main className="flex-grow flex flex-col md:flex-row pt-16 overflow-hidden">
        
        {/* Left: Branding & Visual Content */}
        <section className="hidden md:flex w-1/2 bg-surface-container-low flex-col justify-center px-12 lg:px-24 h-full">
          <div className="space-y-6"> {/* Reduced vertical spacing */}
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-lowest text-primary text-xs font-bold tracking-widest uppercase shadow-sm">
              Digital Curation
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-[1.1]">
              Intelligence in every <br />
              <span className="text-primary italic">transcript.</span>
            </h1>
            <p className="text-base text-on-surface-variant max-w-md leading-relaxed font-light">
              Experience Atmospheric Precision. Our platform captures the nuance of dialogue, turning raw audio into curated editorial masterpieces.
            </p>
            
            <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-[0_30px_60px_-12px_rgba(44,52,55,0.08)] mt-6 bg-gradient-to-br from-primary/10 to-surface-container-highest flex items-center justify-center border border-outline-variant/10">
               <div className="absolute inset-0 bg-primary/5 backdrop-blur-3xl"></div>
               <Sparkles className="w-16 h-16 text-primary/30 relative z-10" />
            </div>
          </div>
        </section>

        {/* Right: Auth Form Container */}
        <section className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 h-full bg-surface">
          <div className="w-full max-w-[400px] space-y-6"> {/* Compressed layout */}
            <div className="text-center md:text-left space-y-1">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">Welcome</h2>
              <p className="text-sm text-on-surface-variant font-medium">Please enter your credentials to access the gallery.</p>
            </div>

            {error && (
              <div className="bg-error-container/20 border border-error-container text-error text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-[0.1em] text-on-surface-variant uppercase ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/50 focus:bg-surface-container-lowest transition-all text-sm text-on-surface placeholder:text-outline/60 outline-none" 
                  placeholder="name@company.com" 
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold tracking-[0.1em] text-on-surface-variant uppercase">Password</label>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/50 focus:bg-surface-container-lowest transition-all text-sm text-on-surface placeholder:text-outline/60 outline-none" 
                  placeholder="••••••••" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold tracking-wide shadow-[0_10px_20px_-10px_rgba(0,91,196,0.5)] hover:shadow-[0_15px_25px_-10px_rgba(0,91,196,0.6)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Access"}
              </button>
            </form>

            <p className="text-center text-xs text-on-surface-variant">
              New to the gallery? 
              <Link to="/register" className="text-primary font-bold hover:underline transition-all underline-offset-4 ml-1">
                Establish Account
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
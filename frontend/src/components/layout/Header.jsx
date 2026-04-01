import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
      <div className="flex justify-between items-center h-16 px-6 lg:px-12 w-full max-w-[1440px] mx-auto">
        <Link to="/" className="active:scale-95 cursor-pointer transition-transform text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tighter flex items-center gap-2 font-['Inter'] antialiased">
          <Activity className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          <span>INTELLIGENCE HUB</span>
        </Link>
      </div>
    </header>
  );
}

export default function Footer() {
  return (
    <footer className="w-full py-8 mt-auto bg-slate-50 dark:bg-slate-950 border-t border-surface-container/50">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 gap-4 max-w-[1440px] mx-auto">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">© 2024 Intelligence Hub.</p>
        <div className="flex gap-6">
          <a className="text-xs font-medium uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors" href="#">Privacy</a>
          <a className="text-xs font-medium uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors" href="#">Terms</a>
          <a className="text-xs font-medium uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors" href="#">Support</a>
        </div>
      </div>
    </footer>
  );
}

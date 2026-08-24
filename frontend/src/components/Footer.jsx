import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-surface dark:bg-surface-dim font-body-sm text-body-sm full-width bottom border-t border-outline-variant/10 transition-opacity duration-300 w-full py-xl px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-md mt-auto">
            <div className="flex items-center gap-md">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Intelligence Hub</span>
                <span className="text-secondary dark:text-secondary-fixed-dim text-body-sm">© 2026 Intelligence Hub. AI-Powered Clarity.</span>
            </div>
        </footer>
    );
}

import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <Header />
            <div className="flex-grow overflow-y-auto w-full flex flex-col">
                {children}
            </div>
            <Footer />
        </div>
    );
}

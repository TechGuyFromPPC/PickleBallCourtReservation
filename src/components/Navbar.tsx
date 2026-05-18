// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide the back button if the user is already on the root homepage
  const isHomepage = pathname === '/';

  return (
    <nav className="relative z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Left Side: Navigation Links */}
        <div className="flex items-center gap-4">
          {!isHomepage && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              ◀ Back
            </button>
          )}
          
          <Link 
            href="/"
            className="flex items-center gap-2 font-black text-sm text-white tracking-widest uppercase hover:text-emerald-400 transition-colors"
          >
            🏠 <span className="hidden sm:inline">Portal Home</span>
          </Link>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/50 border border-slate-800/60 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            System Instance Live
          </span>
        </div>

        {/* Right Side: Account Placeholder Interface Layer */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-white leading-none">Club Administrator</p>
            <p className="text-[8px] font-bold text-emerald-400 tracking-wide mt-0.5">Session: Active</p>
          </div>
          
          {/* User Profile Avatar Wrapper Box */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md border border-emerald-400/20 cursor-pointer hover:scale-105 transition-transform">
            AM
          </div>
        </div>

      </div>
    </nav>
  );
}
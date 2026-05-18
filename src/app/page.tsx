// src/app/page.tsx
'use client';

import Link from 'next/link';

export default function HomePage() {
  // 🏢 PITCH DECK CONFIGURATION
  // Swap these values right before your meeting with a specific club owner!
  const clubConfig = {
    name: "SMASH & DROP ARENA", // 👈 Type the prospect's exact club name here
    location: "BGC, Taguig",     // 👈 Their facility location
    tagline: "Exclusive Club Operating System",
    motto: "Bespoke digital architecture engineered for the premier courts of "
  };

  const features = [
    {
      title: 'Book a Court',
      description: `Reserve premium courts instantly. Tailored time slot allocation with fast-track GCash and Maya mobile payment processing lanes.`,
      actionText: 'Open Booking Portal',
      href: '/book',
      icon: '🏓',
      badge: 'Bespoke',
      colorStyles: 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/50 group-hover:bg-emerald-500/10 text-emerald-400',
      btnStyles: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black'
    },
    {
      title: 'Live Court Monitor',
      description: `Track real-time court occupancy, receipt verification queues, and booking schedules customized for your player base.`,
      actionText: 'View Court Status',
      href: '/live',
      icon: '📊',
      badge: 'Live Operations',
      colorStyles: 'border-blue-500/20 bg-blue-500/[0.02] hover:border-blue-500/50 group-hover:bg-blue-500/10 text-blue-400',
      btnStyles: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800'
    },
   // src/app/page.tsx
// Find the 3rd feature object inside the array and update it to this:
{
  title: 'Admin Dashboard', // 👈 Updated title
  description: 'Manage active bookings, review payment receipts, update entry statuses, and control overall arena parameters.',
  actionText: 'Open Dashboard', // 👈 Updated action text
  href: '/dashboard', // 👈 Changed route destination from /reservations to /dashboard
  icon: '🎛️', // 👈 Swapped ticket icon to a control panel layout icon
  badge: 'Management',
  colorStyles: 'border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/50 group-hover:bg-amber-500/10 text-amber-400',
  btnStyles: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800'
}
  ];

  return (
    <div className="min-h-screen text-slate-100 antialiased flex flex-col justify-between relative bg-slate-950 overflow-hidden">
      
      {/* 📸 High-Visibility Court Background */}
      {/* Opacity bumped up to 35% and backdrop-blur adjusted so it's beautifully clear yet readable */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop" 
          alt="Sports Court Background"
          className="w-full h-full object-cover opacity-35 filter brightness-[50%] contrast-[110%]"
        />
        {/* Deep vignette gradient wrapper to frame the cards perfectly */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950 backdrop-blur-[2px]" />
      </div>

      {/* Structural Minimalist Header Navbar */}
      {/* DELETE OR COMMENT THIS SECTION OUT OF APP/PAGE.TSX */}

      {/* Main Container Core Menu Options */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-center items-center w-full">
        
        {/* Highly Personalized Headline Banner */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
            {clubConfig.tagline}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
            Next-Gen Arena <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
              Management Portal
            </span>
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-300 leading-relaxed max-w-xl mx-auto">
            {clubConfig.motto}
            <span className="text-white underline decoration-emerald-400 decoration-2 underline-offset-4 font-bold">
              {clubConfig.name}
            </span>
            . A single-instance software layer tailored completely to your court configurations, member behaviors, and operational standards.
          </p>
        </div>

        {/* 3-Column Grid Feature Section Array Loop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
          {features.map((item) => (
            <Link 
              key={item.title} 
              href={item.href}
              className="group flex flex-col justify-between bg-slate-950/85 border border-slate-800/80 rounded-2xl p-6 shadow-2xl hover:border-slate-700/80 backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold border transition-colors ${item.colorStyles}`}>
                    {item.icon}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-md text-slate-400 shadow-inner">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                    {item.title}
                  </h2>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Button Area */}
              <div className="pt-6 mt-auto">
                <div className={`w-full py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider text-center transition-all ${item.btnStyles}`}>
                  {item.actionText} →
                </div>
              </div>
            </Link>
          ))}
        </div>

      </main>

      {/* Structural Minimal Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/90 backdrop-blur py-5 text-center">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Bespoke Deployment Platform • Configured Exclusively for {clubConfig.name}
        </p>
      </footer>

    </div>
  );
}
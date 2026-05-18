// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="max-w-md w-full space-y-6">
        {/* Playful visual element */}
        <div className="text-6xl font-extrabold text-emerald-600 animate-bounce">
          🏓
        </div>
        
        <h1 className="text-6xl font-black text-slate-900 tracking-tight">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-slate-800">
          Out of Bounds!
        </h2>
        
        <p className="text-slate-600">
          Oops! The page you are looking for doesn't exist, or has been moved. Let's get you back on the court.
        </p>

        <div className="pt-4">
          <Link
            href="/book"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Back to Booking
          </Link>
        </div>
      </div>
    </div>
  );
}
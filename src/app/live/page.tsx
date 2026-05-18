// src/app/live/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabase/client'; // 👈 Connected directly to your client instance

interface Booking {
  id: string;
  fullName: string;
  courtId: number; // Storing court matching index values
  date: string;
  slots: string[];
  status: 'pending' | 'accepted' | 'rejected';
}

export default function LiveCourtsPage() {
  // 1. Traditional Calendar Selector States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(currentYear, currentMonth, day));
    return days;
  }, [currentYear, currentMonth]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // 2. Real-time Reactive Bookings Repository State
  const [bookings, setBookings] = useState<Booking[]>([]);

  // 📡 Real-time Database Synchronization Handler
  // 📡 Real-time Database Synchronization Handler
useEffect(() => {
  // 1. Safety Guard: If for any reason the date isn't ready yet, hold execution
  if (!selectedDateStr) return;

  const fetchLiveDatabaseBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id_custom, full_name, court_id, booking_date, slots, status')
      .eq('booking_date', selectedDateStr)
      .not('status', 'eq', 'rejected');

    if (error) {
      console.error("Error updating live grid database tracking:", error);
      return;
    }

    if (data) {
      const formattedBookings: Booking[] = data.map((b: any) => ({
        id: b.id_custom,
        fullName: b.full_name,
        courtId: Number(b.court_id),
        date: b.booking_date,
        slots: b.slots,
        status: b.status as 'pending' | 'accepted' | 'rejected'
      }));
      setBookings(formattedBookings);
    }
  };

  fetchLiveDatabaseBookings();

  const liveChannel = supabase
    .channel('live-monitor-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      () => {
        fetchLiveDatabaseBookings();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(liveChannel);
  };
}, [selectedDateStr]); // 👈 This stays constant now because of the guard check above

  // Unified Court list indexing configurations matching your Supabase seed identifiers
  const courts = [
    { id: 1, name: 'Court 1 (Indoor Pro)', icon: '💎 Indoor' },
    { id: 2, name: 'Court 2 (Indoor Standard)', icon: '💎 Indoor' },
    { id: 3, name: 'Court 3 (Outdoor Showcourt)', icon: '☀️ Outdoor' },
    { id: 4, name: 'Court 4 (Outdoor North)', icon: '☀️ Outdoor' },
    { id: 5, name: 'Court 5 (Outdoor South)', icon: '☀️ Outdoor' }
  ];

  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased pb-24">
      
      {/* Top Header Grid Status Tracker Bar */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500 text-slate-950 p-2 rounded-xl font-black text-sm">📊</span>
          <div>
            <h1 className="font-black text-base text-white tracking-tight uppercase">Live Court Monitor</h1>
            <p className="text-[10px] font-bold text-slate-500">Realtime Court Occupancy System</p>
          </div>
        </div>
        
        {/* Status Legends Info */}
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider bg-slate-900 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span><span className="text-slate-400">Open</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span><span className="text-slate-400">Review</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500 block"></span><span className="text-slate-400">Booked</span></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Calendar Control Block */}
        <div className="lg:col-span-1 bg-slate-800/40 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Select Track Date</h3>
            <div className="flex gap-1">
              <button onClick={() => setCurrentCalendarDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1.5 rounded bg-slate-800 text-[10px]">◀</button>
              <button onClick={() => setCurrentCalendarDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1.5 rounded bg-slate-800 text-[10px]">▶</button>
            </div>
          </div>
          <p className="text-sm font-bold text-emerald-400 bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 text-center mb-4 tracking-wide">
            {monthNames[currentMonth]} {currentYear}
          </p>

          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-600 uppercase mb-2">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dateObj, idx) => {
              if (!dateObj) return <div key={idx} />;
              const dateString = dateObj.toISOString().split('T')[0];
              const isSelected = selectedDateStr === dateString;
              return (
                <button
                  key={dateString}
                  type="button"
                  onClick={() => setSelectedDateStr(dateString)}
                  className={`h-8 rounded-lg text-xs font-bold transition-colors ${
                    isSelected ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {dateObj.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: The 5-Column Live Allocation Grid Matrix */}
        <div className="lg:col-span-3 overflow-x-auto bg-slate-800/20 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="min-w-[700px] grid grid-cols-5 gap-4">
            
            {courts.map((court) => (
              <div key={court.id} className="space-y-3">
                
                {/* Court Column Header Title Banner */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-0.5 shadow-inner">
                  <h2 className="font-black text-xs text-white tracking-tight truncate">{court.name.split(' (')[0]}</h2>
                  <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                    {court.icon}
                  </span>
                </div>

                {/* Vertical Time Increments Layout Loop */}
                <div className="space-y-2">
                  {timeSlots.map((time) => {
                    // Match checking logic matching court ID values and string slots arrays
                    const activeMatch = bookings.find(
                      (b) =>
                        b.date === selectedDateStr &&
                        b.courtId === court.id &&
                        b.slots.includes(time)
                    );

                    let statusStyles = 'border-slate-800 bg-slate-900/30 text-slate-400';
                    let pillText = 'Available';
                    let displayId = '';

                    if (activeMatch) {
                      displayId = `ID: ${activeMatch.id}`;
                      if (activeMatch.status === 'pending') {
                        statusStyles = 'border-amber-500/30 bg-amber-500/[0.03] text-amber-400';
                        pillText = 'Checking';
                      } else if (activeMatch.status === 'accepted') {
                        statusStyles = 'border-red-500/30 bg-red-500/[0.04] text-red-400';
                        pillText = 'Occupied';
                      }
                    }

                    return (
                      <div
                        key={time}
                        className={`border rounded-xl p-2.5 flex flex-col justify-between h-20 transition-all ${statusStyles}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-black text-[11px] tracking-tight text-slate-200">{time}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-950/40 border border-slate-800/60">
                            {pillText}
                          </span>
                        </div>
                        
                        {displayId && (
                          <div className="font-mono text-[9px] font-bold bg-slate-950/80 border border-slate-800 px-1.5 py-1 rounded text-center text-slate-300 truncate tracking-wide">
                            {displayId}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}
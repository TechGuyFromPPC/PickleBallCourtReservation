// src/app/book/page.tsx
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

export default function BookPage() {
  // Helper to safely format a Date object into a local YYYY-MM-DD string without UTC shifting
  const getLocalYYYYMMDD = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // --- 1. STATES ---
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  // 🎯 FIX: Intialize directly to accurate local date mapping instead of UTC
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalYYYYMMDD(new Date()));
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(1);
  const [racketsCount, setRacketsCount] = useState<number>(0);

  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);

  // Modals & UI Controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState({ fullName: '', email: '', phone: '' });

  const RATE_PER_HOUR = 400;
  const RATE_PER_RACKET = 100;
  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];

  const courts = [
    { id: 1, name: 'Court 1 (Indoor Pro)' },
    { id: 2, name: 'Court 2 (Indoor Standard)' },
    { id: 3, name: 'Court 3 (Outdoor Showcourt)' },
    { id: 4, name: 'Court 4 (Outdoor North)' },
    { id: 5, name: 'Court 5 (Outdoor South)' },
  ];

  // --- 2. DATABASE REAL-TIME READ HOOK ---
  useEffect(() => {
    const fetchUnavailableSlots = async () => {
      if (!selectedCourtId) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('slots')
        .eq('booking_date', selectedDateStr)
        .eq('court_id', selectedCourtId)
        .not('status', 'eq', 'rejected');

      if (error) {
        console.error("Error fetching live slot inventory:", error);
        return;
      }

      if (data) {
        const slotsTaken = data.flatMap((booking: any) => booking.slots);
        setOccupiedSlots(slotsTaken);
      }
    };

    fetchUnavailableSlots();
  }, [selectedDateStr, selectedCourtId, isSuccessModalOpen]);

  // --- 3. BUSINESS RULES FOR TIMING ENTRIES ---
  const parseSlotTo24Hour = (timeStr: string): number => {
    const [time, modifier] = timeStr.split(' ');
    let [hours] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours;
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(currentYear, currentMonth, d));
    return days;
  }, [currentYear, currentMonth]);

  const toggleTimeSlot = (time: string) => {
    setSelectedTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
  };

  const totalBill = (selectedTimes.length * RATE_PER_HOUR) + (racketsCount * RATE_PER_RACKET);

  // --- 4. DATABASE WRITE SUBMISSION HOOK ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptPreview) return alert('Please upload your payment receipt image.');
    
    setIsSubmitting(true);
    const reservationId = `KL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const courtName = courts.find(c => c.id === selectedCourtId)?.name || 'Court';

    const newBookingRow = {
      id_custom: reservationId,
      full_name: guestInfo.fullName,
      email: guestInfo.email,
      phone: guestInfo.phone,
      court_id: selectedCourtId,
      booking_date: selectedDateStr,
      slots: selectedTimes,
      rackets_count: racketsCount,
      total_price: totalBill,
      receipt_url: receiptPreview,
      status: 'pending'
    };

    const { error } = await supabase
      .from('bookings')
      .insert([newBookingRow]);

    setIsSubmitting(false);

    if (error) {
      alert(`Database insertion transaction error: ${error.message}`);
      return;
    }

    setLastBooking({
      id: reservationId,
      fullName: guestInfo.fullName,
      courtName,
      date: selectedDateStr,
      slots: selectedTimes,
      total: totalBill
    });

    setIsFormModalOpen(false);
    setIsSuccessModalOpen(true);

    setSelectedTimes([]);
    setRacketsCount(0);
    setReceiptPreview(null);
    setGuestInfo({ fullName: '', email: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased pb-24">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <span className="font-black text-lg text-white">🏓 KITCHEN LINE</span>
        <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">Supabase Connected</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Choose Court */}
          <section className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-black">1</span>
              Choose Court
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {courts.map(court => (
                <button key={court.id} type="button" onClick={() => { setSelectedCourtId(court.id); setSelectedTimes([]); }}
                  className={`text-left p-4 rounded-xl border flex justify-between items-center transition-all ${selectedCourtId === court.id ? 'border-emerald-500 bg-emerald-500/[0.04]' : 'border-slate-700/60 bg-slate-800/40'}`}>
                  <span className="font-bold text-sm text-slate-100">{court.name}</span>
                  <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">₱400/hr</span>
                </button>
              ))}
            </div>
          </section>

          {/* STEP 2: Calendar */}
          <section className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-black">2</span>
                Select Date
              </h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCurrentCalendarDate(new Date(currentYear, currentMonth - 1, 1))} className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold">◀</button>
                <span className="text-xs font-black text-white w-32 text-center bg-slate-950/80 border border-slate-800 py-1.5 rounded-xl">{monthNames[currentMonth]} {currentYear}</span>
                <button type="button" onClick={() => setCurrentCalendarDate(new Date(currentYear, currentMonth + 1, 1))} className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold">▶</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((dateObj, idx) => {
                if (!dateObj) return <div key={idx} />;
                
                // 🎯 FIX: Parse calendar elements dynamically using the custom local date handler
                const dateString = getLocalYYYYMMDD(dateObj);
                const isSelected = selectedDateStr === dateString;
                
                const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
                const isDateInPast = dateObj < todayMidnight;
                return (
                  <button key={dateString} type="button" disabled={isDateInPast} onClick={() => { setSelectedDateStr(dateString); setSelectedTimes([]); }}
                    className={`h-11 rounded-xl text-xs font-bold border transition-all ${isDateInPast ? 'bg-slate-900/10 text-slate-700 opacity-20 line-through' : isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-black' : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'}`}>
                    {dateObj.getDate()}
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 3: Time Slots */}
          <section className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-black">3</span>
              Available Times
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {timeSlots.map(time => {
                const isSelected = selectedTimes.includes(time);
                
                const rightNow = new Date();
                const todayDateString = getLocalYYYYMMDD(rightNow);
                const isTargetToday = selectedDateStr === todayDateString;
                const isHourInPast = isTargetToday && (parseSlotTo24Hour(time) <= rightNow.getHours());
                
                const isAlreadyBooked = occupiedSlots.includes(time);
                const isButtonDisabled = isHourInPast || isAlreadyBooked;

                return (
                  <button key={time} type="button" disabled={isButtonDisabled} onClick={() => toggleTimeSlot(time)}
                    className={`py-3 rounded-xl border text-xs font-bold tracking-wide transition-all ${
                      isAlreadyBooked ? 'bg-red-500/5 border-red-500/20 text-red-400/50 line-through opacity-50 cursor-not-allowed' :
                      isHourInPast ? 'bg-slate-900/10 border-slate-900/5 text-slate-700 line-through opacity-20 cursor-not-allowed' :
                      isSelected ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-black' : 
                      'border-slate-700/60 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                    }`}>
                    {time} {isAlreadyBooked ? '• Reserved' : isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 4: Paddles */}
          <section className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
             <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2"><span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-black">4</span>Rent Paddles? (₱100/ea)</h2>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button type="button" onClick={() => setRacketsCount(p => Math.max(0, p - 1))} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold">−</button>
                  <span className="w-6 text-center font-bold text-xs">{racketsCount}</span>
                  <button type="button" onClick={() => setRacketsCount(p => p + 1)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold">+</button>
                </div>
             </div>
          </section>
        </div>

        {/* Checkout column info parameters block */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl shadow-2xl space-y-6">
            <h3 className="text-xs font-bold uppercase text-slate-400 border-b border-slate-700/60 pb-3">Summary</h3>
            <div className="space-y-2 text-xs font-semibold text-slate-300">
              <div className="flex justify-between bg-slate-900/40 p-2 rounded-xl"><span>Court</span><span className="text-white">{courts.find(c => c.id === selectedCourtId)?.name.split(' (')[0]}</span></div>
              {/* 📊 FIXED SOURCE OF TRUTH: Prints selection matching the local timezone exactly */}
              <div className="flex justify-between bg-slate-900/40 p-2 rounded-xl"><span>Date</span><span className="text-white">{selectedDateStr}</span></div>
              <div className="flex justify-between bg-slate-900/40 p-2 rounded-xl"><span>Slots</span><span className="text-emerald-400 font-bold">{selectedTimes.length} Slot(s)</span></div>
            </div>
            <div className="pt-2 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-400 uppercase">Grand Total:</span>
              <span className="text-3xl font-black text-emerald-400">₱{totalBill.toLocaleString()}</span>
            </div>
            <button type="button" disabled={selectedTimes.length === 0 || !selectedCourtId} onClick={() => setIsFormModalOpen(true)}
              className="w-full py-4 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest disabled:bg-slate-700 disabled:text-slate-500 shadow-xl">
              Proceed to Payment
            </button>
          </div>
        </div>
      </main>

      {/* --- FORM REGISTRATION SUBMIT PAYMENT MODAL --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <h3 className="text-base font-black text-white">Payment Validation Portal</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
               <div className="w-20 h-20 bg-emerald-500 rounded-lg flex flex-col items-center justify-center font-black text-slate-950 text-[10px] p-2 leading-tight"><span>GCASH</span><span className="text-sm">🏓</span><span>MAYA</span></div>
               <div className="text-xs">
                 <p className="font-black text-emerald-400 text-sm">Account Mobile: 0917-123-4567</p>
                 <p className="text-slate-300 font-bold mt-1">Amount Due: ₱{totalBill.toLocaleString()}</p>
               </div>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" required placeholder="Full Name" value={guestInfo.fullName} onChange={e => setGuestInfo({...guestInfo, fullName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white" />
                <input type="tel" required placeholder="Phone Number" value={guestInfo.phone} onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white" />
              </div>
              <input type="email" required placeholder="Email Address" value={guestInfo.email} onChange={e => setGuestInfo({...guestInfo, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white" />
              
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500/50 bg-slate-950">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader(); r.onloadend = () => setReceiptPreview(r.result as string); r.readAsDataURL(file);
                  }
                }} />
                <span className="text-xs font-bold text-slate-400">{receiptPreview ? "📊 Receipt Connected Successfully" : "📸 Click to Upload Receipt Screenshot"}</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 uppercase">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-500 py-3 rounded-xl font-black text-xs text-slate-950 uppercase shadow-lg shadow-emerald-500/10">
                  {isSubmitting ? 'Transmitting...' : 'Submit Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RECEIPT GENERATED CARD DISPLAY --- */}
      {isSuccessModalOpen && lastBooking && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl scale-100">
            <div className="bg-emerald-500 p-6 text-center text-white">
              <h3 className="text-xl font-black uppercase tracking-tight">Receipt Generated</h3>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Pending Admin Review</p>
            </div>
            <div className="p-6 space-y-6 relative bg-white">
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reservation Key ID</p>
                <h4 className="text-3xl font-mono font-black tracking-tight text-emerald-600">{lastBooking.id}</h4>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-5 space-y-2.5 text-xs font-medium">
                <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">Player</span><span className="font-black text-slate-900">{lastBooking.fullName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">Court</span><span className="font-black text-slate-900">{lastBooking.courtName.split(' (')[0]}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase">Date</span><span className="font-black text-slate-900">{lastBooking.date}</span></div>
                <div className="flex justify-between items-start"><span className="text-slate-400 font-bold uppercase">Slots</span><div className="text-right max-w-[160px] font-black text-slate-900">{lastBooking.slots.join(', ')}</div></div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 flex justify-between items-center border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Paid Total</span>
                <span className="text-lg font-black text-slate-950">₱{lastBooking.total.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setIsSuccessModalOpen(false)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest">Close & Complete</button>
          </div>
        </div>
      )}
    </div>
  );
}
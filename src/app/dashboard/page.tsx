// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

interface Booking {
  id: string;        // UUID from DB
  id_custom: string; // The KL-XXXXXX display string
  fullName: string;
  email: string;
  phone: string;
  courtId: number;
  date: string;
  slots: string[];
  receiptUrl: string;
  racketsCount: number;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to hold the currently selected booking for detailed view modal drawer
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // 📡 1. Pull directly from Supabase instead of local cache
  const fetchDashboardData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Dashboard database read failure:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const formatted: Booking[] = data.map((b: any) => ({
        id: b.id,
        id_custom: b.id_custom,
        fullName: b.full_name,
        email: b.email,
        phone: b.phone,
        courtId: Number(b.court_id),
        date: b.booking_date,
        slots: b.slots,
        receiptUrl: b.receipt_url,
        racketsCount: Number(b.rackets_count || 0),
        totalPrice: Number(b.total_price || 0),
        status: b.status
      }));
      setBookings(formatted);

      // 🔄 Sync up active record details if drawer is genuinely open
      // We read the updated state safely by matching against functional updates or current values
      setSelectedBooking((prev) => {
        if (!prev) return null;
        return formatted.find(item => item.id === prev.id) || null;
      });
    }
    setLoading(false);
  };

  // ⚡ FIXED LIFECYCLE: Keep the WebSocket pipeline alive permanently. 
  // We change the dependency array to empty [] so it doesn't loop when opening/closing items.
  useEffect(() => {
    fetchDashboardData();

    const liveChannel = supabase
      .channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(liveChannel);
    };
  }, []); // 👈 Empty array ensures initialization happens exactly once

  // 🛠️ 2. Action Handlers
 const updateStatus = async (id: string, nextStatus: 'accepted' | 'rejected') => {
  setSelectedBooking(null);

  // 🧪 Diagnostic Log
  console.log(`Attempting database write: Row ID ${id} -> Target Status: ${nextStatus}`);

  const { data, error, status, statusText } = await supabase
    .from('bookings')
    .update({ status: nextStatus })
    .eq('id', id)
    .select(); // 👈 Forcing a return select catches silent policy blocks

  console.log("Supabase response network status:", status, statusText);
  
  if (error) {
    console.error("❌ SUPABASE WRITE ERROR DETECTED:", error);
    alert(`Database rejected write: ${error.message}`);
    fetchDashboardData();
    return;
  }

  // If data is empty, RLS or your WHERE clause (eq) failed to find/match a row it has permission to edit
  if (!data || data.length === 0) {
    console.warn("⚠️ Silent rejection: Database row was not modified. Check your RLS policies or UUID string format.");
    alert("The server processed the request but zero rows were modified. This usually means Row Level Security (RLS) is blocking edits.");
  } else {
    console.log("✅ Database write verified successfully:", data);
  }

  fetchDashboardData();
};

  const getCourtName = (id: number) => {
    const names: Record<number, string> = {
      1: 'Court 1 (Indoor Pro)',
      2: 'Court 2 (Indoor Standard)',
      3: 'Court 3 (Outdoor Showcourt)',
      4: 'Court 4 (Outdoor North)',
      5: 'Court 5 (Outdoor South)'
    };
    return names[id] || `Court Slot ${id}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Module Meta Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">Ops Control Dashboard</h1>
            <p className="text-xs text-slate-400">Click any row below to review matching user details and full payment attachment metadata</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-700 transition-all shadow-md"
          >
            🔄 Force Sync Database
          </button>
        </div>

        {/* Loading / Empty States */}
        {loading && bookings.length === 0 ? (
          <p className="text-sm font-bold text-slate-500 animate-pulse text-center py-12">Querying data clusters...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-slate-950/40 border border-dashed border-slate-800 p-12 rounded-2xl text-center">
            <p className="text-sm font-bold text-slate-500 uppercase">No active operations files logged</p>
          </div>
        ) : (
          /* Operational Reservation Queue Table Grid */
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="p-4">Reference</th>
                    <th className="p-4">Player Details</th>
                    <th className="p-4">Allocation Target</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Operational Status</th>
                    <th className="p-4 text-right">Action Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-xs font-medium">
                  {bookings.map((row) => (
                    <tr 
                      key={row.id} 
                      onClick={() => setSelectedBooking(row)}
                      className={`cursor-pointer transition-colors ${
                        selectedBooking?.id === row.id 
                          ? 'bg-emerald-500/10' 
                          : 'hover:bg-slate-900/50'
                      }`}
                    >
                      {/* ID Reference */}
                      <td className="p-4 font-mono font-black text-emerald-400">
                        {row.id_custom}
                      </td>
                      
                      {/* Personal Info */}
                      <td className="p-4 space-y-0.5">
                        <p className="font-bold text-white uppercase">{row.fullName}</p>
                        <p className="text-[10px] text-slate-500">{row.email} • {row.phone}</p>
                      </td>
                      
                      {/* Booking target */}
                      <td className="p-4 space-y-0.5">
                        <p className="text-slate-200 font-bold">{getCourtName(row.courtId)}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          📅 {row.date} | ⏰ {row.slots.length} Slot(s)
                        </p>
                      </td>

                      {/* Financial Value */}
                      <td className="p-4 font-bold text-slate-300">
                        ₱{row.totalPrice.toLocaleString()}
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          row.status === 'pending' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          row.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>

                      {/* Administrative control lanes */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {row.status === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => updateStatus(row.id, 'accepted')}
                              className="px-3 py-1 bg-emerald-500 text-slate-950 font-black uppercase text-[10px] rounded-lg hover:bg-emerald-400 transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(row.id, 'rejected')}
                              className="px-3 py-1 bg-slate-800 border border-slate-700 text-red-400 font-black uppercase text-[10px] rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mr-2">Processed</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 📊 FULL-DETAILS SIDEBAR MODAL DRAWER OVERLAY */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          {/* Transparent click-outside-to-close boundary area layer */}
          <div className="flex-1" onClick={() => setSelectedBooking(null)} />
          
          {/* Main Sidebar Right Container block UI */}
          <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl p-6 relative z-10 overflow-y-auto">
            
            <div className="space-y-6">
              {/* Header block details wrapper */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[9px] font-mono font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                    REF: {selectedBooking.id_custom}
                  </span>
                  <h2 className="text-base font-black uppercase text-white mt-2">Reservation Dossier</h2>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Section 1: Customer Profile Details */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Player Profile</h3>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Full Name</span><span className="font-bold text-white uppercase">{selectedBooking.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Phone Contact</span><span className="font-mono text-slate-200">{selectedBooking.phone}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Email Address</span><span className="text-slate-200">{selectedBooking.email}</span></div>
                </div>
              </div>

              {/* Section 2: Court Allocations */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Allocation Target</h3>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Arena Field</span><span className="font-bold text-emerald-400">{getCourtName(selectedBooking.courtId)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Calendar Date</span><span className="font-bold text-slate-200">{selectedBooking.date}</span></div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400">Selected Slots</span>
                    <div className="text-right max-w-[200px] font-mono text-xs font-bold text-white flex flex-wrap gap-1 justify-end">
                      {selectedBooking.slots.map(s => (
                        <span key={s} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">Paddle Rentals</span><span className="font-bold text-slate-200">{selectedBooking.racketsCount} Unit(s)</span></div>
                  <div className="border-t border-slate-800/80 pt-2 flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-slate-400">Grand Bill Settled</span>
                    <span className="text-xl font-black text-emerald-400">₱{selectedBooking.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Embedded Proof Receipt Image */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Digital Payment Attachment</h3>
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-center min-h-[220px] max-h-[340px] overflow-hidden relative shadow-inner">
                  {selectedBooking.receiptUrl ? (
                    <img 
                      src={selectedBooking.receiptUrl} 
                      alt="Payment Receipt Slip Screenshot"
                      className="max-w-full max-h-[320px] object-contain rounded-lg shadow-md border border-slate-800 bg-slate-950"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Missing file screenshot parameters</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer buttons inside drawer side menu */}
            <div className="border-t border-slate-800 pt-4 mt-6 flex gap-3">
              {selectedBooking.status === 'pending' ? (
                <>
                  <button
                    onClick={() => updateStatus(selectedBooking.id, 'rejected')}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-red-400 font-black text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Deny Request
                  </button>
                  <button
                    onClick={() => updateStatus(selectedBooking.id, 'accepted')}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-emerald-500/10"
                  >
                    Approve Payment
                  </button>
                </>
              ) : (
                <div className="w-full text-center py-2 text-slate-500 font-bold uppercase tracking-widest text-[10px] bg-slate-900/40 border border-slate-800 rounded-xl">
                  ✓ Core file logs locked down as: <span className={selectedBooking.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}>{selectedBooking.status}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}